const db = require('../db'); // Tu archivo de conexión
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

    // Verificar si el correo ya existe en usuarios.
    const existingUser = await client.query('SELECT usuarioid FROM usuarios WHERE correo = $1', [correo.toLowerCase()]);
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
      [correo.toLowerCase(), cedulaProfesional]
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
        correo.toLowerCase(),
        contrasenaHash,
        telefono || null,
        cedulaProfesional,
        especialidad || 'Psicologia General'
      ]
    );

    await client.query('COMMIT');
    
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


module.exports = { login, register };
