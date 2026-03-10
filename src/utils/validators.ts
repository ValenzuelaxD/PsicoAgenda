/**
 * RF_US_016: Validación de Datos
 * Sistema de validación centralizado para garantizar la integridad de los datos
 * en toda la aplicación PsicoAgenda
 */

// Validaciones para formularios de pacientes
export const validarNombre = (nombre: string): { valido: boolean; error?: string } => {
  if (!nombre || nombre.trim().length === 0) {
    return { valido: false, error: 'El nombre es obligatorio' };
  }
  if (nombre.trim().length < 2) {
    return { valido: false, error: 'El nombre debe tener al menos 2 caracteres' };
  }
  if (nombre.length > 100) {
    return { valido: false, error: 'El nombre no puede exceder 100 caracteres' };
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
    return { valido: false, error: 'El nombre solo puede contener letras y espacios' };
  }
  return { valido: true };
};

export const validarEmail = (email: string): { valido: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { valido: false, error: 'El correo electrónico es obligatorio' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valido: false, error: 'El formato del correo electrónico no es válido' };
  }
  if (email.length > 255) {
    return { valido: false, error: 'El correo electrónico es demasiado largo' };
  }
  return { valido: true };
};

export const validarTelefono = (telefono: string): { valido: boolean; error?: string } => {
  if (!telefono || telefono.trim().length === 0) {
    return { valido: false, error: 'El teléfono es obligatorio' };
  }
  // Acepta formato: 10 dígitos, con o sin espacios, guiones o paréntesis
  const telefonoLimpio = telefono.replace(/[\s\-()]/g, '');
  if (!/^\d{10}$/.test(telefonoLimpio)) {
    return { valido: false, error: 'El teléfono debe tener 10 dígitos' };
  }
  return { valido: true };
};

export const validarEdad = (edad: number): { valido: boolean; error?: string } => {
  if (!edad) {
    return { valido: false, error: 'La edad es obligatoria' };
  }
  if (edad < 0 || edad > 150) {
    return { valido: false, error: 'La edad debe estar entre 0 y 150 años' };
  }
  return { valido: true };
};

export const validarFecha = (fecha: string): { valido: boolean; error?: string } => {
  if (!fecha) {
    return { valido: false, error: 'La fecha es obligatoria' };
  }
  const fechaObj = new Date(fecha);
  if (isNaN(fechaObj.getTime())) {
    return { valido: false, error: 'El formato de fecha no es válido' };
  }
  return { valido: true };
};

export const validarFechaFutura = (fecha: string): { valido: boolean; error?: string } => {
  const validacionBasica = validarFecha(fecha);
  if (!validacionBasica.valido) {
    return validacionBasica;
  }
  const fechaObj = new Date(fecha);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  if (fechaObj < hoy) {
    return { valido: false, error: 'La fecha debe ser futura' };
  }
  return { valido: true };
};

// Validaciones para credenciales profesionales
export const validarCedulaProfesional = (cedula: string): { valido: boolean; error?: string } => {
  if (!cedula || cedula.trim().length === 0) {
    return { valido: false, error: 'La cédula profesional es obligatoria' };
  }
  // Formato típico: 7-8 dígitos
  const cedulaLimpia = cedula.replace(/[\s\-]/g, '');
  if (!/^\d{7,8}$/.test(cedulaLimpia)) {
    return { valido: false, error: 'La cédula profesional debe tener 7 u 8 dígitos' };
  }
  return { valido: true };
};

// Validaciones para contraseñas (RF_US_022: Restauración de Contraseñas)
export const validarContrasena = (contrasena: string): { valido: boolean; error?: string } => {
  if (!contrasena || contrasena.length === 0) {
    return { valido: false, error: 'La contraseña es obligatoria' };
  }
  if (contrasena.length < 8) {
    return { valido: false, error: 'La contraseña debe tener al menos 8 caracteres' };
  }
  if (contrasena.length > 128) {
    return { valido: false, error: 'La contraseña es demasiado larga' };
  }
  if (!/[A-Z]/.test(contrasena)) {
    return { valido: false, error: 'La contraseña debe contener al menos una letra mayúscula' };
  }
  if (!/[a-z]/.test(contrasena)) {
    return { valido: false, error: 'La contraseña debe contener al menos una letra minúscula' };
  }
  if (!/[0-9]/.test(contrasena)) {
    return { valido: false, error: 'La contraseña debe contener al menos un número' };
  }
  return { valido: true };
};

export const validarConfirmacionContrasena = (
  contrasena: string,
  confirmacion: string
): { valido: boolean; error?: string } => {
  if (contrasena !== confirmacion) {
    return { valido: false, error: 'Las contraseñas no coinciden' };
  }
  return { valido: true };
};

// Validaciones para notas clínicas
export const validarNotaClinica = (nota: string): { valido: boolean; error?: string } => {
  if (!nota || nota.trim().length === 0) {
    return { valido: false, error: 'La nota clínica es obligatoria' };
  }
  if (nota.length < 10) {
    return { valido: false, error: 'La nota debe tener al menos 10 caracteres' };
  }
  if (nota.length > 5000) {
    return { valido: false, error: 'La nota no puede exceder 5000 caracteres' };
  }
  return { valido: true };
};

// Validación de sesión (RF_US_018: Control de Sesiones)
export const validarTokenSesion = (token: string): boolean => {
  // En un sistema real, validaría el token JWT
  return token && token.length > 0;
};

export const validarTiempoSesion = (ultimaActividad: Date): boolean => {
  const TIEMPO_EXPIRACION = 30 * 60 * 1000; // 30 minutos
  const ahora = new Date();
  const diferencia = ahora.getTime() - ultimaActividad.getTime();
  return diferencia < TIEMPO_EXPIRACION;
};

// Validación de roles (RF_US_017: Control de Roles y Permisos)
export const validarPermisoPsicologo = (userType: string): boolean => {
  return userType === 'psicologo';
};

export const validarPermisoPaciente = (userType: string): boolean => {
  return userType === 'paciente';
};

// Sanitización de datos
export const sanitizarTexto = (texto: string): string => {
  // Elimina caracteres peligrosos para prevenir XSS
  return texto
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .trim();
};

export const sanitizarHTML = (html: string): string => {
  // En producción, usar una librería como DOMPurify
  return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

// Validación de citas (RF_US_019: Gestión de Citas)
export const validarHoraCita = (hora: string): { valido: boolean; error?: string } => {
  if (!hora) {
    return { valido: false, error: 'La hora es obligatoria' };
  }
  const horaRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!horaRegex.test(hora)) {
    return { valido: false, error: 'El formato de hora no es válido (HH:MM)' };
  }
  return { valido: true };
};

export const validarDuracionCita = (duracion: number): { valido: boolean; error?: string } => {
  if (!duracion || duracion <= 0) {
    return { valido: false, error: 'La duración debe ser mayor a 0' };
  }
  if (duracion < 15) {
    return { valido: false, error: 'La duración mínima es de 15 minutos' };
  }
  if (duracion > 240) {
    return { valido: false, error: 'La duración máxima es de 4 horas' };
  }
  return { valido: true };
};

// Validación de datos de sesión terapéutica
export const validarDatosSesion = (sesion: {
  fecha: string;
  duracion: number;
  notas: string;
  pacienteId: string;
}): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];

  const validacionFecha = validarFecha(sesion.fecha);
  if (!validacionFecha.valido) {
    errores.push(validacionFecha.error!);
  }

  const validacionDuracion = validarDuracionCita(sesion.duracion);
  if (!validacionDuracion.valido) {
    errores.push(validacionDuracion.error!);
  }

  const validacionNotas = validarNotaClinica(sesion.notas);
  if (!validacionNotas.valido) {
    errores.push(validacionNotas.error!);
  }

  if (!sesion.pacienteId || sesion.pacienteId.trim().length === 0) {
    errores.push('El ID del paciente es obligatorio');
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};

// Validación completa de formulario de registro
export const validarRegistroCompleto = (datos: {
  nombre: string;
  email: string;
  telefono?: string;
  edad?: number;
  password: string;
  userType: string;
  cedulaProfesional?: string;
}): { valido: boolean; errores: string[] } => {
  const errores: string[] = [];

  const validacionNombre = validarNombre(datos.nombre);
  if (!validacionNombre.valido) {
    errores.push(validacionNombre.error!);
  }

  const validacionEmail = validarEmail(datos.email);
  if (!validacionEmail.valido) {
    errores.push(validacionEmail.error!);
  }

  if (datos.telefono) {
    const validacionTelefono = validarTelefono(datos.telefono);
    if (!validacionTelefono.valido) {
      errores.push(validacionTelefono.error!);
    }
  }

  if (datos.edad !== undefined) {
    const validacionEdad = validarEdad(datos.edad);
    if (!validacionEdad.valido) {
      errores.push(validacionEdad.error!);
    }
  }

  const validacionContrasena = validarContrasena(datos.password);
  if (!validacionContrasena.valido) {
    errores.push(validacionContrasena.error!);
  }

  if (datos.userType === 'psicologo' && datos.cedulaProfesional) {
    const validacionCedula = validarCedulaProfesional(datos.cedulaProfesional);
    if (!validacionCedula.valido) {
      errores.push(validacionCedula.error!);
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  };
};
