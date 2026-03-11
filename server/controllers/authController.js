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
 * Crea la entrada en Usuarios y también en Pacientes o Psicologas según corresponda.
 */
const register = async (req, res) => {
  let { nombre, apellidoPaterno, apellidoMaterno, correo, password, cedulaProfesional } = req.body;

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

  // Registro público restringido: solo se permite registro de psicólogas.
  const rol = 'psicologa';

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

    // Verificar si el usuario ya existe
    const existingUser = await client.query('SELECT usuarioid FROM usuarios WHERE correo = $1', [correo.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false,
        message: "El correo ya está registrado." 
      });
    }

    // Genera un "salt" y luego "hashea" la contraseña
    const salt = await bcrypt.genSalt(10);
    const contrasenaHash = await bcrypt.hash(password, salt);

    // Guarda el nuevo usuario en la base de datos con la contraseña hasheada
    const newUser = await client.query(
      'INSERT INTO usuarios (nombre, apellidopaterno, apellidomaterno, correo, contrasenahash, rol, activo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING usuarioid, nombre, apellidopaterno, apellidomaterno, correo, rol',
      [nombre, apellidoPaterno, apellidoMaterno || null, correo.toLowerCase(), contrasenaHash, rol, true]
    );
    
    const usuarioId = newUser.rows[0].usuarioid;

    console.log(`Registrando usuario ${rol}: ${usuarioId}`);

    await client.query(
      'INSERT INTO psicologas (usuarioid, cedulaprofesional, especialidad) VALUES ($1, $2, $3)',
      [usuarioId, cedulaProfesional, 'Psicología General']
    );
    console.log(`Psicólogo creado: ${usuarioId}`);

    await client.query('COMMIT');
    
    return res.status(201).json({ 
      success: true,
      message: "Usuario registrado con éxito", 
      user: { 
        id: usuarioId,
        nombre: newUser.rows[0].nombre,
        apellidoPaterno: newUser.rows[0].apellidopaterno,
        apellidoMaterno: newUser.rows[0].apellidomaterno,
        correo: newUser.rows[0].correo,
        rol: newUser.rows[0].rol
      } 
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
          message: 'La cédula profesional ya está registrada.'
        });
      }

      if (String(error.constraint || '').includes('correo')) {
        return res.status(409).json({
          success: false,
          message: 'El correo ya está registrado.'
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Registro duplicado detectado.'
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
