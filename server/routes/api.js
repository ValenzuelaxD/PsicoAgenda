const express = require('express');
const router = express.Router();
const db = require('../db');

// Importar controladores y middleware
const { login, register, forgotPassword, resetPassword } = require('../controllers/authController');
const { getMisCitas, crearCita, actualizarCita, confirmarCita, cancelarCita, getMiDisponibilidad } = require('../controllers/citasController');
const { getMisNotificaciones, marcarNotificacionComoLeida, eliminarNotificacion } = require('../controllers/notificacionesController');
const { getPacienteDashboard, getPsicologoDashboard } = require('../controllers/dashboardController');
const { getPsicologas, getDisponibilidad } = require('../controllers/psicologasController');
// Importar controladores
const { getPacientes, crearPaciente, actualizarPaciente, eliminarPaciente } = require('../controllers/pacientesController');
const { getMiHistorial, getHistorial, crearEntradaHistorial, actualizarEntradaHistorial } = require('../controllers/historialClinicoController');
const { getMiPerfil, actualizarMiPerfil, cambiarMiPassword, actualizarImagenTema } = require('../controllers/perfilController');
const { getReporteCitas } = require('../controllers/reportesController');
const { getMiAgenda, crearAgenda, actualizarAgenda, eliminarAgenda } = require('../controllers/agendasController');
const {
  getFrecuenciaPorPacienteParaPsicologa,
  upsertFrecuenciaPorPacienteParaPsicologa,
  getMiFrecuenciaRecomendada,
} = require('../controllers/frecuenciaCitasController');
const {
  getSolicitudesPsicologas,
  aprobarSolicitudPsicologa,
  rechazarSolicitudPsicologa,
} = require('../controllers/solicitudesRegistroController');
const { protegerRuta, autorizarRol } = require('../middleware/authMiddleware');

// --- Rutas Públicas ---
router.post('/auth/login', login);
router.post('/auth/register', register); // Ruta de ejemplo para registrar
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// --- Rutas Protegidas (requieren token) ---
router.post('/citas', protegerRuta, crearCita);
router.get('/citas', protegerRuta, getMisCitas);
router.get('/citas/disponibilidad', protegerRuta, getMiDisponibilidad);
router.put('/citas/:id', protegerRuta, actualizarCita);
router.put('/citas/:id/confirm', protegerRuta, confirmarCita);
router.put('/citas/:id/cancel', protegerRuta, cancelarCita);
router.get('/agendas', protegerRuta, getMiAgenda);
router.post('/agendas', protegerRuta, crearAgenda);
router.put('/agendas/:id', protegerRuta, actualizarAgenda);
router.delete('/agendas/:id', protegerRuta, eliminarAgenda);
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
router.post('/pacientes', protegerRuta, crearPaciente);
router.put('/pacientes/:pacienteId', protegerRuta, actualizarPaciente);
router.delete('/pacientes/:pacienteId', protegerRuta, eliminarPaciente);
router.get('/historialclinico', protegerRuta, getMiHistorial);
router.get('/historialclinico/:pacienteId', protegerRuta, getHistorial);
router.post('/historialclinico', protegerRuta, crearEntradaHistorial);
router.put('/historialclinico/:id', protegerRuta, actualizarEntradaHistorial);
router.get('/perfil', protegerRuta, getMiPerfil);
router.put('/perfil', protegerRuta, actualizarMiPerfil);
router.put('/perfil/password', protegerRuta, cambiarMiPassword);
router.put('/perfil/tema-imagen', protegerRuta, actualizarImagenTema);
router.get('/frecuencia-citas/mi', protegerRuta, getMiFrecuenciaRecomendada);
router.get('/frecuencia-citas/paciente/:pacienteId', protegerRuta, getFrecuenciaPorPacienteParaPsicologa);
router.put('/frecuencia-citas/paciente/:pacienteId', protegerRuta, upsertFrecuenciaPorPacienteParaPsicologa);
router.get('/reportes/citas', protegerRuta, getReporteCitas);
router.get('/admin/solicitudes-psicologas', protegerRuta, autorizarRol('admin'), getSolicitudesPsicologas);
router.put('/admin/solicitudes-psicologas/:id/aprobar', protegerRuta, autorizarRol('admin'), aprobarSolicitudPsicologa);
router.put('/admin/solicitudes-psicologas/:id/rechazar', protegerRuta, autorizarRol('admin'), rechazarSolicitudPsicologa);
// ... aquí irían el resto de tus rutas protegidas

module.exports = router;



