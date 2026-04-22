const db = require('../db');

const UNIDADES_PERMITIDAS = ['dias', 'semanas', 'meses'];

let ensureTablePromise = null;

const ensureFrecuenciaTable = async () => {
  if (!ensureTablePromise) {
    ensureTablePromise = db.query(`
      CREATE TABLE IF NOT EXISTS frecuenciasrecomendadascitas (
        frecuenciaid SERIAL PRIMARY KEY,
        pacienteid INTEGER NOT NULL REFERENCES pacientes(pacienteid) ON DELETE CASCADE,
        psicologaid INTEGER NOT NULL REFERENCES psicologas(psicologaid) ON DELETE CASCADE,
        cadacantidad INTEGER NOT NULL CHECK (cadacantidad >= 1 AND cadacantidad <= 365),
        unidad VARCHAR(16) NOT NULL CHECK (unidad IN ('dias', 'semanas', 'meses')),
        nota VARCHAR(500),
        fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fechamodificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (pacienteid, psicologaid)
      )
    `);
  }

  await ensureTablePromise;
};

const getPsicologaIdByUsuario = async (usuarioId) => {
  const result = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [usuarioId]);
  return result.rows[0]?.psicologaid;
};

const getPacienteIdByUsuario = async (usuarioId) => {
  const result = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
  return result.rows[0]?.pacienteid;
};

const unidadLabel = (unidad) => {
  if (unidad === 'dias') return 'días';
  if (unidad === 'semanas') return 'semanas';
  return 'meses';
};

const mapFrecuencia = (row) => {
  if (!row) return null;
  return {
    frecuenciaId: row.frecuenciaid,
    pacienteId: row.pacienteid,
    psicologaId: row.psicologaid,
    cadaCantidad: row.cadacantidad,
    unidad: row.unidad,
    nota: row.nota || '',
    recomendacionTexto: `Cada ${row.cadacantidad} ${unidadLabel(row.unidad)}`,
    fechaCreacion: row.fechacreacion,
    fechaModificacion: row.fechamodificacion,
    psicologaNombre: row.psicologa_nombre || '',
    psicologaApellido: row.psicologa_apellido || '',
  };
};

const getFrecuenciaPorPacienteParaPsicologa = async (req, res) => {
  try {
    if (!req.user || req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo psicólogas pueden consultar esta información.' });
    }

    const pacienteId = Number(req.params.pacienteId);
    if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
      return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    await ensureFrecuenciaTable();

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const result = await db.query(
      `
        SELECT frecuenciaid, pacienteid, psicologaid, cadacantidad, unidad, nota, fechacreacion, fechamodificacion
        FROM frecuenciasrecomendadascitas
        WHERE pacienteid = $1 AND psicologaid = $2
        LIMIT 1
      `,
      [pacienteId, psicologaId]
    );

    return res.json({
      success: true,
      frecuencia: mapFrecuencia(result.rows[0] || null),
    });
  } catch (error) {
    console.error('Error al consultar frecuencia recomendada (psicóloga):', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const upsertFrecuenciaPorPacienteParaPsicologa = async (req, res) => {
  try {
    if (!req.user || req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo psicólogas pueden actualizar esta información.' });
    }

    const pacienteId = Number(req.params.pacienteId);
    if (!Number.isInteger(pacienteId) || pacienteId <= 0) {
      return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    const cadaCantidad = Number(req.body?.cadaCantidad);
    const unidad = String(req.body?.unidad || '').toLowerCase();
    const nota = String(req.body?.nota || '').trim();

    if (!Number.isInteger(cadaCantidad) || cadaCantidad <= 0 || cadaCantidad > 365) {
      return res.status(400).json({ message: 'cadaCantidad debe ser un entero entre 1 y 365.' });
    }

    if (!UNIDADES_PERMITIDAS.includes(unidad)) {
      return res.status(400).json({ message: 'Unidad inválida. Usa dias, semanas o meses.' });
    }

    await ensureFrecuenciaTable();

    const psicologaId = await getPsicologaIdByUsuario(req.user.id);
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const pacienteExiste = await db.query('SELECT pacienteid FROM pacientes WHERE pacienteid = $1', [pacienteId]);
    if (pacienteExiste.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }

    const upsert = await db.query(
      `
        INSERT INTO frecuenciasrecomendadascitas (
          pacienteid,
          psicologaid,
          cadacantidad,
          unidad,
          nota,
          fechamodificacion
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        ON CONFLICT (pacienteid, psicologaid)
        DO UPDATE SET
          cadacantidad = EXCLUDED.cadacantidad,
          unidad = EXCLUDED.unidad,
          nota = EXCLUDED.nota,
          fechamodificacion = CURRENT_TIMESTAMP
        RETURNING frecuenciaid, pacienteid, psicologaid, cadacantidad, unidad, nota, fechacreacion, fechamodificacion
      `,
      [pacienteId, psicologaId, cadaCantidad, unidad, nota || null]
    );

    return res.json({
      success: true,
      message: 'Frecuencia recomendada guardada correctamente.',
      frecuencia: mapFrecuencia(upsert.rows[0]),
    });
  } catch (error) {
    console.error('Error al guardar frecuencia recomendada (psicóloga):', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getMiFrecuenciaRecomendada = async (req, res) => {
  try {
    if (!req.user || req.user.rol !== 'paciente') {
      return res.status(403).json({ message: 'Solo pacientes pueden consultar esta información.' });
    }

    await ensureFrecuenciaTable();

    const pacienteId = await getPacienteIdByUsuario(req.user.id);
    if (!pacienteId) {
      return res.status(404).json({ message: 'Perfil de paciente no encontrado.' });
    }

    const result = await db.query(
      `
        SELECT
          f.frecuenciaid,
          f.pacienteid,
          f.psicologaid,
          f.cadacantidad,
          f.unidad,
          f.nota,
          f.fechacreacion,
          f.fechamodificacion,
          u.nombre AS psicologa_nombre,
          u.apellidopaterno AS psicologa_apellido
        FROM frecuenciasrecomendadascitas f
        JOIN psicologas ps ON ps.psicologaid = f.psicologaid
        JOIN usuarios u ON u.usuarioid = ps.usuarioid
        WHERE f.pacienteid = $1
        ORDER BY f.fechamodificacion DESC
        LIMIT 1
      `,
      [pacienteId]
    );

    return res.json({
      success: true,
      frecuencia: mapFrecuencia(result.rows[0] || null),
    });
  } catch (error) {
    console.error('Error al consultar frecuencia recomendada (paciente):', error);
    return res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = {
  getFrecuenciaPorPacienteParaPsicologa,
  upsertFrecuenciaPorPacienteParaPsicologa,
  getMiFrecuenciaRecomendada,
};
