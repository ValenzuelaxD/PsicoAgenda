/**
 * RF_US_021: Gestión de Bases de Datos
 * 
 * Este módulo maneja todas las operaciones de base de datos de PsicoAgenda.
 * Se conecta a Google Cloud SQL (PostgreSQL).
 * 
 * IMPORTANTE: En producción, este módulo debe garantizar:
 * - Persistencia de datos
 * - Sincronización entre dispositivos
 * - Backups automáticos
 * - Seguridad de datos médicos sensibles
 * - Cumplimiento con normativas de protección de datos (HIPAA, GDPR)
 */

// Re-exportar tipos desde types.ts para que los componentes los puedan importar desde aquí
export {
  Usuario,
  TokenPayload,
  Psicologa,
  Paciente,
  Cita,
  Agenda,
  HistorialClinico,
  SolicitudReagenda,
  Notificacion,
  LoginResponse,
  CitaConDetalles,
  PacienteDashboardData,
  PsicologaDashboardData,
  ESTADO_CITA,
  MODALIDAD_CITA,
  GENERO,
  DIAS_SEMANA,
  ROL_USUARIO,
  TIPO_NOTIFICACION,
} from './types';

// API Base URLs y funciones utilitarias
export const API_BASE_URL = '/api';

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });
}


export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  tipo: 'psicologo' | 'paciente';
  cedulaProfesional?: string;
  telefono?: string;
  edad?: number;
  fechaRegistro: string;
  ultimaActividad: string;
  activo?: boolean;
  password?: string;
}

// Clase principal de gestión de base de datos
export class DatabaseManager {
  private static instance: DatabaseManager;
  
  // Prefijos para las claves de localStorage
  private readonly PREFIJO_PACIENTES = 'psicoagenda_pacientes';
  private readonly PREFIJO_CITAS = 'psicoagenda_citas';
  private readonly PREFIJO_SESIONES = 'psicoagenda_sesiones';
  private readonly PREFIJO_USUARIOS = 'psicoagenda_usuarios';
  private readonly PREFIJO_BACKUP = 'psicoagenda_backup';

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  // === GESTIÓN DE PACIENTES ===
  
  public guardarPaciente(paciente: Paciente): boolean {
    try {
      const pacientes = this.obtenerPacientes();
      const index = pacientes.findIndex(p => p.id === paciente.id);
      
      if (index !== -1) {
        pacientes[index] = paciente;
      } else {
        pacientes.push(paciente);
      }
      
      localStorage.setItem(this.PREFIJO_PACIENTES, JSON.stringify(pacientes));
      this.crearBackupAutomatico();
      return true;
    } catch (error) {
      console.error('Error al guardar paciente:', error);
      return false;
    }
  }

  public obtenerPacientes(): Paciente[] {
    try {
      const data = localStorage.getItem(this.PREFIJO_PACIENTES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener pacientes:', error);
      return [];
    }
  }

  public obtenerPacientePorId(id: string): Paciente | null {
    const pacientes = this.obtenerPacientes();
    return pacientes.find(p => p.id === id) || null;
  }

  public buscarPacientes(query: string): Paciente[] {
    const pacientes = this.obtenerPacientes();
    const queryLower = query.toLowerCase();
    return pacientes.filter(p => 
      p.nombre.toLowerCase().includes(queryLower) ||
      p.email.toLowerCase().includes(queryLower)
    );
  }

  public eliminarPaciente(id: string): boolean {
    try {
      const pacientes = this.obtenerPacientes();
      const pacientesFiltrados = pacientes.filter(p => p.id !== id);
      localStorage.setItem(this.PREFIJO_PACIENTES, JSON.stringify(pacientesFiltrados));
      this.crearBackupAutomatico();
      return true;
    } catch (error) {
      console.error('Error al eliminar paciente:', error);
      return false;
    }
  }

  // === GESTIÓN DE CITAS ===
  
  public guardarCita(cita: Cita): boolean {
    try {
      const citas = this.obtenerCitas();
      const index = citas.findIndex(c => c.id === cita.id);
      
      if (index !== -1) {
        citas[index] = cita;
      } else {
        citas.push(cita);
      }
      
      localStorage.setItem(this.PREFIJO_CITAS, JSON.stringify(citas));
      this.crearBackupAutomatico();
      return true;
    } catch (error) {
      console.error('Error al guardar cita:', error);
      return false;
    }
  }

  public obtenerCitas(): Cita[] {
    try {
      const data = localStorage.getItem(this.PREFIJO_CITAS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener citas:', error);
      return [];
    }
  }

  public obtenerCitasPorPaciente(pacienteId: string): Cita[] {
    const citas = this.obtenerCitas();
    return citas.filter(c => c.pacienteId === pacienteId);
  }

  public obtenerCitasPorPsicologo(psicologoId: string): Cita[] {
    const citas = this.obtenerCitas();
    return citas.filter(c => c.psicologoId === psicologoId);
  }

  public obtenerCitasPorFecha(fecha: string): Cita[] {
    const citas = this.obtenerCitas();
    return citas.filter(c => c.fecha === fecha);
  }

  // === GESTIÓN DE SESIONES CLÍNICAS ===
  
  public guardarSesion(sesion: SesionClinica): boolean {
    try {
      const sesiones = this.obtenerSesiones();
      const index = sesiones.findIndex(s => s.id === sesion.id);
      
      if (index !== -1) {
        sesiones[index] = sesion;
      } else {
        sesiones.push(sesion);
      }
      
      localStorage.setItem(this.PREFIJO_SESIONES, JSON.stringify(sesiones));
      this.crearBackupAutomatico();
      return true;
    } catch (error) {
      console.error('Error al guardar sesión:', error);
      return false;
    }
  }

  public obtenerSesiones(): SesionClinica[] {
    try {
      const data = localStorage.getItem(this.PREFIJO_SESIONES);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener sesiones:', error);
      return [];
    }
  }

  public obtenerSesionesPorPaciente(pacienteId: string): SesionClinica[] {
    const sesiones = this.obtenerSesiones();
    return sesiones.filter(s => s.pacienteId === pacienteId);
  }

  // === GESTIÓN DE USUARIOS ===
  
  public guardarUsuario(usuario: Usuario): boolean {
    try {
      const usuarios = this.obtenerUsuarios();
      const index = usuarios.findIndex(u => u.id === usuario.id);
      
      if (index !== -1) {
        usuarios[index] = usuario;
      } else {
        usuarios.push(usuario);
      }
      
      localStorage.setItem(this.PREFIJO_USUARIOS, JSON.stringify(usuarios));
      return true;
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      return false;
    }
  }

  public obtenerUsuarios(): Usuario[] {
    try {
      const data = localStorage.getItem(this.PREFIJO_USUARIOS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      return [];
    }
  }

  public obtenerUsuarioPorEmail(email: string): Usuario | null {
    const usuarios = this.obtenerUsuarios();
    return usuarios.find(u => u.email === email) || null;
  }

  public obtenerUsuarioPorId(id: string): Usuario | null {
    const usuarios = this.obtenerUsuarios();
    return usuarios.find(u => u.id === id) || null;
  }

  public buscarUsuarios(query: string): Usuario[] {
    const usuarios = this.obtenerUsuarios();
    const queryLower = query.toLowerCase();
    return usuarios.filter(u => 
      u.nombre.toLowerCase().includes(queryLower) ||
      u.email.toLowerCase().includes(queryLower) ||
      (u.cedulaProfesional && u.cedulaProfesional.includes(query))
    );
  }

  public actualizarUsuario(usuario: Usuario): boolean {
    try {
      const usuarios = this.obtenerUsuarios();
      const index = usuarios.findIndex(u => u.id === usuario.id);
      
      if (index !== -1) {
        usuarios[index] = { ...usuarios[index], ...usuario, ultimaActividad: new Date().toISOString() };
        localStorage.setItem(this.PREFIJO_USUARIOS, JSON.stringify(usuarios));
        this.crearBackupAutomatico();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      return false;
    }
  }

  public eliminarUsuario(id: string): boolean {
    try {
      const usuarios = this.obtenerUsuarios();
      const usuariosFiltrados = usuarios.filter(u => u.id !== id);
      localStorage.setItem(this.PREFIJO_USUARIOS, JSON.stringify(usuariosFiltrados));
      this.crearBackupAutomatico();
      return true;
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      return false;
    }
  }

  public cambiarRolUsuario(id: string, nuevoTipo: 'psicologo' | 'paciente', cedulaProfesional?: string): boolean {
    try {
      const usuarios = this.obtenerUsuarios();
      const usuario = usuarios.find(u => u.id === id);
      
      if (usuario) {
        usuario.tipo = nuevoTipo;
        if (nuevoTipo === 'psicologo' && cedulaProfesional) {
          usuario.cedulaProfesional = cedulaProfesional;
        } else if (nuevoTipo === 'paciente') {
          delete usuario.cedulaProfesional;
        }
        usuario.ultimaActividad = new Date().toISOString();
        
        localStorage.setItem(this.PREFIJO_USUARIOS, JSON.stringify(usuarios));
        this.crearBackupAutomatico();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error al cambiar rol de usuario:', error);
      return false;
    }
  }

  public obtenerUsuariosPorTipo(tipo: 'psicologo' | 'paciente'): Usuario[] {
    const usuarios = this.obtenerUsuarios();
    return usuarios.filter(u => u.tipo === tipo);
  }

  // === BACKUP Y RESTAURACIÓN ===
  
  public crearBackupAutomatico(): void {
    try {
      const backup = {
        fecha: new Date().toISOString(),
        pacientes: this.obtenerPacientes(),
        citas: this.obtenerCitas(),
        sesiones: this.obtenerSesiones(),
        usuarios: this.obtenerUsuarios(),
      };
      localStorage.setItem(this.PREFIJO_BACKUP, JSON.stringify(backup));
    } catch (error) {
      console.error('Error al crear backup automático:', error);
    }
  }

  public exportarDatos(): string {
    const datos = {
      version: '1.0',
      fecha_exportacion: new Date().toISOString(),
      pacientes: this.obtenerPacientes(),
      citas: this.obtenerCitas(),
      sesiones: this.obtenerSesiones(),
      usuarios: this.obtenerUsuarios(),
    };
    return JSON.stringify(datos, null, 2);
  }

  public importarDatos(datosJson: string): boolean {
    try {
      const datos = JSON.parse(datosJson);
      
      if (datos.pacientes) {
        localStorage.setItem(this.PREFIJO_PACIENTES, JSON.stringify(datos.pacientes));
      }
      if (datos.citas) {
        localStorage.setItem(this.PREFIJO_CITAS, JSON.stringify(datos.citas));
      }
      if (datos.sesiones) {
        localStorage.setItem(this.PREFIJO_SESIONES, JSON.stringify(datos.sesiones));
      }
      if (datos.usuarios) {
        localStorage.setItem(this.PREFIJO_USUARIOS, JSON.stringify(datos.usuarios));
      }
      
      this.crearBackupAutomatico();
      return true;
    } catch (error) {
      console.error('Error al importar datos:', error);
      return false;
    }
  }

  public restaurarBackup(): boolean {
    try {
      const backup = localStorage.getItem(this.PREFIJO_BACKUP);
      if (!backup) {
        return false;
      }
      
      const datos = JSON.parse(backup);
      localStorage.setItem(this.PREFIJO_PACIENTES, JSON.stringify(datos.pacientes || []));
      localStorage.setItem(this.PREFIJO_CITAS, JSON.stringify(datos.citas || []));
      localStorage.setItem(this.PREFIJO_SESIONES, JSON.stringify(datos.sesiones || []));
      localStorage.setItem(this.PREFIJO_USUARIOS, JSON.stringify(datos.usuarios || []));
      
      return true;
    } catch (error) {
      console.error('Error al restaurar backup:', error);
      return false;
    }
  }

  // === LIMPIEZA Y MANTENIMIENTO ===
  
  public limpiarDatos(): boolean {
    try {
      localStorage.removeItem(this.PREFIJO_PACIENTES);
      localStorage.removeItem(this.PREFIJO_CITAS);
      localStorage.removeItem(this.PREFIJO_SESIONES);
      localStorage.removeItem(this.PREFIJO_USUARIOS);
      return true;
    } catch (error) {
      console.error('Error al limpiar datos:', error);
      return false;
    }
  }

  // === ESTADÍSTICAS ===
  
  public obtenerEstadisticas() {
    return {
      totalPacientes: this.obtenerPacientes().length,
      totalCitas: this.obtenerCitas().length,
      totalSesiones: this.obtenerSesiones().length,
      totalUsuarios: this.obtenerUsuarios().length,
      espacioUtilizado: this.calcularEspacioUtilizado(),
    };
  }

  private calcularEspacioUtilizado(): string {
    let total = 0;
    for (let key in localStorage) {
      if (key.startsWith('psicoagenda_')) {
        total += localStorage[key].length;
      }
    }
    return `${(total / 1024).toFixed(2)} KB`;
  }
}

// Exportar instancia única
export const db = DatabaseManager.getInstance();

/**
 * NOTAS DE MIGRACIÓN A PRODUCCIÓN:
 * 
 * 1. Reemplazar localStorage con Supabase o PostgreSQL
 * 2. Implementar autenticación real con tokens JWT
 * 3. Agregar encriptación para datos sensibles
 * 4. Implementar auditoria de cambios (logs)
 * 5. Configurar backups automáticos en la nube
 * 6. Implementar rate limiting para prevenir abuso
 * 7. Agregar validación de permisos en cada operación
 * 8. Cumplir con normativas HIPAA/GDPR para datos médicos
 * 9. Implementar soft deletes en lugar de eliminación física
 * 10. Agregar índices para mejorar el rendimiento de búsquedas
 */