const db = require('../db');
const crypto = require('crypto');

let sharp = null;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

const DIAS_SEMANA = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
const ESTADOS_EDITABLES = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada', 'Reagendada'];
const DURACION_CITA_MIN = 60;

const toPositiveInt = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
};

const MAX_DIAS_ADELANTO_PACIENTE = toPositiveInt(process.env.MAX_BOOKING_DAYS_PACIENTE, 45);
const MAX_DIAS_ADELANTO_PSICOLOGA = toPositiveInt(process.env.MAX_BOOKING_DAYS_PSICOLOGA, 180);
const MIS_CITAS_CACHE_TTL_MS = toPositiveInt(process.env.MIS_CITAS_CACHE_TTL_MS, 60000);
const MIS_CITAS_THUMB_SIZE_PX = toPositiveInt(process.env.MIS_CITAS_THUMB_SIZE_PX, 96);
const MAX_MIS_CITAS_CACHE_ITEMS = toPositiveInt(process.env.MAX_MIS_CITAS_CACHE_ITEMS, 400);
const MAX_MINIATURAS_CACHE_ITEMS = toPositiveInt(process.env.MAX_MINIATURAS_CACHE_ITEMS, 800);

const misCitasResponseCache = new Map();
const miniaturasFotoCache = new Map();

const getMaxDiasAdelantoPorRol = (rol) => {
  if (rol === 'paciente') return MAX_DIAS_ADELANTO_PACIENTE;
  if (rol === 'psicologa') return MAX_DIAS_ADELANTO_PSICOLOGA;
  return MAX_DIAS_ADELANTO_PSICOLOGA;
};

const estaDentroDeVentana = (fechaHora, rol) => {
  if (!(fechaHora instanceof Date) || Number.isNaN(fechaHora.getTime())) {
    return false;
  }

  const inicioHoy = new Date();
  inicioHoy.setHours(0, 0, 0, 0);

  const fechaMaxima = new Date(inicioHoy);
  fechaMaxima.setDate(fechaMaxima.getDate() + getMaxDiasAdelantoPorRol(rol));
  fechaMaxima.setHours(23, 59, 59, 999);

  return fechaHora >= inicioHoy && fechaHora <= fechaMaxima;
};

const construirFotoDesdeBd = (mimeType, dataBuffer) => {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
};

const construirClaveMisCitasCache = ({ rol, usuarioId }) => `${rol}:${usuarioId}`;

const obtenerMisCitasDesdeCache = ({ rol, usuarioId }) => {
  const cacheKey = construirClaveMisCitasCache({ rol, usuarioId });
  const cacheEntry = misCitasResponseCache.get(cacheKey);
  if (!cacheEntry) {
    return null;
  }

  if (cacheEntry.expiraEn <= Date.now()) {
    misCitasResponseCache.delete(cacheKey);
    return null;
  }

  return cacheEntry.payload;
};

const guardarMisCitasEnCache = ({ rol, usuarioId, payload }) => {
  if (!Array.isArray(payload)) {
    return;
  }

  if (misCitasResponseCache.size >= MAX_MIS_CITAS_CACHE_ITEMS) {
    misCitasResponseCache.clear();
  }

  const cacheKey = construirClaveMisCitasCache({ rol, usuarioId });
  misCitasResponseCache.set(cacheKey, {
    expiraEn: Date.now() + MIS_CITAS_CACHE_TTL_MS,
    payload,
  });
};

const invalidarMisCitasCachePorUsuarios = ({ pacienteUsuarioId = null, psicologaUsuarioId = null } = {}) => {
  const pacienteIdNum = Number(pacienteUsuarioId);
  const psicologaIdNum = Number(psicologaUsuarioId);

  if (!Number.isInteger(pacienteIdNum) && !Number.isInteger(psicologaIdNum)) {
    misCitasResponseCache.clear();
    return;
  }

  if (Number.isInteger(pacienteIdNum) && pacienteIdNum > 0) {
    misCitasResponseCache.delete(construirClaveMisCitasCache({ rol: 'paciente', usuarioId: pacienteIdNum }));
  }

  if (Number.isInteger(psicologaIdNum) && psicologaIdNum > 0) {
    misCitasResponseCache.delete(construirClaveMisCitasCache({ rol: 'psicologa', usuarioId: psicologaIdNum }));
  }
};

const construirClaveMiniatura = ({ usuarioId, mimeType, dataBuffer }) => {
  const hash = crypto.createHash('sha1').update(dataBuffer).digest('hex').slice(0, 20);
  return `${usuarioId}:${mimeType}:${MIS_CITAS_THUMB_SIZE_PX}:${hash}`;
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

  const cacheKey = construirClaveMiniatura({ usuarioId, mimeType: mimeNormalizado, dataBuffer });
  const miniaturaEnCache = miniaturasFotoCache.get(cacheKey);
  if (miniaturaEnCache) {
    return miniaturaEnCache;
  }

  try {
    const miniatura = await sharp(dataBuffer)
      .rotate()
      .resize(MIS_CITAS_THUMB_SIZE_PX, MIS_CITAS_THUMB_SIZE_PX, {
        fit: 'cover',
        position: 'attention',
      })
      .webp({ quality: 72 })
      .toBuffer();

    const dataUrl = `data:image/webp;base64,${miniatura.toString('base64')}`;

    if (miniaturasFotoCache.size >= MAX_MINIATURAS_CACHE_ITEMS) {
      miniaturasFotoCache.clear();
    }
    miniaturasFotoCache.set(cacheKey, dataUrl);

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

const validarDisponibilidad = async ({ psicologaId, fechaHora, citaIdExcluir = null }) => {
  const diaSemana = DIAS_SEMANA[fechaHora.getDay()];
  const fecha = fechaHora.toISOString().slice(0, 10);
  const inicioMinutos = fechaHora.getHours() * 60 + fechaHora.getMinutes();
  const finMinutos = inicioMinutos + DURACION_CITA_MIN;

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
        AND fechahora >= $2::date
        AND fechahora < ($2::date + interval '1 day')
        AND COALESCE(LOWER(TRIM(estado)), '') NOT IN ('cancelada', 'cancelado')
        ${excluirClause}
    `,
    params
  );

  const haySolapamiento = citasResult.rows.some((cita) => {
    const citaInicio = new Date(cita.fechahora);
    const citaFin = new Date(citaInicio.getTime() + Number(cita.duracionmin || 60) * 60000);
    return fechaHora < citaFin && new Date(fechaHora.getTime() + DURACION_CITA_MIN * 60000) > citaInicio;
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
    console.log(`[getMisCitas] Obteniendo citas para usuario ${usuarioId} con rol ${rol}`);

    const usaCacheMisCitas = rol === 'paciente' || rol === 'psicologa';
    if (usaCacheMisCitas) {
      const payloadCache = obtenerMisCitasDesdeCache({ rol, usuarioId });
      if (payloadCache) {
        console.log(`[getMisCitas] Respondiendo desde cache para usuario ${usuarioId} (${rol})`);
        return res.json(payloadCache);
      }
    }
    
    let query;
    let params = [usuarioId];

    if (rol === 'paciente') {
      const pacienteId = await getPacienteIdByUsuario(usuarioId);
      if (!pacienteId) {
        console.log(`[getMisCitas] No hay perfil de paciente para usuario ${usuarioId}`);
        return res.status(404).json({ message: 'Perfil de paciente no encontrado.' });
      }

      query = `
        SELECT
          c.*,
          c.notaspaciente AS notas,
          COALESCE(h.observaciones, h.tratamiento, h.diagnostico, c.notaspaciente) AS notasresumen,
          u.nombre AS psicologa_nombre,
          u.apellidopaterno AS psicologa_apellido,
          u.usuarioid AS psicologa_usuarioid,
          ps.consultorio AS ubicacion
        FROM citas c
        JOIN psicologas ps ON c.psicologaid = ps.psicologaid
        JOIN usuarios u ON ps.usuarioid = u.usuarioid
        LEFT JOIN LATERAL (
          SELECT observaciones, tratamiento, diagnostico
          FROM historialclinico h
          WHERE h.citaid = c.citaid
          ORDER BY h.fechaentrada DESC
          LIMIT 1
        ) h ON TRUE
        WHERE c.pacienteid = $1
        ORDER BY c.fechahora DESC
      `;
      params = [pacienteId];
    } else if (rol === 'psicologa') {
      const psicologaId = await getPsicologaIdByUsuario(usuarioId);
      if (!psicologaId) {
        console.log(`[getMisCitas] No hay perfil de psicóloga para usuario ${usuarioId}`);
        return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
      }

      query = `
        SELECT
          c.*,
          COALESCE(c.notaspsicologa, c.notaspaciente) AS notas,
          COALESCE(h.observaciones, h.tratamiento, h.diagnostico, c.notaspsicologa, c.notaspaciente) AS notasresumen,
          u.nombre AS paciente_nombre,
          u.apellidopaterno AS paciente_apellido,
          u.usuarioid AS paciente_usuarioid,
          ps.consultorio AS ubicacion
        FROM citas c
        JOIN pacientes p ON c.pacienteid = p.pacienteid
        JOIN usuarios u ON p.usuarioid = u.usuarioid
        JOIN psicologas ps ON c.psicologaid = ps.psicologaid
        LEFT JOIN LATERAL (
          SELECT observaciones, tratamiento, diagnostico
          FROM historialclinico h
          WHERE h.citaid = c.citaid
          ORDER BY h.fechaentrada DESC
          LIMIT 1
        ) h ON TRUE
        WHERE c.psicologaid = $1
        ORDER BY c.fechahora DESC
      `;
      params = [psicologaId];
    } else {
      query = 'SELECT * FROM citas ORDER BY fechahora DESC';
      params = [];
    }

    console.log(`[getMisCitas] Ejecutando query con params:`, params);
    const result = await db.query(query, params);
    console.log(`[getMisCitas] Se encontraron ${result.rows.length} citas`);

    let fotosPorUsuario = new Map();
    if (rol === 'paciente') {
      fotosPorUsuario = await obtenerFotosPerfilPorUsuario(result.rows.map((row) => row.psicologa_usuarioid), { usarMiniatura: true });
    } else if (rol === 'psicologa') {
      fotosPorUsuario = await obtenerFotosPerfilPorUsuario(result.rows.map((row) => row.paciente_usuarioid), { usarMiniatura: true });
    }

    const payload = result.rows.map((row) => {
        const {
          paciente_usuarioid,
          psicologa_usuarioid,
          ...rowSinUsuariosRelacionados
        } = row;

        return {
          ...rowSinUsuariosRelacionados,
          paciente_fotoperfil: rol === 'psicologa'
            ? (fotosPorUsuario.get(paciente_usuarioid) || '')
            : row.paciente_fotoperfil,
          psicologa_fotoperfil: rol === 'paciente'
            ? (fotosPorUsuario.get(psicologa_usuarioid) || '')
            : row.psicologa_fotoperfil,
          notas: rol === 'psicologa' ? (row.notaspsicologa || '') : (row.notaspaciente || ''),
          notasresumen: row.notasresumen || row.notaspsicologa || row.notaspaciente || '',
        };
      });

    if (rol === 'paciente' || rol === 'psicologa') {
      guardarMisCitasEnCache({ rol, usuarioId, payload });
    }

    res.json(payload);
  } catch (error) {
    console.error('[getMisCitas] Error:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor.',
      error: error.message
    });
  }
};

const crearCita = async (req, res) => {
  const { psicologaId, pacienteId, fecha, hora, notas, modalidad } = req.body;
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

    if (!estaDentroDeVentana(fechaHora, rol)) {
      const diasMax = getMaxDiasAdelantoPorRol(rol);
      return res.status(400).json({ message: `Solo puedes agendar citas dentro de los próximos ${diasMax} días.` });
    }

    const duracionFinal = DURACION_CITA_MIN;
    const modalidadFinal = modalidad || 'Presencial';
    const notasPacienteFinal = rol === 'paciente' ? notas || null : null;
    const notasPsicologaFinal = rol === 'psicologa' ? notas || null : null;
    const disponibilidad = await validarDisponibilidad({ psicologaId: citaPsicologaId, fechaHora });
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

    invalidarMisCitasCachePorUsuarios({
      pacienteUsuarioId: contexto?.paciente_usuarioid,
      psicologaUsuarioId: contexto?.psicologa_usuarioid,
    });

    res.status(201).json({ citaId: result.rows[0].citaid });
  } catch (error) {
    console.error('Error al crear la cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const actualizarCita = async (req, res) => {
  const { id } = req.params;
  const { fecha, hora, modalidad, estado, notas, notasPaciente, notasPsicologa } = req.body;

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

    if (!estaDentroDeVentana(nuevaFechaHora, req.user.rol)) {
      const diasMax = getMaxDiasAdelantoPorRol(req.user.rol);
      return res.status(400).json({ message: `Solo puedes reagendar citas dentro de los próximos ${diasMax} días.` });
    }

    const nuevaDuracion = DURACION_CITA_MIN;
    const nuevaModalidad = modalidad || contexto.modalidad;
    const nuevoEstado = req.user.rol === 'psicologa'
      ? (ESTADOS_EDITABLES.includes(estado) ? estado : contexto.estado)
      : 'Pendiente';

    const disponibilidad = await validarDisponibilidad({
      psicologaId: contexto.psicologaid,
      fechaHora: nuevaFechaHora,
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

    // Detectar cambios de estado para actualizar el contador de sesiones completadas
    const estadoAnterior = String(contexto.estado || '').trim();
    const estadoNormalizado = String(nuevoEstado || '').trim();
    const estabaCompletada = estadoAnterior.toLowerCase() === 'completada';
    const estaraCompletada = estadoNormalizado.toLowerCase() === 'completada';

    // Actualizar contador de sesiones completadas si cambia el estado
    if (estaraCompletada && !estabaCompletada) {
      // Cambio a Completada: incrementar contador
      await db.query(
        `UPDATE pacientes SET sesionescompletadas = COALESCE(sesionescompletadas, 0) + 1 WHERE pacienteid = $1`,
        [contexto.pacienteid]
      );
    } else if (!estaraCompletada && estabaCompletada) {
      // Cambio desde Completada: decrementar contador
      await db.query(
        `UPDATE pacientes SET sesionescompletadas = GREATEST(COALESCE(sesionescompletadas, 0) - 1, 0) WHERE pacienteid = $1`,
        [contexto.pacienteid]
      );
    }

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

    invalidarMisCitasCachePorUsuarios({
      pacienteUsuarioId: contextoActualizado?.paciente_usuarioid,
      psicologaUsuarioId: contextoActualizado?.psicologa_usuarioid,
    });

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
    if (req.user.rol !== 'psicologa') {
      return res.status(403).json({ message: 'Solo las psicólogas pueden confirmar citas.' });
    }

    const validacion = await validarAccesoCita(req, id);
    if (validacion.error) {
      return res.status(validacion.error.status).json({ message: validacion.error.message });
    }

    const contexto = validacion.contexto;
    if (String(contexto.estado || '').trim().toLowerCase() !== 'pendiente') {
      return res.status(409).json({ message: 'Solo se pueden confirmar citas en estado Pendiente.' });
    }

    const result = await db.query(
      `
        UPDATE citas
        SET estado = 'Confirmada', fechamodificacion = NOW()
        WHERE citaid = $1 AND estado = 'Pendiente'
        RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ message: 'La cita ya no está pendiente de confirmación.' });
    }

    const contextoActualizado = await getContextoCita(id);
    if (contextoActualizado) {
      const fechaCliente = obtenerFechaClienteDesdeRequest(req);
      await crearNotificacion({
        usuarioId: contextoActualizado.paciente_usuarioid,
        citaId: Number(id),
        tipo: 'Confirmacion',
        mensaje: `Tu cita del ${new Date(contextoActualizado.fechahora).toLocaleString('es-MX')} fue confirmada por tu psicóloga.`,
        fechaEnvio: fechaCliente,
      });
    }

    invalidarMisCitasCachePorUsuarios({
      pacienteUsuarioId: contextoActualizado?.paciente_usuarioid,
      psicologaUsuarioId: contextoActualizado?.psicologa_usuarioid,
    });

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

    const contexto = validacion.contexto;
    
    // Si la cita estaba completada, decrementar el contador
    if (String(contexto.estado || '').trim().toLowerCase() === 'completada') {
      await db.query(
        `UPDATE pacientes SET sesionescompletadas = GREATEST(COALESCE(sesionescompletadas, 0) - 1, 0) WHERE pacienteid = $1`,
        [contexto.pacienteid]
      );
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

    const contextoActualizado = await getContextoCita(id);
    if (contextoActualizado) {
      const fechaCliente = obtenerFechaClienteDesdeRequest(req);
      const destinatario = req.user.rol === 'paciente' ? contextoActualizado.psicologa_usuarioid : contextoActualizado.paciente_usuarioid;
      await crearNotificacion({
        usuarioId: destinatario,
        citaId: Number(id),
        tipo: 'Cancelacion',
        mensaje: `La cita del ${new Date(contextoActualizado.fechahora).toLocaleString('es-MX')} fue cancelada.`,
        fechaEnvio: fechaCliente,
      });
    }

    invalidarMisCitasCachePorUsuarios({
      pacienteUsuarioId: contextoActualizado?.paciente_usuarioid,
      psicologaUsuarioId: contextoActualizado?.psicologa_usuarioid,
    });

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

    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(fecha))) {
      return res.status(400).json({ message: 'La fecha no es válida. Usa el formato YYYY-MM-DD.' });
    }

    const fechaSolicitada = new Date(`${fecha}T00:00:00`);
    if (!estaDentroDeVentana(fechaSolicitada, req.user.rol)) {
      const diasMax = getMaxDiasAdelantoPorRol(req.user.rol);
      return res.status(400).json({ message: `Solo puedes consultar disponibilidad dentro de los próximos ${diasMax} días.` });
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
          AND fechahora >= $2::date
          AND fechahora < ($2::date + interval '1 day')
          AND COALESCE(LOWER(TRIM(estado)), '') NOT IN ('cancelada', 'cancelado')
      `,
      [psicologaId, fecha]
    );

    const disponibilidad = new Set();
    const duracionDefault = DURACION_CITA_MIN;

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
