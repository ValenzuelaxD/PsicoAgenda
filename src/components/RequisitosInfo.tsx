import { motion } from 'motion/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Check, Database, Shield, Clock, Calendar, Bell, Key, CheckCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export function RequisitosInfo() {
  const requisitos = [
    {
      codigo: 'RF_US_016',
      titulo: 'Validación de Datos',
      descripcion: 'Sistema robusto de validación que garantiza la integridad de todos los datos ingresados en la aplicación',
      icono: CheckCircle,
      color: 'text-teal-400',
      implementacion: [
        'Validación de nombres, emails y teléfonos',
        'Validación de cédulas profesionales',
        'Validación de fechas y horarios',
        'Validación de contraseñas seguras',
        'Sanitización de datos para prevenir XSS',
        'Validación de sesiones clínicas completas',
      ],
      ubicacion: '/utils/validators.ts',
    },
    {
      codigo: 'RF_US_017',
      titulo: 'Control de Roles y Permisos',
      descripcion: 'Gestión diferenciada de acceso según el tipo de usuario (psicólogo o paciente)',
      icono: Shield,
      color: 'text-violet-400',
      implementacion: [
        'Autenticación diferenciada por tipo de usuario',
        'Menús y vistas específicas por rol',
        'Psicólogos: acceso a gestión de pacientes, bitácora, programación',
        'Pacientes: acceso a solicitar citas, ver historial',
        'Validación de permisos en componentes',
        'Rutas protegidas según tipo de usuario',
      ],
      ubicacion: '/components/Autenticar.tsx, /components/Sidebar.tsx',
    },
    {
      codigo: 'RF_US_018',
      titulo: 'Control de Sesiones',
      descripcion: 'Manejo seguro de sesiones de usuario con timeouts y validaciones',
      icono: Clock,
      color: 'text-teal-400',
      implementacion: [
        'Login y logout con animaciones de transición',
        'Splash screen durante autenticación',
        'Validación de tiempo de sesión (30 minutos)',
        'Gestión de estado de autenticación',
        'Cierre de sesión automático por inactividad',
        'Mensaje de confirmación al cerrar sesión',
      ],
      ubicacion: '/App.tsx, /components/Autenticar.tsx, /utils/validators.ts',
    },
    {
      codigo: 'RF_US_019',
      titulo: 'Gestión de Citas',
      descripcion: 'Sistema completo para programar, confirmar y gestionar citas terapéuticas',
      icono: Calendar,
      color: 'text-violet-400',
      implementacion: [
        'Solicitud de citas por pacientes',
        'Programación de citas por psicólogos',
        'Visualización de agenda y calendario',
        'Estados de citas: pendiente, confirmada, cancelada, completada',
        'Filtros por fecha, estado y paciente',
        'Gestión de múltiples citas',
        'Reportes de citas',
      ],
      ubicacion: '/components/MisCitas.tsx, /components/ProgramarCita.tsx, /components/AgendarCita.tsx',
    },
    {
      codigo: 'RF_US_020',
      titulo: 'Gestión de Notificaciones',
      descripcion: 'Centro de notificaciones para mantener informados a usuarios sobre eventos importantes',
      icono: Bell,
      color: 'text-teal-400',
      implementacion: [
        'Centro de notificaciones con panel lateral',
        'Contador de notificaciones sin leer',
        'Categorías: citas, recordatorios, sistema, información',
        'Marcar como leídas individualmente o todas',
        'Eliminar notificaciones',
        'Notificaciones específicas por tipo de usuario',
        'Preferencias de notificaciones en perfil',
      ],
      ubicacion: '/components/NotificationCenter.tsx, /components/Perfil.tsx',
    },
    {
      codigo: 'RF_US_021',
      titulo: 'Gestión de Bases de Datos',
      descripcion: 'Sistema de gestión de datos con operaciones CRUD y backups automáticos',
      icono: Database,
      color: 'text-violet-400',
      implementacion: [
        'Gestión de pacientes (crear, leer, actualizar, eliminar)',
        'Gestión de citas con estados',
        'Gestión de sesiones clínicas',
        'Gestión de usuarios',
        'Backups automáticos después de cada cambio',
        'Exportación e importación de datos',
        'Estadísticas de uso y espacio',
        'Preparado para migración a Supabase/PostgreSQL',
      ],
      ubicacion: '/utils/database.ts',
    },
    {
      codigo: 'RF_US_022',
      titulo: 'Restauración de Contraseñas',
      descripcion: 'Sistema seguro para recuperar y restablecer contraseñas olvidadas',
      icono: Key,
      color: 'text-teal-400',
      implementacion: [
        'Formulario de recuperación en página de login',
        'Envío simulado de correo de recuperación',
        'Validación de email antes de envío',
        'Confirmación visual de envío exitoso',
        'Modal con overlay para mejor UX',
        'Botón para volver al login',
        'Validaciones de contraseña segura en perfil',
      ],
      ubicacion: '/components/Autenticar.tsx, /components/Perfil.tsx',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-slate-100 mb-2">Requisitos Funcionales del Sistema</h1>
        <p className="text-slate-300">
          Actor: Sistema PsicoAgenda - Requisitos RF_US_016 a RF_US_022
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-2">
          <Check className="w-5 h-5 stroke-2 text-green-400" />
          <span className="text-green-300">Todos los requisitos implementados</span>
        </div>
      </div>

      {/* Lista de Requisitos */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader className="bg-gradient-to-r from-teal-900/30 to-violet-900/30">
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <Database className="w-6 h-6 stroke-2" />
            Requisitos Funcionales Implementados
          </CardTitle>
          <CardDescription className="text-slate-400">
            Detalles de implementación de cada requisito funcional del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Accordion type="single" collapsible className="space-y-2">
            {requisitos.map((req, index) => {
              const Icono = req.icono;
              return (
                <AccordionItem
                  key={req.codigo}
                  value={req.codigo}
                  className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50"
                >
                  <AccordionTrigger className="px-4 hover:bg-slate-800/50 hover:no-underline">
                    <div className="flex items-center gap-4 w-full">
                      <Icono className={`w-6 h-6 stroke-2 ${req.color}`} />
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-teal-600 text-white">
                            {req.codigo}
                          </Badge>
                          <span className="text-slate-100">{req.titulo}</span>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">
                          {req.descripcion}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4 pt-4">
                      <div>
                        <h4 className="text-teal-400 mb-2">Implementación:</h4>
                        <ul className="space-y-2">
                          {req.implementacion.map((item, i) => (
                            <motion.li
                              key={i}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="flex items-start gap-2 text-slate-300"
                            >
                              <Check className="w-4 h-4 stroke-2 text-teal-400 flex-shrink-0 mt-0.5" />
                              <span>{item}</span>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                        <span className="text-violet-400 text-sm">Ubicación: </span>
                        <code className="text-slate-300 text-sm">{req.ubicacion}</code>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-900/30 mb-3">
                <Check className="w-6 h-6 stroke-2 text-teal-400" />
              </div>
              <h3 className="text-slate-100 mb-1">7 Requisitos</h3>
              <p className="text-slate-400 text-sm">Implementados</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-violet-900/30 mb-3">
                <Shield className="w-6 h-6 stroke-2 text-violet-400" />
              </div>
              <h3 className="text-slate-100 mb-1">100% Seguro</h3>
              <p className="text-slate-400 text-sm">Con validaciones</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-900/30 mb-3">
                <Database className="w-6 h-6 stroke-2 text-teal-400" />
              </div>
              <h3 className="text-slate-100 mb-1">Datos Protegidos</h3>
              <p className="text-slate-400 text-sm">Con backups automáticos</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
