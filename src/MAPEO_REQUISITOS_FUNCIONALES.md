# Mapeo de Requisitos Funcionales - PsicoAgenda

Este documento mapea los requisitos funcionales especificados con su implementación exacta en el sistema PsicoAgenda.

---

## ✅ REQUISITOS FUNCIONALES - PACIENTE (10 Requisitos)

| Código | Requisito Funcional | Componente | Descripción de Implementación |
|--------|---------------------|------------|-------------------------------|
| **RF_US_001** | Autenticar | `Autenticar.tsx` | Sistema de login con usuario y contraseña |
| **RF_US_002** | Gestionar Perfil Usuario | `Perfil.tsx` | Edición completa de información personal, contacto y preferencias |
| **RF_US_003** | Solicitar Cita | `AgendarCita.tsx` | Formulario para solicitar nuevas citas con psicólogo, fecha y hora |
| **RF_US_007** | Visualizar Información Personal | `Perfil.tsx` | Visualización de todos los datos personales del paciente |
| **RF_US_010** | Confirmar Cita | `MisCitas.tsx` | Botón "Confirmar Cita" para citas en estado pendiente |
| **RF_US_011** | Cancelar Cita | `MisCitas.tsx` | Botón de cancelación con modal de confirmación |
| **RF_US_012** | Consultar Agenda Digital | `MisCitas.tsx` | Tab "Próximas Citas" mostrando todas las citas programadas |
| **RF_US_013** | Visualizar Próximas Citas | `Inicio.tsx` + `MisCitas.tsx` | Dashboard con próximas citas y listado completo |
| **RF_US_014** | Solicitar Reagendar Cita | `MisCitas.tsx` | Botón "Modificar" que redirige a AgendarCita |
| **RF_US_023** | Ver Historial Clínico | `Historial.tsx` | Historial completo de sesiones con notas y progreso |

### Menú de Navegación - Paciente

```
Sidebar (Panel Paciente) - 5 opciones:
├── 📊 Inicio                    → RF_US_013 (Visualizar Próximas Citas)
├── 📅 Solicitar Cita            → RF_US_003
├── 📋 Mis Citas                 → RF_US_010, 011, 012, 013, 014
├── 📁 Historial Clínico         → RF_US_023
└── 👤 Mi Perfil                 → RF_US_002, 007
```

---

## ✅ REQUISITOS FUNCIONALES - PSICÓLOGO (11 Requisitos)

| Código | Requisito Funcional | Componente | Descripción de Implementación |
|--------|---------------------|------------|-------------------------------|
| **RF_US_001** | Autenticar | `Autenticar.tsx` | Sistema de login con cédula profesional y contraseña |
| **RF_US_002** | Gestionar Perfil Usuario | `Perfil.tsx` | Edición de perfil profesional con cédula y especialidad |
| **RF_US_004** | Registrar Paciente | `RegistroPaciente.tsx` | Formulario completo para dar de alta nuevos pacientes |
| **RF_US_005** | Editar Bitácora Paciente | `BitacoraPaciente.tsx` | Edición de entradas de bitácora con notas clínicas |
| **RF_US_006** | Buscar Paciente | `BuscarPaciente.tsx` | Búsqueda por nombre, ID, con filtros avanzados |
| **RF_US_008** | Programar Cita | `ProgramarCita.tsx` | Formulario completo de programación de citas |
| **RF_US_009** | Modificar Cita | `MisCitas.tsx` | Botón "Modificar" en gestión de citas |
| **RF_US_011** | Cancelar Cita | `MisCitas.tsx` | Botón de cancelación con modal de confirmación |
| **RF_US_012** | Consultar Agenda Digital | `MisCitas.tsx` | Tab "Consultar Agenda" con calendario y filtros |
| **RF_US_015** | Generar Reporte Cita | `ReportesCitas.tsx` | Generación de reportes con filtros y exportación PDF |
| **RF_US_024** | Consultar Bitácora Paciente | `BitacoraPaciente.tsx` | Visualización completa de bitácora por paciente |

### Menú de Navegación - Psicólogo

```
Sidebar (Panel Psicólogo) - 8 opciones:
├── 📊 Inicio                           → Dashboard con agenda del día
├── ➕ Registrar Paciente               → RF_US_004
├── 🔍 Buscar Paciente                  → RF_US_006
├── 📅 Programar Cita                   → RF_US_008
├── 📋 Gestionar Citas                  → RF_US_009, 011, 012
├── 📖 Bitácora de Pacientes           → RF_US_005, 024
├── 📊 Reportes de Citas               → RF_US_015
└── 👤 Mi Perfil                        → RF_US_002
```

---

## 🔄 Requisitos Funcionales Compartidos

Ambos tipos de usuario comparten:

| Código | Requisito | Implementación |
|--------|-----------|----------------|
| **RF_US_001** | Autenticación | Login diferenciado por tipo de usuario |
| **RF_US_002** | Gestionar Perfil Usuario | Perfiles personalizados según rol |
| **RF_US_011** | Cancelar Cita | Ambos pueden cancelar citas |
| **RF_US_012** | Consultar Agenda Digital | Vistas adaptadas a cada rol |

---

## 📋 Detalles de Implementación

### RF_US_012 - Consultar Agenda Digital

**Paciente:**
- Vista de "Mis Citas" con listado de citas próximas
- Filtro por estado (Confirmada, Pendiente)
- Ordenamiento cronológico

**Psicólogo:**
- Vista de calendario completo
- Filtros por paciente y estado
- Búsqueda de citas
- Vista de agenda mensual

### RF_US_009 y RF_US_014 - Modificar/Reagendar Cita

**Implementación común:**
- Función `handleModificarCita()` en `MisCitas.tsx`
- Redirección según tipo de usuario:
  - Psicólogo → `ProgramarCita.tsx` (RF_US_009)
  - Paciente → `AgendarCita.tsx` (RF_US_014)

### RF_US_005 y RF_US_024 - Bitácora de Paciente

**Implementación en `BitacoraPaciente.tsx`:**
- **RF_US_005**: Modo edición con formulario de actualización
- **RF_US_024**: Modo consulta/visualización de entradas
- Selector de paciente
- Historial completo de entradas por paciente

### RF_US_002 y RF_US_007 - Perfil

**Paciente:**
- **RF_US_002**: Editar información personal
- **RF_US_007**: Visualizar información personal
- Mismo componente `Perfil.tsx` con modos vista/edición

---

## 📊 Resumen de Cumplimiento

| Tipo de Usuario | Requisitos | Estado | Porcentaje |
|-----------------|-----------|--------|------------|
| **Paciente** | 10 | ✅ 10/10 | 100% |
| **Psicólogo** | 11 | ✅ 11/11 | 100% |
| **TOTAL** | **21** | **✅ 21/21** | **100%** |

---

## 🗂️ Estructura de Archivos y Requisitos

```
/components/
├── Autenticar.tsx              → RF_US_001 (Paciente y Psicólogo)
├── Perfil.tsx                  → RF_US_002 (Ambos), RF_US_007 (Paciente)
├── AgendarCita.tsx             → RF_US_003, RF_US_014
├── MisCitas.tsx                → RF_US_010, 011, 012, 013, 014 (Paciente)
│                                  RF_US_009, 011, 012 (Psicólogo)
├── Historial.tsx               → RF_US_023
├── RegistroPaciente.tsx        → RF_US_004
├── BitacoraPaciente.tsx        → RF_US_005, RF_US_024
├── BuscarPaciente.tsx          → RF_US_006
├── ProgramarCita.tsx           → RF_US_008
├── ReportesCitas.tsx           → RF_US_015
├── Sidebar.tsx                 → Navegación diferenciada por rol
├── Dashboard.tsx               → Contenedor principal de vistas
└── Inicio.tsx                  → Dashboard inicial (RF_US_013 para paciente)
```

---

## ✅ Validación Final

### Paciente - 10 Requisitos Funcionales Únicos:
1. ✅ RF_US_001 - Autenticar
2. ✅ RF_US_002 - Gestionar Perfil Usuario
3. ✅ RF_US_003 - Solicitar Cita
4. ✅ RF_US_007 - Visualizar Información Personal
5. ✅ RF_US_010 - Confirmar Cita
6. ✅ RF_US_011 - Cancelar Cita
7. ✅ RF_US_012 - Consultar Agenda Digital
8. ✅ RF_US_013 - Visualizar Próximas Citas
9. ✅ RF_US_014 - Solicitar Reagendar Cita
10. ✅ RF_US_023 - Ver Historial Clínico

### Psicólogo - 11 Requisitos Funcionales Únicos:
1. ✅ RF_US_001 - Autenticar
2. ✅ RF_US_002 - Gestionar Perfil Usuario
3. ✅ RF_US_004 - Registrar Paciente
4. ✅ RF_US_005 - Editar Bitácora Paciente
5. ✅ RF_US_006 - Buscar Paciente
6. ✅ RF_US_008 - Programar Cita
7. ✅ RF_US_009 - Modificar Cita
8. ✅ RF_US_011 - Cancelar Cita
9. ✅ RF_US_012 - Consultar Agenda Digital
10. ✅ RF_US_015 - Generar Reporte Cita
11. ✅ RF_US_024 - Consultar Bitácora Paciente

---

**Última actualización**: 10 de marzo de 2026  
**Estado**: ✅ Sistema 100% alineado con requisitos funcionales  
**Validación**: Confirmado - Todos los requisitos implementados correctamente