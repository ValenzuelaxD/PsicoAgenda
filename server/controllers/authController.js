const db = require('../db'); // Tu archivo de conexión
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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
 * Crea la entrada en Usuarios y también en Pacientes o Psicologas según corresponda.
 */
const register = async (req, res) => {
  const { nombre, apellidoPaterno, correo, password, rol, cedulaProfesional } = req.body;

  // Validar campos requeridos
  if (!nombre || !apellidoPaterno || !correo || !password || !rol) {
    return res.status(400).json({ 
      success: false,
      message: "Todos los campos son requeridos." 
    });
  }

  // Validar que rol sea válido
  if (!['paciente', 'psicologa', 'admin'].includes(rol)) {
    return res.status(400).json({ 
      success: false,
      message: "Rol inválido." 
    });
  }

  // Si es psicólogo, validar que tenga cédula
  if (rol === 'psicologa' && !cedulaProfesional) {
    return res.status(400).json({ 
      success: false,
      message: "Los psicólogos deben proporcionar una cédula profesional." 
    });
  }

  try {
    // Verificar si el usuario ya existe
    const existingUser = await db.query('SELECT * FROM usuarios WHERE correo = $1', [correo.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        message: "El correo ya está registrado." 
      });
    }

    // Genera un "salt" y luego "hashea" la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // Guarda el nuevo usuario en la base de datos con la contraseña hasheada
    const newUser = await db.query(
      'INSERT INTO usuarios (nombre, apellidopaterno, correo, contrasenahash, rol, activo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING usuarioid, nombre, apellidopaterno, correo, rol',
      [nombre, apellidoPaterno, correo.toLowerCase(), contrasenaHash, rol, true]
    );
    
    const usuarioId = newUser.rows[0].usuarioid;

    console.log(`Registrando usuario ${rol}: ${usuarioId}`);

    // Si es paciente, crear entrada en tabla Pacientes
    if (rol === 'paciente') {
      await db.query(
        'INSERT INTO pacientes (usuarioid, fechaalta) VALUES ($1, CURRENT_DATE)',
        [usuarioId]
      );
      console.log(`Paciente creado: ${usuarioId}`);
    }

    // Si es psicólogo, crear entrada en tabla Psicologas
    if (rol === 'psicologa') {
      await db.query(
        'INSERT INTO psicologas (usuarioid, cedulaprofesional, especialidad) VALUES ($1, $2, $3)',
        [usuarioId, cedulaProfesional, 'Psicología General']
      );
      console.log(`Psicólogo creado: ${usuarioId}`);
    }
    
    return res.status(201).json({ 
      success: true,
      message: "Usuario registrado con éxito", 
      user: { 
        id: usuarioId,
        nombre: newUser.rows[0].nombre,
        apellidoPaterno: newUser.rows[0].apellidopaterno,
        correo: newUser.rows[0].correo,
        rol: newUser.rows[0].rol
      } 
    });

  } catch (error) {
    console.error("Error en el registro:", error);
    return res.status(500).json({ 
      success: false,
      message: "Error al registrar el usuario.",
      error: error.message 
    });
  }
};


module.exports = { login, register };
