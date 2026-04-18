const db = require('../db');
const crypto = require('crypto');

let sharp = null;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

const HISTORIAL_CACHE_TTL_MS = 90 * 1000;
const HISTORIAL_THUMB_SIZE_PX = 96;
const MAX_HISTORIAL_CACHE_ITEMS = 300;
const MAX_HISTORIAL_MINIATURA_CACHE_ITEMS = 800;

const historialPacienteCache = new Map();
const miniaturasHistorialCache = new Map();

const construirFotoDesdeBd = (mimeType, dataBuffer) => {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
};

const obtenerHistorialPacienteDesdeCache = (pacienteId) => {
  const cacheKey = String(pacienteId);
  const cacheEntry = historialPacienteCache.get(cacheKey);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiraEn <= Date.now()) {
    historialPacienteCache.delete(cacheKey);
    return null;
  }

  return cacheEntry.payload;
};

const guardarHistorialPacienteEnCache = (pacienteId, payload) => {
  if (!payload || typeof payload !== 'object') {
    return;
  }

  if (historialPacienteCache.size >= MAX_HISTORIAL_CACHE_ITEMS) {
    historialPacienteCache.clear();
  }

  historialPacienteCache.set(String(pacienteId), {
    expiraEn: Date.now() + HISTORIAL_CACHE_TTL_MS,
    payload,
  });
};

const invalidarHistorialPacienteCache = (pacienteId) => {
  const pacienteIdNum = Number(pacienteId);
  if (!Number.isInteger(pacienteIdNum) || pacienteIdNum <= 0) {
    return;
  }

  historialPacienteCache.delete(String(pacienteIdNum));
};

const construirClaveMiniaturaHistorial = ({ usuarioId, mimeType, dataBuffer }) => {
  const hash = crypto.createHash('sha1').update(dataBuffer).digest('hex').slice(0, 20);
  return `${usuarioId}:${mimeType}:${HISTORIAL_THUMB_SIZE_PX}:${hash}`;
};

const construirFotoMiniaturaDesdeBd = async (usuarioId, mimeType, dataBuffer) => {
  if (!mimeType || !dataBuffer) {
    return '';
  }

  if (!sharp) {
    return construirFotoDesdeBd(mimeType, dataBuffer);
  }

  const mimeNormalizado = String(mimeType).toLowerCase();
  if (!mimeNormalizado.startsWith('image/')) {
    return construirFotoDesdeBd(mimeType, dataBuffer);
  }

  const cacheKey = construirClaveMiniaturaHistorial({ usuarioId, mimeType: mimeNormalizado, dataBuffer });
  const miniaturaEnCache = miniaturasHistorialCache.get(cacheKey);
  if (miniaturaEnCache) {
    return miniaturaEnCache;
  }

  try {
    const miniatura = await sharp(dataBuffer)
      .rotate()
      .resize(HISTORIAL_THUMB_SIZE_PX, HISTORIAL_THUMB_SIZE_PX, {
        fit: 'cover',
        position: 'attention',
      })
      .webp({ quality: 72 })
      .toBuffer();

    const dataUrl = `data:image/webp;base64,${miniatura.toString('base64')}`;

    if (miniaturasHistorialCache.size >= MAX_HISTORIAL_MINIATURA_CACHE_ITEMS) {
      miniaturasHistorialCache.clear();
    }
    miniaturasHistorialCache.set(cacheKey, dataUrl);

    return dataUrl;
  } catch {
    return construirFotoDesdeBd(mimeType, dataBuffer);
  }
};

const obtenerFotosPerfilPorUsuario = async (usuarioIds = [], { usarMiniatura = false } = {}) => {
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
  const fotosResueltas = await Promise.all(
    result.rows.map(async (row) => {
      const foto = usarMiniatura
        ? await construirFotoMiniaturaDesdeBd(row.usuarioid, row.fotoperfil_mime, row.fotoperfil_data)
        : construirFotoDesdeBd(row.fotoperfil_mime, row.fotoperfil_data);

      return { usuarioid: row.usuarioid, foto };
    })
  );

  fotosResueltas.forEach((row) => {
    fotosPorUsuario.set(row.usuarioid, row.foto);
  });

  return fotosPorUsuario;
};

const getMiHistorial = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    // Obtener el pacienteId del usuario
    const pacienteResult = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ message: "Perfil de paciente no encontrado." });
    }
    const pacienteId = pacienteResult.rows[0].pacienteid;

    const payloadCache = obtenerHistorialPacienteDesdeCache(pacienteId);
    if (payloadCache) {
      return res.json(payloadCache);
    }

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
        ps.usuarioid as psicologa_usuarioid,
        ps.especialidad
      FROM historialclinico h
      LEFT JOIN citas c ON h.citaid = c.citaid
      LEFT JOIN psicologas ps ON h.psicologaid = ps.psicologaid
      LEFT JOIN usuarios u ON ps.usuarioid = u.usuarioid
      WHERE h.pacienteid = $1
      ORDER BY h.fechaentrada DESC
    `;

    // También obtener estadísticas
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sesiones,
        MAX(fechahora) as ultima_sesion,
        MIN(fechahora) as primera_sesion
      FROM citas
      WHERE pacienteid = $1 AND estado = 'Completada'
    `;

    const [result, statsResult] = await Promise.all([
      db.query(query, [pacienteId]),
      db.query(statsQuery, [pacienteId]),
    ]);

    const fotosPorUsuario = await obtenerFotosPerfilPorUsuario(result.rows.map((row) => row.psicologa_usuarioid), { usarMiniatura: true });

    const payload = {
      historial: result.rows.map((row) => {
        const { psicologa_usuarioid, ...resto } = row;
        return {
          ...resto,
          psicologa_fotoperfil: fotosPorUsuario.get(psicologa_usuarioid) || '',
        };
      }),
      estadisticas: statsResult.rows[0]
    };

    guardarHistorialPacienteEnCache(pacienteId, payload);
    res.json(payload);
  } catch (error) {
    console.error("Error al obtener mi historial:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const getHistorial = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ message: 'No autorizado.' });
    }

    const pacienteIdNumero = Number(pacienteId);
    if (!Number.isInteger(pacienteIdNumero) || pacienteIdNumero <= 0) {
      return res.status(400).json({ message: 'ID de paciente inválido.' });
    }

    let query = `
      SELECT h.*, c.fechahora as fechacita
      FROM historialclinico h
      LEFT JOIN citas c ON h.citaid = c.citaid
      WHERE h.pacienteid = $1
    `;
    let params = [pacienteIdNumero];

    if (req.user.rol === 'psicologa') {
      const psicologaResult = await db.query(
        'SELECT psicologaid FROM psicologas WHERE usuarioid = $1',
        [req.user.id]
      );
      if (psicologaResult.rows.length === 0) {
        return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
      }

      query += ' AND h.psicologaid = $2';
      params.push(psicologaResult.rows[0].psicologaid);
    } else if (req.user.rol === 'paciente') {
      const pacienteResult = await db.query(
        'SELECT pacienteid FROM pacientes WHERE usuarioid = $1',
        [req.user.id]
      );
      if (pacienteResult.rows.length === 0) {
        return res.status(404).json({ message: 'Perfil de paciente no encontrado.' });
      }

      if (pacienteResult.rows[0].pacienteid !== pacienteIdNumero) {
        return res.status(403).json({ message: 'No tienes permiso para consultar este historial.' });
      }
    } else if (req.user.rol !== 'admin') {
      return res.status(403).json({ message: 'No tienes permiso para consultar este historial.' });
    }

    query += ' ORDER BY h.fechaentrada DESC';
    const result = await db.query(query, params);
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
    invalidarHistorialPacienteCache(pacienteId);
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

    invalidarHistorialPacienteCache(result.rows[0].pacienteid);

    res.json(result.rows[0]);
  } catch (error) {
    console.error("Error al actualizar la entrada del historial:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = { getMiHistorial, getHistorial, crearEntradaHistorial, actualizarEntradaHistorial };
