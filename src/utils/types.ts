/**
 * Tipos e Interfaces alineadas con la BD de PsicoAgenda en Google Cloud SQL
 * Generadas basándose en la estructura definida en BD.md
 */

// ============================================
// USUARIOS Y AUTENTICACIÓN
// ============================================

export interface Usuario {
  usuarioid: number;
  nombre: string;
  apellidopaterno: string;
  apellidomaterno?: string;
  correo: string;
  contrasenaHash: string;
  telefono?: string;
  rol: 'paciente' | 'psicologa' | 'admin';
  fotoperfil?: string;
  activo: boolean;
  fecharegistro: string;
  tokenrecuperacion?: string;
  tokenexpiracion?: string;
}

export interface TokenPayload {
  usuarioid: number;
  correo: string;
  rol: 'paciente' | 'psicologa' | 'admin';
}

// ============================================
// PSICÓLOGAS
// ============================================

export interface Psicologa {
  psicologaid: number;
  usuarioid: number;
  cedulaprofesional: string;
  especialidad: string;
  descripcion?: string;
  consultorio?: string;
  usuario?: Usuario;
}

// ============================================
// PACIENTES
// ============================================
 
export interface Paciente {
  pacienteid: number;
  usuarioid: number;
  fechanacimiento?: string;
  genero?: 'Masculino' | 'Femenino' | 'Otro' | 'Prefiero no decir';
  direccion?: string;
  motivoconsulta?: string;
  contactoemergencia?: string;
  telemergencia?: string;
  fechaalta?: string;
  usuario?: Usuario;
  // Campos derivados/calculados
  nombre?: string;
  apellidopaterno?: string;
  apellidomaterno?: string;
  correo?: string;
  email?: string;
  telefono?: string;
  fotoperfil?: string;
  edad?: number;
  sesionesTotales?: number;
}

// ============================================
// CITAS
// ============================================

export interface Cita {
  citaid: number;
  pacienteid: number;
  psicologaid: number;
  fechahora: string;
  duracionmin: number;
  estado: 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada' | 'Reagendada';
  modalidad: 'Presencial' | 'En linea';
  notaspaciente?: string;
  notaspsicologa?: string;
  fechacreacion?: string;
  fechamodificacion?: string;
  // Campos derivados
  paciente_nombre?: string;
  paciente_apellido?: string;
  paciente_fotoperfil?: string;
  psicologa_nombre?: string;
  psicologa_apellido?: string;
  notas?: string;
  notasresumen?: string;
  ubicacion?: string;
}

export interface ReporteCitasResumen {
  total_citas: number;
  citas_completadas: number;
  citas_canceladas: number;
  citas_pendientes: number;
  citas_reagendadas: number;
  pacientes_activos: number;
  horas_terapia: number;
}

export interface ReporteCitasModalidad {
  modalidad: string;
  cantidad: number;
  porcentaje: number;
}

export interface ReporteCitasPaciente {
  pacienteid: number;
  paciente: string;
  sesiones: number;
  ultima_cita: string;
}

export interface ReporteCitasTimeline {
  fecha: string;
  completadas: number;
  canceladas: number;
  pendientes: number;
  reagendadas: number;
}

export interface ReporteCitasDetalle {
  citaid: number;
  fecha: string;
  hora: string;
  paciente: string;
  modalidad: string;
  estado: string;
  duracionmin: number;
  notas?: string;
  consultorio?: string;
}

export interface ReporteCitasResponse {
  resumen: ReporteCitasResumen;
  modalidades: ReporteCitasModalidad[];
  pacientes: ReporteCitasPaciente[];
  timeline: ReporteCitasTimeline[];
  citas: ReporteCitasDetalle[];
}

// ============================================
// AGENDA
// ============================================

export interface Agenda {
  agendaid: number;
  psicologaid: number;
  diasemana: 'Lunes' | 'Martes' | 'Miercoles' | 'Jueves' | 'Viernes' | 'Sabado' | 'Domingo';
  horainicio: string;
  horafin: string;
  disponible: boolean;
}

// ============================================
// HISTORIAL CLÍNICO
// ============================================

export interface HistorialClinico {
  historialid: number;
  pacienteid: number;
  citaid?: number;
  psicologaid: number;
  fechaentrada: string;
  diagnostico?: string;
  tratamiento?: string;
  observaciones?: string;
  esconfidencial: boolean;
}

// ============================================
// SOLICITUDES DE REAGENDA
// ============================================

export interface SolicitudReagenda {
  solicitudid: number;
  citaid: number;
  nuevafechahora: string;
  motivo?: string;
  estadosolicitud: 'Pendiente' | 'Aprobada' | 'Rechazada';
  fechasolicitud: string;
}

// ============================================
// NOTIFICACIONES
// ============================================

export interface Notificacion {
  notificacionid: number;
  usuarioid: number;
  citaid?: number;
  tipo: 'Recordatorio' | 'Confirmacion' | 'Cancelacion' | 'Reagenda' | 'Sistema';
  mensaje: string;
  leida: boolean;
  fechaenvio: string;
}

// ============================================
// RESPUESTAS DE API
// ============================================

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export interface CitaConDetalles extends Cita {
  paciente?: Paciente;
  psicologa?: Psicologa;
}

export interface PacienteDashboardData {
  proximaCita?: string;
  sesionesTotales: number;
  ultimaSesion?: string;
  proximasCitas?: Array<{
    citaid: number;
    fechahora: string;
    modalidad: string;
    estado: string;
    nombre: string;
    apellidopaterno: string;
    consultorio: string;
  }>;
}

export interface PsicologaDashboardData {
  citasHoy: CitaConDetalles[];
  pacientesActivos: number;
  citasSemana: number;
  citasPendientes: number;
  nuevasSolicitudes: number;
}

// ============================================
// ENUMS Y CONSTANTES
// ============================================

export const ESTADO_CITA = {
  PENDIENTE: 'Pendiente',
  CONFIRMADA: 'Confirmada',
  CANCELADA: 'Cancelada',
  COMPLETADA: 'Completada',
  REAGENDADA: 'Reagendada'
} as const;

export const MODALIDAD_CITA = {
  PRESENCIAL: 'Presencial',
  EN_LINEA: 'En linea'
} as const;

export const GENERO = {
  MASCULINO: 'Masculino',
  FEMENINO: 'Femenino',
  OTRO: 'Otro',
  PREFIERO_NO_DECIR: 'Prefiero no decir'
} as const;

export const DIAS_SEMANA = [
  'Lunes',
  'Martes',
  'Miercoles',
  'Jueves',
  'Viernes',
  'Sabado',
  'Domingo'
] as const;

export const ROL_USUARIO = {
  PACIENTE: 'paciente',
  PSICOLOGA: 'psicologa',
  ADMIN: 'admin'
} as const;

export const TIPO_NOTIFICACION = {
  RECORDATORIO: 'Recordatorio',
  CONFIRMACION: 'Confirmacion',
  CANCELACION: 'Cancelacion',
  REAGENDA: 'Reagenda',
  SISTEMA: 'Sistema'
} as const;
