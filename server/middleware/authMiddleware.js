const jwt = require('jsonwebtoken');

const protegerRuta = (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Obtiene el token del encabezado "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Verifica la firma del token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Adjunta los datos del usuario (el 'payload' del token) a la petición
      // para que las siguientes funciones en la ruta puedan usarlo.
      req.user = decoded;
      next(); // Continúa a la siguiente función

    } catch (error) {
      console.error('Error verificando token:', error.message);
      return res.status(401).json({ 
        success: false,
        message: 'Token inválido o expirado',
        error: error.message 
      });
    }
  } else {
    return res.status(401).json({ 
      success: false,
      message: 'No autorizado, token no encontrado' 
    });
  }
};

module.exports = { protegerRuta };
