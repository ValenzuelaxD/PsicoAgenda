import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Search, User, Phone, Mail, Calendar, FileText, Download, TrendingUp, X, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from './ui/dialog';
import { Progress } from './ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
import { Paciente, HistorialClinico } from '../utils/types';
import { API_ENDPOINTS } from '../utils/api';

interface BuscarPacienteProps {
  onNavigate: (view: ViewType, pacienteId?: number) => void;
}

interface HistorialPaciente {
  historial: HistorialClinico[];
  estadisticas: any;
}

const obtenerNombreCompletoPaciente = (paciente: Partial<Paciente> | null | undefined) => {
  if (!paciente) return '';
  return [paciente.nombre, paciente.apellidopaterno, paciente.apellidomaterno]
    .filter((valor) => Boolean(valor && String(valor).trim()))
    .join(' ')
    .trim();
};

export function BuscarPaciente({ onNavigate }: BuscarPacienteProps) {
  const [busqueda, setBusqueda] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [historialActual, setHistorialActual] = useState<HistorialPaciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [mostrarModalActualizar, setMostrarModalActualizar] = useState(false);
  const [mostrarConfirmacionEliminar, setMostrarConfirmacionEliminar] = useState(false);
  
  const [formActualizar, setFormActualizar] = useState({
    nombre: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    motivoConsulta: '',
  });

  const dividirNombreCompleto = (nombreCompleto: string) => {
    const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
    const nombre = partes.shift() || '';
    const apellidoPaterno = partes.shift() || '';
    const apellidoMaterno = partes.length > 0 ? partes.join(' ') : null;
    return { nombre, apellidoPaterno, apellidoMaterno };
  };

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No autenticado. Por favor inicia sesión.');
        }

        const response = await fetch(API_ENDPOINTS.PACIENTES, {
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
          throw new Error(errorData.message || 'Error al cargar pacientes');
        }

        const data = await response.json();
        setPacientes(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPacientes();
  }, []);

  useEffect(() => {
    if (pacienteSeleccionado) {
      const fetchHistorial = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_ENDPOINTS.HISTORIAL_CLINICO}/${pacienteSeleccionado.pacienteid}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            const data = await response.json();
            
            // Calcular estadísticas desde los datos reales
            const totalSesiones = data.length;
            const ultimaSesion = data.length > 0 ? new Date(data[0].fechaentrada).toLocaleDateString('es-ES') : 'N/A';
            
            // Calcular tiempo en terapia (desde la primera sesión hasta ahora)
            let tiempoEnTerapia = 'N/A';
            if (data.length > 0) {
              const primeraFecha = new Date(data[data.length - 1].fechaentrada);
              const ahora = new Date();
              const diferenciaDias = Math.floor((ahora.getTime() - primeraFecha.getTime()) / (1000 * 60 * 60 * 24));
              
              if (diferenciaDias < 30) {
                tiempoEnTerapia = `${diferenciaDias} días`;
              } else if (diferenciaDias < 365) {
                const meses = Math.floor(diferenciaDias / 30);
                tiempoEnTerapia = `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
              } else {
                const años = Math.floor(diferenciaDias / 365);
                tiempoEnTerapia = `${años} ${años === 1 ? 'año' : 'años'}`;
              }
            }
            
            // Calcular progreso general basado en cantidad de sesiones (escala 0-100)
            // Considerando 10 sesiones como 100% de progreso esperado
            const progresoGeneral = Math.min(Math.round((totalSesiones / 10) * 100), 100);
            
            setHistorialActual({
              sesiones: data,
              estadisticas: {
                totalSesiones,
                progresoGeneral,
                ultimaSesion,
                tiempoEnTerapia,
              },
              objetivosTerapeuticos: [],
            });
          } else {
            throw new Error('Error al cargar el historial');
          }
        } catch (err: any) {
          toast.error(err.message);
        }
      };
      fetchHistorial();
    }
  }, [pacienteSeleccionado]);

  const pacientesFiltrados = pacientes.filter((p) =>
    obtenerNombreCompletoPaciente(p).toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.email ?? '').toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAbrirModalActualizar = () => {
    if (pacienteSeleccionado) {
      setFormActualizar({
        nombre: obtenerNombreCompletoPaciente(pacienteSeleccionado),
        email: pacienteSeleccionado.email ?? '',
        telefono: pacienteSeleccionado.telefono ?? '',
        fechaNacimiento: pacienteSeleccionado.fechanacimiento ?? '',
        motivoConsulta: pacienteSeleccionado.motivoconsulta ?? '',
      });
      setMostrarModalActualizar(true);
    }
  };

  const handleActualizarPaciente = async () => {
    if (!pacienteSeleccionado) return;
    const nombreDividido = dividirNombreCompleto(formActualizar.nombre);
    if (!nombreDividido.nombre || !nombreDividido.apellidoPaterno) {
      toast.error('Debes capturar nombre y al menos un apellido.');
      return;
    }

    try {
      const response = await fetch(`${API_ENDPOINTS.PACIENTES}/${pacienteSeleccionado.pacienteid}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nombre: nombreDividido.nombre,
          apellidoPaterno: nombreDividido.apellidoPaterno,
          apellidoMaterno: nombreDividido.apellidoMaterno,
          telefono: formActualizar.telefono,
          motivoConsulta: formActualizar.motivoConsulta,
        })
      });
      if (!response.ok) throw new Error('Error al actualizar');
      toast.success('Paciente actualizado correctamente');
      setMostrarModalActualizar(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleEliminarPaciente = async () => {
    if (!pacienteSeleccionado) return;
    try {
      const response = await fetch(`${API_ENDPOINTS.PACIENTES}/${pacienteSeleccionado.pacienteid}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error al eliminar');
      toast.success('Paciente eliminado correctamente');
      setPacientes(pacientes.filter(p => p.pacienteid !== pacienteSeleccionado.pacienteid));
      setPacienteSeleccionado(null);
      setMostrarConfirmacionEliminar(false);
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-white mb-2 text-xl sm:text-2xl">Buscar Paciente</h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Encuentra y consulta la información de tus pacientes
        </p>
      </div>

      {/* Barra de Búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o correo electrónico..."
                className="pl-10 w-full"
              />
            </div>
            <Button onClick={() => onNavigate('registro-paciente')} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
              Nuevo Paciente
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pacientes */}
        <div className="lg:col-span-1 space-y-4">
                  <h2 className="text-white">
                    Resultados ({pacientesFiltrados.length})
                  </h2>
                  <div className="space-y-3">
                    {pacientesFiltrados.map((paciente) => (
                      <Card
                        key={paciente.pacienteid}
                        className={`cursor-pointer transition-all hover:shadow-md bg-slate-800/50 backdrop-blur-sm border-slate-700 ${
                          pacienteSeleccionado?.pacienteid === paciente.pacienteid
                            ? 'border-teal-500 bg-gradient-to-r from-teal-900/30 to-violet-900/30 shadow-lg'
                            : ''
                        }`}
                        onClick={() => setPacienteSeleccionado(paciente)}
                      >
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
                                <User className="w-5 h-5 text-white stroke-2" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium">{obtenerNombreCompletoPaciente(paciente)}</p>
                                <p className="text-slate-400">{paciente.edad} años</p>
                              </div>
                            </div>
                            <Badge variant={paciente.estado === 'activo' ? 'default' : 'secondary'} className={paciente.estado === 'activo' ? 'bg-teal-600' : ''}>
                              {paciente.estado}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
        
                {/* Detalles del Paciente */}
                <div className="lg:col-span-2">
                  {pacienteSeleccionado ? (
                    <div className="space-y-6">
                      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                        <CardHeader>
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <CardTitle className="text-slate-100">Información del Paciente</CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                              <Button size="sm" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700 w-full sm:w-auto" onClick={handleAbrirModalActualizar}>
                                <Edit2 className="w-4 h-4 mr-2 stroke-2" />
                                Actualizar
                              </Button>
                              <Button size="sm" variant="outline" className="border-red-600 text-red-400 hover:bg-red-900/20 w-full sm:w-auto" onClick={() => setMostrarConfirmacionEliminar(true)}>
                                <Trash2 className="w-4 h-4 mr-2 stroke-2" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-slate-400 mb-1">Nombre Completo</p>
                              <p className="text-teal-300 font-medium">{obtenerNombreCompletoPaciente(pacienteSeleccionado)}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Fecha de Nacimiento</p>
                              <p className="text-violet-300 font-medium">{new Date(pacienteSeleccionado.fechanacimiento).toLocaleDateString()} ({pacienteSeleccionado.edad} años)</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Correo Electrónico</p>
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-teal-400" />
                                <p className="text-slate-200 break-all">{pacienteSeleccionado.email}</p>
                              </div>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Teléfono</p>
                              <div className="flex items-center gap-2 min-w-0">
                                <Phone className="w-4 h-4 text-violet-400" />
                                <p className="text-slate-200 break-words">{pacienteSeleccionado.telefono}</p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
        
                      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                        <CardHeader>
                          <CardTitle className="text-slate-100">Información Clínica</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-slate-400 mb-1">Motivo de Consulta</p>
                            <p className="text-slate-200">{pacienteSeleccionado.motivoconsulta}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <p className="text-slate-400 mb-1">Sesiones Totales</p>
                              <p className="text-teal-400 text-2xl font-semibold">{pacienteSeleccionado.sesionesTotales}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Última Cita</p>
                              <p className="text-violet-400 font-medium">{pacienteSeleccionado.ultimaCita ? new Date(pacienteSeleccionado.ultimaCita).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-1">Próxima Cita</p>
                              <p className="text-violet-400 font-medium">{pacienteSeleccionado.proximaCita ? new Date(pacienteSeleccionado.proximaCita).toLocaleDateString() : 'Sin programar'}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
        
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Button onClick={() => onNavigate('bitacora', pacienteSeleccionado!.pacienteid)} className="w-full">
                          <FileText className="w-4 h-4 mr-2" />
                          Ver Bitácora
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full md:col-span-2"
                          onClick={() => setMostrarHistorial(true)}
                        >
                          Historial Completo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Card className="h-full bg-slate-800/50 backdrop-blur-sm border-slate-700">
                      <CardContent className="pt-12 pb-12 text-center">
                        <User className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                        <p className="text-slate-300">
                          Selecciona un paciente para ver sus detalles
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
        
              {/* Modal de Historial Completo */}
              <AnimatePresence>
                {mostrarHistorial && pacienteSeleccionado && historialActual && (
                  <Dialog open={mostrarHistorial} onOpenChange={setMostrarHistorial}>
                    <DialogContent className="w-[calc(100%-1rem)] max-w-5xl max-h-[90dvh] overflow-y-auto bg-slate-800 border-slate-700 p-0">
                      <DialogTitle className="sr-only">
                        Historial Clínico Completo - {obtenerNombreCompletoPaciente(pacienteSeleccionado)}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Visualización completa del historial clínico y sesiones del paciente seleccionado
                      </DialogDescription>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Header del Modal */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800 border-b border-slate-700 px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-white text-xl font-semibold">Historial Clínico Completo</h2>
                              <p className="text-teal-400 mt-1">{obtenerNombreCompletoPaciente(pacienteSeleccionado)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMostrarHistorial(false)}
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
        
                        <div className="p-6 space-y-6">
                          {/* Estadísticas */}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <Card className="bg-slate-700/50 backdrop-blur-sm border-slate-600">
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-slate-300 mb-1">Total Sesiones</p>
                                  <p className="text-white text-3xl font-semibold">{historialActual.estadisticas.totalSesiones}</p>
                                </div>
                              </CardContent>
                            </Card>
        
                            <Card className="bg-slate-700/50 backdrop-blur-sm border-slate-600">
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-slate-300 mb-1">Tiempo en Terapia</p>
                                  <p className="text-teal-400 text-3xl font-semibold">{historialActual.estadisticas.tiempoEnTerapia}</p>
                                </div>
                              </CardContent>
                            </Card>
        
                            <Card className="bg-slate-700/50 backdrop-blur-sm border-slate-600">
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-slate-300 mb-1">Última Sesión</p>
                                  <p className="text-violet-400 text-3xl font-semibold">{historialActual.estadisticas.ultimaSesion}</p>
                                </div>
                              </CardContent>
                            </Card>
        
                            <Card className="bg-slate-700/50 backdrop-blur-sm border-slate-600">
                              <CardContent className="pt-6">
                                <div className="text-center">
                                  <p className="text-slate-300 mb-1">Progreso General</p>
                                  <p className="text-teal-400 text-3xl font-semibold">{historialActual.estadisticas.progresoGeneral}%</p>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
        
                          {/* Progreso Terapéutico */}
                          <Card className="bg-slate-700/50 backdrop-blur-sm border-slate-600">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-slate-100">
                                <TrendingUp className="w-5 h-5 text-teal-500" />
                                Progreso Terapéutico
                              </CardTitle>
                              <p className="text-slate-400">
                                Evolución de los objetivos terapéuticos
                              </p>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {historialActual.objetivosTerapeuticos.map((objetivo: any, index: number) => (
                                  <div key={index}>
                                    <div className="flex justify-between mb-2">
                                      <span className={index % 2 === 0 ? "text-teal-300 font-medium" : "text-violet-300 font-medium"}>
                                        {objetivo.nombre}
                                      </span>
                                      <span className={index % 2 === 0 ? "text-teal-400 font-semibold" : "text-violet-400 font-semibold"}>
                                        {objetivo.progreso}%
                                      </span>
                                    </div>
                                    <Progress value={objetivo.progreso} className="h-2" />
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
        
                          {/* Historial de Sesiones */}
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="text-white">Sesiones Anteriores</h3>
                            </div>
        
                            {historialActual.sesiones.map((sesion: any) => (
                              <Card key={sesion.historialid} className="bg-slate-700/50 backdrop-blur-sm border-slate-600">
                                <CardHeader>
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                      <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                                        <FileText className="w-6 h-6 text-white stroke-2" />
                                      </div>
                                      <div>
                                        <CardTitle className="text-slate-100">{sesion.diagnostico}</CardTitle>
                                        <div className="flex items-center gap-4 mt-1 text-slate-400">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {new Date(sesion.fechaentrada).toLocaleDateString()}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    <Badge className="bg-teal-600">Completada</Badge>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                  <div>
                                    <h4 className="text-slate-200 mb-2">Notas de la Sesión</h4>
                                    <p className="text-slate-300">{sesion.observaciones}</p>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </DialogContent>
                  </Dialog>
                )}
              </AnimatePresence>
        
              {/* Modal de Actualización */}
              <AnimatePresence>
                {mostrarModalActualizar && pacienteSeleccionado && (
                  <Dialog open={mostrarModalActualizar} onOpenChange={setMostrarModalActualizar}>
                    <DialogContent className="w-[calc(100%-1rem)] max-w-2xl max-h-[90dvh] overflow-y-auto bg-slate-800 border-slate-700 p-0">
                      <DialogTitle className="sr-only">
                        Actualizar Información del Paciente - {obtenerNombreCompletoPaciente(pacienteSeleccionado)}
                      </DialogTitle>
                      <DialogDescription className="sr-only">
                        Formulario para actualizar la información del paciente seleccionado
                      </DialogDescription>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Header del Modal */}
                        <div className="sticky top-0 z-10 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-800 border-b border-slate-700 px-6 py-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h2 className="text-white text-xl font-semibold">Actualizar Información del Paciente</h2>
                              <p className="text-teal-400 mt-1">{obtenerNombreCompletoPaciente(pacienteSeleccionado)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setMostrarModalActualizar(false)}
                              className="text-slate-400 hover:text-white hover:bg-slate-700"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        </div>
        
                        <div className="p-6 space-y-6">
                          {/* Formulario de Actualización */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label className="text-slate-400 mb-1">Nombre Completo</Label>
                              <Input
                                value={formActualizar.nombre}
                                onChange={(e) => setFormActualizar({ ...formActualizar, nombre: e.target.value })}
                                placeholder="Nombre completo del paciente"
                                className="pl-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-400 mb-1">Fecha de Nacimiento</Label>
                              <Input
                                value={formActualizar.fechaNacimiento}
                                onChange={(e) => setFormActualizar({ ...formActualizar, fechaNacimiento: e.target.value })}
                                placeholder="Fecha de nacimiento"
                                className="pl-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-400 mb-1">Correo Electrónico</Label>
                              <Input
                                value={formActualizar.email}
                                onChange={(e) => setFormActualizar({ ...formActualizar, email: e.target.value })}
                                placeholder="Correo electrónico"
                                className="pl-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-400 mb-1">Teléfono</Label>
                              <Input
                                value={formActualizar.telefono}
                                onChange={(e) => setFormActualizar({ ...formActualizar, telefono: e.target.value })}
                                placeholder="Teléfono"
                                className="pl-10"
                              />
                            </div>
                            <div>
                              <Label className="text-slate-400 mb-1">Motivo de Consulta</Label>
                              <Textarea
                                value={formActualizar.motivoConsulta}
                                onChange={(e) => setFormActualizar({ ...formActualizar, motivoConsulta: e.target.value })}
                                placeholder="Motivo de consulta"
                                className="pl-10"
                              />
                            </div>
                          </div>
        
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleActualizarPaciente}
                              className="border-slate-600 text-slate-200 hover:bg-slate-700"
                            >
                              <Edit2 className="w-4 h-4 mr-2" />
                              Actualizar
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    </DialogContent>
                  </Dialog>
                )}
              </AnimatePresence>
        
              {/* Confirmación de Eliminación */}
              <AnimatePresence>
                {mostrarConfirmacionEliminar && pacienteSeleccionado && (
                  <AlertDialog open={mostrarConfirmacionEliminar} onOpenChange={setMostrarConfirmacionEliminar}>
                    <AlertDialogContent className="bg-slate-800 border-slate-700">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white">Eliminar Paciente</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-300">
                          ¿Estás seguro de que deseas eliminar a {obtenerNombreCompletoPaciente(pacienteSeleccionado)} del sistema? Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel
                          className="bg-slate-700 text-slate-200 hover:bg-slate-600"
                        >
                          Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 text-white hover:bg-red-700"
                          onClick={handleEliminarPaciente}
                        >
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </AnimatePresence>
            </div>
          );
        }
        