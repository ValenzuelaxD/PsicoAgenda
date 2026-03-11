const db = require('../db');

const getReporteCitas = async (req, res) => {
  try {
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden consultar reportes.' });
    }

    const psicologaResult = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [req.user.id]);
    const psicologaId = psicologaResult.rows[0]?.psicologaid;
    if (!psicologaId) {
      return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
    }

    const now = new Date();
    const primerDiaMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const ultimoDiaMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

    const fechaInicio = req.query.fechaInicio || primerDiaMes;
    const fechaFin = req.query.fechaFin || ultimoDiaMes;
    const modalidad = req.query.modalidad;
    const pacienteId = req.query.pacienteId;
    const estados = typeof req.query.estados === 'string'
      ? req.query.estados.split(',').map((estado) => estado.trim()).filter(Boolean)
      : [];

    const params = [psicologaId, fechaInicio, fechaFin];
    const condiciones = [
      'c.psicologaid = $1',
      'DATE(c.fechahora) >= $2',
      'DATE(c.fechahora) <= $3',
    ];

    if (modalidad && modalidad !== 'todas') {
      params.push(modalidad);
      condiciones.push(`c.modalidad = $${params.length}`);
    }

    if (pacienteId && pacienteId !== 'todos') {
      params.push(Number(pacienteId));
      condiciones.push(`c.pacienteid = $${params.length}`);
    }

    if (estados.length > 0) {
      params.push(estados);
      condiciones.push(`c.estado = ANY($${params.length})`);
    }

    const whereClause = condiciones.join(' AND ');

    const summaryQuery = `
      WITH filtered AS (
        SELECT c.*
        FROM citas c
        WHERE ${whereClause}
      )
      SELECT
        COUNT(*)::int AS total_citas,
        COUNT(*) FILTER (WHERE estado = 'Completada')::int AS citas_completadas,
        COUNT(*) FILTER (WHERE estado = 'Cancelada')::int AS citas_canceladas,
        COUNT(*) FILTER (WHERE estado = 'Pendiente')::int AS citas_pendientes,
        COUNT(*) FILTER (WHERE estado = 'Reagendada')::int AS citas_reagendadas,
        COUNT(DISTINCT pacienteid)::int AS pacientes_activos,
        COALESCE(ROUND(SUM(duracionmin) FILTER (WHERE estado = 'Completada') / 60.0, 1), 0) AS horas_terapia
      FROM filtered
    `;

    const modalidadesQuery = `
      WITH filtered AS (
        SELECT c.modalidad, COUNT(*)::int AS cantidad
        FROM citas c
        WHERE ${whereClause}
        GROUP BY c.modalidad
      ), total AS (
        SELECT COALESCE(SUM(cantidad), 0) AS total FROM filtered
      )
      SELECT
        modalidad,
        cantidad,
        CASE WHEN total.total = 0 THEN 0 ELSE ROUND((cantidad::numeric / total.total) * 100, 1) END AS porcentaje
      FROM filtered, total
      ORDER BY cantidad DESC, modalidad ASC
    `;

    const pacientesQuery = `
      SELECT
        p.pacienteid,
        CONCAT(u.nombre, ' ', u.apellidopaterno) AS paciente,
        COUNT(*)::int AS sesiones,
        MAX(c.fechahora) AS ultima_cita
      FROM citas c
      JOIN pacientes p ON c.pacienteid = p.pacienteid
      JOIN usuarios u ON p.usuarioid = u.usuarioid
      WHERE ${whereClause}
      GROUP BY p.pacienteid, u.nombre, u.apellidopaterno
      ORDER BY sesiones DESC, ultima_cita DESC
      LIMIT 10
    `;

    const timelineQuery = `
      SELECT
        TO_CHAR(DATE(c.fechahora), 'DD/MM') AS fecha,
        COUNT(*) FILTER (WHERE c.estado = 'Completada')::int AS completadas,
        COUNT(*) FILTER (WHERE c.estado = 'Cancelada')::int AS canceladas,
        COUNT(*) FILTER (WHERE c.estado = 'Pendiente')::int AS pendientes,
        COUNT(*) FILTER (WHERE c.estado = 'Reagendada')::int AS reagendadas
      FROM citas c
      WHERE ${whereClause}
      GROUP BY DATE(c.fechahora)
      ORDER BY DATE(c.fechahora)
    `;

    const listadoQuery = `
      SELECT
        c.citaid,
        DATE(c.fechahora) AS fecha,
        TO_CHAR(c.fechahora, 'HH24:MI') AS hora,
        CONCAT(u.nombre, ' ', u.apellidopaterno) AS paciente,
        c.modalidad,
        c.estado,
        c.duracionmin,
        COALESCE(c.notaspsicologa, c.notaspaciente, '') AS notas,
        ps.consultorio
      FROM citas c
      JOIN pacientes p ON c.pacienteid = p.pacienteid
      JOIN usuarios u ON p.usuarioid = u.usuarioid
      JOIN psicologas ps ON c.psicologaid = ps.psicologaid
      WHERE ${whereClause}
      ORDER BY c.fechahora DESC
    `;

    const [summaryResult, modalidadesResult, pacientesResult, timelineResult, listadoResult] = await Promise.all([
      db.query(summaryQuery, params),
      db.query(modalidadesQuery, params),
      db.query(pacientesQuery, params),
      db.query(timelineQuery, params),
      db.query(listadoQuery, params),
    ]);

    res.json({
      resumen: summaryResult.rows[0],
      modalidades: modalidadesResult.rows,
      pacientes: pacientesResult.rows,
      timeline: timelineResult.rows,
      citas: listadoResult.rows,
    });
  } catch (error) {
    console.error('Error al obtener reporte de citas:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getReporteCitas };