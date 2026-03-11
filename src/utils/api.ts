/**
 * Configuración de la API
 * Define la URL base del backend
 */

// Detectar si estamos en desarrollo o producción
// Usar localhost en desarrollo, de lo contrario usar variable de entorno o ruta relativa
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// URL base del backend
const API_BASE_URL = isDevelopment 
  ? 'http://localhost:3001'  // Desarrollo: backend local
  : (typeof (import.meta as any).env !== 'undefined' && (import.meta as any).env.VITE_API_URL) || '/api';  // Producción: usar variable de entorno o ruta relativa

export const API_ENDPOINTS = {
  // Auth
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Citas
  CITAS: `${API_BASE_URL}/api/citas`,
  CITAS_TIPOS: `${API_BASE_URL}/api/citas/tipos`,
  
  // Dashboard
  DASHBOARD_PACIENTE: `${API_BASE_URL}/api/dashboard/paciente`,
  DASHBOARD_PSICOLOGO: `${API_BASE_URL}/api/dashboard/psicologo`,
  
  // Pacientes
  PACIENTES: `${API_BASE_URL}/api/pacientes`,
  
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
};

/**
 * Función auxiliar para hacer fetch con error handling consistente
 */
export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  try {
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    // Si hay token, agregarlo automaticamente
    const token = localStorage.getItem('token');
    if (token) {
      const headersWithAuth = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
      
      return fetch(endpoint, {
        ...options,
        headers: headersWithAuth,
      });
    }

    return response;
  } catch (error) {
    console.error(`Error en fetch a ${endpoint}:`, error);
    throw error;
  }
}

export default API_ENDPOINTS;
