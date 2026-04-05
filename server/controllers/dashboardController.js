const db = require('../db');

const construirFotoDesdeBd = (mimeType, dataBuffer) => {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
};

const getPacienteDashboard = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const pacienteResult = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ message: "Perfil de paciente no encontrado." });
    }
    const pacienteId = pacienteResult.rows[0].pacienteid;

    const proximaCitaQuery = `
      SELECT fechahora
      FROM citas
      WHERE pacienteid = $1 AND fechahora >= NOW() AND estado IN ('Pendiente', 'Confirmada')
      ORDER BY fechahora ASC
      LIMIT 1`;
    
    const sesionesTotalesQuery = `SELECT COUNT(*) FROM citas WHERE pacienteid = $1 AND estado = 'Completada'`;
    
    const ultimaSesionQuery = `
      SELECT fechahora
      FROM citas
      WHERE pacienteid = $1 AND estado = 'Completada'
      ORDER BY fechahora DESC
      LIMIT 1`;

    const proximasCitasQuery = `
      SELECT c.citaid, c.fechahora, c.modalidad, c.estado, u.nombre, u.apellidopaterno, ps.consultorio, u.fotoperfil_mime, u.fotoperfil_data
      FROM citas c
      JOIN psicologas ps ON c.psicologaid = ps.psicologaid
      JOIN usuarios u ON ps.usuarioid = u.usuarioid
      WHERE c.pacienteid = $1 AND c.fechahora >= NOW() AND c.estado IN ('Pendiente', 'Confirmada')
      ORDER BY c.fechahora ASC
      LIMIT 5`;

    const proximaCitaResult = await db.query(proximaCitaQuery, [pacienteId]);
    const sesionesTotalesResult = await db.query(sesionesTotalesQuery, [pacienteId]);
    const ultimaSesionResult = await db.query(ultimaSesionQuery, [pacienteId]);
    const proximasCitasResult = await db.query(proximasCitasQuery, [pacienteId]);

    const proximasCitasConFoto = proximasCitasResult.rows.map(row => ({
      ...row,
      fotoperfil: construirFotoDesdeBd(row.fotoperfil_mime, row.fotoperfil_data)
    }));

    res.json({
      proximaCita: proximaCitaResult.rows[0]?.fechahora,
      sesionesTotales: parseInt(sesionesTotalesResult.rows[0].count, 10),
      ultimaSesion: ultimaSesionResult.rows[0]?.fechahora,
      proximasCitas: proximasCitasConFoto,
    });
  } catch (error) {
    console.error("Error al obtener datos del dashboard del paciente:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getPsicologoDashboard = async (req, res) => {
  const usuarioId = req.user.id;
  const fechaParam = String(req.query?.fecha || '').trim();

  const hoyLocal = new Date();
  const fechaHoy = `${hoyLocal.getFullYear()}-${String(hoyLocal.getMonth() + 1).padStart(2, '0')}-${String(hoyLocal.getDate()).padStart(2, '0')}`;
  const fechaObjetivo = /^\d{4}-\d{2}-\d{2}$/.test(fechaParam) ? fechaParam : fechaHoy;

  try {
    const psicologaResult = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [usuarioId]);
    if (psicologaResult.rows.length === 0) {
      return res.status(404).json({ message: "Perfil de psicóloga no encontrado." });
    }
    const psicologaId = psicologaResult.rows[0].psicologaid;

    const citasHoyQuery = `
      SELECT
        c.*, 
        u.nombre as paciente_nombre,
        u.apellidopaterno as paciente_apellido,
        u.fotoperfil_mime as paciente_fotoperfil_mime,
        u.fotoperfil_data as paciente_fotoperfil_data
      FROM citas c
      JOIN pacientes p ON c.pacienteid = p.pacienteid
      JOIN usuarios u ON p.usuarioid = u.usuarioid
      WHERE c.psicologaid = $1 AND DATE(c.fechahora) = $2
      ORDER BY c.fechahora ASC
    `;
    const pacientesActivosQuery = `SELECT COUNT(DISTINCT pacienteid) FROM citas WHERE psicologaid = $1`;
    const citasSemanaQuery = `SELECT COUNT(*) FROM citas WHERE psicologaid = $1 AND fechahora >= date_trunc('week', CURRENT_DATE) AND fechahora < date_trunc('week', CURRENT_DATE) + interval '1 week'`;
    const citasPendientesQuery = `SELECT COUNT(*) FROM citas WHERE psicologaid = $1 AND estado = 'Pendiente'`;

    const citasHoyResult = await db.query(citasHoyQuery, [psicologaId, fechaObjetivo]);
    const pacientesActivosResult = await db.query(pacientesActivosQuery, [psicologaId]);
    const citasSemanaResult = await db.query(citasSemanaQuery, [psicologaId]);
    const citasPendientesResult = await db.query(citasPendientesQuery, [psicologaId]);

    res.json({
      citasHoy: citasHoyResult.rows.map((row) => ({
        ...row,
        paciente_fotoperfil: construirFotoDesdeBd(row.paciente_fotoperfil_mime, row.paciente_fotoperfil_data),
      })),
      pacientesActivos: parseInt(pacientesActivosResult.rows[0].count, 10),
      citasSemana: parseInt(citasSemanaResult.rows[0].count, 10),
      citasPendientes: parseInt(citasPendientesResult.rows[0].count, 10),
    });

  } catch (error) {
    console.error("Error al obtener datos del dashboard de la psicóloga:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};


module.exports = { getPacienteDashboard, getPsicologoDashboard };
