import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, User, CheckCircle2, XCircle, AlertCircle, FileText, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ViewType } from './Dashboard';
import { Cita, MODALIDAD_CITA } from '../utils/types';

interface CitaAsistencia extends Cita {
  asistencia?: 'asistio' | 'no-asistio' | 'llego-tarde' | null;
  notasAsistencia?: string;
}

interface RegistrarAsistenciaProps {
  onNavigate: (view: ViewType) => void;
}

export function RegistrarAsistencia({ onNavigate }: RegistrarAsistenciaProps) {
  const [modalRegistrar, setModalRegistrar] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState<CitaAsistencia | null>(null);
  const [estadoAsistencia, setEstadoAsistencia] = useState<'asistio' | 'no-asistio' | 'llego-tarde'>('asistio');
  const [notasAsistencia, setNotasAsistencia] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('hoy');

  const [citasRealizadas, setCitasRealizadas] = useState<CitaAsistencia[]>([
    {
      id: 1,
      fecha: '27 Nov 2025',
      hora: '9:00 AM',
      paciente: 'Ana García Martínez',
      tipo: 'Terapia Individual',
      modalidad: 'Presencial',
      asistencia: 'asistio',
      notasAsistencia: 'Paciente llegó puntual. Sesión productiva.'
    },
    {
      id: 2,
      fecha: '27 Nov 2025',
      hora: '11:00 AM',
      paciente: 'Pedro González Sánchez',
      tipo: 'Terapia Familiar',
      modalidad: 'Virtual',
      asistencia: null,
    },
    {
      id: 3,
      fecha: '27 Nov 2025',
      hora: '2:00 PM',
      paciente: 'Carlos Ramírez López',
      tipo: 'Seguimiento',
      modalidad: 'Virtual',
      asistencia: null,
    },
    {
      id: 4,
      fecha: '26 Nov 2025',
      hora: '10:00 AM',
      paciente: 'María Fernández Torres',
      tipo: 'Terapia Individual',
      modalidad: 'Presencial',
      asistencia: 'llego-tarde',
      notasAsistencia: 'Llegó 15 minutos tarde. Avisó con anticipación.'
    },
    {
      id: 5,
      fecha: '26 Nov 2025',
      hora: '3:00 PM',
      paciente: 'Laura Martínez Ruiz',
      tipo: 'Consulta Inicial',
      modalidad: 'Presencial',
      asistencia: 'no-asistio',
      notasAsistencia: 'No asistió. No avisó con anticipación.'
    },
    {
      id: 6,
      fecha: '25 Nov 2025',
      hora: '9:00 AM',
      paciente: 'Ana García Martínez',
      tipo: 'Terapia Individual',
      modalidad: 'Presencial',
      asistencia: 'asistio',
    },
  ]);

  const handleAbrirModal = (cita: CitaAsistencia) => {
    setCitaSeleccionada(cita);
    setEstadoAsistencia(cita.asistencia || 'asistio');
    setNotasAsistencia(cita.notasAsistencia || '');
    setModalRegistrar(true);
  };

  const handleGuardarAsistencia = () => {
    if (!citaSeleccionada) return;

    setCitasRealizadas(citasRealizadas.map(cita => 
      cita.id === citaSeleccionada.id 
        ? { ...cita, asistencia: estadoAsistencia, notasAsistencia: notasAsistencia }
        : cita
    ));

    const mensajes = {
      'asistio': 'Asistencia registrada exitosamente',
      'no-asistio': 'Inasistencia registrada',
      'llego-tarde': 'Llegada tarde registrada'
    };

    toast.success(mensajes[estadoAsistencia], {
      description: `Se ha actualizado el registro de ${citaSeleccionada.paciente}`
    });

    setModalRegistrar(false);
    setCitaSeleccionada(null);
    setNotasAsistencia('');
  };

  // Filtrar citas
  const citasFiltradas = citasRealizadas.filter(cita => {
    const cumpleBusqueda = busqueda === '' || cita.paciente.toLowerCase().includes(busqueda.toLowerCase());
    
    let cumpleFecha = true;
    if (filtroFecha === 'hoy') {
      cumpleFecha = cita.fecha === '27 Nov 2025';
    } else if (filtroFecha === 'ayer') {
      cumpleFecha = cita.fecha === '26 Nov 2025';
    } else if (filtroFecha === 'ultimos-7-dias') {
      // Para simplificar, incluimos las fechas de ejemplo
      cumpleFecha = true;
    }
    
    return cumpleBusqueda && cumpleFecha;
  });

  // Calcular estadísticas
  const totalCitas = citasFiltradas.length;
  const asistieron = citasFiltradas.filter(c => c.asistencia === 'asistio').length;
  const noAsistieron = citasFiltradas.filter(c => c.asistencia === 'no-asistio').length;
  const llegaronTarde = citasFiltradas.filter(c => c.asistencia === 'llego-tarde').length;
  const pendientes = citasFiltradas.filter(c => !c.asistencia).length;

  const porcentajeAsistencia = totalCitas > 0 ? ((asistieron / totalCitas) * 100).toFixed(0) : 0;

  const getIconoAsistencia = (estado: string | null | undefined) => {
    switch (estado) {
      case 'asistio':
        return <CheckCircle2 className="w-5 h-5 text-green-400 stroke-2" />;
      case 'no-asistio':
        return <XCircle className="w-5 h-5 text-red-400 stroke-2" />;
      case 'llego-tarde':
        return <AlertCircle className="w-5 h-5 text-amber-400 stroke-2" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400 stroke-2" />;
    }
  };

  const getTextoAsistencia = (estado: string | null | undefined) => {
    switch (estado) {
      case 'asistio':
        return 'Asistió';
      case 'no-asistio':
        return 'No asistió';
      case 'llego-tarde':
        return 'Llegó tarde';
      default:
        return 'Pendiente';
    }
  };

  const getBadgeClass = (estado: string | null | undefined) => {
    switch (estado) {
      case 'asistio':
        return 'bg-green-600';
      case 'no-asistio':
        return 'bg-red-600';
      case 'llego-tarde':
        return 'bg-amber-600';
      default:
        return 'bg-slate-600';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Registrar Asistencia</h1>
        <p className="text-slate-300">
          Registra la asistencia de tus pacientes a las citas programadas
        </p>
      </div>

      {/* Estadísticas de Asistencia */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-slate-700/50 to-slate-800/50 border-slate-600">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Total Citas</p>
              <p className="text-slate-100">{totalCitas}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Asistieron</p>
              <p className="text-green-400">{asistieron}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">No Asistieron</p>
              <p className="text-red-400">{noAsistieron}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Llegaron Tarde</p>
              <p className="text-amber-400">{llegaronTarde}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-violet-500/30">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Pendientes</p>
              <p className="text-violet-400">{pendientes}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Porcentaje de Asistencia */}
      <Card className="bg-gradient-to-br from-teal-500/10 to-violet-500/10 border-teal-500/30">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-300 mb-2">Tasa de Asistencia</p>
              <p className="text-slate-100">{porcentajeAsistencia}% de asistencia efectiva</p>
            </div>
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-violet-600 rounded-full flex items-center justify-center">
              <span className="text-white">{porcentajeAsistencia}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-200 flex items-center gap-2">
                <Search className="w-4 h-4 stroke-2" />
                Buscar paciente
              </label>
              <Input
                placeholder="Nombre del paciente..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>

            <div className="space-y-2">
              <label className="text-slate-200 flex items-center gap-2">
                <Calendar className="w-4 h-4 stroke-2" />
                Filtrar por fecha
              </label>
              <Select value={filtroFecha} onValueChange={setFiltroFecha}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="hoy">Hoy</SelectItem>
                  <SelectItem value="ayer">Ayer</SelectItem>
                  <SelectItem value="ultimos-7-dias">Últimos 7 días</SelectItem>
                  <SelectItem value="todas">Todas las fechas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Citas para Registrar Asistencia */}
      <div className="space-y-4">
        <h3 className="text-slate-100">Citas Realizadas ({citasFiltradas.length})</h3>

        {citasFiltradas.map((cita) => (
          <motion.div
            key={cita.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={`
              hover:shadow-lg transition-all bg-slate-800/50 backdrop-blur-sm border-slate-700
              ${!cita.asistencia ? 'border-violet-500/50' : ''}
            `}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex gap-4 flex-1">
                    <div className={`
                      w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg
                      ${cita.asistencia === 'asistio' ? 'bg-gradient-to-br from-green-500 to-green-600' : ''}
                      ${cita.asistencia === 'no-asistio' ? 'bg-gradient-to-br from-red-500 to-red-600' : ''}
                      ${cita.asistencia === 'llego-tarde' ? 'bg-gradient-to-br from-amber-500 to-amber-600' : ''}
                      ${!cita.asistencia ? 'bg-gradient-to-br from-slate-600 to-slate-700' : ''}
                    `}>
                      {getIconoAsistencia(cita.asistencia)}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-slate-100">{cita.paciente}</h3>
                        <Badge className={getBadgeClass(cita.asistencia)}>
                          {getTextoAsistencia(cita.asistencia)}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-400">
                          {cita.tipo}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-slate-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{cita.fecha}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{cita.hora}</span>
                        </div>
                        {cita.notasAsistencia && (
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="w-4 h-4 text-violet-400" />
                            <span className="text-sm text-slate-400">{cita.notasAsistencia}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleAbrirModal(cita)}
                    className={
                      cita.asistencia 
                        ? 'bg-violet-600 hover:bg-violet-700' 
                        : 'bg-teal-600 hover:bg-teal-700'
                    }
                  >
                    <FileText className="w-4 h-4 mr-2 stroke-2" />
                    {cita.asistencia ? 'Editar' : 'Registrar'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {citasFiltradas.length === 0 && (
          <Card className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No se encontraron citas con los filtros seleccionados</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal para Registrar/Editar Asistencia */}
      <Dialog open={modalRegistrar} onOpenChange={setModalRegistrar}>
        <DialogContent className="bg-slate-800 border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-teal-400 stroke-2" />
              Registrar Asistencia
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {citaSeleccionada && (
                <>Registra la asistencia de <span className="text-teal-400">{citaSeleccionada.paciente}</span> para la cita del {citaSeleccionada.fecha} a las {citaSeleccionada.hora}</>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Estado de Asistencia</Label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setEstadoAsistencia('asistio')}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${estadoAsistencia === 'asistio' 
                      ? 'border-green-500 bg-green-500/20' 
                      : 'border-slate-600 bg-slate-700/50 hover:border-green-500/50'
                    }
                  `}
                >
                  <CheckCircle2 className={`w-8 h-8 mx-auto mb-2 ${estadoAsistencia === 'asistio' ? 'text-green-400' : 'text-slate-400'}`} />
                  <p className={`text-sm ${estadoAsistencia === 'asistio' ? 'text-green-300' : 'text-slate-300'}`}>Asistió</p>
                </button>

                <button
                  onClick={() => setEstadoAsistencia('llego-tarde')}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${estadoAsistencia === 'llego-tarde' 
                      ? 'border-amber-500 bg-amber-500/20' 
                      : 'border-slate-600 bg-slate-700/50 hover:border-amber-500/50'
                    }
                  `}
                >
                  <AlertCircle className={`w-8 h-8 mx-auto mb-2 ${estadoAsistencia === 'llego-tarde' ? 'text-amber-400' : 'text-slate-400'}`} />
                  <p className={`text-sm ${estadoAsistencia === 'llego-tarde' ? 'text-amber-300' : 'text-slate-300'}`}>Llegó tarde</p>
                </button>

                <button
                  onClick={() => setEstadoAsistencia('no-asistio')}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${estadoAsistencia === 'no-asistio' 
                      ? 'border-red-500 bg-red-500/20' 
                      : 'border-slate-600 bg-slate-700/50 hover:border-red-500/50'
                    }
                  `}
                >
                  <XCircle className={`w-8 h-8 mx-auto mb-2 ${estadoAsistencia === 'no-asistio' ? 'text-red-400' : 'text-slate-400'}`} />
                  <p className={`text-sm ${estadoAsistencia === 'no-asistio' ? 'text-red-300' : 'text-slate-300'}`}>No asistió</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Notas Adicionales (Opcional)</Label>
              <Textarea
                placeholder="Ej: Llegó 10 minutos tarde por tráfico, Avisó con anticipación, etc..."
                value={notasAsistencia}
                onChange={(e) => setNotasAsistencia(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100"
                rows={4}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setModalRegistrar(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarAsistencia}
              className="bg-teal-600 hover:bg-teal-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 stroke-2" />
              Guardar Registro
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}