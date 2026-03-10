const express = require('express');
const router = express.Router();
const db = require('../db');

// Importar controladores y middleware
const { login, register } = require('../controllers/authController');
const { getMisCitas, crearCita } = require('../controllers/citasController');
const { getMisNotificaciones, marcarNotificacionComoLeida, eliminarNotificacion } = require('../controllers/notificacionesController');
const { getPacienteDashboard, getPsicologoDashboard } = require('../controllers/dashboardController');
const { getPsicologas, getDisponibilidad } = require('../controllers/psicologasController');
const { getPacientes } = require('../controllers/pacientesController');
const { getMiHistorial, getHistorial, crearEntradaHistorial, actualizarEntradaHistorial } = require('../controllers/historialClinicoController');
const { protegerRuta } = require('../middleware/authMiddleware');

// --- Rutas Públicas ---
router.post('/auth/login', login);
router.post('/auth/register', register); // Ruta de ejemplo para registrar

// --- Rutas Protegidas (requieren token) ---
router.post('/citas', protegerRuta, crearCita);
router.get('/citas', protegerRuta, getMisCitas);
router.get('/notificaciones', protegerRuta, getMisNotificaciones);
router.put('/notificaciones/:id/leida', protegerRuta, marcarNotificacionComoLeida);
router.delete('/notificaciones/:id', protegerRuta, eliminarNotificacion);
router.get('/dashboard/paciente', protegerRuta, getPacienteDashboard);
router.get('/dashboard/psicologo', protegerRuta, getPsicologoDashboard);
router.get('/psicologas', protegerRuta, getPsicologas);
router.get('/psicologas/:id/disponibilidad', protegerRuta, getDisponibilidad);
router.get('/citas/tipos', protegerRuta, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT modalidad FROM (
        SELECT DISTINCT modalidad FROM citas WHERE modalidad IS NOT NULL
        UNION
        SELECT 'Presencial'::varchar
        UNION
        SELECT 'En linea'::varchar
      ) modalidades
      ORDER BY modalidad
    `);
    res.json(result.rows.map((row) => row.modalidad));
  } catch (error) {
    console.error('Error al obtener modalidades de cita:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});
router.get('/pacientes', protegerRuta, getPacientes);
router.get('/historialclinico', protegerRuta, getMiHistorial);
router.get('/historialclinico/:pacienteId', protegerRuta, getHistorial);
router.post('/historialclinico', protegerRuta, crearEntradaHistorial);
router.put('/historialclinico/:id', protegerRuta, actualizarEntradaHistorial);
// ... aquí irían el resto de tus rutas protegidas

module.exports = router;



