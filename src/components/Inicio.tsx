import { Calendar, Clock, FileText, TrendingUp, User, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ViewType } from './Dashboard';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PacienteDashboardData, PsicologaDashboardData } from '../utils/types';
import { apiFetch, API_ENDPOINTS } from '../utils/api';

interface InicioProps {
  userName: string;
  userType: 'psicologo' | 'paciente' | 'admin';
  onNavigate: (view: ViewType) => void;
}

export function Inicio({ userName, userType, onNavigate }: InicioProps) {
  const [pacienteData, setPacienteData] = useState<PacienteDashboardData | null>(null);
  const [psicologoData, setPsicologoData] = useState<PsicologoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmandoCitaId, setConfirmandoCitaId] = useState<number | null>(null);

  const extraerFechaHoraLocal = (fechaHora?: string) => {
    const valor = String(fechaHora || '').trim();
    const matchLocal = valor.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2})/);

    if (matchLocal) {
      return { fecha: matchLocal[1], hora: matchLocal[2] };
    }

    const date = new Date(valor);
    if (!Number.isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = `${date.getMonth() + 1}`.padStart(2, '0');
      const day = `${date.getDate()}`.padStart(2, '0');
      const hour = `${date.getHours()}`.padStart(2, '0');
      const minute = `${date.getMinutes()}`.padStart(2, '0');
      return { fecha: `${year}-${month}-${day}`, hora: `${hour}:${minute}` };
    }

    return { fecha: '', hora: '' };
  };

  const formatearHora12 = (hora: string) => {
    const [hourRaw, minuteRaw] = hora.split(':').map(Number);
    if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw)) {
      return hora;
    }

    const sufijo = hourRaw >= 12 ? 'p.m.' : 'a.m.';
    return `${String(hourRaw).padStart(2, '0')}:${String(minuteRaw).padStart(2, '0')} ${sufijo}`;
  };

  const formatearFechaVisual = (fechaHora?: string) => {
    const { fecha } = extraerFechaHoraLocal(fechaHora);
    if (!fecha) {
      return 'Sin fecha';
    }
    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatearFechaHoraVisual = (fechaHora?: string) => {
    const { fecha, hora } = extraerFechaHoraLocal(fechaHora);
    if (!fecha || !hora) {
      return 'Sin fecha';
    }
    return `${formatearFechaVisual(fechaHora)}, ${formatearHora12(hora)}`;
  };

  const formatearResumenProximaCita = (fechaHora?: string) => {
    const { fecha, hora } = extraerFechaHoraLocal(fechaHora);
    if (!fecha || !hora) {
      return 'Sin fecha';
    }

    const dateLocal = new Date(`${fecha}T${hora}:00`);
    const encabezado = dateLocal.toLocaleString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    return `${encabezado}, ${hora}`;
  };

  const obtenerFechaLocalISO = () => {
    const ahora = new Date();
    const yyyy = ahora.getFullYear();
    const mm = `${ahora.getMonth() + 1}`.padStart(2, '0');
    const dd = `${ahora.getDate()}`.padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  useEffect(() => {
    if (userType === 'admin') {
      setLoading(false);
      setError(null);
      return;
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No autenticado. Por favor inicia sesión.");
        }

    const endpoint = userType === 'paciente'
      ? API_ENDPOINTS.DASHBOARD_PACIENTE
      : `${API_ENDPOINTS.DASHBOARD_PSICOLOGO}?fecha=${obtenerFechaLocalISO()}`;
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar los datos del dashboard');
        }

        const data = await response.json();
        if (userType === 'paciente') {
          setPacienteData(data);
        } else {
          setPsicologoData(data);
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userType]);

  if (loading) {
    return <div>Cargando...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (userType === 'admin') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-slate-100 mb-2">Bienvenido/a, {userName}</h1>
          <p className="text-slate-300">
            Gestiona las solicitudes de alta de psicologas y su aprobación.
          </p>
        </div>

        <Card className="cursor-pointer hover:shadow-xl transition-all border-teal-500/30 bg-slate-800/50 backdrop-blur-sm" onClick={() => onNavigate('admin-solicitudes')}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <FileText className="w-6 h-6 text-white stroke-2" />
              </div>
              <div>
                <h3 className="text-white mb-1">Revisar Solicitudes</h3>
                <p className="text-slate-300">
                  Accede a la bandeja para aprobar o rechazar registros de psicologas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Contenido para Paciente
  if (userType === 'paciente' && pacienteData) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-slate-100 mb-2">Bienvenido/a, {userName}</h1>
          <p className="text-slate-300">
            Gestiona tus citas y consulta tu progreso terapéutico
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-teal-500/30 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Próxima Cita</p>
                  <p className="text-slate-100">{pacienteData.proximaCita ? formatearFechaHoraVisual(pacienteData.proximaCita) : 'No hay citas'}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-500/30 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Sesiones Totales</p>
                  <p className="text-slate-100">{pacienteData.sesionesTotales} Sesiones</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-600 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Última Sesión</p>
                  <p className="text-slate-100">{pacienteData.ultimaSesion ? formatearFechaVisual(pacienteData.ultimaSesion) : 'No hay sesiones'}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-slate-200 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximas Citas */}
        <Card className="border-teal-500/30 shadow-lg bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-900/50 to-violet-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-slate-100">Próximas Citas</CardTitle>
              <Button onClick={() => onNavigate('agendar')} size="sm" className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
                Solicitar Nueva Cita
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {pacienteData.proximasCitas && pacienteData.proximasCitas.length > 0 ? (
                pacienteData.proximasCitas.map((cita) => (
                  <Card key={cita.citaid} className="bg-slate-700/30 border-slate-600">
                    <CardContent className="pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {cita.fotoperfil ? (
                            <img
                              src={cita.fotoperfil}
                              alt={`${cita.nombre} ${cita.apellidopaterno}`}
                              className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-5 h-5 text-white" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-slate-100 font-medium">
                              {cita.nombre} {cita.apellidopaterno}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{formatearResumenProximaCita(cita.fechahora)}</span>
                              <span>•</span>
                              <span>{cita.modalidad}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onNavigate('citas')}
                          className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10 w-full sm:w-auto"
                        >
                          Ver Detalles
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-4">No tienes citas próximas programadas</p>
                  <Button 
                    onClick={() => onNavigate('agendar')} 
                    size="sm" 
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    Agendar Nueva Cita
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recursos Rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-xl transition-all border-violet-500/30 bg-slate-800/50 backdrop-blur-sm" onClick={() => onNavigate('historial')}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FileText className="w-6 h-6 text-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-white mb-1">Historial Clínico</h3>
                  <p className="text-slate-300">
                    Consulta tus sesiones pasadas y notas del terapeuta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-xl transition-all border-teal-500/30 bg-slate-800/50 backdrop-blur-sm" onClick={() => onNavigate('perfil')}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FileText className="w-6 h-6 text-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-white mb-1">Mi Perfil</h3>
                  <p className="text-slate-300">
                    Actualiza tu información personal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Contenido para Psicólogo
  if (userType === 'psicologo' && psicologoData) {
    const pendientesPorConfirmar = psicologoData.pendientesPorConfirmar || [];

    const handleConfirmarDesdeInicio = async (citaId: number) => {
      try {
        setConfirmandoCitaId(citaId);
        const response = await apiFetch(`${API_ENDPOINTS.CITAS}/${citaId}/confirm`, {
          method: 'PUT',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No fue posible confirmar la cita.');
        }

        setPsicologoData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            citasPendientes: Math.max(0, prev.citasPendientes - 1),
            citasHoy: prev.citasHoy.map((cita: any) =>
              cita.citaid === citaId ? { ...cita, estado: data.estado || 'Confirmada' } : cita
            ),
            pendientesPorConfirmar: (prev.pendientesPorConfirmar || []).filter((cita) => cita.citaid !== citaId),
          };
        });

        toast.success('Cita confirmada', {
          description: 'La cita se confirmó correctamente desde Inicio.',
        });
      } catch (err: any) {
        toast.error(err.message || 'Error al confirmar la cita.');
      } finally {
        setConfirmandoCitaId(null);
      }
    };

    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-slate-100 mb-2">Bienvenido/a, Dr. {userName}</h1>
          <p className="text-slate-300">
            Panel de control para gestión de pacientes y citas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-teal-500/30 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Citas Hoy</p>
                  <p className="text-slate-100">{psicologoData.citasHoy.length} Sesiones</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Calendar className="w-6 h-6 text-white stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-violet-500/30 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Pacientes Activos</p>
                  <p className="text-slate-100">{psicologoData.pacientesActivos} Pacientes</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-600 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Esta Semana</p>
                  <p className="text-slate-100">{psicologoData.citasSemana} Citas</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-slate-200 stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/30 shadow-lg hover:shadow-xl transition-shadow bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 mb-1">Pendientes</p>
                  <p className="text-slate-100">{psicologoData.citasPendientes} Por Confirmar</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                  <FileText className="w-6 h-6 text-white stroke-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pendientes por Confirmar */}
        <Card className="border-amber-500/30 shadow-lg bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-amber-900/40 to-slate-900/40">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-slate-100">Por Confirmar</CardTitle>
              <Button onClick={() => onNavigate('citas')} size="sm" variant="outline" className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20 w-full sm:w-auto">
                Ver todas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {pendientesPorConfirmar.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-8 text-center">
                  <p className="text-slate-300">No tienes citas pendientes por confirmar</p>
                </div>
              ) : (
                pendientesPorConfirmar.map((cita) => {
                  const { fecha, hora } = extraerFechaHoraLocal(cita.fechahora);
                  const fechaDate = new Date(`${fecha}T${hora}:00`);
                  const diaSemana = fechaDate.toLocaleDateString('es-ES', { weekday: 'short' });

                  return (
                    <Card key={cita.citaid} className="bg-slate-700/30 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {cita.paciente_fotoperfil ? (
                              <img
                                src={cita.paciente_fotoperfil}
                                alt={`${cita.paciente_nombre}`}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-slate-100 font-medium">{cita.paciente_nombre} {cita.paciente_apellido}</p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{diaSemana}, {formatearHora12(hora)}</span>
                                <span>•</span>
                                <span>{cita.modalidad}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmarDesdeInicio(cita.citaid)}
                            disabled={confirmandoCitaId === cita.citaid}
                            className="w-full sm:w-auto bg-teal-500 hover:bg-teal-400 text-slate-950 border border-teal-200/80 shadow-[0_0_0_1px_rgba(153,246,228,0.35)] font-semibold disabled:bg-teal-500/50 disabled:text-slate-800"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {confirmandoCitaId === cita.citaid ? 'Confirmando...' : 'Confirmar'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Agenda del Día */}
        <Card className="border-teal-500/30 shadow-lg bg-slate-800/50 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-teal-900/50 to-violet-900/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <CardTitle className="text-slate-100">Agenda de Hoy - {new Date().toLocaleDateString()}</CardTitle>
              <Button onClick={() => onNavigate('citas')} size="sm" className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
                Gestionar Citas
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {psicologoData.citasHoy.length === 0 ? (
                <div className="rounded-xl border border-slate-700 bg-slate-900/30 px-4 py-8 text-center">
                  <p className="text-slate-300">Hoy no tienes citas agendadas</p>
                </div>
              ) : (
                psicologoData.citasHoy.map((cita: any) => {
                  const { fecha, hora } = extraerFechaHoraLocal(cita.fechahora);
                  const fechaDate = new Date(`${fecha}T${hora}:00`);
                  const diaSemana = fechaDate.toLocaleDateString('es-ES', { weekday: 'short' });
                  return (
                    <Card key={cita.citaid} className="bg-slate-700/30 border-slate-600">
                      <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            {cita.paciente_fotoperfil ? (
                              <img
                                src={cita.paciente_fotoperfil}
                                alt={`${cita.paciente_nombre}`}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5 text-white" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-slate-100 font-medium">
                                {cita.paciente_nombre} {cita.paciente_apellido}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                                <Clock className="w-3 h-3" />
                                <span>{diaSemana}, {formatearHora12(hora)}</span>
                                <span>•</span>
                                <span>{cita.modalidad}</span>
                                <span>•</span>
                                <span>{cita.duracionmin} min</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => onNavigate('bitacora')} 
                              className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20 flex-1 sm:flex-none"
                            >
                              Ver Bitácora
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => onNavigate('citas')} 
                              className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none"
                            >
                              Gestionar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-xl transition-all border-teal-500/30 bg-slate-800/50 backdrop-blur-sm" onClick={() => onNavigate('registro-paciente')}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FileText className="w-6 h-6 text-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-slate-100 mb-1">Registrar Paciente</h3>
                  <p className="text-slate-300">
                    Agrega un nuevo paciente al sistema
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-xl transition-all border-violet-500/30 bg-slate-800/50 backdrop-blur-sm" onClick={() => onNavigate('buscar-paciente')}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <FileText className="w-6 h-6 text-white stroke-2" />
                </div>
                <div>
                  <h3 className="text-slate-100 mb-1">Buscar Paciente</h3>
                  <p className="text-slate-300">
                    Consulta información de tus pacientes
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <div></div>;
}