const db = require('../db');
const bcrypt = require('bcrypt');
const { isEmailIntegrationEnabled, enviarCorreo } = require('../services/mailService');
const { construirTemplateCambioPassword } = require('../services/emailTemplateService');

const APP_TIMEZONE = String(process.env.APP_TIMEZONE || 'America/Mexico_City').trim();

const GENEROS_PERMITIDOS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no decir'];
const MAX_FOTO_PERFIL_BYTES = 10 * 1024 * 1024;

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

function extraerFotoDesdeDataUrl(dataUrl) {
  const match = /^data:(image\/(png|jpeg|jpg|webp));base64,(.+)$/i.exec(dataUrl || '');
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const buffer = Buffer.from(match[3], 'base64');
  return { mimeType, buffer };
}

function construirFotoDesdeBd(mimeType, dataBuffer) {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
}

function construirImagenTemaDesdeBd(mimeType, dataBuffer) {
  if (!mimeType || !dataBuffer) return '';
  return `data:${mimeType};base64,${dataBuffer.toString('base64')}`;
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
        u.fotoperfil_mime,
        u.fotoperfil_data,
        u.imagentema_mime,
        u.imagentema_data,
        u.imagentema_nombre,
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
        fotoPerfil: construirFotoDesdeBd(row.fotoperfil_mime, row.fotoperfil_data),
        imagenTema: construirImagenTemaDesdeBd(row.imagentema_mime, row.imagentema_data),
        imagenTemaNombre: row.imagentema_nombre || '',
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

    let fotoPerfilMime = null;
    let fotoPerfilData = null;

    if (typeof fotoPerfil === 'string' && fotoPerfil.trim() === '') {
      fotoPerfilMime = null;
      fotoPerfilData = null;
    } else if (typeof fotoPerfil === 'string' && fotoPerfil.startsWith('data:image/')) {
      const fotoExtraida = extraerFotoDesdeDataUrl(fotoPerfil);
      if (!fotoExtraida) {
        return res.status(400).json({
          success: false,
          message: 'Formato de imagen no válido. Usa PNG, JPG o WEBP.'
        });
      }

      if (fotoExtraida.buffer.length > MAX_FOTO_PERFIL_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'La imagen no debe superar los 10MB.'
        });
      }

      fotoPerfilMime = fotoExtraida.mimeType;
      fotoPerfilData = fotoExtraida.buffer;
    } else {
      return res.status(400).json({
        success: false,
        message: 'fotoPerfil debe enviarse como data URL o cadena vacía.'
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
          fotoperfil = NULL,
          fotoperfil_mime = $6,
          fotoperfil_data = $7
        WHERE usuarioid = $8
      `,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno,
        email.toLowerCase(),
        telefono || null,
        fotoPerfilMime,
        fotoPerfilData,
        usuarioId
      ]
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
      'SELECT contrasenahash, correo, nombre, apellidopaterno FROM usuarios WHERE usuarioid = $1',
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

    const passwordRepetida = await bcrypt.compare(passwordNueva, result.rows[0].contrasenahash);
    if (passwordRepetida) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña no puede ser igual a la contraseña actual.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNueva, salt);

    await db.query(
      'UPDATE usuarios SET contrasenahash = $1 WHERE usuarioid = $2',
      [nuevoHash, usuarioId]
    );

    if (isEmailIntegrationEnabled()) {
      const usuario = result.rows[0];
      Promise.resolve()
        .then(async () => {
          const template = await construirTemplateCambioPassword({
            nombre: usuario.nombre,
            apellidoPaterno: usuario.apellidopaterno,
            fechaCambio: new Date(),
            timezone: APP_TIMEZONE,
          });

          await enviarCorreo({
            to: usuario.correo,
            subject: template.asunto,
            text: template.texto,
            html: template.html,
          });
        })
        .catch((emailError) => {
          console.error('[perfil.cambiarMiPassword] Error enviando correo de confirmacion:', emailError.message);
        });
    }

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

const actualizarImagenTema = async (req, res) => {
  const usuarioId = req.user.id;
  const { imagenTema, imagenTemaNombre } = req.body;

  try {
    let imagenTemaMime = null;
    let imagenTemaData = null;

    if (typeof imagenTema === 'string' && imagenTema.trim() === '') {
      imagenTemaMime = null;
      imagenTemaData = null;
    } else if (typeof imagenTema === 'string' && imagenTema.startsWith('data:image/')) {
      const imagenExtraida = extraerFotoDesdeDataUrl(imagenTema);
      if (!imagenExtraida) {
        return res.status(400).json({
          success: false,
          message: 'Formato de imagen no válido. Usa PNG, JPG o WEBP.'
        });
      }

      if (imagenExtraida.buffer.length > MAX_FOTO_PERFIL_BYTES) {
        return res.status(400).json({
          success: false,
          message: 'La imagen no debe superar los 10MB.'
        });
      }

      imagenTemaMime = imagenExtraida.mimeType;
      imagenTemaData = imagenExtraida.buffer;
    }

    const updateQuery = `
      UPDATE usuarios
      SET 
        imagentema_mime = $1,
        imagentema_data = $2,
        imagentema_nombre = $3
      WHERE usuarioid = $4
      RETURNING usuarioid
    `;

    const result = await db.query(updateQuery, [
      imagenTemaMime,
      imagenTemaData,
      imagenTemaNombre || 'tema-personalizado',
      usuarioId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.'
      });
    }

    return res.json({
      success: true,
      message: 'Imagen de tema actualizada correctamente.'
    });
  } catch (error) {
    console.error('Error al actualizar imagen de tema:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar imagen de tema.',
      error: error.message
    });
  }
};

module.exports = { getMiPerfil, actualizarMiPerfil, cambiarMiPassword, actualizarImagenTema };
