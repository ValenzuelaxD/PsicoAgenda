const db = require('../db');

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const ESTADOS_EDITABLES = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada', 'Reagendada'];

const getPacienteIdByUsuario = async (usuarioId) => {
  const pacienteResult = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
  return pacienteResult.rows[0]?.pacienteid;
};

const getPsicologaIdByUsuario = async (usuarioId) => {
  const psicologaResult = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [usuarioId]);
  return psicologaResult.rows[0]?.psicologaid;
};

const construirFechaHora = (fecha, hora) => {
  if (!fecha || !hora) {
    return null;
  }

  const horaNormalizada = String(hora).slice(0, 5);
  const fechaHora = new Date(`${fecha}T${horaNormalizada}:00`);
  return Number.isNaN(fechaHora.getTime()) ? null : fechaHora;
};

const esFechaHoraPasada = (fechaHora) => {
  if (!(fechaHora instanceof Date) || Number.isNaN(fechaHora.getTime())) {
    return false;
  }

  return fechaHora < new Date();
};

const obtenerFechaClienteDesdeRequest = (req) => {
  const valor = String(req.headers['x-client-local-datetime'] || '').trim();
  // Formato esperado: YYYY-MM-DD HH:mm:ss
  const valido = /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}:\d{2}$/.test(valor);
  return valido ? valor : null;
};

const validarDisponibilidad = async ({ psicologaId, fechaHora, duracionMin, citaIdExcluir = null }) => {
  const diaSemana = DIAS_SEMANA[fechaHora.getDay()];
  const fecha = fechaHora.toISOString().slice(0, 10);
  const inicioMinutos = fechaHora.getHours() * 60 + fechaHora.getMinutes();
  const finMinutos = inicioMinutos + duracionMin;

  const agendaResult = await db.query(
    `
      SELECT horainicio, horafin
      FROM agendas
      WHERE psicologaid = $1 AND diasemana ILIKE $2 AND disponible = true
    `,
    [psicologaId, diaSemana]
  );

  const hayBloqueValido = agendaResult.rows.some((agenda) => {
    const [horaInicio, minutoInicio] = String(agenda.horainicio).slice(0, 5).split(':').map(Number);
    const [horaFin, minutoFin] = String(agenda.horafin).slice(0, 5).split(':').map(Number);
    const agendaInicio = horaInicio * 60 + minutoInicio;
    const agendaFin = horaFin * 60 + minutoFin;
    return inicioMinutos >= agendaInicio && finMinutos <= agendaFin;
  });

  if (!hayBloqueValido) {
    return { disponible: false, message: 'La hora seleccionada está fuera de la agenda disponible.' };
  }

  const params = citaIdExcluir ? [psicologaId, fecha, citaIdExcluir] : [psicologaId, fecha];
  const excluirClause = citaIdExcluir ? 'AND citaid <> $3' : '';

  const citasResult = await db.query(
    `
      SELECT citaid, fechahora, duracionmin
      FROM citas
      WHERE psicologaid = $1
        AND DATE(fechahora) = $2
        AND COALESCE(LOWER(TRIM(estado)), '') NOT IN ('cancelada', 'cancelado')
        ${excluirClause}
    `,
    params
  );

  const haySolapamiento = citasResult.rows.some((cita) => {
    const citaInicio = new Date(cita.fechahora);
    const citaFin = new Date(citaInicio.getTime() + Number(cita.duracionmin || 60) * 60000);
    return fechaHora < citaFin && new Date(fechaHora.getTime() + duracionMin * 60000) > citaInicio;
  });

  if (haySolapamiento) {
    return { disponible: false, message: 'La hora seleccionada ya está ocupada por otra cita.' };
  }

  return { disponible: true };
};

const crearNotificacion = async ({ usuarioId, citaId, tipo, mensaje, fechaEnvio }) => {
  if (!usuarioId || !mensaje) {
    return;
  }

  try {
    if (fechaEnvio) {
      await db.query(
        `
          INSERT INTO notificaciones (usuarioid, citaid, tipo, mensaje, fechaenvio)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [usuarioId, citaId || null, tipo, mensaje, fechaEnvio]
      );
      return;
    }

    await db.query(
      `
        INSERT INTO notificaciones (usuarioid, citaid, tipo, mensaje)
        VALUES ($1, $2, $3, $4)
      `,
      [usuarioId, citaId || null, tipo, mensaje]
    );
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};

const getContextoCita = async (citaId) => {
  const result = await db.query(
    `
      SELECT
        c.citaid,
        c.pacienteid,
        c.psicologaid,
        c.fechahora,
        c.duracionmin,
        c.modalidad,
        c.estado,
        c.notaspaciente,
        c.notaspsicologa,
        p.usuarioid AS paciente_usuarioid,
        ps.usuarioid AS psicologa_usuarioid,
        up.nombre AS paciente_nombre,
        up.apellidopaterno AS paciente_apellido,
        us.nombre AS psicologa_nombre,
        us.apellidopaterno AS psicologa_apellido,
        ps.consultorio
      FROM citas c
      JOIN pacientes p ON c.pacienteid = p.pacienteid
      JOIN psicologas ps ON c.psicologaid = ps.psicologaid
      JOIN usuarios up ON p.usuarioid = up.usuarioid
      JOIN usuarios us ON ps.usuarioid = us.usuarioid
      WHERE c.citaid = $1
    `,
    [citaId]
  );

  return result.rows[0] || null;
};

const validarAccesoCita = async (req, citaId) => {
  const contexto = await getContextoCita(citaId);
  if (!contexto) {
    return { error: { status: 404, message: 'Cita no encontrada.' } };
  }

  if (req.user.rol === 'paciente') {
    const pacienteId = await getPacienteIdByUsuario(req.user.id);
    if (!pacienteId || pacienteId !== contexto.pacienteid) {
      return { error: { status: 403, message: 'No tienes permiso para modificar esta cita.' } };
    }
  }

  if (req.user.rol === 'psicologa') {
    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId || psicologaId !== contexto.psicologaid) {
      return { error: { status: 403, message: 'No tienes permiso para modificar esta cita.' } };
    }
  }

  return { contexto };
};

const getMisCitas = async (req, res) => {
  const usuarioId = req.user.id;
  const rol = req.user.rol;

  try {
    let query;
    let params = [usuarioId];

    if (rol === 'paciente') {
      const pacienteId = await getPacienteIdByUsuario(usuarioId);
      if (!pacienteId) {
        return res.status(404).json({ message: 'Perfil de paciente no encontrado.' });
      }

      query = `
        SELECT
          c.*,
          c.notaspaciente AS notas,
          COALESCE(h.observaciones, h.tratamiento, h.diagnostico, c.notaspaciente) AS notasresumen,
          u.nombre AS psicologa_nombre,
          u.apellidopaterno AS psicologa_apellido,
          ps.consultorio AS ubicacion
        FROM citas c
        JOIN psicologas ps ON c.psicologaid = ps.psicologaid
        JOIN usuarios u ON ps.usuarioid = u.usuarioid
        LEFT JOIN historialclinico h ON h.citaid = c.citaid
        WHERE c.pacienteid = $1
        ORDER BY c.fechahora DESC
      `;
      params = [pacienteId];
    } else if (rol === 'psicologa') {
      const psicologaId = await getPsicologaIdByUsuario(usuarioId);
      if (!psicologaId) {
        return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
      }

      query = `
        SELECT
          c.*,
          COALESCE(c.notaspsicologa, c.notaspaciente) AS notas,
          COALESCE(h.observaciones, h.tratamiento, h.diagnostico, c.notaspsicologa, c.notaspaciente) AS notasresumen,
          u.nombre AS paciente_nombre,
          u.apellidopaterno AS paciente_apellido,
          ps.consultorio AS ubicacion
        FROM citas c
        JOIN pacientes p ON c.pacienteid = p.pacienteid
        JOIN usuarios u ON p.usuarioid = u.usuarioid
        JOIN psicologas ps ON c.psicologaid = ps.psicologaid
        LEFT JOIN historialclinico h ON h.citaid = c.citaid
        WHERE c.psicologaid = $1
        ORDER BY c.fechahora DESC
      `;
      params = [psicologaId];
    } else {
      query = 'SELECT * FROM citas ORDER BY fechahora DESC';
      params = [];
    }

    const result = await db.query(query, params);
    res.json(
      result.rows.map((row) => ({
        ...row,
        notas: rol === 'psicologa' ? (row.notaspsicologa || '') : (row.notaspaciente || ''),
        notasresumen: row.notasresumen || row.notaspsicologa || row.notaspaciente || '',
      }))
    );
  } catch (error) {
    console.error('Error al obtener citas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const crearCita = async (req, res) => {
  const { psicologaId, pacienteId, fecha, hora, notas, modalidad, duracionMin } = req.body;
  const usuarioId = req.user.id;
  const rol = req.user.rol;

  try {
    let citaPacienteId = pacienteId;
    let citaPsicologaId = psicologaId;

    if (rol === 'paciente') {
      citaPacienteId = await getPacienteIdByUsuario(usuarioId);
      if (!citaPacienteId) {
        return res.status(404).json({ message: 'Perfil de paciente no encontrado.' });
      }
      if (!citaPsicologaId) {
        return res.status(400).json({ message: 'La psicóloga es requerida.' });
      }
    }

    if (rol === 'psicologa') {
      citaPsicologaId = await getPsicologaIdByUsuario(usuarioId);
      if (!citaPsicologaId) {
        return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
      }
      if (!citaPacienteId) {
        return res.status(400).json({ message: 'El paciente es requerido.' });
      }
    }

    const fechaHora = construirFechaHora(fecha, hora);
    if (!fechaHora) {
      return res.status(400).json({ message: 'Fecha u hora inválida.' });
    }

    if (esFechaHoraPasada(fechaHora)) {
      return res.status(400).json({ message: 'No puedes agendar una cita en una fecha u hora pasada.' });
    }

    const duracionFinal = Number(duracionMin || 60);
    const modalidadFinal = modalidad || 'Presencial';
    const notasPacienteFinal = rol === 'paciente' ? notas || null : null;
    const notasPsicologaFinal = rol === 'psicologa' ? notas || null : null;
    const disponibilidad = await validarDisponibilidad({ psicologaId: citaPsicologaId, fechaHora, duracionMin: duracionFinal });
    if (!disponibilidad.disponible) {
      return res.status(409).json({ message: disponibilidad.message });
    }

    // Si existe una cita cancelada en el mismo slot, se reutiliza para respetar
    // la restricción UNIQUE(psicologaid, fechahora) sin tocar el esquema.
    let result = await db.query(
      `
        UPDATE citas
        SET pacienteid = $1,
            psicologaid = $2,
            fechahora = $3,
            duracionmin = $4,
            estado = 'Pendiente',
            modalidad = $5,
            notaspaciente = $6,
            notaspsicologa = $7,
            fechamodificacion = NOW()
        WHERE psicologaid = $2
          AND fechahora = $3
          AND COALESCE(LOWER(TRIM(estado)), '') IN ('cancelada', 'cancelado')
        RETURNING citaid
      `,
      [
        citaPacienteId,
        citaPsicologaId,
        fechaHora,
        duracionFinal,
        modalidadFinal,
        notasPacienteFinal,
        notasPsicologaFinal,
      ]
    );

    if (result.rows.length === 0) {
      result = await db.query(
        `
          INSERT INTO citas (
            pacienteid,
            psicologaid,
            fechahora,
            duracionmin,
            estado,
            modalidad,
            notaspaciente,
            notaspsicologa,
            fechamodificacion
          )
          VALUES ($1, $2, $3, $4, 'Pendiente', $5, $6, $7, NOW())
          RETURNING citaid
        `,
        [
          citaPacienteId,
          citaPsicologaId,
          fechaHora,
          duracionFinal,
          modalidadFinal,
          notasPacienteFinal,
          notasPsicologaFinal,
        ]
      );
    }

    const contexto = await getContextoCita(result.rows[0].citaid);
    if (contexto) {
      const fechaCliente = obtenerFechaClienteDesdeRequest(req);
      await crearNotificacion({
        usuarioId: contexto.paciente_usuarioid,
        citaId: contexto.citaid,
        tipo: 'Confirmacion',
        mensaje: `Tu cita con ${contexto.psicologa_nombre} ${contexto.psicologa_apellido} fue programada para ${new Date(contexto.fechahora).toLocaleString('es-MX')}.`,
        fechaEnvio: fechaCliente,
      });
      await crearNotificacion({
        usuarioId: contexto.psicologa_usuarioid,
        citaId: contexto.citaid,
        tipo: 'Confirmacion',
        mensaje: `Se programó una cita con ${contexto.paciente_nombre} ${contexto.paciente_apellido} para ${new Date(contexto.fechahora).toLocaleString('es-MX')}.`,
        fechaEnvio: fechaCliente,
      });
    }

    res.status(201).json({ citaId: result.rows[0].citaid });
  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const actualizarCita = async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, modalidad, duracionMin, estado, notas, notasPaciente, notasPsicologa } = req.body;

  try {
    const validacion = await validarAccesoCita(req, id);
    if (validacion.error) {
      return res.status(validacion.error.status).json({ message: validacion.error.message });
    }

    const contexto = validacion.contexto;
    const fechaBase = fecha || new Date(contexto.fechahora).toISOString().slice(0, 10);
    const horaBase = hora || new Date(contexto.fechahora).toTimeString().slice(0, 5);
    const nuevaFechaHora = construirFechaHora(fechaBase, horaBase);
    if (!nuevaFechaHora) {
      return res.status(400).json({ message: 'Fecha u hora inválida.' });
    }

    if (esFechaHoraPasada(nuevaFechaHora)) {
      return res.status(400).json({ message: 'No puedes reagendar una cita en una fecha u hora pasada.' });
    }

    const nuevaDuracion = Number(duracionMin || contexto.duracionmin || 60);
    const nuevaModalidad = modalidad || contexto.modalidad;
    const nuevoEstado = req.user.rol === 'psicologa'
      ? (ESTADOS_EDITABLES.includes(estado) ? estado : contexto.estado)
      : 'Pendiente';

    const disponibilidad = await validarDisponibilidad({
      psicologaId: contexto.psicologaid,
      fechaHora: nuevaFechaHora,
      duracionMin: nuevaDuracion,
      citaIdExcluir: Number(id),
    });
    if (!disponibilidad.disponible) {
      return res.status(409).json({ message: disponibilidad.message });
    }

    const notaspaciente = req.user.rol === 'paciente'
      ? (notasPaciente ?? notas ?? contexto.notaspaciente)
      : contexto.notaspaciente;
    const notaspsicologa = req.user.rol === 'psicologa'
      ? (notasPsicologa ?? notas ?? contexto.notaspsicologa)
      : contexto.notaspsicologa;

    const result = await db.query(
      `
        UPDATE citas
        SET fechahora = $1,
            duracionmin = $2,
            modalidad = $3,
            estado = $4,
            notaspaciente = $5,
            notaspsicologa = $6,
            fechamodificacion = NOW()
        WHERE citaid = $7
        RETURNING *
      `,
      [nuevaFechaHora, nuevaDuracion, nuevaModalidad, nuevoEstado, notaspaciente, notaspsicologa, id]
    );

    const contextoActualizado = await getContextoCita(id);
    if (contextoActualizado) {
      const fechaCliente = obtenerFechaClienteDesdeRequest(req);
      const destinatario = req.user.rol === 'paciente' ? contextoActualizado.psicologa_usuarioid : contextoActualizado.paciente_usuarioid;
      const nombreContraparte = req.user.rol === 'paciente'
        ? `${contextoActualizado.paciente_nombre} ${contextoActualizado.paciente_apellido}`
        : `${contextoActualizado.psicologa_nombre} ${contextoActualizado.psicologa_apellido}`;

      await crearNotificacion({
        usuarioId: destinatario,
        citaId: Number(id),
        tipo: 'Reagenda',
        mensaje: `La cita con ${nombreContraparte} fue actualizada para ${new Date(contextoActualizado.fechahora).toLocaleString('es-MX')}.`,
        fechaEnvio: fechaCliente,
      });
    }

    res.json({
      ...result.rows[0],
      notas: req.user.rol === 'psicologa' ? (notaspsicologa || '') : (notaspaciente || ''),
      notasresumen: contextoActualizado
        ? (contextoActualizado.notaspsicologa || contextoActualizado.notaspaciente || '')
        : '',
    });
  } catch (error) {
    console.error('Error al actualizar la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const confirmarCita = async (req, res) => {
  const { id } = req.params;

  try {
    const validacion = await validarAccesoCita(req, id);
    if (validacion.error) {
      return res.status(validacion.error.status).json({ message: validacion.error.message });
    }

    const result = await db.query(
      `
        UPDATE citas
        SET estado = 'Confirmada', fechamodificacion = NOW()
        WHERE citaid = $1
        RETURNING *
      `,
      [id]
    );

    const contexto = await getContextoCita(id);
    if (contexto) {
      const fechaCliente = obtenerFechaClienteDesdeRequest(req);
      const destinatario = req.user.rol === 'paciente' ? contexto.psicologa_usuarioid : contexto.paciente_usuarioid;
      await crearNotificacion({
        usuarioId: destinatario,
        citaId: Number(id),
        tipo: 'Confirmacion',
        mensaje: `La cita del ${new Date(contexto.fechahora).toLocaleString('es-MX')} fue confirmada.`,
        fechaEnvio: fechaCliente,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al confirmar la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const cancelarCita = async (req, res) => {
  const { id } = req.params;

  try {
    const validacion = await validarAccesoCita(req, id);
    if (validacion.error) {
      return res.status(validacion.error.status).json({ message: validacion.error.message });
    }

    const result = await db.query(
      `
        UPDATE citas
        SET estado = 'Cancelada', fechamodificacion = NOW()
        WHERE citaid = $1
        RETURNING *
      `,
      [id]
    );

    const contexto = await getContextoCita(id);
    if (contexto) {
      const fechaCliente = obtenerFechaClienteDesdeRequest(req);
      const destinatario = req.user.rol === 'paciente' ? contexto.psicologa_usuarioid : contexto.paciente_usuarioid;
      await crearNotificacion({
        usuarioId: destinatario,
        citaId: Number(id),
        tipo: 'Cancelacion',
        mensaje: `La cita del ${new Date(contexto.fechahora).toLocaleString('es-MX')} fue cancelada.`,
        fechaEnvio: fechaCliente,
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al cancelar la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getMiDisponibilidad = async (req, res) => {
  const { fecha } = req.query;

  try {
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden consultar su disponibilidad interna.' });
    }

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    if (!fecha) {
      return res.status(400).json({ message: 'La fecha es requerida.' });
    }

    const agendaResult = await db.query(
      `
        SELECT horainicio, horafin
        FROM agendas
        WHERE psicologaid = $1 AND diasemana ILIKE $2 AND disponible = true
      `,
      [psicologaId, DIAS_SEMANA[new Date(`${fecha}T00:00:00`).getDay()]]
    );

    if (agendaResult.rows.length === 0) {
      return res.json([]);
    }

    const citasResult = await db.query(
      `
        SELECT fechahora, duracionmin
        FROM citas
        WHERE psicologaid = $1
          AND DATE(fechahora) = $2
          AND COALESCE(LOWER(TRIM(estado)), '') NOT IN ('cancelada', 'cancelado')
      `,
      [psicologaId, fecha]
    );

    const disponibilidad = new Set();
    const duracionDefault = 60;

    agendaResult.rows.forEach((bloque) => {
      let horaActual = new Date(`${fecha}T${String(bloque.horainicio).slice(0, 5)}:00`);
      const horaFin = new Date(`${fecha}T${String(bloque.horafin).slice(0, 5)}:00`);

      while (horaActual < horaFin) {
        const finPotencial = new Date(horaActual.getTime() + duracionDefault * 60000);
        const ocupada = citasResult.rows.some((cita) => {
          const citaInicio = new Date(cita.fechahora);
          const citaFin = new Date(citaInicio.getTime() + Number(cita.duracionmin || 60) * 60000);
          return horaActual < citaFin && finPotencial > citaInicio;
        });

        if (!ocupada && finPotencial <= horaFin) {
          disponibilidad.add(horaActual.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false }));
        }

        horaActual = new Date(horaActual.getTime() + duracionDefault * 60000);
      }
    });

    res.json(Array.from(disponibilidad).sort());
  } catch (error) {
    console.error('Error al obtener mi disponibilidad:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getMisCitas,
  crearCita,
  actualizarCita,
  confirmarCita,
  cancelarCita,
  getMiDisponibilidad,
};
