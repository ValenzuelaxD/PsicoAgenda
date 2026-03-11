const db = require('../db');

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;

const getPsicologaIdByUsuario = async (usuarioId) => {
  const result = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [usuarioId]);
  return result.rows[0]?.psicologaid;
};

const normalizarHora = (hora) => String(hora || '').slice(0, 5);

const validarPayloadAgenda = ({ diasemana, horainicio, horafin }) => {
  if (!diasemana || !horainicio || !horafin) {
    return 'Debes indicar día, hora de inicio y hora de fin.';
  }

  if (!DIAS_SEMANA.includes(diasemana)) {
    return 'El día de la semana no es válido.';
  }

  if (!HORA_REGEX.test(horainicio) || !HORA_REGEX.test(horafin)) {
    return 'El formato de hora debe ser HH:MM.';
  }

  if (normalizarHora(horainicio) >= normalizarHora(horafin)) {
    return 'La hora de fin debe ser mayor a la hora de inicio.';
  }

  return null;
};

const existeTraslape = async ({ psicologaId, diasemana, horainicio, horafin, agendaIdExcluir = null }) => {
  const result = await db.query(
    `
      SELECT agendaid
      FROM agendas
      WHERE psicologaid = $1
        AND diasemana = $2
        AND agendaid <> COALESCE($5, -1)
        AND NOT ($4::time <= horainicio OR $3::time >= horafin)
      LIMIT 1
    `,
    [psicologaId, diasemana, normalizarHora(horainicio), normalizarHora(horafin), agendaIdExcluir]
  );

  return result.rows.length > 0;
};

const getMiAgenda = async (req, res) => {
  try {
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden gestionar su agenda.' });
    }

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const result = await db.query(
      `
        SELECT agendaid, psicologaid, diasemana, horainicio, horafin, disponible
        FROM agendas
        WHERE psicologaid = $1
        ORDER BY
          CASE diasemana
            WHEN 'Lunes' THEN 1
            WHEN 'Martes' THEN 2
            WHEN 'Miercoles' THEN 3
            WHEN 'Jueves' THEN 4
            WHEN 'Viernes' THEN 5
            WHEN 'Sabado' THEN 6
            WHEN 'Domingo' THEN 7
            ELSE 8
          END,
          horainicio
      `,
      [psicologaId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener mi agenda:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const crearAgenda = async (req, res) => {
  try {
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden gestionar su agenda.' });
    }

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const { diasemana, horainicio, horafin, disponible = true } = req.body;
    const errorValidacion = validarPayloadAgenda({ diasemana, horainicio, horafin });
    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    if (await existeTraslape({ psicologaId, diasemana, horainicio, horafin })) {
      return res.status(409).json({ message: 'El bloque se traslapa con otro horario ya registrado en ese día.' });
    }

    const result = await db.query(
      `
        INSERT INTO agendas (psicologaid, diasemana, horainicio, horafin, disponible)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING agendaid, psicologaid, diasemana, horainicio, horafin, disponible
      `,
      [psicologaId, diasemana, normalizarHora(horainicio), normalizarHora(horafin), disponible]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al crear bloque de agenda:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const actualizarAgenda = async (req, res) => {
  try {
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden gestionar su agenda.' });
    }

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const agendaId = Number(req.params.id);
    if (!Number.isInteger(agendaId)) {
      return res.status(400).json({ message: 'El identificador del bloque no es válido.' });
    }

    const existente = await db.query(
      'SELECT agendaid FROM agendas WHERE agendaid = $1 AND psicologaid = $2',
      [agendaId, psicologaId]
    );

    if (existente.rows.length === 0) {
      return res.status(404).json({ message: 'Bloque de agenda no encontrado.' });
    }

    const { diasemana, horainicio, horafin, disponible = true } = req.body;
    const errorValidacion = validarPayloadAgenda({ diasemana, horainicio, horafin });
    if (errorValidacion) {
      return res.status(400).json({ message: errorValidacion });
    }

    if (await existeTraslape({ psicologaId, diasemana, horainicio, horafin, agendaIdExcluir: agendaId })) {
      return res.status(409).json({ message: 'El bloque se traslapa con otro horario ya registrado en ese día.' });
    }

    const result = await db.query(
      `
        UPDATE agendas
        SET diasemana = $1,
            horainicio = $2,
            horafin = $3,
            disponible = $4
        WHERE agendaid = $5 AND psicologaid = $6
        RETURNING agendaid, psicologaid, diasemana, horainicio, horafin, disponible
      `,
      [diasemana, normalizarHora(horainicio), normalizarHora(horafin), disponible, agendaId, psicologaId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error al actualizar bloque de agenda:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const eliminarAgenda = async (req, res) => {
  try {
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden gestionar su agenda.' });
    }

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const agendaId = Number(req.params.id);
    if (!Number.isInteger(agendaId)) {
      return res.status(400).json({ message: 'El identificador del bloque no es válido.' });
    }

    const result = await db.query(
      'DELETE FROM agendas WHERE agendaid = $1 AND psicologaid = $2 RETURNING agendaid',
      [agendaId, psicologaId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Bloque de agenda no encontrado.' });
    }

    res.json({ success: true, message: 'Bloque eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar bloque de agenda:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getMiAgenda,
  crearAgenda,
  actualizarAgenda,
  eliminarAgenda,
};