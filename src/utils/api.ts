/**
 * Configuración de la API
 * Define la URL base del backend
 */

// URL base del backend.
// En desarrollo el proxy de Vite reenvía /api → http://localhost:3001.
// En producción se puede definir VITE_API_URL; si no, se usan rutas relativas.
const API_BASE_URL: string = (import.meta as any).env?.VITE_API_URL ?? '';

const toNumberOrDefault = (value: unknown, defaultValue: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

export const CLIENT_CONFIG = {
  NOTIFICATIONS_POLL_INTERVAL_DESKTOP_MS: toNumberOrDefault((import.meta as any).env?.VITE_NOTIF_POLL_DESKTOP_MS, 45000),
  NOTIFICATIONS_POLL_INTERVAL_MOBILE_MS: toNumberOrDefault((import.meta as any).env?.VITE_NOTIF_POLL_MOBILE_MS, 75000),
  NOTIFICATIONS_TOAST_COOLDOWN_MS: toNumberOrDefault((import.meta as any).env?.VITE_NOTIF_TOAST_COOLDOWN_MS, 30000),
} as const;

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

  // Admin - Solicitudes de psicologas
  ADMIN_SOLICITUDES_PSICOLOGAS: `${API_BASE_URL}/api/admin/solicitudes-psicologas`,
  ADMIN_APROBAR_SOLICITUD_PSICOLOGA: (id: number) => `${API_BASE_URL}/api/admin/solicitudes-psicologas/${id}/aprobar`,
  ADMIN_RECHAZAR_SOLICITUD_PSICOLOGA: (id: number) => `${API_BASE_URL}/api/admin/solicitudes-psicologas/${id}/rechazar`,
};

function getClientLocalDateTime(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // Se envía sin zona para conservar exactamente la hora local del navegador.
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

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

    headers.set('x-client-local-datetime', getClientLocalDateTime());
    headers.set('x-client-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone || '');

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
