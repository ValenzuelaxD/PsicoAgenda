const db = require('../db');
const bcrypt = require('bcrypt');

async function verificarColumnaSesionesCompletadas() {
  try {
    const result = await db.query(
      `
      SELECT COUNT(*)::int AS total
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'pacientes'
        AND column_name = 'sesionescompletadas'
      `
    );

    return result.rows[0]?.total === 1;
  } catch (error) {
    return false;
  }
}

function dividirNombreCompleto(nombreCompleto = '') {
  const partes = String(nombreCompleto).trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return { nombre: '', apellidoPaterno: '', apellidoMaterno: null };
  }

  const nombre = partes.shift();
  const apellidoPaterno = partes.shift() || '';
  const apellidoMaterno = partes.length > 0 ? partes.join(' ') : null;

  return { nombre, apellidoPaterno, apellidoMaterno };
}

function construirFotoDesdeBd(mimeType, dataBuffer) {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
}

const getPacientes = async (req, res) => {
  try {
    if (!req.user || !req.user.rol) {
      return res.status(401).json({ message: 'No autorizado.' });
    }

    const usarContadorPersistente = await verificarColumnaSesionesCompletadas();

    let result;

    if (req.user.rol === 'psicologa') {
      const psicologa = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [req.user.id]);
      if (psicologa.rows.length === 0) {
        return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
      }

      const psicologaId = psicologa.rows[0].psicologaid;

      result = await db.query(
        `
          SELECT
            u.usuarioid,
            p.pacienteid,
            u.nombre,
            u.apellidopaterno,
            u.apellidomaterno,
            u.correo,
            u.telefono,
            u.fotoperfil_mime,
            u.fotoperfil_data,
            p.fechanacimiento,
            p.genero,
            p.direccion,
            p.motivoconsulta,
            p.contactoemergencia,
            p.telemergencia,
            (
              SELECT MAX(cx.fechahora)
              FROM citas cx
              WHERE cx.pacienteid = p.pacienteid
                AND cx.psicologaid = $1
                AND COALESCE(LOWER(TRIM(cx.estado)), '') NOT IN ('cancelada', 'cancelado')
                AND cx.fechahora < NOW()
            ) AS ultimacita,
            (
              SELECT MIN(cx.fechahora)
              FROM citas cx
              WHERE cx.pacienteid = p.pacienteid
                AND cx.psicologaid = $1
                AND COALESCE(LOWER(TRIM(cx.estado)), '') NOT IN ('cancelada', 'cancelado')
                AND cx.fechahora >= NOW()
            ) AS proximacita,
            ${usarContadorPersistente
              ? 'COALESCE(p.sesionescompletadas, 0) AS sesionestotales'
              : `COUNT(c.citaid) FILTER (
                   WHERE COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
                 ) AS sesionestotales`
            }
          FROM usuarios u
          JOIN pacientes p ON u.usuarioid = p.usuarioid
          ${usarContadorPersistente ? '' : 'LEFT JOIN citas c ON c.pacienteid = p.pacienteid AND c.psicologaid = $1'}
          WHERE u.rol = 'paciente'
            AND u.activo = true
            AND EXISTS (
              SELECT 1
              FROM citas cx
              WHERE cx.pacienteid = p.pacienteid
                AND cx.psicologaid = $1
            )
          ${usarContadorPersistente ? '' : 'GROUP BY u.usuarioid, p.pacienteid, u.fotoperfil_mime, u.fotoperfil_data'}
        `,
        [psicologaId]
      );
    } else if (req.user.rol === 'admin') {
      result = await db.query(`
        SELECT
          u.usuarioid,
          p.pacienteid,
          u.nombre,
          u.apellidopaterno,
          u.apellidomaterno,
          u.correo,
          u.telefono,
          u.fotoperfil_mime,
          u.fotoperfil_data,
          p.fechanacimiento,
          p.genero,
          p.direccion,
          p.motivoconsulta,
          p.contactoemergencia,
          p.telemergencia,
          (
            SELECT MAX(cx.fechahora)
            FROM citas cx
            WHERE cx.pacienteid = p.pacienteid
              AND COALESCE(LOWER(TRIM(cx.estado)), '') NOT IN ('cancelada', 'cancelado')
              AND cx.fechahora < NOW()
          ) AS ultimacita,
          (
            SELECT MIN(cx.fechahora)
            FROM citas cx
            WHERE cx.pacienteid = p.pacienteid
              AND COALESCE(LOWER(TRIM(cx.estado)), '') NOT IN ('cancelada', 'cancelado')
              AND cx.fechahora >= NOW()
          ) AS proximacita,
          ${usarContadorPersistente
            ? 'COALESCE(p.sesionescompletadas, 0) AS sesionestotales'
            : `COUNT(c.citaid) FILTER (
                 WHERE COALESCE(LOWER(TRIM(c.estado)), '') = 'completada'
               ) AS sesionestotales`
          }
        FROM usuarios u
        JOIN pacientes p ON u.usuarioid = p.usuarioid
        ${usarContadorPersistente ? '' : 'LEFT JOIN citas c ON c.pacienteid = p.pacienteid'}
        WHERE u.rol = 'paciente' AND u.activo = true
        ${usarContadorPersistente ? '' : 'GROUP BY u.usuarioid, p.pacienteid, u.fotoperfil_mime, u.fotoperfil_data'}
      `);
    } else {
      return res.status(403).json({ message: 'No tienes permisos para consultar pacientes.' });
    }

    const pacientes = result.rows.map(p => ({
      ...p,
      fotoperfil: construirFotoDesdeBd(p.fotoperfil_mime, p.fotoperfil_data),
      edad: p.fechanacimiento
        ? new Date().getFullYear() - new Date(p.fechanacimiento).getFullYear()
        : null,
      sesionesTotales: Number(p.sesionestotales) || 0,
      ultimaCita: p.ultimacita || null,
      proximaCita: p.proximacita || null,
      email: p.correo,
      estado: 'activo',
    }));

    res.json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const getPacientesSelector = async (req, res) => {
  try {
    if (!req.user || !['psicologa', 'admin'].includes(req.user.rol)) {
      return res.status(403).json({ message: 'No tienes permisos para consultar pacientes.' });
    }

    const result = await db.query(
      `
        SELECT
          p.pacienteid,
          u.nombre,
          u.apellidopaterno,
          u.apellidomaterno,
          u.fotoperfil_mime,
          u.fotoperfil_data
        FROM pacientes p
        JOIN usuarios u ON u.usuarioid = p.usuarioid
        WHERE u.rol = 'paciente'
          AND u.activo = true
        ORDER BY u.nombre ASC, u.apellidopaterno ASC, u.apellidomaterno ASC
      `
    );

    const pacientes = result.rows.map((p) => ({
      pacienteid: p.pacienteid,
      nombre: p.nombre,
      apellidopaterno: p.apellidopaterno,
      apellidomaterno: p.apellidomaterno,
      fotoperfil: construirFotoDesdeBd(p.fotoperfil_mime, p.fotoperfil_data),
    }));

    res.json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes para selector:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const crearPaciente = async (req, res) => {
  let { nombre, apellidoPaterno, apellidoMaterno, correo, telefono, fechaNacimiento, genero, direccion, motivoConsulta, contactoEmergencia, telefonoEmergencia, password } = req.body;

  if (nombre && (!apellidoPaterno || !String(apellidoPaterno).trim())) {
    const nombreDividido = dividirNombreCompleto(nombre);
    nombre = nombreDividido.nombre;
    apellidoPaterno = nombreDividido.apellidoPaterno;
    apellidoMaterno = nombreDividido.apellidoMaterno;
  }

  if (!req.user || !['psicologa', 'admin'].includes(req.user.rol)) {
    return res.status(403).json({ message: 'Solo psicólogas o administradores pueden registrar pacientes.' });
  }

  if (!nombre || !apellidoPaterno || !correo || !password) {
    return res.status(400).json({ message: 'Campos requeridos: nombre, apellidoPaterno, correo, password.' });
  }

  try {
    if (req.user.rol === 'psicologa') {
      const psicologa = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [req.user.id]);
      if (psicologa.rows.length === 0) {
        return res.status(404).json({ message: 'Perfil de psicóloga no encontrado.' });
      }
    }

    // Verificar si el correo ya existe
    const existing = await db.query('SELECT usuarioid FROM usuarios WHERE correo = $1', [correo.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'El correo ya está registrado.' });
    }

    // Hash contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // Crear usuario
    const newUser = await db.query(
      'INSERT INTO usuarios (nombre, apellidopaterno, apellidomaterno, correo, contrasenahash, telefono, rol, activo) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING usuarioid',
      [nombre, apellidoPaterno, apellidoMaterno || null, correo.toLowerCase(), contrasenaHash, telefono || null, 'paciente', true]
    );
    const usuarioId = newUser.rows[0].usuarioid;

    // Crear paciente
    const newPaciente = await db.query(
      'INSERT INTO pacientes (usuarioid, fechanacimiento, genero, direccion, motivoconsulta, contactoemergencia, telemergencia, fechaalta) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE) RETURNING pacienteid',
      [usuarioId, fechaNacimiento || null, genero || null, direccion || null, motivoConsulta || null, contactoEmergencia || null, telefonoEmergencia || null]
    );

    res.status(201).json({
      pacienteid: newPaciente.rows[0].pacienteid,
      usuarioid: usuarioId,
      nombre,
      apellidopaterno: apellidoPaterno,
      correo,
      mensaje: 'Paciente registrado exitosamente',
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const actualizarPaciente = async (req, res) => {
  const { pacienteId } = req.params;
  let { nombre, apellidoPaterno, apellidoMaterno, telefono, direccion, motivoConsulta, contactoEmergencia, telefonoEmergencia } = req.body;

  if (nombre && (!apellidoPaterno || !String(apellidoPaterno).trim())) {
    const nombreDividido = dividirNombreCompleto(nombre);
    nombre = nombreDividido.nombre;
    apellidoPaterno = nombreDividido.apellidoPaterno;
    apellidoMaterno = nombreDividido.apellidoMaterno;
  }

  try {
    // Obtener usuarioId del paciente
    const paciente = await db.query('SELECT usuarioid FROM pacientes WHERE pacienteid = $1', [pacienteId]);
    if (paciente.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    const usuarioId = paciente.rows[0].usuarioid;

    // Actualizar usuario
    if (nombre || apellidoPaterno || apellidoMaterno || telefono) {
      await db.query(
        'UPDATE usuarios SET nombre = COALESCE($1, nombre), apellidopaterno = COALESCE($2, apellidopaterno), apellidomaterno = COALESCE($3, apellidomaterno), telefono = COALESCE($4, telefono) WHERE usuarioid = $5',
        [nombre || null, apellidoPaterno || null, apellidoMaterno || null, telefono || null, usuarioId]
      );
    }

    // Actualizar paciente
    await db.query(
      'UPDATE pacientes SET direccion = COALESCE($1, direccion), motivoconsulta = COALESCE($2, motivoconsulta), contactoemergencia = COALESCE($3, contactoemergencia), telemergencia = COALESCE($4, telemergencia) WHERE pacienteid = $5',
      [direccion || null, motivoConsulta || null, contactoEmergencia || null, telefonoEmergencia || null, pacienteId]
    );

    res.json({ message: 'Paciente actualizado correctamente.' });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

const eliminarPaciente = async (req, res) => {
  const { pacienteId } = req.params;

  try {
    // Obtener usuarioId
    const paciente = await db.query('SELECT usuarioid FROM pacientes WHERE pacienteid = $1', [pacienteId]);
    if (paciente.rows.length === 0) {
      return res.status(404).json({ message: 'Paciente no encontrado.' });
    }
    const usuarioId = paciente.rows[0].usuarioid;

    // Desactivar usuario
    await db.query('UPDATE usuarios SET activo = false WHERE usuarioid = $1', [usuarioId]);

    res.json({ message: 'Paciente eliminado correctamente.' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

module.exports = { getPacientes, getPacientesSelector, crearPaciente, actualizarPaciente, eliminarPaciente };
