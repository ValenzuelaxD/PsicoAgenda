const db = require('../db');
const bcrypt = require('bcrypt');

const GENEROS_PERMITIDOS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];

function construirNombreCompleto(usuario) {
  return [usuario.nombre, usuario.apellidopaterno, usuario.apellidomaterno]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function dividirNombreCompleto(nombreCompleto = '') {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return { nombre: '', apellidoPaterno: '', apellidoMaterno: null };
  }

  const nombre = partes.shift();
  const apellidoPaterno = partes.shift() || '';
  const apellidoMaterno = partes.length > 0 ? partes.join(' ') : null;

  return { nombre, apellidoPaterno, apellidoMaterno };
}

const getMiPerfil = async (req, res) => {
  const usuarioId = req.user.id;

  try {
    const result = await db.query(
      `
      SELECT
        u.usuarioid,
        u.nombre,
        u.apellidopaterno,
        u.apellidomaterno,
        u.correo,
        u.telefono,
        u.fotoperfil,
        u.fecharegistro,
        u.rol,
        p.fechanacimiento,
        p.genero,
        p.direccion,
        p.motivoconsulta,
        p.contactoemergencia,
        p.telemergencia,
        p.fechaalta,
        ps.cedulaprofesional,
        ps.especialidad,
        ps.descripcion,
        ps.consultorio
      FROM usuarios u
      LEFT JOIN pacientes p ON p.usuarioid = u.usuarioid
      LEFT JOIN psicologas ps ON ps.usuarioid = u.usuarioid
      WHERE u.usuarioid = $1
      `,
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Perfil no encontrado.'
      });
    }

    const row = result.rows[0];

    return res.json({
      success: true,
      profile: {
        usuarioId: row.usuarioid,
        rol: row.rol,
        nombreCompleto: construirNombreCompleto(row),
        nombre: row.nombre,
        apellidoPaterno: row.apellidopaterno,
        apellidoMaterno: row.apellidomaterno || '',
        email: row.correo,
        telefono: row.telefono || '',
        fotoPerfil: row.fotoperfil || '',
        fechaRegistro: row.fecharegistro || null,
        fechaNacimiento: row.fechanacimiento || null,
        genero: row.genero || '',
        direccion: row.direccion || '',
        notasPersonales: row.motivoconsulta || '',
        contactoEmergencia: row.contactoemergencia || '',
        telefonoEmergencia: row.telemergencia || '',
        fechaAlta: row.fechaalta || null,
        cedula: row.cedulaprofesional || '',
        especialidad: row.especialidad || '',
        descripcionProfesional: row.descripcion || '',
        consultorio: row.consultorio || ''
      }
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message
    });
  }
};

const actualizarMiPerfil = async (req, res) => {
  const usuarioId = req.user.id;
  const {
    nombreCompleto,
    email,
    telefono,
    fotoPerfil,
    fechaNacimiento,
    genero,
    direccion,
    notasPersonales,
    contactoEmergencia,
    telefonoEmergencia,
    cedula,
    especialidad,
    descripcionProfesional,
    consultorio
  } = req.body;

  if (!nombreCompleto || !email) {
    return res.status(400).json({
      success: false,
      message: 'Nombre completo y correo son requeridos.'
    });
  }

  if (genero && !GENEROS_PERMITIDOS.includes(genero)) {
    return res.status(400).json({
      success: false,
      message: 'Género inválido.'
    });
  }

  try {
    const userResult = await db.query('SELECT rol FROM usuarios WHERE usuarioid = $1', [usuarioId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const rol = userResult.rows[0].rol;

    const { nombre, apellidoPaterno, apellidoMaterno } = dividirNombreCompleto(nombreCompleto);

    if (!nombre || !apellidoPaterno) {
      return res.status(400).json({
        success: false,
        message: 'Ingresa al menos nombre y apellido paterno.'
      });
    }

    await db.query(
      `
      UPDATE usuarios
      SET nombre = $1,
          apellidopaterno = $2,
          apellidomaterno = $3,
          correo = $4,
          telefono = $5,
          fotoperfil = $6
        WHERE usuarioid = $7
      `,
        [nombre, apellidoPaterno, apellidoMaterno, email.toLowerCase(), telefono || null, fotoPerfil || null, usuarioId]
    );

    if (rol === 'paciente') {
      await db.query(
        `
        INSERT INTO pacientes (
          usuarioid,
          fechanacimiento,
          genero,
          direccion,
          motivoconsulta,
          contactoemergencia,
          telemergencia
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (usuarioid)
        DO UPDATE SET
          fechanacimiento = EXCLUDED.fechanacimiento,
          genero = EXCLUDED.genero,
          direccion = EXCLUDED.direccion,
          motivoconsulta = EXCLUDED.motivoconsulta,
          contactoemergencia = EXCLUDED.contactoemergencia,
          telemergencia = EXCLUDED.telemergencia
        `,
        [
          usuarioId,
          fechaNacimiento || null,
          genero || null,
          direccion || null,
          notasPersonales || null,
          contactoEmergencia || null,
          telefonoEmergencia || null
        ]
      );
    }

    if (rol === 'psicologa') {
      await db.query(
        `
        INSERT INTO pacientes (
          usuarioid,
          fechanacimiento,
          genero,
          direccion
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (usuarioid)
        DO UPDATE SET
          fechanacimiento = EXCLUDED.fechanacimiento,
          genero = EXCLUDED.genero,
          direccion = EXCLUDED.direccion
        `,
        [
          usuarioId,
          fechaNacimiento || null,
          genero || null,
          direccion || null
        ]
      );

      await db.query(
        `
        INSERT INTO psicologas (
          usuarioid,
          cedulaprofesional,
          especialidad,
          descripcion,
          consultorio
        )
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (usuarioid)
        DO UPDATE SET
          cedulaprofesional = EXCLUDED.cedulaprofesional,
          especialidad = EXCLUDED.especialidad,
          descripcion = EXCLUDED.descripcion,
          consultorio = EXCLUDED.consultorio
        `,
        [usuarioId, cedula || null, especialidad || null, descripcionProfesional || null, consultorio || null]
      );
    }

    return res.json({
      success: true,
      message: 'Perfil actualizado correctamente.'
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message
    });
  }
};

const cambiarMiPassword = async (req, res) => {
  const usuarioId = req.user.id;
  const { passwordActual, passwordNueva } = req.body;

  if (!passwordActual || !passwordNueva) {
    return res.status(400).json({
      success: false,
      message: 'La contraseña actual y la nueva son requeridas.'
    });
  }

  if (passwordNueva.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contraseña debe tener al menos 8 caracteres.'
    });
  }

  try {
    const result = await db.query(
      'SELECT contrasenahash FROM usuarios WHERE usuarioid = $1',
      [usuarioId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    const passwordValida = await bcrypt.compare(passwordActual, result.rows[0].contrasenahash);
    if (!passwordValida) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña actual es incorrecta.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNueva, salt);

    await db.query(
      'UPDATE usuarios SET contrasenahash = $1 WHERE usuarioid = $2',
      [nuevoHash, usuarioId]
    );

    return res.json({
      success: true,
      message: 'Contraseña actualizada correctamente.'
    });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor.',
      error: error.message
    });
  }
};

module.exports = { getMiPerfil, actualizarMiPerfil, cambiarMiPassword };
