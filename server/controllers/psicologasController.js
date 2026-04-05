const db = require('../db');

const toPositiveInt = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
};

const MAX_DIAS_ADELANTO_PACIENTE = toPositiveInt(process.env.MAX_BOOKING_DAYS_PACIENTE, 45);
const MAX_DIAS_ADELANTO_PSICOLOGA = toPositiveInt(process.env.MAX_BOOKING_DAYS_PSICOLOGA, 180);
const DURACION_CITA_MIN = 60;

const getMaxDiasAdelantoPorRol = (rol) => {
  if (rol === 'paciente') return MAX_DIAS_ADELANTO_PACIENTE;
  if (rol === 'psicologa') return MAX_DIAS_ADELANTO_PSICOLOGA;
  return MAX_DIAS_ADELANTO_PSICOLOGA;
};

const parsearFechaLocal = (fecha) => {
  const valor = String(fecha || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return null;
  }

  const parsed = new Date(`${valor}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const estaDentroDeVentana = ({ fechaSeleccionada, rol }) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const maxDias = getMaxDiasAdelantoPorRol(rol);
  const fechaMaxima = new Date(hoy);
  fechaMaxima.setDate(fechaMaxima.getDate() + maxDias);
  fechaMaxima.setHours(23, 59, 59, 999);

  if (fechaSeleccionada < hoy) return false;
  if (fechaSeleccionada > fechaMaxima) return false;
  return true;
};

const construirFotoDesdeBd = (mimeType, dataBuffer) => {
  if (!mimeType || !dataBuffer) return null;
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
};

const getPsicologas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        p.psicologaid, 
        u.nombre, 
        u.apellidopaterno, 
        p.especialidad, 
        u.fotoperfil_mime,
        u.fotoperfil_data
      FROM usuarios u
      JOIN psicologas p ON u.usuarioid = p.usuarioid
      WHERE u.rol = 'psicologa' AND u.activo = true
    `);
    
    const psicologas = result.rows.map(row => ({
      psicologaid: row.psicologaid,
      nombre: row.nombre,
      apellidopaterno: row.apellidopaterno,
      especialidad: row.especialidad,
      fotoperfil: construirFotoDesdeBd(row.fotoperfil_mime, row.fotoperfil_data)
    }));
    
    res.json(psicologas);
  } catch (error) {
    console.error("Error al obtener psicólogas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getDisponibilidad = async (req, res) => {
  const { id } = req.params;
  const { fecha, citaIdExcluir } = req.query;

  try {
    if (!fecha) {
      return res.status(400).json({ message: 'La fecha es requerida.' });
    }

    const fechaSeleccionada = parsearFechaLocal(fecha);
    if (!fechaSeleccionada) {
      return res.status(400).json({ message: 'La fecha no es válida. Usa el formato YYYY-MM-DD.' });
    }

    if (!estaDentroDeVentana({ fechaSeleccionada, rol: req.user?.rol })) {
      const diasMax = getMaxDiasAdelantoPorRol(req.user?.rol);
      return res.status(400).json({ message: `Solo puedes consultar disponibilidad dentro de los próximos ${diasMax} días.` });
    }

    // 1. Obtener la agenda de la psicóloga para el día de la semana de la fecha seleccionada
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const diaSemana = diasSemana[fechaSeleccionada.getDay()];
    const agendaQuery = `
      SELECT horainicio, horafin
      FROM agendas
      WHERE psicologaid = $1 AND diasemana ILIKE $2 AND disponible = true
    `;
    const agendaResult = await db.query(agendaQuery, [id, diaSemana]);

    if (agendaResult.rows.length === 0) {
      return res.json([]); // No hay disponibilidad para ese día
    }

    // 2. Obtener las citas ya agendadas para esa fecha
    const citaIdExcluirNum = Number(citaIdExcluir);
    const excluirCita = Number.isInteger(citaIdExcluirNum) && citaIdExcluirNum > 0;

    const citasAgendadasQuery = `
      SELECT fechahora, duracionmin
      FROM citas
      WHERE psicologaid = $1
        AND DATE(fechahora) = $2
        AND COALESCE(LOWER(TRIM(estado)), '') NOT IN ('cancelada', 'cancelado')
        ${excluirCita ? 'AND citaid <> $3' : ''}
    `;
    const citasAgendadasParams = excluirCita ? [id, fecha, citaIdExcluirNum] : [id, fecha];
    const citasAgendadasResult = await db.query(citasAgendadasQuery, citasAgendadasParams);
    const citasAgendadas = citasAgendadasResult.rows;

    // 3. Generar los horarios disponibles
    const horariosDisponibles = new Set();
    const duracionCita = DURACION_CITA_MIN;

    for (const bloque of agendaResult.rows) {
      let horaActual = new Date(`${fecha}T${String(bloque.horainicio).slice(0, 5)}:00`);
      const horaFin = new Date(`${fecha}T${String(bloque.horafin).slice(0, 5)}:00`);

      while (horaActual < horaFin) {
        const horaPotencialFin = new Date(horaActual.getTime() + duracionCita * 60000);

        let ocupado = false;
        for (const cita of citasAgendadas) {
          const citaInicio = new Date(cita.fechahora);
          const citaFin = new Date(citaInicio.getTime() + cita.duracionmin * 60000);

          // Comprobar si hay solapamiento
          if (horaActual < citaFin && horaPotencialFin > citaInicio) {
            ocupado = true;
            break;
          }
        }

        if (!ocupado && horaPotencialFin <= horaFin) {
          horariosDisponibles.add(horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }));
        }

        horaActual.setMinutes(horaActual.getMinutes() + duracionCita);
      }
    }

    res.json(Array.from(horariosDisponibles).sort());

  } catch (error) {
    console.error("Error al obtener disponibilidad:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = { getPsicologas, getDisponibilidad };
