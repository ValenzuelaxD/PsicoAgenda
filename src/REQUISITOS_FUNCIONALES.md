# Requisitos Funcionales del Sistema PsicoAgenda

## Actor: Sistema PsicoAgenda (RF_US_016 a RF_US_022)

Este documento detalla la implementación de los requisitos funcionales del sistema PsicoAgenda correspondientes al actor "Sistema" como componente indirecto que proporciona servicios esenciales a todos los usuarios.

---

## ✅ RF_US_016: Validación de Datos

**Descripción:** Sistema robusto de validación que garantiza la integridad de todos los datos ingresados en la aplicación.

**Estado:** ✅ Implementado

**Ubicación:** `/utils/validators.ts`

**Funcionalidades:**
- ✅ Validación de nombres (2-100 caracteres, solo letras)
- ✅ Validación de emails (formato RFC 5322)
- ✅ Validación de teléfonos (10 dígitos)
- ✅ Validación de edades (0-150 años)
- ✅ Validación de fechas y fechas futuras
- ✅ Validación de cédulas profesionales (7-8 dígitos)
- ✅ Validación de contraseñas seguras (mínimo 8 caracteres, mayúsculas, minúsculas, números)
- ✅ Validación de notas clínicas (10-5000 caracteres)
- ✅ Validación de horarios de citas (formato HH:MM)
- ✅ Validación de duración de citas (15 minutos - 4 horas)
- ✅ Sanitización de datos para prevenir XSS
- ✅ Validación completa de formularios de registro

**Implementación:**
```typescript
import { validarEmail, validarNombre, validarTelefono } from '../utils/validators';

// Ejemplo de uso en componentes
const validacion = validarEmail(email);
if (!validacion.valido) {
  toast.error('Error de validación', { description: validacion.error });
  return;
}
```

**Componentes que usan validación:**
- `/components/Autenticar.tsx` - Validación de email y cédula profesional
- `/components/RegistroPaciente.tsx` - Validación de datos de pacientes

---

## ✅ RF_US_017: Control de Roles y Permisos

**Descripción:** Gestión diferenciada de acceso según el tipo de usuario (psicólogo o paciente).

**Estado:** ✅ Implementado

**Ubicación:** 
- `/components/Autenticar.tsx` - Autenticación por rol
- `/components/Sidebar.tsx` - Menús diferenciados
- `/components/Dashboard.tsx` - Control de vistas
- `/utils/validators.ts` - Funciones de validación de permisos

**Funcionalidades:**

### Para Psicólogos:
- ✅ Registro con cédula profesional obligatoria
- ✅ Acceso a "Registrar Paciente"
- ✅ Acceso a "Buscar Paciente"
- ✅ Acceso a "Programar Cita"
- ✅ Acceso a "Gestionar Citas"
- ✅ Acceso a "Bitácora Clínica"
- ✅ Acceso a "Reportes"
- ✅ Panel de administración completo

### Para Pacientes:
- ✅ Registro simple sin cédula
- ✅ Acceso a "Solicitar Cita"
- ✅ Acceso a "Mis Citas"
- ✅ Acceso a "Historial Clínico"
- ✅ Panel de paciente simplificado

**Validación de permisos:**
```typescript
import { validarPermisoPsicologo } from '../utils/validators';

if (validarPermisoPsicologo(userType)) {
  // Permitir acceso a funcionalidad de psicólogo
}
```

---

## ✅ RF_US_018: Control de Sesiones

**Descripción:** Manejo seguro de sesiones de usuario con timeouts y validaciones.

**Estado:** ✅ Implementado

**Ubicación:** 
- `/App.tsx` - Gestión de estados de autenticación
- `/components/Autenticar.tsx` - Login/Logout
- `/components/LoadingSplash.tsx` - Splash screens
- `/utils/validators.ts` - Validación de sesiones

**Funcionalidades:**
- ✅ Login con animaciones de transición
- ✅ Splash screen durante autenticación (2 segundos)
- ✅ Validación de tiempo de sesión (30 minutos de inactividad)
- ✅ Gestión de estado de autenticación global
- ✅ Logout con confirmación visual
- ✅ Splash screen durante cierre de sesión
- ✅ Validación de tokens de sesión (preparado para JWT)

**Control de sesión:**
```typescript
// Validación de tiempo de sesión
import { validarTiempoSesion } from '../utils/validators';

const sesionValida = validarTiempoSesion(ultimaActividad);
if (!sesionValida) {
  // Cerrar sesión automáticamente
  handleLogout();
}
```

---

## ✅ RF_US_019: Gestión de Citas

**Descripción:** Sistema completo para programar, confirmar y gestionar citas terapéuticas.

**Estado:** ✅ Implementado

**Ubicación:**
- `/components/MisCitas.tsx` - Vista de citas
- `/components/ProgramarCita.tsx` - Programación (psicólogos)
- `/components/AgendarCita.tsx` - Solicitud (pacientes)
- `/components/ReportesCitas.tsx` - Reportes estadísticos
- `/utils/database.ts` - Gestión de datos de citas

**Funcionalidades:**
- ✅ Solicitud de citas por pacientes
- ✅ Programación de citas por psicólogos
- ✅ Visualización en formato calendario
- ✅ Estados de citas: pendiente, confirmada, cancelada, completada
- ✅ Filtros por fecha, estado y paciente
- ✅ Gestión de múltiples citas
- ✅ Confirmación y cancelación de citas
- ✅ Notificaciones de recordatorio
- ✅ Reportes y estadísticas de citas
- ✅ Validación de fechas y horarios

**Estados de citas:**
```typescript
type EstadoCita = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';
```

---

## ✅ RF_US_020: Gestión de Notificaciones

**Descripción:** Centro de notificaciones para mantener informados a usuarios sobre eventos importantes.

**Estado:** ✅ Implementado

**Ubicación:**
- `/components/NotificationCenter.tsx` - Centro de notificaciones
- `/components/Dashboard.tsx` - Integración en barra superior
- `/components/Perfil.tsx` - Preferencias de notificaciones

**Funcionalidades:**
- ✅ Centro de notificaciones con panel lateral deslizante
- ✅ Contador de notificaciones sin leer
- ✅ Categorías de notificaciones:
  - 📅 Citas (nuevas solicitudes, confirmaciones)
  - ⏰ Recordatorios (citas próximas)
  - ⚠️ Sistema (actualizaciones, seguridad)
  - ℹ️ Información (recursos, mensajes)
- ✅ Marcar como leídas individualmente
- ✅ Marcar todas como leídas
- ✅ Eliminar notificaciones
- ✅ Notificaciones específicas por tipo de usuario
- ✅ Preferencias de notificaciones (email, WhatsApp)
- ✅ Indicador visual para notificaciones nuevas

**Configuración de preferencias:**
```typescript
// En Perfil de usuario
- Notificaciones por Email
- Notificaciones por WhatsApp
- Recordatorios de citas
```

---

## ✅ RF_US_021: Gestión de Bases de Datos

**Descripción:** Sistema de gestión de datos con operaciones CRUD y backups automáticos.

**Estado:** ✅ Implementado (con localStorage, preparado para Supabase)

**Ubicación:** `/utils/database.ts`

**Funcionalidades:**

### Gestión de Pacientes:
- ✅ Crear paciente
- ✅ Leer pacientes
- ✅ Actualizar paciente
- ✅ Eliminar paciente
- ✅ Buscar pacientes por nombre o email

### Gestión de Citas:
- ✅ Crear cita
- ✅ Leer citas
- ✅ Actualizar estado de cita
- ✅ Filtrar por paciente, psicólogo o fecha

### Gestión de Sesiones Clínicas:
- ✅ Guardar sesión clínica
- ✅ Leer sesiones por paciente
- ✅ Historial completo de sesiones

### Gestión de Usuarios:
- ✅ Crear usuario
- ✅ Autenticar usuario
- ✅ Actualizar perfil

### Backup y Restauración:
- ✅ Backup automático después de cada cambio
- ✅ Exportación de datos en JSON
- ✅ Importación de datos
- ✅ Restauración desde backup

### Estadísticas:
- ✅ Total de pacientes
- ✅ Total de citas
- ✅ Total de sesiones
- ✅ Espacio utilizado

**Uso del sistema de datos:**
```typescript
import { db } from '../utils/database';

// Guardar paciente
db.guardarPaciente(paciente);

// Obtener citas
const citas = db.obtenerCitas();

// Crear backup
db.crearBackupAutomatico();
```

**Preparado para producción:**
- 📝 Documentación para migración a Supabase/PostgreSQL
- 📝 Estructura lista para autenticación JWT
- 📝 Diseñado para encriptación de datos sensibles
- 📝 Cumplimiento con normativas HIPAA/GDPR

---

## ✅ RF_US_022: Restauración de Contraseñas

**Descripción:** Sistema seguro para recuperar y restablecer contraseñas olvidadas.

**Estado:** ✅ Implementado

**Ubicación:**
- `/components/Autenticar.tsx` - Formulario de recuperación
- `/components/Perfil.tsx` - Cambio de contraseña
- `/utils/validators.ts` - Validación de contraseñas

**Funcionalidades:**
- ✅ Formulario de recuperación en página de login
- ✅ Validación de email antes de envío
- ✅ Simulación de envío de correo de recuperación
- ✅ Confirmación visual de envío exitoso
- ✅ Modal con overlay para mejor UX
- ✅ Botón para volver al login
- ✅ Cambio de contraseña desde perfil
- ✅ Validación de contraseña segura:
  - Mínimo 8 caracteres
  - Al menos una mayúscula
  - Al menos una minúscula
  - Al menos un número
  - Máximo 128 caracteres
- ✅ Confirmación de contraseña
- ✅ Modal de confirmación al cambiar contraseña exitosamente

**Validación de contraseñas:**
```typescript
import { validarContrasena, validarConfirmacionContrasena } from '../utils/validators';

const validacion = validarContrasena(password);
if (!validacion.valido) {
  toast.error('Error', { description: validacion.error });
  return;
}

const validacionConfirmacion = validarConfirmacionContrasena(password, confirmPassword);
if (!validacionConfirmacion.valido) {
  toast.error('Error', { description: validacionConfirmacion.error });
  return;
}
```

---

## 📊 Resumen de Implementación

| Requisito | Código | Estado | Ubicación Principal |
|-----------|--------|--------|---------------------|
| Validación de Datos | RF_US_016 | ✅ Completo | `/utils/validators.ts` |
| Control de Roles y Permisos | RF_US_017 | ✅ Completo | `/components/Autenticar.tsx`, `/components/Sidebar.tsx` |
| Control de Sesiones | RF_US_018 | ✅ Completo | `/App.tsx`, `/utils/validators.ts` |
| Gestión de Citas | RF_US_019 | ✅ Completo | `/components/MisCitas.tsx`, `/components/ProgramarCita.tsx` |
| Gestión de Notificaciones | RF_US_020 | ✅ Completo | `/components/NotificationCenter.tsx` |
| Gestión de Bases de Datos | RF_US_021 | ✅ Completo | `/utils/database.ts` |
| Restauración de Contraseñas | RF_US_022 | ✅ Completo | `/components/Autenticar.tsx`, `/components/Perfil.tsx` |

**Total: 7/7 Requisitos Implementados (100%)**

---

## 🔐 Consideraciones de Seguridad

### Datos Sensibles
- ❗ **IMPORTANTE:** PsicoAgenda maneja datos médicos sensibles que requieren protección especial
- ✅ Validación de datos en todos los formularios
- ✅ Sanitización contra ataques XSS
- ✅ Control de roles y permisos
- ✅ Validación de sesiones con timeout
- ⚠️ En producción: implementar encriptación de datos
- ⚠️ En producción: usar HTTPS exclusivamente
- ⚠️ Cumplir con normativas HIPAA/GDPR/LFPDPPP

### Backups
- ✅ Backups automáticos después de cada cambio
- ✅ Exportación manual de datos
- ✅ Restauración desde backup
- ⚠️ En producción: backups en la nube con encriptación

---

## 🚀 Migración a Producción

### Pasos Recomendados:

1. **Base de Datos:**
   - Migrar de localStorage a Supabase o PostgreSQL
   - Implementar esquema relacional completo
   - Configurar índices para búsquedas rápidas

2. **Autenticación:**
   - Implementar JWT para tokens de sesión
   - Usar Supabase Auth o similar
   - Agregar autenticación de dos factores (2FA)

3. **Seguridad:**
   - Encriptar datos sensibles en reposo
   - Implementar rate limiting
   - Agregar logs de auditoría
   - Configurar CORS apropiadamente

4. **Notificaciones:**
   - Integrar servicio de email real (SendGrid, Amazon SES)
   - Implementar notificaciones push
   - Configurar WhatsApp Business API

5. **Cumplimiento Legal:**
   - Implementar política de privacidad
   - Obtener consentimiento informado
   - Cumplir con HIPAA/GDPR/LFPDPPP
   - Auditorías de seguridad regulares

---

## 📚 Documentación Adicional

### Para Desarrolladores:
- Ver comentarios en `/utils/validators.ts` para detalles de cada validación
- Ver comentarios en `/utils/database.ts` para estructura de datos
- Consultar tipos TypeScript para interfaces de datos

### Para Usuarios:
- Acceder a "Requisitos Sistema" desde el menú lateral
- Ver detalles de cada requisito implementado
- Entender las funcionalidades disponibles según el rol

---

## ✨ Características Destacadas

- 🎨 Interfaz moderna con tema oscuro profesional
- 🔔 Centro de notificaciones en tiempo real
- ✅ Validaciones robustas en todos los formularios
- 💾 Sistema de backups automáticos
- 🔐 Control de roles y permisos granular
- 📊 Reportes y estadísticas de citas
- 🩺 Gestión completa de expedientes clínicos
- 📱 Diseño responsive (preparado para móviles)

---

**Última actualización:** 27 de Noviembre, 2025  
**Versión del sistema:** 1.0.0  
**Actor:** Sistema PsicoAgenda  
**Requisitos:** RF_US_016 a RF_US_022
