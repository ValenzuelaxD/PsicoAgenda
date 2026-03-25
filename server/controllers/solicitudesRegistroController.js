const db = require('../db');

const TABLA_SOLICITUDES = 'solicitudesregistropsicologas';

const getSolicitudesPsicologas = async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT
        s.solicitudid,
        s.nombre,
        s.apellidopaterno,
        s.apellidomaterno,
        s.correo,
        s.telefono,
        s.cedulaprofesional,
        s.especialidad,
        s.estadosolicitud,
        s.motivorevision,
        s.fechasolicitud,
        s.fecharevision,
        s.usuarioadminrevisionid,
        s.usuariocreadoid,
        u.nombre AS admin_nombre,
        u.apellidopaterno AS admin_apellidopaterno
      FROM ${TABLA_SOLICITUDES} s
      LEFT JOIN usuarios u ON u.usuarioid = s.usuarioadminrevisionid
      ORDER BY
        CASE WHEN s.estadosolicitud = 'Pendiente' THEN 0 ELSE 1 END,
        s.fechasolicitud DESC
      `
    );

    return res.json({
      success: true,
      solicitudes: result.rows,
    });
  } catch (error) {
    console.error('Error al listar solicitudes de psicologas:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message,
    });
  }
};

const aprobarSolicitudPsicologa = async (req, res) => {
  const solicitudId = Number(req.params.id);
  const motivoRevision = req.body?.motivoRevision || null;

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de solicitud invalido.',
    });
  }

  let client;
  try {
    client = await db.getClient();
    await client.query('BEGIN');

    const solicitudResult = await client.query(
      `SELECT * FROM ${TABLA_SOLICITUDES} WHERE solicitudid = $1 FOR UPDATE`,
      [solicitudId]
    );

    if (solicitudResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada.',
      });
    }

    const solicitud = solicitudResult.rows[0];

    if (solicitud.estadosolicitud !== 'Pendiente') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `La solicitud ya fue procesada (${solicitud.estadosolicitud}).`,
      });
    }

    const correoExistente = await client.query(
      'SELECT usuarioid FROM usuarios WHERE correo = $1',
      [solicitud.correo.toLowerCase()]
    );
    if (correoExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'El correo ya esta registrado en usuarios.',
      });
    }

    const cedulaExistente = await client.query(
      'SELECT psicologaid FROM psicologas WHERE cedulaprofesional = $1',
      [solicitud.cedulaprofesional]
    );
    if (cedulaExistente.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'La cedula profesional ya esta registrada.',
      });
    }

    const usuarioNuevo = await client.query(
      `
      INSERT INTO usuarios (nombre, apellidopaterno, apellidomaterno, correo, contrasenahash, telefono, rol, activo)
      VALUES ($1, $2, $3, $4, $5, $6, 'psicologa', true)
      RETURNING usuarioid, nombre, apellidopaterno, correo, rol
      `,
      [
        solicitud.nombre,
        solicitud.apellidopaterno,
        solicitud.apellidomaterno || null,
        solicitud.correo.toLowerCase(),
        solicitud.contrasenahash,
        solicitud.telefono || null,
      ]
    );

    const usuarioCreadoId = usuarioNuevo.rows[0].usuarioid;

    await client.query(
      `
      INSERT INTO psicologas (usuarioid, cedulaprofesional, especialidad)
      VALUES ($1, $2, $3)
      `,
      [
        usuarioCreadoId,
        solicitud.cedulaprofesional,
        solicitud.especialidad || 'Psicologia General',
      ]
    );

    await client.query(
      `
      UPDATE ${TABLA_SOLICITUDES}
      SET
        estadosolicitud = 'Aprobada',
        motivorevision = $2,
        usuarioadminrevisionid = $3,
        usuariocreadoid = $4,
        fecharevision = CURRENT_TIMESTAMP
      WHERE solicitudid = $1
      `,
      [solicitudId, motivoRevision, req.user.id, usuarioCreadoId]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Solicitud aprobada y cuenta de psicologa creada.',
      user: usuarioNuevo.rows[0],
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error en rollback al aprobar solicitud:', rollbackError);
      }
    }

    console.error('Error al aprobar solicitud de psicologa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message,
    });
  } finally {
    if (client) client.release();
  }
};

const rechazarSolicitudPsicologa = async (req, res) => {
  const solicitudId = Number(req.params.id);
  const motivoRevision = (req.body?.motivoRevision || '').trim();

  if (!Number.isInteger(solicitudId) || solicitudId <= 0) {
    return res.status(400).json({
      success: false,
      message: 'ID de solicitud invalido.',
    });
  }

  if (!motivoRevision) {
    return res.status(400).json({
      success: false,
      message: 'El motivo de rechazo es obligatorio.',
    });
  }

  let client;
  try {
    client = await db.getClient();
    await client.query('BEGIN');

    const solicitudResult = await client.query(
      `SELECT solicitudid, estadosolicitud FROM ${TABLA_SOLICITUDES} WHERE solicitudid = $1 FOR UPDATE`,
      [solicitudId]
    );

    if (solicitudResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada.',
      });
    }

    const solicitud = solicitudResult.rows[0];
    if (solicitud.estadosolicitud !== 'Pendiente') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: `La solicitud ya fue procesada (${solicitud.estadosolicitud}).`,
      });
    }

    await client.query(
      `
      UPDATE ${TABLA_SOLICITUDES}
      SET
        estadosolicitud = 'Rechazada',
        motivorevision = $2,
        usuarioadminrevisionid = $3,
        fecharevision = CURRENT_TIMESTAMP
      WHERE solicitudid = $1
      `,
      [solicitudId, motivoRevision, req.user.id]
    );

    await client.query('COMMIT');

    return res.json({
      success: true,
      message: 'Solicitud rechazada correctamente.',
    });
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error en rollback al rechazar solicitud:', rollbackError);
      }
    }

    console.error('Error al rechazar solicitud de psicologa:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message,
    });
  } finally {
    if (client) client.release();
  }
};

module.exports = {
  getSolicitudesPsicologas,
  aprobarSolicitudPsicologa,
  rechazarSolicitudPsicologa,
};
