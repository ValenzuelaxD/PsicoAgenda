const db = require('../db');

const getPsicologas = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.psicologaid, u.nombre, u.apellidopaterno, p.especialidad
      FROM usuarios u
      JOIN psicologas p ON u.usuarioid = p.usuarioid
      WHERE u.rol = 'psicologa' AND u.activo = true
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener psicólogas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getDisponibilidad = async (req, res) => {
  const { id } = req.params;
  const { fecha } = req.query;

  try {
    if (!fecha) {
      return res.status(400).json({ message: 'La fecha es requerida.' });
    }

    // 1. Obtener la agenda de la psicóloga para el día de la semana de la fecha seleccionada
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    const fechaSeleccionada = new Date(`${fecha}T00:00:00`);
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
    const citasAgendadasQuery = `
      SELECT fechahora, duracionmin
      FROM citas
      WHERE psicologaid = $1 AND DATE(fechahora) = $2 AND estado <> 'Cancelada'
    `;
    const citasAgendadasResult = await db.query(citasAgendadasQuery, [id, fecha]);
    const citasAgendadas = citasAgendadasResult.rows;

    // 3. Generar los horarios disponibles
    const horariosDisponibles = new Set();
    const duracionCita = 60; // Asumimos citas de 60 minutos

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
