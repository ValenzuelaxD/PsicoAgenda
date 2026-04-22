const db = require('../db');
const FELICITACION_PREFIX = '[PSICOAGENDA_COMENTARIO_FELICITACION]';

const extraerComentarioFelicitacion = (observaciones) => {
  const texto = String(observaciones || '');
  const start = texto.indexOf(FELICITACION_PREFIX);

  if (start === -1) {
    return '';
  }

  const contentStart = start + FELICITACION_PREFIX.length;
  const nextMeta = texto.indexOf('[PSICOAGENDA_', contentStart);
  const contentEnd = nextMeta === -1 ? texto.length : nextMeta;

  return texto.slice(contentStart, contentEnd).trim();
};

const construirFotoDesdeBd = (mimeType, dataBuffer) => {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
};

const obtenerFotosPerfilPorUsuario = async (usuarioIds = []) => {
  const idsUnicos = [...new Set(
    usuarioIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  )];

  if (idsUnicos.length === 0) {
    return new Map();
  }

  const result = await db.query(
    `
      SELECT usuarioid, fotoperfil_mime, fotoperfil_data
      FROM usuarios
      WHERE usuarioid = ANY($1::int[])
    `,
    [idsUnicos]
  );

  const fotosPorUsuario = new Map();
  result.rows.forEach((row) => {
    fotosPorUsuario.set(row.usuarioid, construirFotoDesdeBd(row.fotoperfil_mime, row.fotoperfil_data));
  });

  return fotosPorUsuario;
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
    
    const sesionesTotalesQuery = `SELECT COUNT(*) as count FROM citas WHERE pacienteid = $1 AND COALESCE(LOWER(TRIM(estado)), '') = 'completada'`;
    
    const ultimaSesionQuery = `
      SELECT fechahora
      FROM citas
      WHERE pacienteid = $1 AND COALESCE(LOWER(TRIM(estado)), '') = 'completada'
      ORDER BY fechahora DESC
      LIMIT 1`;

    const proximasCitasQuery = `
      SELECT
        c.citaid,
        c.fechahora,
        c.modalidad,
        c.estado,
        u.nombre,
        u.apellidopaterno,
        ps.consultorio,
        u.usuarioid AS psicologa_usuarioid
      FROM citas c
      JOIN psicologas ps ON c.psicologaid = ps.psicologaid
      JOIN usuarios u ON ps.usuarioid = u.usuarioid
      WHERE c.pacienteid = $1 AND c.fechahora >= NOW() AND c.estado IN ('Pendiente', 'Confirmada')
      ORDER BY c.fechahora ASC
      LIMIT 5`;

    const comentarioPositivoQuery = `
      SELECT observaciones
      FROM historialclinico
      WHERE pacienteid = $1
        AND observaciones ILIKE '%' || $2 || '%'
      ORDER BY fechaentrada DESC
      LIMIT 1`;

    const [
      proximaCitaResult,
      sesionesTotalesResult,
      ultimaSesionResult,
      proximasCitasResult,
      comentarioPositivoResult,
    ] = await Promise.all([
      db.query(proximaCitaQuery, [pacienteId]),
      db.query(sesionesTotalesQuery, [pacienteId]),
      db.query(ultimaSesionQuery, [pacienteId]),
      db.query(proximasCitasQuery, [pacienteId]),
      db.query(comentarioPositivoQuery, [pacienteId, FELICITACION_PREFIX]),
    ]);

    const fotosPorUsuario = await obtenerFotosPerfilPorUsuario(
      proximasCitasResult.rows.map((row) => row.psicologa_usuarioid)
    );

    const proximasCitasConFoto = proximasCitasResult.rows.map((row) => {
      const { psicologa_usuarioid, ...resto } = row;
      return {
        ...resto,
        fotoperfil: fotosPorUsuario.get(psicologa_usuarioid) || '',
      };
    });

    const comentarioPositivo = extraerComentarioFelicitacion(
      comentarioPositivoResult.rows[0]?.observaciones
    );

    res.json({
      proximaCita: proximaCitaResult.rows[0]?.fechahora,
      sesionesTotales: parseInt(sesionesTotalesResult.rows[0].count, 10),
      ultimaSesion: ultimaSesionResult.rows[0]?.fechahora,
      proximasCitas: proximasCitasConFoto,
      comentarioPositivo,
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
        u.usuarioid as paciente_usuarioid
      FROM citas c
      JOIN pacientes p ON c.pacienteid = p.pacienteid
      JOIN usuarios u ON p.usuarioid = u.usuarioid
      WHERE c.psicologaid = $1
        AND c.fechahora >= $2::date
        AND c.fechahora < ($2::date + interval '1 day')
      ORDER BY c.fechahora ASC
    `;
    const pacientesActivosQuery = `SELECT COUNT(DISTINCT pacienteid) FROM citas WHERE psicologaid = $1`;
    const citasSemanaQuery = `SELECT COUNT(*) FROM citas WHERE psicologaid = $1 AND fechahora >= date_trunc('week', CURRENT_DATE) AND fechahora < date_trunc('week', CURRENT_DATE) + interval '1 week'`;
    const citasPendientesQuery = `
      SELECT COUNT(*)
      FROM citas
      WHERE psicologaid = $1
        AND estado = 'Pendiente'
        AND fechahora >= NOW()
    `;
    const pendientesPorConfirmarQuery = `
      SELECT
        c.citaid,
        c.fechahora,
        c.modalidad,
        c.estado,
        c.duracionmin,
        u.nombre AS paciente_nombre,
        u.apellidopaterno AS paciente_apellido,
        u.usuarioid AS paciente_usuarioid
      FROM citas c
      JOIN pacientes p ON c.pacienteid = p.pacienteid
      JOIN usuarios u ON p.usuarioid = u.usuarioid
      WHERE c.psicologaid = $1
        AND c.estado = 'Pendiente'
        AND c.fechahora >= NOW()
      ORDER BY c.fechahora ASC
      LIMIT 5
    `;

    const [
      citasHoyResult,
      pacientesActivosResult,
      citasSemanaResult,
      citasPendientesResult,
      pendientesPorConfirmarResult,
    ] = await Promise.all([
      db.query(citasHoyQuery, [psicologaId, fechaObjetivo]),
      db.query(pacientesActivosQuery, [psicologaId]),
      db.query(citasSemanaQuery, [psicologaId]),
      db.query(citasPendientesQuery, [psicologaId]),
      db.query(pendientesPorConfirmarQuery, [psicologaId]),
    ]);

    const fotosPorUsuario = await obtenerFotosPerfilPorUsuario([
      ...citasHoyResult.rows.map((row) => row.paciente_usuarioid),
      ...pendientesPorConfirmarResult.rows.map((row) => row.paciente_usuarioid),
    ]);

    res.json({
      citasHoy: citasHoyResult.rows.map((row) => {
        const { paciente_usuarioid, ...resto } = row;
        return {
          ...resto,
          paciente_fotoperfil: fotosPorUsuario.get(paciente_usuarioid) || '',
        };
      }),
      pacientesActivos: parseInt(pacientesActivosResult.rows[0].count, 10),
      citasSemana: parseInt(citasSemanaResult.rows[0].count, 10),
      citasPendientes: parseInt(citasPendientesResult.rows[0].count, 10),
      pendientesPorConfirmar: pendientesPorConfirmarResult.rows.map((row) => {
        const { paciente_usuarioid, ...resto } = row;
        return {
          ...resto,
          paciente_fotoperfil: fotosPorUsuario.get(paciente_usuarioid) || '',
        };
      }),
    });

  } catch (error) {
    console.error("Error al obtener datos del dashboard de la psicóloga:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};


module.exports = { getPacienteDashboard, getPsicologoDashboard };
