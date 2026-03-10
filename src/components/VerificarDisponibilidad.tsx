import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, ChevronLeft, ChevronRight, Plus, Lock, Unlock, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { ViewType } from './Dashboard';

interface VerificarDisponibilidadProps {
  onNavigate: (view: ViewType) => void;
}

export function VerificarDisponibilidad({ onNavigate }: VerificarDisponibilidadProps) {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date(2025, 10, 27)); // 27 Nov 2025
  const [modalBloquear, setModalBloquear] = useState(false);
  const [horarioABloquear, setHorarioABloquear] = useState<string | null>(null);
  const [motivoBloqueo, setMotivoBloqueo] = useState('');
  const [duracionBloqueo, setDuracionBloqueo] = useState('1-hora');

  // Horarios del día (8 AM - 6 PM)
  const horarios = [
    '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM'
  ];

  // Estado de disponibilidad de horarios
  const [disponibilidad, setDisponibilidad] = useState<{ [key: string]: { estado: 'disponible' | 'ocupado' | 'bloqueado', paciente?: string, tipo?: string } }>({
    '8:00 AM': { estado: 'disponible' },
    '9:00 AM': { estado: 'ocupado', paciente: 'Ana García Martínez', tipo: 'Terapia Individual' },
    '10:00 AM': { estado: 'disponible' },
    '11:00 AM': { estado: 'ocupado', paciente: 'Pedro González Sánchez', tipo: 'Terapia Familiar' },
    '12:00 PM': { estado: 'bloqueado' },
    '1:00 PM': { estado: 'disponible' },
    '2:00 PM': { estado: 'ocupado', paciente: 'Carlos Ramírez López', tipo: 'Seguimiento' },
    '3:00 PM': { estado: 'disponible' },
    '4:00 PM': { estado: 'disponible' },
    '5:00 PM': { estado: 'bloqueado' },
    '6:00 PM': { estado: 'disponible' },
  });

  const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  // Obtener semana actual
  const obtenerSemana = (fecha: Date) => {
    const semana = [];
    const primerDia = new Date(fecha);
    primerDia.setDate(fecha.getDate() - fecha.getDay()); // Ir al domingo

    for (let i = 0; i < 7; i++) {
      const dia = new Date(primerDia);
      dia.setDate(primerDia.getDate() + i);
      semana.push(dia);
    }
    return semana;
  };

  const semanaActual = obtenerSemana(fechaSeleccionada);

  const avanzarSemana = () => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(fechaSeleccionada.getDate() + 7);
    setFechaSeleccionada(nuevaFecha);
  };

  const retrocederSemana = () => {
    const nuevaFecha = new Date(fechaSeleccionada);
    nuevaFecha.setDate(fechaSeleccionada.getDate() - 7);
    setFechaSeleccionada(nuevaFecha);
  };

  const irHoy = () => {
    setFechaSeleccionada(new Date(2025, 10, 27)); // 27 Nov 2025
  };

  const handleBloquearHorario = (horario: string) => {
    setHorarioABloquear(horario);
    setModalBloquear(true);
  };

  const confirmarBloqueo = () => {
    if (horarioABloquear) {
      setDisponibilidad(prev => ({
        ...prev,
        [horarioABloquear]: { estado: 'bloqueado' }
      }));
    }
    toast.success('Horario bloqueado exitosamente', {
      description: `${horarioABloquear} ha sido bloqueado`
    });
    setModalBloquear(false);
    setMotivoBloqueo('');
    setHorarioABloquear(null);
  };

  const handleDesbloquearHorario = (horario: string) => {
    setDisponibilidad(prev => ({
      ...prev,
      [horario]: { estado: 'disponible' }
    }));
    toast.success('Horario desbloqueado', {
      description: `${horario} está ahora disponible`
    });
  };

  // Calcular estadísticas de disponibilidad
  const horariosDisponibles = Object.values(disponibilidad).filter(h => h.estado === 'disponible').length;
  const horariosOcupados = Object.values(disponibilidad).filter(h => h.estado === 'ocupado').length;
  const horariosBloqueados = Object.values(disponibilidad).filter(h => h.estado === 'bloqueado').length;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Verificar Disponibilidad</h1>
        <p className="text-slate-300">
          Consulta y gestiona tus horarios disponibles y bloqueados
        </p>
      </div>

      {/* Estadísticas de Disponibilidad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Horarios Disponibles</p>
                <p className="text-slate-100">{horariosDisponibles} espacios</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Horarios Ocupados</p>
                <p className="text-slate-100">{horariosOcupados} citas</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDays className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/10 border-red-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Horarios Bloqueados</p>
                <p className="text-slate-100">{horariosBloqueados} bloques</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navegación de Semana */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal-400 stroke-2" />
              {meses[fechaSeleccionada.getMonth()]} {fechaSeleccionada.getFullYear()}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={retrocederSemana}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={irHoy}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Hoy
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={avanzarSemana}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Vista Semanal de Disponibilidad */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-100">Disponibilidad Semanal</CardTitle>
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-slate-300">Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-teal-500 rounded"></div>
                <span className="text-slate-300">Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span className="text-slate-300">Bloqueado</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Días de la semana */}
          <div className="grid grid-cols-8 gap-2 mb-4">
            <div></div>
            {semanaActual.map((dia, index) => (
              <div key={index} className="text-center">
                <div className="text-slate-400 text-sm">{diasSemana[dia.getDay()]}</div>
                <div className={`text-slate-100 ${dia.getDate() === 27 ? 'bg-teal-600 rounded-full w-8 h-8 flex items-center justify-center mx-auto' : ''}`}>
                  {dia.getDate()}
                </div>
              </div>
            ))}
          </div>

          {/* Tabla de horarios */}
          <div className="space-y-2">
            {horarios.map((horario) => (
              <motion.div
                key={horario}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-8 gap-2 items-center"
              >
                <div className="text-slate-300 text-sm">{horario}</div>
                {semanaActual.map((dia, index) => {
                  const info = disponibilidad[horario];
                  const esDiaSeleccionado = dia.getDate() === fechaSeleccionada.getDate();

                  return (
                    <div key={index}>
                      {esDiaSeleccionado && info ? (
                        <div
                          className={`
                            p-2 rounded-lg text-center text-sm cursor-pointer transition-all
                            ${info.estado === 'disponible' ? 'bg-green-500/20 border border-green-500/50 hover:bg-green-500/30' : ''}
                            ${info.estado === 'ocupado' ? 'bg-teal-500/20 border border-teal-500/50' : ''}
                            ${info.estado === 'bloqueado' ? 'bg-red-500/20 border border-red-500/50 hover:bg-red-500/30' : ''}
                          `}
                          onClick={() => {
                            if (info.estado === 'disponible') {
                              handleBloquearHorario(horario);
                            } else if (info.estado === 'bloqueado') {
                              handleDesbloquearHorario(horario);
                            }
                          }}
                        >
                          {info.estado === 'disponible' && (
                            <span className="text-green-300 text-xs">Libre</span>
                          )}
                          {info.estado === 'ocupado' && (
                            <div>
                              <p className="text-teal-300 text-xs truncate">{info.paciente?.split(' ')[0]}</p>
                              <Badge className="bg-teal-600 text-xs mt-1">{info.tipo?.split(' ')[0]}</Badge>
                            </div>
                          )}
                          {info.estado === 'bloqueado' && (
                            <Lock className="w-4 h-4 text-red-300 mx-auto" />
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-slate-700/30 rounded-lg"></div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Horarios del Día Seleccionado */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">
            Detalle del Día - {fechaSeleccionada.getDate()} de {meses[fechaSeleccionada.getMonth()]}
          </CardTitle>
          <CardDescription className="text-slate-400">
            Gestiona los horarios de este día específico
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {horarios.map((horario) => {
            const info = disponibilidad[horario];
            return (
              <Card key={horario} className={`
                ${info.estado === 'disponible' ? 'bg-green-900/10 border-green-500/30' : ''}
                ${info.estado === 'ocupado' ? 'bg-teal-900/10 border-teal-500/30' : ''}
                ${info.estado === 'bloqueado' ? 'bg-red-900/10 border-red-500/30' : ''}
              `}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center
                        ${info.estado === 'disponible' ? 'bg-gradient-to-br from-green-500 to-green-600' : ''}
                        ${info.estado === 'ocupado' ? 'bg-gradient-to-br from-teal-500 to-teal-600' : ''}
                        ${info.estado === 'bloqueado' ? 'bg-gradient-to-br from-red-500 to-red-600' : ''}
                      `}>
                        <Clock className="w-6 h-6 text-white stroke-2" />
                      </div>
                      <div>
                        <p className="text-slate-100">{horario}</p>
                        {info.estado === 'ocupado' && (
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-slate-300 text-sm">{info.paciente}</p>
                            <Badge className="bg-teal-600 text-xs">{info.tipo}</Badge>
                          </div>
                        )}
                        {info.estado === 'disponible' && (
                          <p className="text-green-400 text-sm">Horario disponible</p>
                        )}
                        {info.estado === 'bloqueado' && (
                          <p className="text-red-400 text-sm">Horario bloqueado</p>
                        )}
                      </div>
                    </div>
                    <div>
                      {info.estado === 'disponible' && (
                        <Button
                          size="sm"
                          onClick={() => handleBloquearHorario(horario)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Lock className="w-4 h-4 mr-2 stroke-2" />
                          Bloquear
                        </Button>
                      )}
                      {info.estado === 'bloqueado' && (
                        <Button
                          size="sm"
                          onClick={() => handleDesbloquearHorario(horario)}
                          variant="outline"
                          className="border-green-600 text-green-400 hover:bg-green-600/20"
                        >
                          <Unlock className="w-4 h-4 mr-2 stroke-2" />
                          Desbloquear
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Modal para Bloquear Horario */}
      <Dialog open={modalBloquear} onOpenChange={setModalBloquear}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400 stroke-2" />
              Bloquear Horario
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Bloquea el horario de {horarioABloquear} para que no esté disponible para citas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Duración del Bloqueo</Label>
              <Select value={duracionBloqueo} onValueChange={setDuracionBloqueo}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="1-hora">1 hora</SelectItem>
                  <SelectItem value="2-horas">2 horas</SelectItem>
                  <SelectItem value="medio-dia">Medio día</SelectItem>
                  <SelectItem value="dia-completo">Día completo</SelectItem>
                  <SelectItem value="permanente">Permanente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Motivo (Opcional)</Label>
              <Textarea
                placeholder="Ej: Reunión administrativa, Descanso, Evento personal..."
                value={motivoBloqueo}
                onChange={(e) => setMotivoBloqueo(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setModalBloquear(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarBloqueo}
              className="bg-red-600 hover:bg-red-700"
            >
              <Lock className="w-4 h-4 mr-2 stroke-2" />
              Bloquear Horario
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}