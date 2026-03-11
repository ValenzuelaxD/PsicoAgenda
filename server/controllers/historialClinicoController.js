const db = require('../db');

const getMiHistorial = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    // Obtener el pacienteId del usuario
    const pacienteResult = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ message: "Perfil de paciente no encontrado." });
    }
    const pacienteId = pacienteResult.rows[0].pacienteid;

    // Obtener historial con información de la cita y psicóloga
    const query = `
      SELECT 
        h.historialid,
        h.diagnostico,
        h.tratamiento,
        h.observaciones,
        h.fechaentrada,
        h.esconfidencial,
        c.fechahora as fechacita,
        c.duracionmin,
        c.modalidad,
        u.nombre as psicologa_nombre,
        u.apellidopaterno as psicologa_apellido,
        ps.especialidad
      FROM historialclinico h
      LEFT JOIN citas c ON h.citaid = c.citaid
      LEFT JOIN psicologas ps ON h.psicologaid = ps.psicologaid
      LEFT JOIN usuarios u ON ps.usuarioid = u.usuarioid
      WHERE h.pacienteid = $1
      ORDER BY h.fechaentrada DESC
    `;
    const result = await db.query(query, [pacienteId]);

    // También obtener estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sesiones,
        MAX(fechahora) as ultima_sesion,
        MIN(fechahora) as primera_sesion
      FROM citas
      WHERE pacienteid = $1 AND estado = 'Completada'
    `;
    const statsResult = await db.query(statsQuery, [pacienteId]);

    res.json({
      historial: result.rows,
      estadisticas: statsResult.rows[0]
    });
  } catch (error) {
    console.error("Error al obtener mi historial:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getHistorial = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    const query = `
      SELECT h.*, c.fechahora as fechacita
      FROM historialclinico h
      LEFT JOIN citas c ON h.citaid = c.citaid
      WHERE h.pacienteid = $1
      ORDER BY h.fechaentrada DESC
    `;
    const result = await db.query(query, [pacienteId]);
    res.json(result.rows);
  } catch (error) {
    console.error("Error al obtener el historial clínico:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const crearEntradaHistorial = async (req, res) => {
  try {
    const { pacienteId, diagnostico, tratamiento, observaciones } = req.body;

    if (!pacienteId || !observaciones) {
      return res.status(400).json({ message: 'pacienteId y observaciones son requeridos.' });
    }

    const psicologaResult = await db.query(
      'SELECT psicologaid FROM psicologas WHERE usuarioid = $1',
      [req.user.id]
    );
    if (psicologaResult.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }
    const psicologaId = psicologaResult.rows[0].psicologaid;

    const query = `
      INSERT INTO historialclinico (pacienteid, psicologaid, diagnostico, tratamiento, observaciones)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await db.query(query, [pacienteId, psicologaId, diagnostico, tratamiento, observaciones]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("Error al crear entrada en el historial:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const actualizarEntradaHistorial = async (req, res) => {
  const { id } = req.params;
  const { diagnostico, tratamiento, observaciones } = req.body;

  try {
    const psicologaResult = await db.query(
      'SELECT psicologaid FROM psicologas WHERE usuarioid = $1',
      [req.user.id]
    );
    if (psicologaResult.rows.length === 0) {
      return res.status(403).json({ message: 'No tienes permiso para editar este registro.' });
    }
    const psicologaId = psicologaResult.rows[0].psicologaid;

    const query = `
      UPDATE historialclinico
      SET diagnostico = $1, tratamiento = $2, observaciones = $3
      WHERE historialid = $4 AND psicologaid = $5
      RETURNING *
    `;
    const result = await db.query(query, [diagnostico, tratamiento, observaciones, id, psicologaId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entrada no encontrada o no tienes permiso para editarla.' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar la entrada del historial:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = { getMiHistorial, getHistorial, crearEntradaHistorial, actualizarEntradaHistorial };
