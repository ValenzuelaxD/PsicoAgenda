import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Check, Calendar as CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch, API_ENDPOINTS } from '../utils/api';

interface AgendarCitaProps {
  onNavigate: (view: ViewType) => void;
}

export function AgendarCita({ onNavigate }: AgendarCitaProps) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const formatearFechaLocal = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [date, setDate] = useState<Date | undefined>(new Date());
  const [psicologo, setPsicologo] = useState('');
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState('');
  const [notas, setNotas] = useState('');
  const [mostrarExito, setMostrarExito] = useState(false);

  const [psicologos, setPsicologos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  const [tiposCita, setTiposCita] = useState<string[]>([]);
  const [loadingInicial, setLoadingInicial] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [psicologosRes, tiposCitaRes] = await Promise.all([
          apiFetch(API_ENDPOINTS.PSICOLOGAS),
          apiFetch(API_ENDPOINTS.CITAS_TIPOS)
        ]);

        if (psicologosRes.ok) {
          const psicologosData = await psicologosRes.json();
          setPsicologos(psicologosData);
        }

        if (tiposCitaRes.ok) {
          const tiposCitaData = await tiposCitaRes.json();
          setTiposCita(tiposCitaData);
        }
      } catch (error) {
        toast.error('Error al cargar datos iniciales.');
      } finally {
        setLoadingInicial(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (psicologo && date) {
      const fetchHorarios = async () => {
        setLoadingHorarios(true);
        try {
          const fechaSeleccionada = formatearFechaLocal(date);
          const response = await apiFetch(`${API_ENDPOINTS.PSICOLOGAS}/${psicologo}/disponibilidad?fecha=${fechaSeleccionada}`);
          if (response.ok) {
            const data = await response.json();
            setHorarios(data);
          } else {
            const errorData = await response.json().catch(() => null);
            if (errorData?.message) {
              toast.error(errorData.message);
            }
            setHorarios([]);
          }
        } catch (error) {
          toast.error('Error al cargar horarios.');
          setHorarios([]);
        } finally {
          setLoadingHorarios(false);
        }
      };
      fetchHorarios();
    } else {
      setHorarios([]);
    }
  }, [psicologo, date]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await apiFetch(API_ENDPOINTS.CITAS, {
        method: 'POST',
        body: JSON.stringify({
          psicologaId: psicologo,
          fecha: date ? formatearFechaLocal(date) : undefined,
          hora,
          modalidad: tipo,
          notas,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error al agendar la cita.');
      }

      toast.success('Cita solicitada exitosamente', {
        description: 'Podrás revisar el estado de la solicitud desde Mis Citas y tus notificaciones.'
      });
      setMostrarExito(true);
      setTimeout(() => {
        onNavigate('citas');
      }, 1500);
    } catch (error) {
      toast.error('Error al agendar la cita.');
    }
  };

  if (mostrarExito) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="bg-gradient-to-br from-teal-900/50 to-violet-900/50 border-teal-500/50 backdrop-blur-sm">
            <CardContent className="pt-12 pb-12 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
              >
                <Check className="w-10 h-10 text-white stroke-2" />
              </motion.div>
              <h2 className="text-white mb-3">¡Cita Agendada Exitosamente!</h2>
              <p className="text-teal-300 mb-2">
                Revisa Mis Citas y el centro de notificaciones para ver actualizaciones
              </p>
              <p className="text-slate-400 text-sm">
                Redirigiendo a tus citas...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Agendar Nueva Cita</h1>
        <p className="text-slate-300">
          Selecciona el profesional, fecha y hora para tu próxima sesión
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">Información de la Cita</CardTitle>
                <CardDescription className="text-slate-400">
                  Completa los detalles de tu sesión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="psicologo" className="text-slate-200">Seleccionar Psicólogo</Label>
                  <Select value={psicologo} onValueChange={setPsicologo} required>
                                      <SelectTrigger id="psicologo" className="bg-slate-700/50 border-slate-600 text-slate-200">
                                        <SelectValue placeholder={loadingInicial ? 'Cargando profesionales...' : 'Elige un profesional'} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {psicologos.map((psi) => (
                                          <SelectItem key={psi.psicologaid} value={String(psi.psicologaid)}>
                                            {`${psi.nombre} ${psi.apellidopaterno}`}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                  
                                  <div className="space-y-2">
                                    <Label htmlFor="tipo" className="text-slate-200">Tipo de Cita</Label>
                                    <Select value={tipo} onValueChange={setTipo} required>
                                      <SelectTrigger id="tipo" className="bg-slate-700/50 border-slate-600 text-slate-200">
                                        <SelectValue placeholder={loadingInicial ? 'Cargando modalidades...' : 'Selecciona la modalidad'} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {tiposCita.map((t) => (
                                          <SelectItem key={t} value={t}>
                                            {t}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                  
                                  <div className="space-y-2">
                                    <Label htmlFor="hora" className="text-slate-200">Horario</Label>
                                    <Select value={hora} onValueChange={setHora} required>
                                      <SelectTrigger id="hora" className="bg-slate-700/50 border-slate-600 text-slate-200">
                                        <SelectValue placeholder={loadingHorarios ? 'Cargando horarios...' : 'Selecciona la hora'} />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {horarios.length === 0 && (
                                          <SelectItem value="__sin_horarios__" disabled>
                                            No hay horarios disponibles
                                          </SelectItem>
                                        )}
                                        {horarios.map((h) => (
                                          <SelectItem key={h} value={h}>
                                            {h}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                  
                                  <div className="space-y-2">
                                    <Label htmlFor="notas" className="text-slate-200">Notas Adicionales (Opcional)</Label>
                                    <Textarea
                                      id="notas"
                                      placeholder="Describe brevemente el motivo de la consulta..."
                                      value={notas}
                                      onChange={(e) => setNotas(e.target.value)}
                                      rows={4}
                                      className="bg-slate-700/50 border-slate-600 text-slate-200 placeholder:text-slate-500"
                                    />
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                  
                            {/* Columna Derecha */}
                            <div className="space-y-6">
                              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                                <CardHeader>
                                  <CardTitle className="text-slate-100">Seleccionar Fecha</CardTitle>
                                  <CardDescription className="text-slate-400">
                                    Elige el día para tu sesión
                                  </CardDescription>
                                </CardHeader>
                                <CardContent>
                                  <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    className="rounded-md border border-slate-600"
                                    disabled={(date) => date < hoy}
                                  />
                                </CardContent>
                              </Card>
                  
                              {date && psicologo && hora && tipo && (
                                <motion.div
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.3 }}
                                >
                                  <Card className="bg-gradient-to-br from-teal-900/40 to-violet-900/40 border-teal-500/50 backdrop-blur-sm shadow-lg">
                                    <CardHeader>
                                      <CardTitle className="flex items-center gap-2 text-slate-100">
                                        <CalendarIcon className="w-5 h-5 stroke-2 text-teal-400" />
                                        Resumen de la Cita
                                      </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                      <p className="text-slate-200">
                                        <span className="font-medium text-teal-300">Psicólogo:</span> {psicologos.find(p => String(p.psicologaid) === psicologo)?.nombre} {psicologos.find(p => String(p.psicologaid) === psicologo)?.apellidopaterno}
                                      </p>
                                      <p className="text-slate-200">
                                        <span className="font-medium text-violet-300">Modalidad:</span> {tipo}
                                      </p>
                                      <p className="text-slate-200">
                                        <span className="font-medium text-teal-300">Fecha:</span>{' '}
                                        {date.toLocaleDateString('es-ES', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric',
                                        })}
                                      </p>
                                      <p className="text-slate-200">
                                        <span className="font-medium text-violet-300">Hora:</span> {hora}
                                      </p>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              )}
                            </div>
                          </div>
                  
                          <div className="flex gap-4 mt-6">
                            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={!date || !psicologo || !hora || !tipo}>
                              Confirmar Cita
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onNavigate('inicio')}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </div>
                    );
                  }
                  