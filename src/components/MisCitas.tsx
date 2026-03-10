import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Calendar, Clock, User, MapPin, Video, Trash2, Edit, FileText, X, Search, Filter, ChevronLeft, ChevronRight, CalendarDays, CheckCircle2, XCircle, AlertCircle, UserCheck, Lock } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { ViewType } from './Dashboard';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Cita, ESTADO_CITA, MODALIDAD_CITA } from '../utils/types';
import { API_ENDPOINTS } from '../utils/api';

interface MisCitasProps {
  userType: 'psicologo' | 'paciente';
  onNavigate: (view: ViewType) => void;
}

export function MisCitas({ userType, onNavigate }: MisCitasProps) {
  const [citaACancelar, setCitaACancelar] = useState<number | null>(null);
  const [citaNotasVisibles, setCitaNotasVisibles] = useState<number | null>(null);
  const [citaAEditar, setCitaAEditar] = useState<Cita | null>(null);
  const [citaAReagendar, setCitaAReagendar] = useState<Cita | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCitas = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No autenticado. Por favor inicia sesión nuevamente.');
        }

        const response = await fetch(API_ENDPOINTS.CITAS, {
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
          const errorData = await response.json();
          throw new Error(errorData.message || 'Error al obtener las citas.');
        }

        const data = await response.json();
        setCitas(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCitas();
  }, []);


  // Estados para Consultar Agenda
  const [mesActual, setMesActual] = useState(new Date());
  const [busquedaAgenda, setBusquedaAgenda] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [citaSeleccionadaAgenda, setCitaSeleccionadaAgenda] = useState<number | null>(null);

  const listaPacientesUnicos = Array.from(new Set(citas.map(c => `${c.paciente_nombre} ${c.paciente_apellido}`)));


  const handleCancelarCita = () => {
    if (citaACancelar) {
      // Aquí iría la lógica para llamar a la API y cancelar la cita
      setCitas(citas.filter(c => c.citaid !== citaACancelar));
      toast.success('Cita cancelada exitosamente', {
        description: `Se ha notificado al ${userType === 'psicologo' ? 'paciente' : 'profesional'}`
      });
    }
    setCitaACancelar(null);
  };

  const handleModificarCita = (citaId: number) => {
    const cita = citas.find(c => c.citaid === citaId);
    if (cita) {
      if (userType === 'paciente') {
        setCitaAReagendar(cita);
      } else {
        setCitaAEditar(cita);
      }
    }
  };
  
    const handleModificarCitaEnAgenda = (cita: Cita) => {
    // Abrir modal de edición en lugar de redirigir
    setCitaAEditar(cita);
  };

  const handleGuardarEdicionCita = (e: React.FormEvent) => {
    e.preventDefault();
    if (citaAEditar) {
      // Aquí iría la lógica para llamar a la API y guardar los cambios
      setCitas(citas.map(c => c.citaid === citaAEditar.citaid ? citaAEditar : c));
      toast.success('Cita modificada exitosamente', {
        description: 'Los cambios han sido guardados'
      });
      setCitaAEditar(null);
    }
  };

  const handleConfirmarCita = (citaId: number) => {
    // Aquí iría la lógica para llamar a la API y confirmar la cita
    setCitas(citas.map(c => 
      c.citaid === citaId ? { ...c, estado: 'confirmada' } : c
    ));
    toast.success('Cita confirmada exitosamente', {
      description: 'Recibirás un recordatorio 24 horas antes'
    });
  };

  const handleUnirseVideollamada = () => {
    toast.info('Iniciando videollamada...');
    setTimeout(() => {
      toast.success('Redirigiendo a la videollamada...');
    }, 1500);
  };

  const handleVerNotas = (citaId: number) => {
    setCitaNotasVisibles(citaId);
  };
  
  const handleGuardarReagendamiento = (e: React.FormEvent) => {
    e.preventDefault();
    if (citaAReagendar) {
      // Aquí iría la lógica para llamar a la API y reagendar la cita
      setCitas(citas.map(c => 
        c.citaid === citaAReagendar.citaid 
          ? { ...citaAReagendar, estado: 'pendiente' } 
          : c
      ));
      toast.success('Solicitud de reagendamiento enviada', {
        description: 'El profesional revisará tu solicitud y te contactará pronto'
      });
      setCitaAReagendar(null);
    }
  };

  if (loading) {
    return <div>Cargando citas...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const ahora = new Date();
  const citasProximas = citas.filter(c => new Date(c.fechahora) >= ahora);
  const citasPasadas = citas.filter(c => new Date(c.fechahora) < ahora);
  const citaConNotas = citasPasadas.find(c => c.citaid === citaNotasVisibles);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-slate-100 mb-2">
          {userType === 'psicologo' ? 'Gestionar Citas' : 'Mis Citas'}
        </h1>
        <p className="text-slate-300">
          {userType === 'psicologo' 
            ? 'Administra las citas de tus pacientes'
            : 'Gestiona tus citas próximas y revisa tu historial'}
        </p>
      </div>

      <Tabs defaultValue="proximas" className="w-full">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="proximas" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">Próximas Citas</TabsTrigger>
          <TabsTrigger value="pasadas" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">Historial</TabsTrigger>
          <TabsTrigger value="agenda" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white">Consultar Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="proximas" className="space-y-4 mt-6">
          {citasProximas.map((cita) => (
            <Card key={cita.citaid} className="hover:shadow-lg transition-shadow bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      {cita.modalidad === 'virtual' ? (
                        <Video className="w-8 h-8 text-white stroke-2" />
                      ) : (
                        <Calendar className="w-8 h-8 text-white stroke-2" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        
                        <Badge
                          variant={cita.estado === 'confirmada' ? 'default' : 'secondary'}
                          className={cita.estado === 'confirmada' ? 'bg-green-600 text-white' : 'bg-amber-600 text-white'}
                        >
                          {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{userType === 'psicologo' ? `${cita.paciente_nombre} ${cita.paciente_apellido}` : `${cita.psicologa_nombre} ${cita.psicologa_apellido}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(cita.fechahora).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(cita.fechahora).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{cita.ubicacion}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cita.modalidad === 'virtual' && (
                      <Button size="sm" onClick={handleUnirseVideollamada} className="bg-teal-600 hover:bg-teal-700">Unirse a Videollamada</Button>
                    )}
                    {cita.estado === 'pendiente' && userType === 'paciente' && (
                      <Button size="sm" variant="outline" onClick={() => handleConfirmarCita(cita.citaid)} className="border-green-600 text-green-400 hover:bg-green-600/20">
                        Confirmar Cita
                      </Button>
                    )}
                    {userType === 'psicologo' && (
                      <Button size="sm" variant="outline" onClick={() => handleModificarCita(cita.citaid)} className="border-violet-600 text-violet-400 hover:bg-violet-600/20">
                        <Edit className="w-4 h-4 mr-2" />
                        Modificar
                      </Button>
                    )}
                    {userType === 'paciente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModificarCita(cita.citaid)}
                        className="border-violet-600 text-violet-400 hover:bg-violet-600/20"
                      >
                        Reagendar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCitaACancelar(cita.citaid)}
                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pasadas" className="space-y-4 mt-6">
          {citasPasadas.map((cita) => (
            <Card key={cita.citaid} className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      {cita.modalidad === 'virtual' ? (
                        <Video className="w-8 h-8 text-slate-400" />
                      ) : (
                        <Calendar className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        
                        <Badge variant="outline" className="border-slate-600 text-slate-400">Completada</Badge>
                      </div>
                      <div className="space-y-1 text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{userType === 'psicologo' ? `${cita.paciente_nombre} ${cita.paciente_apellido}` : `${cita.psicologa_nombre} ${cita.psicologa_apellido}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(cita.fechahora).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{new Date(cita.fechahora).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => userType === 'psicologo' ? onNavigate('bitacora') : handleVerNotas(cita.citaid)} 
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <FileText className="w-4 h-4 mr-2 stroke-2" />
                    {userType === 'psicologo' ? 'Ver Bitácora' : 'Ver Notas'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        
        {/* Tab Consultar Agenda */}
        {userType === 'psicologo' && (
          <TabsContent value="agenda" className="space-y-6 mt-6">
            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">Citas Hoy</p>
                      <p className="text-slate-100">2 citas</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarDays className="w-6 h-6 text-white stroke-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-violet-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">Esta Semana</p>
                      <p className="text-slate-100">8 citas</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white stroke-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">Este Mes</p>
                      <p className="text-slate-100">{citas.length} citas</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarDays className="w-6 h-6 text-white stroke-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Filtros y Búsqueda */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Búsqueda */}
                  <div className="space-y-2">
                    <label className="text-slate-200 flex items-center gap-2">
                      <Search className="w-4 h-4 stroke-2" />
                      Buscar paciente
                    </label>
                    <Input
                      placeholder="Nombre del paciente..."
                      value={busquedaAgenda}
                      onChange={(e) => setBusquedaAgenda(e.target.value)}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>
                  
                  {/* Filtro por Paciente */}
                  <div className="space-y-2">
                    <label className="text-slate-200 flex items-center gap-2">
                      <Filter className="w-4 h-4 stroke-2" />
                      Filtrar por paciente
                    </label>
                    <Select value={filtroPaciente} onValueChange={setFiltroPaciente}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="todos">Todos los pacientes</SelectItem>
                        {listaPacientesUnicos.map((paciente, index) => (
                          <SelectItem key={index} value={paciente}>{paciente}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Filtro por Estado */}
                  <div className="space-y-2">
                    <label className="text-slate-200 flex items-center gap-2">
                      <Filter className="w-4 h-4 stroke-2" />
                      Filtrar por estado
                    </label>
                    <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                      <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700">
                        <SelectItem value="todos">Todos los estados</SelectItem>
                        <SelectItem value="confirmada">Confirmadas</SelectItem>
                        <SelectItem value="pendiente">Pendientes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Navegación de Mes */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-teal-400 stroke-2" />
                    {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMesActual(new Date())}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Hoy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Leyenda de Estados */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-slate-300">Leyenda:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-300">Confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-slate-300">Pendiente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span className="text-slate-300">Presencial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                    <span className="text-slate-300">Virtual</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lista de Citas Filtradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-100">
                  Citas del Mes ({citas.filter(c => {
                    const cumpleBusqueda = busquedaAgenda === '' || c.paciente.toLowerCase().includes(busquedaAgenda.toLowerCase());
                    const cumplePaciente = filtroPaciente === 'todos' || c.paciente === filtroPaciente;
                    const cumpleEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
                    return cumpleBusqueda && cumplePaciente && cumpleEstado;
                  }).length})
                </h3>
                <Button
                  size="sm"
                  onClick={() => {
                    setBusquedaAgenda('');
                    setFiltroPaciente('todos');
                    setFiltroEstado('todos');
                    toast.info('Filtros reiniciados');
                  }}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
              </div>
              
              {citas
                .filter(c => {
                  const cumpleBusqueda = busquedaAgenda === '' || `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(busquedaAgenda.toLowerCase());
                  const cumplePaciente = filtroPaciente === 'todos' || `${c.paciente_nombre} ${c.paciente_apellido}` === filtroPaciente;
                  const cumpleEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
                  return cumpleBusqueda && cumplePaciente && cumpleEstado;
                })
                .sort((a, b) => {
                  // Ordenar por fecha y hora
                  const fechaA = new Date(a.fechahora);
                  const fechaB = new Date(b.fechahora);
                  return fechaA.getTime() - fechaB.getTime();
                })
                .map((cita) => (
                  <motion.div
                    key={cita.citaid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="hover:shadow-lg transition-all bg-slate-800/50 backdrop-blur-sm border-slate-700 cursor-pointer hover:border-teal-500/50"
                      onClick={() => setCitaSeleccionadaAgenda(cita.citaid)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            {/* Indicador de estado y modalidad */}
                            <div className="flex flex-col gap-2">
                              <div 
                                className={`w-16 h-16 ${
                                  cita.modalidad === 'virtual' 
                                    ? 'bg-gradient-to-br from-violet-500 to-violet-600' 
                                    : 'bg-gradient-to-br from-teal-500 to-teal-600'
                                } rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                              >
                                {cita.modalidad === 'virtual' ? (
                                  <Video className="w-8 h-8 text-white stroke-2" />
                                ) : (
                                  <MapPin className="w-8 h-8 text-white stroke-2" />
                                )}
                              </div>
                              <div className={`w-16 h-1 rounded-full ${
                                cita.estado === 'confirmada' ? 'bg-green-500' : 'bg-amber-500'
                              }`}></div>
                            </div>
                            
                            {/* Información de la cita */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                
                                <Badge
                                  className={cita.estado === 'confirmada' ? 'bg-green-600' : 'bg-amber-600'}
                                >
                                  {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cita.modalidad === 'virtual' ? 'border-violet-500 text-violet-400' : 'border-teal-500 text-teal-400'}
                                >
                                  {cita.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-slate-300">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{`${cita.paciente_nombre} ${cita.paciente_apellido}`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(cita.fechahora).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{new Date(cita.fechahora).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{cita.ubicacion}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones rápidas */}
                          <div className="flex flex-col gap-2">
                            {cita.modalidad === 'virtual' && (
                              <Button size="sm" onClick={(e) => { e.stopPropagation(); handleUnirseVideollamada(); }} className="bg-teal-600 hover:bg-teal-700">
                                <Video className="w-4 h-4 mr-2" />
                                Unirse
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(e) => { e.stopPropagation(); handleModificarCitaEnAgenda(cita); }} 
                              className="border-violet-600 text-violet-400 hover:bg-violet-600/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Editar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              
              {citas.filter(c => {
                const cumpleBusqueda = busquedaAgenda === '' || `${c.paciente_nombre} ${c.paciente_apellido}`.toLowerCase().includes(busquedaAgenda.toLowerCase());
                const cumplePaciente = filtroPaciente === 'todos' || `${c.paciente_nombre} ${c.paciente_apellido}` === filtroPaciente;
                const cumpleEstado = filtroEstado === 'todos' || c.estado === filtroEstado;
                return cumpleBusqueda && cumplePaciente && cumpleEstado;
              }).length === 0 && (
                <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No se encontraron citas con los filtros seleccionados</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
        
        {/* Tab Consultar Agenda - Paciente */}
        {userType === 'paciente' && (
          <TabsContent value="agenda" className="space-y-6 mt-6">
            {/* Estadísticas Rápidas para Paciente */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">Citas Próximas</p>
                      <p className="text-slate-100">{citasProximas.length} citas</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CalendarDays className="w-6 h-6 text-white stroke-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-violet-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">Confirmadas</p>
                      <p className="text-slate-100">{citasProximas.filter(c => c.estado === 'confirmada').length} citas</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-6 h-6 text-white stroke-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-400 mb-1">Sesiones Completadas</p>
                      <p className="text-slate-100">{citasPasadas.length} sesiones</p>
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-white stroke-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Navegación de Mes */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-teal-400 stroke-2" />
                    Mi Agenda - {mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).charAt(0).toUpperCase() + mesActual.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).slice(1)}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() - 1))}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMesActual(new Date())}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Hoy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMesActual(new Date(mesActual.getFullYear(), mesActual.getMonth() + 1))}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
            
            {/* Leyenda de Estados */}
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4 items-center">
                  <span className="text-slate-300">Leyenda:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-slate-300">Confirmada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                    <span className="text-slate-300">Pendiente</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                    <span className="text-slate-300">Presencial</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
                    <span className="text-slate-300">Virtual</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lista de Citas del Paciente */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-100">
                  Mis Citas ({citas.length})
                </h3>
              </div>
              
              {citas
                .sort((a, b) => {
                  // Ordenar por fecha y hora
                  const fechaA = new Date(a.fecha);
                  const fechaB = new Date(b.fecha);
                  return fechaA.getTime() - fechaB.getTime();
                })
                .map((cita) => (
                  <motion.div
                    key={cita.citaid}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card 
                      className="hover:shadow-lg transition-all bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-teal-500/50"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            {/* Indicador de estado y modalidad */}
                            <div className="flex flex-col gap-2">
                              <div 
                                className={`w-16 h-16 ${
                                  cita.modalidad === 'virtual' 
                                    ? 'bg-gradient-to-br from-violet-500 to-violet-600' 
                                    : 'bg-gradient-to-br from-teal-500 to-teal-600'
                                } rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                              >
                                {cita.modalidad === 'virtual' ? (
                                  <Video className="w-8 h-8 text-white stroke-2" />
                                ) : (
                                  <MapPin className="w-8 h-8 text-white stroke-2" />
                                )}
                              </div>
                              <div className={`w-16 h-1 rounded-full ${
                                cita.estado === 'confirmada' ? 'bg-green-500' : 'bg-amber-500'
                              }`}></div>
                            </div>
                            
                            {/* Información de la cita */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                
                                <Badge
                                  className={cita.estado === 'confirmada' ? 'bg-green-600' : 'bg-amber-600'}
                                >
                                  {cita.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={cita.modalidad === 'virtual' ? 'border-violet-500 text-violet-400' : 'border-teal-500 text-teal-400'}
                                >
                                  {cita.modalidad === 'virtual' ? 'Virtual' : 'Presencial'}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-slate-300">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{`${cita.psicologa_nombre} ${cita.psicologa_apellido}`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{new Date(cita.fechahora).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{new Date(cita.fechahora).toLocaleTimeString()}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{cita.ubicacion}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones rápidas */}
                          <div className="flex flex-col gap-2">
                            {cita.modalidad === 'virtual' && (
                              <Button size="sm" onClick={() => handleUnirseVideollamada()} className="bg-teal-600 hover:bg-teal-700">
                                <Video className="w-4 h-4 mr-2" />
                                Unirse
                              </Button>
                            )}
                            {cita.estado === 'pendiente' && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => handleConfirmarCita(cita.citaid)} 
                                className="border-green-600 text-green-400 hover:bg-green-600/20"
                              >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                Confirmar
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleModificarCita(cita.citaid)} 
                              className="border-violet-600 text-violet-400 hover:bg-violet-600/20"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Reagendar
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              
              {citas.length === 0 && (
                <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400 mb-2">No tienes citas programadas</p>
                      <Button 
                        onClick={() => onNavigate('agendar')} 
                        className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 mt-4"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Solicitar Nueva Cita
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={citaACancelar !== null} onOpenChange={() => setCitaACancelar(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100">¿Cancelar esta cita?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              Esta acción notificará al {userType === 'psicologo' ? 'paciente' : 'profesional'}. Te recomendamos cancelar con al menos 24
              horas de anticipación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600">No, mantener cita</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelarCita} className="bg-red-600 hover:bg-red-700 text-white">
              Sí, cancelar cita
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={citaNotasVisibles !== null} onOpenChange={() => setCitaNotasVisibles(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400 stroke-2" />
              Notas de la Sesión
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Resumen y observaciones de tu sesión con el profesional
            </DialogDescription>
          </DialogHeader>
          
          {citaConNotas && (
            <div className="space-y-4">
              {/* Información de la cita */}
              <div className="bg-slate-900/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-3 text-slate-300 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400 stroke-2" />
                    <span className="text-sm">{new Date(citaConNotas.fechahora).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 stroke-2" />
                    <span className="text-sm">{new Date(citaConNotas.fechahora).toLocaleTimeString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-violet-400 stroke-2" />
                  <span className="text-sm">{`${citaConNotas.psicologa_nombre} ${citaConNotas.psicologa_apellido}`}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  
                  <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                    {citaConNotas.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                  </Badge>
                </div>
              </div>

              {/* Notas clínicas */}
              <div>
                <h4 className="text-slate-200 mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-violet-400 stroke-2" />
                  Notas Clínicas
                </h4>
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700 max-h-[40vh] overflow-y-auto">
                  <p className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {citaConNotas.notas}
                  </p>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="bg-gradient-to-r from-teal-900/30 to-violet-900/30 border border-teal-700/50 rounded-lg p-2.5">
                <p className="text-slate-300 text-xs">
                  💡 Estas notas son un resumen de tu sesión. Si tienes preguntas, no dudes en contactar a tu profesional.
                </p>
              </div>

              {/* Botón de cerrar */}
              <div className="flex justify-end pt-2">
                <Button 
                  onClick={() => setCitaNotasVisibles(null)} 
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Reagendamiento */}
      <Dialog open={citaAReagendar !== null} onOpenChange={() => setCitaAReagendar(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Edit className="w-5 h-5 text-violet-400 stroke-2" />
              Reagendar Cita
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Reagenda la cita seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {citaAReagendar && (
            <form onSubmit={handleGuardarReagendamiento} className="space-y-6">
              {/* Información del paciente (solo lectura) */}
              <div className="bg-gradient-to-br from-violet-900/20 to-teal-900/20 border border-violet-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  <User className="w-5 h-5 text-violet-400 stroke-2" />
                  <span className="font-semibold text-slate-100">{`${citaAReagendar.paciente_nombre} ${citaAReagendar.paciente_apellido}`}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  
                  <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                    {citaAReagendar.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                  </Badge>
                  <Badge className={citaAReagendar.estado === 'confirmada' ? 'bg-green-600/20 text-green-300 border-green-600/50' : 'bg-amber-600/20 text-amber-300 border-amber-600/50'}>
                    {citaAReagendar.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              {/* Campos Editables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400 stroke-2" />
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    value={new Date(citaAReagendar.fechahora).toISOString().split('T')[0]}
                    onChange={(e) => setCitaAReagendar({ ...citaAReagendar, fechahora: new Date(e.target.value).toISOString() })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 stroke-2" />
                    Hora
                  </Label>
                  <Input
                    type="time"
                    value={new Date(citaAReagendar.fechahora).toTimeString().slice(0,5)}
                    onChange={(e) => {
                      const newDate = new Date(citaAReagendar.fechahora);
                      const [hours, minutes] = e.target.value.split(':');
                      newDate.setHours(parseInt(hours, 10));
                      newDate.setMinutes(parseInt(minutes, 10));
                      setCitaAReagendar({ ...citaAReagendar, fechahora: newDate.toISOString() });
                    }}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400 stroke-2" />
                  Ubicación
                </Label>
                <Input
                  value={citaAReagendar.ubicacion}
                  onChange={(e) => setCitaAReagendar({ ...citaAReagendar, ubicacion: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  placeholder="Consultorio o link de videollamada"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 stroke-2" />
                  Estado de la Cita
                </Label>
                <Select value={citaAReagendar.estado} onValueChange={(value) => setCitaAReagendar({ ...citaAReagendar, estado: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="confirmada">✅ Confirmada</SelectItem>
                    <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400 stroke-2" />
                  Notas Adicionales (Opcional)
                </Label>
                <Textarea
                  value={citaAReagendar.notas || ''}
                  onChange={(e) => setCitaAReagendar({ ...citaAReagendar, notas: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100 min-h-[80px]"
                  placeholder="Agrega notas o información adicional sobre esta cita..."
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <Button 
                  type="button"
                  onClick={() => setCitaAReagendar(null)} 
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edición de Cita */}
      <Dialog open={citaAEditar !== null} onOpenChange={() => setCitaAEditar(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto text-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Edit className="w-5 h-5 text-violet-400 stroke-2" />
              Modificar Cita
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Modifica los detalles de la cita seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {citaAEditar && (
            <form onSubmit={handleGuardarEdicionCita} className="space-y-6">
              {/* Información del paciente (solo lectura) */}
              <div className="bg-gradient-to-br from-violet-900/20 to-teal-900/20 border border-violet-700/30 rounded-lg p-4">
                <div className="flex items-center gap-2 text-slate-300 mb-2">
                  <User className="w-5 h-5 text-violet-400 stroke-2" />
                  <span className="font-semibold text-slate-100">{`${citaAEditar.paciente_nombre} ${citaAEditar.paciente_apellido}`}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  
                  <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                    {citaAEditar.modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                  </Badge>
                  <Badge className={citaAEditar.estado === 'confirmada' ? 'bg-green-600/20 text-green-300 border-green-600/50' : 'bg-amber-600/20 text-amber-300 border-amber-600/50'}>
                    {citaAEditar.estado === 'confirmada' ? 'Confirmada' : 'Pendiente'}
                  </Badge>
                </div>
              </div>

              {/* Campos Editables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-400 stroke-2" />
                    Fecha
                  </Label>
                  <Input
                    type="date"
                    value={new Date(citaAEditar.fechahora).toISOString().split('T')[0]}
                    onChange={(e) => setCitaAEditar({ ...citaAEditar, fechahora: new Date(e.target.value).toISOString() })}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 stroke-2" />
                    Hora
                  </Label>
                  <Input
                    type="time"
                    value={new Date(citaAEditar.fechahora).toTimeString().slice(0,5)}
                    onChange={(e) => {
                      const newDate = new Date(citaAEditar.fechahora);
                      const [hours, minutes] = e.target.value.split(':');
                      newDate.setHours(parseInt(hours, 10));
                      newDate.setMinutes(parseInt(minutes, 10));
                      setCitaAEditar({ ...citaAEditar, fechahora: newDate.toISOString() });
                    }}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-teal-400 stroke-2" />
                  Ubicación
                </Label>
                <Input
                  value={citaAEditar.ubicacion}
                  onChange={(e) => setCitaAEditar({ ...citaAEditar, ubicacion: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                  placeholder="Consultorio o link de videollamada"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-400 stroke-2" />
                  Estado de la Cita
                </Label>
                <Select value={citaAEditar.estado} onValueChange={(value) => setCitaAEditar({ ...citaAEditar, estado: value })}>
                  <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="confirmada">✅ Confirmada</SelectItem>
                    <SelectItem value="pendiente">⏳ Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400 stroke-2" />
                  Notas Adicionales (Opcional)
                </Label>
                <Textarea
                  value={citaAEditar.notas || ''}
                  onChange={(e) => setCitaAEditar({ ...citaAEditar, notas: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100 min-h-[80px]"
                  placeholder="Agrega notas o información adicional sobre esta cita..."
                />
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 justify-end pt-4 border-t border-slate-700">
                <Button 
                  type="button"
                  onClick={() => setCitaAEditar(null)} 
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-600"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}