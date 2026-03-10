const db = require('../db');

const getPacientes = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.usuarioid, p.pacienteid, u.nombre, u.apellidopaterno, u.apellidomaterno, p.fechanacimiento
      FROM usuarios u
      JOIN pacientes p ON u.usuarioid = p.usuarioid
      WHERE u.rol = 'paciente' AND u.activo = true
    `);
    
    const pacientes = result.rows.map(p => ({
      ...p,
      edad: new Date().getFullYear() - new Date(p.fechanacimiento).getFullYear()
    }));

    res.json(pacientes);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = { getPacientes };
