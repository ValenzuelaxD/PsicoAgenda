const db = require('../db');

const getMisCitas = async (req, res) => {
  // El ID y rol del usuario vienen del middleware 'protegerRuta'
  const usuarioId = req.user.id; 
  const rol = req.user.rol;

  try {
    let query;
    let params = [usuarioId];

    if (rol === 'paciente') {
      // Un paciente necesita su ID de la tabla 'pacientes' para buscar en 'citas'
      const pacienteResult = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
      if (pacienteResult.rows.length === 0) {
        return res.status(404).json({ message: "Perfil de paciente no encontrado." });
      }
      const pacienteId = pacienteResult.rows[0].pacienteid;
      
      query = `
        SELECT c.*, u.nombre as psicologa_nombre, u.apellidopaterno as psicologa_apellido, ps.consultorio as ubicacion
        FROM citas c
        JOIN psicologas ps ON c.psicologaid = ps.psicologaid
        JOIN usuarios u ON ps.usuarioid = u.usuarioid
        WHERE c.pacienteid = $1 ORDER BY c.fechahora DESC
      `;
      params = [pacienteId];

    } else if (rol === 'psicologa') {
      const psicologaResult = await db.query('SELECT psicologaid FROM psicologas WHERE usuarioid = $1', [usuarioId]);
      if (psicologaResult.rows.length === 0) {
        return res.status(404).json({ message: "Perfil de psicóloga no encontrado." });
      }
      const psicologaId = psicologaResult.rows[0].psicologaid;

      query = `
        SELECT c.*, u.nombre as paciente_nombre, u.apellidopaterno as paciente_apellido, ps.consultorio as ubicacion
        FROM citas c
        JOIN pacientes p ON c.pacienteid = p.pacienteid
        JOIN usuarios u ON p.usuarioid = u.usuarioid
        JOIN psicologas ps ON c.psicologaid = ps.psicologaid
        WHERE c.psicologaid = $1 ORDER BY c.fechahora DESC
      `;
      params = [psicologaId];
    } else { // admin
      query = 'SELECT * FROM citas ORDER BY fechahora DESC';
      params = [];
    }

    const result = await db.query(query, params);
    res.json(result.rows);

  } catch (error) {
    console.error("Error al obtener citas:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

const crearCita = async (req, res) => {
  const { psicologaId, fecha, hora, notas, modalidad } = req.body;
  const usuarioId = req.user.id;

  try {
    const pacienteResult = await db.query('SELECT pacienteid FROM pacientes WHERE usuarioid = $1', [usuarioId]);
    if (pacienteResult.rows.length === 0) {
      return res.status(404).json({ message: "Perfil de paciente no encontrado." });
    }
    const pacienteId = pacienteResult.rows[0].pacienteid;
    
    const [horas, minutos] = String(hora).split(':');
    const fechaHora = new Date(`${fecha}T00:00:00`);
    fechaHora.setHours(Number(horas), Number(minutos), 0, 0);

    if (Number.isNaN(fechaHora.getTime())) {
      return res.status(400).json({ message: 'Fecha u hora inválida.' });
    }

    const query = `
      INSERT INTO citas (pacienteid, psicologaid, fechahora, notaspaciente, modalidad, estado)
      VALUES ($1, $2, $3, $4, $5, 'Pendiente')
      RETURNING citaid
    `;
    const modalidadFinal = modalidad || 'Presencial';
    const result = await db.query(query, [pacienteId, psicologaId, fechaHora, notas, modalidadFinal]);
    
    res.status(201).json({ citaId: result.rows[0].citaid });
  } catch (error) {
    console.error("Error al crear la cita:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

module.exports = { getMisCitas, crearCita };
