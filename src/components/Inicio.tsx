import { Calendar, Clock, FileText, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { ViewType } from './Dashboard';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { PacienteDashboardData, PsicologaDashboardData } from '../utils/types';
import { API_ENDPOINTS } from '../utils/api';

interface InicioProps {
  userName: string;
  userType: 'psicologo' | 'paciente';
  onNavigate: (view: ViewType) => void;
}

export function Inicio({ userName, userType, onNavigate }: InicioProps) {
  const [pacienteData, setPacienteData] = useState<PacienteDashboardData | null>(null);
  const [psicologoData, setPsicologoData] = useState<PsicologoDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error("No autenticado. Por favor inicia sesión.");
        }

  const endpoint = userType === 'paciente' ? API_ENDPOINTS.DASHBOARD_PACIENTE : API_ENDPOINTS.DASHBOARD_PSICOLOGO;
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

  // Contenido para Paciente
  if (userType === 'paciente' && pacienteData) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
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
                  <p className="text-slate-100">{pacienteData.proximaCita ? new Date(pacienteData.proximaCita).toLocaleString() : 'No hay citas'}</p>
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
                  <p className="text-slate-100">{pacienteData.ultimaSesion ? new Date(pacienteData.ultimaSesion).toLocaleDateString() : 'No hay sesiones'}</p>
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
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-slate-100 font-medium">
                              {cita.nombre} {cita.apellidopaterno}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(cita.fechahora).toLocaleString('es-ES', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                              <span>•</span>
                              <span>{cita.modalidad}</span>
                            </div>
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => onNavigate('citas')}
                          className="border-teal-500/30 text-teal-400 hover:bg-teal-500/10"
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
    return (
      <div className="max-w-6xl mx-auto space-y-8">
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
              {psicologoData.citasHoy.map((cita: any) => (
                <div
                  key={cita.citaid}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-gradient-to-r from-slate-700/50 to-teal-900/20 rounded-xl hover:shadow-md transition-all border border-teal-500/20"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <p className="text-white text-sm">{new Date(cita.fechahora).toLocaleTimeString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-100 text-sm sm:text-base">{`${cita.paciente_nombre} ${cita.paciente_apellido}`}</p>
                      <p className="text-slate-300 text-sm">{cita.modalidad}</p>
                      <p className="text-slate-400 text-sm">{cita.duracionmin} min</p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => onNavigate('bitacora')} className="border-violet-500/50 text-violet-300 hover:bg-violet-500/20">
                      Ver Bitácora
                    </Button>
                    <Button size="sm" onClick={() => onNavigate('citas')} className="bg-teal-600 hover:bg-teal-700">
                      Gestionar
                    </Button>
                  </div>
                </div>
              ))}
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