const db = require('../db'); // Tu archivo de conexión
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { isEmailIntegrationEnabled, enviarCorreo } = require('../services/mailService');
const {
  construirTemplateBienvenidaRegistro,
  construirTemplateRecuperacionPassword,
} = require('../services/emailTemplateService');

const APP_WEB_URL = String(process.env.APP_WEB_URL || 'https://psicoagenda.online').trim().replace(/\/+$/, '');
const RESET_TOKEN_EXPIRES_MINUTES = 30;

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

/**
 * Maneja el inicio de sesión de un usuario.
 */
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ 
      success: false,
      message: "El correo y la contraseña son requeridos." 
    });
  }

  try {
    // 1. Busca el usuario por su correo en la tabla 'usuarios'
    const result = await db.query('SELECT * FROM usuarios WHERE correo = $1', [email.toLowerCase()]);

    // 2. Si no se encuentra el usuario, devuelve un error.
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false,
        message: "Credenciales inválidas." 
      });
    }

    const usuario = result.rows[0];

    // 3. Compara la contraseña enviada con el hash almacenado en la BD.
    const esPasswordCorrecto = await bcrypt.compare(password, usuario.contrasenahash);

    if (!esPasswordCorrecto) {
      return res.status(401).json({ 
        success: false,
        message: "Credenciales inválidas." 
      });
    }

    // 4. Si las credenciales son correctas, genera un token JWT.
    const payload = {
      id: usuario.usuarioid,
      email: usuario.correo,
      rol: usuario.rol
    };
    
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // 5. Devuelve el token y la información del usuario (sin la contraseña).
    return res.status(200).json({
      success: true,
      message: "Inicio de sesión exitoso",
      token,
      user: {
        id: usuario.usuarioid,
        nombre: usuario.nombre,
        apellidoPaterno: usuario.apellidopaterno,
        email: usuario.correo,
        rol: usuario.rol,
        activo: usuario.activo
      }
    });

  } catch (error) {
    console.error("Error en el login:", error);

    // Errores típicos cuando Cloud SQL Proxy no puede alcanzar la instancia.
    if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT"].includes(error.code)) {
      return res.status(503).json({
        success: false,
        message: "Base de datos no disponible temporalmente. Verifica Cloud SQL Proxy o conectividad de red.",
        error: error.code
      });
    }

    return res.status(500).json({ 
      success: false,
      message: "Error interno del servidor.",
      error: error.message 
    });
  }
};

/**
 * Maneja el registro de un nuevo usuario.
 * Crea una solicitud pendiente para alta de psicologa.
 */
const register = async (req, res) => {
  let {
    nombre,
    apellidoPaterno,
    apellidoMaterno,
    correo,
    password,
    telefono,
    cedulaProfesional,
    especialidad,
  } = req.body;

  if (nombre && (!apellidoPaterno || !String(apellidoPaterno).trim())) {
    const nombreDividido = dividirNombreCompleto(nombre);
    nombre = nombreDividido.nombre;
    apellidoPaterno = nombreDividido.apellidoPaterno;
    apellidoMaterno = nombreDividido.apellidoMaterno;
  }

  // Validar campos requeridos
  if (!nombre || !apellidoPaterno || !correo || !password) {
    return res.status(400).json({ 
      success: false,
      message: "Todos los campos son requeridos." 
    });
  }

  // Validar que tenga cédula profesional.
  if (!cedulaProfesional) {
    return res.status(400).json({ 
      success: false,
      message: "Los psicólogos deben proporcionar una cédula profesional." 
    });
  }

  let client;
  try {
    client = await db.getClient();
    await client.query('BEGIN');

    const correoNormalizado = correo.toLowerCase();

    // Verificar si el correo ya existe en usuarios.
    const existingUser = await client.query('SELECT usuarioid FROM usuarios WHERE correo = $1', [correoNormalizado]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false,
        message: "El correo ya está registrado." 
      });
    }

    // Verificar si la cédula ya existe en psicologas.
    const existingCedula = await client.query('SELECT psicologaid FROM psicologas WHERE cedulaprofesional = $1', [cedulaProfesional]);
    if (existingCedula.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'La cédula profesional ya está registrada.'
      });
    }

    // Evitar duplicado de solicitud pendiente por correo o cédula.
    const existingPending = await client.query(
      `
      SELECT solicitudid
      FROM solicitudesregistropsicologas
      WHERE estadosolicitud = 'Pendiente'
        AND (correo = $1 OR cedulaprofesional = $2)
      LIMIT 1
      `,
      [correoNormalizado, cedulaProfesional]
    );
    if (existingPending.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({
        success: false,
        message: 'Ya existe una solicitud pendiente con ese correo o cédula.'
      });
    }

    // Genera un "salt" y luego "hashea" la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // Crear solicitud de registro en estado pendiente.
    const solicitudResult = await client.query(
      `
      INSERT INTO solicitudesregistropsicologas
      (nombre, apellidopaterno, apellidomaterno, correo, contrasenahash, telefono, cedulaprofesional, especialidad, estadosolicitud)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendiente')
      RETURNING solicitudid, nombre, apellidopaterno, apellidomaterno, correo, cedulaprofesional, estadosolicitud, fechasolicitud
      `,
      [
        nombre,
        apellidoPaterno,
        apellidoMaterno || null,
        correoNormalizado,
        contrasenaHash,
        telefono || null,
        cedulaProfesional,
        especialidad || 'Psicologia General'
      ]
    );

    await client.query('COMMIT');

    if (isEmailIntegrationEnabled()) {
      Promise.resolve()
        .then(async () => {
          const templateBienvenida = await construirTemplateBienvenidaRegistro({
            nombre,
            apellidoPaterno,
            correo: correoNormalizado,
            password,
            estadoSolicitud: solicitudResult.rows[0]?.estadosolicitud || 'Pendiente',
          });

          await enviarCorreo({
            to: correoNormalizado,
            subject: templateBienvenida.asunto,
            text: templateBienvenida.texto,
            html: templateBienvenida.html,
          });
        })
        .catch((emailError) => {
          console.error('[auth.register] Error enviando correo de bienvenida:', emailError.message);
        });
    }
    
    return res.status(201).json({ 
      success: true,
      message: 'Solicitud enviada. Un administrador revisará tu registro de psicóloga.',
      solicitud: solicitudResult.rows[0]
    });

  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error al hacer rollback en registro:', rollbackError);
      }
    }

    if (error.code === '23505') {
      if (String(error.constraint || '').includes('cedulaprofesional')) {
        return res.status(409).json({
          success: false,
          message: 'La cédula profesional ya existe en una solicitud pendiente o en un perfil activo.'
        });
      }

      if (String(error.constraint || '').includes('correo')) {
        return res.status(409).json({
          success: false,
          message: 'El correo ya existe en una solicitud pendiente o en una cuenta activa.'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Registro duplicado detectado.'
      });
    }

    if (error.code === '42501') {
      return res.status(503).json({
        success: false,
        message: 'Permisos de base de datos insuficientes para registrar solicitudes. Ejecuta los GRANT de migración.',
        error: error.message,
      });
    }

    if (error.code === '42P01') {
      return res.status(503).json({
        success: false,
        message: 'La tabla de solicitudes no existe. Aplica la migración en DB.md antes de registrar.',
        error: error.message,
      });
    }

    console.error("Error en el registro:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al registrar el usuario.",
      error: error.message 
    });
  } finally {
    if (client) {
      client.release();
    }
  }
};

const forgotPassword = async (req, res) => {
  const correo = String(req.body?.correo || '').trim().toLowerCase();

  if (!correo) {
    return res.status(400).json({
      success: false,
      message: 'El correo es requerido.',
    });
  }

  if (!isEmailIntegrationEnabled()) {
    return res.status(503).json({
      success: false,
      message: 'La recuperacion de contrasena no esta disponible en este momento.',
    });
  }

  try {
    const result = await db.query(
      'SELECT usuarioid, nombre, apellidopaterno, correo, contrasenahash FROM usuarios WHERE correo = $1 LIMIT 1',
      [correo]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'El correo no esta registrado en PsicoAgenda.',
      });
    }

    const usuario = result.rows[0];
    const token = jwt.sign(
      {
        sub: usuario.usuarioid,
        purpose: 'password-reset',
        pwdv: String(usuario.contrasenahash || '').slice(-16),
      },
      process.env.JWT_SECRET,
      { expiresIn: `${RESET_TOKEN_EXPIRES_MINUTES}m` }
    );

    const resetUrl = `${APP_WEB_URL}?resetToken=${encodeURIComponent(token)}`;
    const template = await construirTemplateRecuperacionPassword({
      nombre: usuario.nombre,
      apellidoPaterno: usuario.apellidopaterno,
      resetUrl,
      expiracionMinutos: RESET_TOKEN_EXPIRES_MINUTES,
    });

    await enviarCorreo({
      to: usuario.correo,
      subject: template.asunto,
      text: template.texto,
      html: template.html,
    });

    return res.status(200).json({
      success: true,
      message: 'Te enviamos un correo con instrucciones para restablecer tu contrasena.',
    });
  } catch (error) {
    console.error('[auth.forgotPassword] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible procesar la solicitud de recuperacion.',
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  const token = String(req.body?.token || '').trim();
  const passwordNueva = String(req.body?.passwordNueva || '').trim();

  if (!token || !passwordNueva) {
    return res.status(400).json({
      success: false,
      message: 'El token y la nueva contrasena son requeridos.',
    });
  }

  if (passwordNueva.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'La nueva contrasena debe tener al menos 8 caracteres.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (payload.purpose !== 'password-reset' || !payload.sub) {
      return res.status(400).json({
        success: false,
        message: 'El token de recuperacion no es valido.',
      });
    }

    const result = await db.query(
      'SELECT usuarioid, contrasenahash FROM usuarios WHERE usuarioid = $1 LIMIT 1',
      [payload.sub]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado.',
      });
    }

    const usuario = result.rows[0];
    const versionHashActual = String(usuario.contrasenahash || '').slice(-16);
    if (versionHashActual !== payload.pwdv) {
      return res.status(400).json({
        success: false,
        message: 'El token ya no es valido. Solicita un nuevo enlace.',
      });
    }

    const passwordRepetida = await bcrypt.compare(passwordNueva, usuario.contrasenahash);
    if (passwordRepetida) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contrasena no puede ser igual a la anterior.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const nuevoHash = await bcrypt.hash(passwordNueva, salt);

    await db.query('UPDATE usuarios SET contrasenahash = $1 WHERE usuarioid = $2', [nuevoHash, usuario.usuarioid]);

    return res.status(200).json({
      success: true,
      message: 'Contrasena restablecida correctamente.',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({
        success: false,
        message: 'El enlace de recuperacion ha expirado. Solicita uno nuevo.',
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({
        success: false,
        message: 'El token de recuperacion no es valido.',
      });
    }

    console.error('[auth.resetPassword] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'No fue posible restablecer la contrasena.',
      error: error.message,
    });
  }
};


module.exports = { login, register, forgotPassword, resetPassword };
