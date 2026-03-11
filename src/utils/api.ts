/**
 * Configuración de la API
 * Define la URL base del backend
 */

// URL base del backend.
// En desarrollo el proxy de Vite reenvía /api → http://localhost:3001.
// En producción se puede definir VITE_API_URL; si no, se usan rutas relativas.
const API_BASE_URL: string = (import.meta as any).env?.VITE_API_URL ?? '';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Citas
  CITAS: `${API_BASE_URL}/api/citas`,
  CITAS_TIPOS: `${API_BASE_URL}/api/citas/tipos`,
  CITAS_DISPONIBILIDAD: `${API_BASE_URL}/api/citas/disponibilidad`,

  // Agenda
  AGENDAS: `${API_BASE_URL}/api/agendas`,
  
  // Dashboard
  DASHBOARD_PACIENTE: `${API_BASE_URL}/api/dashboard/paciente`,
  DASHBOARD_PSICOLOGO: `${API_BASE_URL}/api/dashboard/psicologo`,
  
  // Pacientes
  PACIENTES: `${API_BASE_URL}/api/pacientes`,
  PACIENTES_ID: (id: number) => `${API_BASE_URL}/api/pacientes/${id}`,
  
  // Psicologas
  PSICOLOGAS: `${API_BASE_URL}/api/psicologas`,

  // Perfil
  PERFIL: `${API_BASE_URL}/api/perfil`,
  PERFIL_PASSWORD: `${API_BASE_URL}/api/perfil/password`,
  
  // Historial Clínico
  HISTORIAL_CLINICO: `${API_BASE_URL}/api/historialclinico`,
  MI_HISTORIAL: `${API_BASE_URL}/api/historialclinico`,
  
  // Notificaciones
  NOTIFICACIONES: `${API_BASE_URL}/api/notificaciones`,

  // Reportes
  REPORTES_CITAS: `${API_BASE_URL}/api/reportes/citas`,
};

/**
 * Función auxiliar para hacer fetch con error handling consistente
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const token = localStorage.getItem('token');
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return fetch(endpoint, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error(`Error en fetch a ${endpoint}:`, error);
    throw error;
  }
}

export default API_ENDPOINTS;
