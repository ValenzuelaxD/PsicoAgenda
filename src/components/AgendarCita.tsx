import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Check, Calendar as CalendarIcon, CalendarDays, User } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import { motion, AnimatePresence } from 'motion/react';
import { apiFetch, API_ENDPOINTS, CLIENT_CONFIG } from '../utils/api';
import { formatHourLabel, loadHourFormatPreference } from '../utils/timeFormat';

interface AgendarCitaProps {
  onNavigate: (view: ViewType) => void;
}

export function AgendarCita({ onNavigate }: AgendarCitaProps) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicioRango = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  const finRango = new Date(hoy);
  finRango.setDate(finRango.getDate() + CLIENT_CONFIG.APPOINTMENT_WINDOW_PATIENT_DAYS);
  finRango.setHours(23, 59, 59, 999);
  const finMesRango = new Date(finRango.getFullYear(), finRango.getMonth(), 1);

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
  const [loadingProximos, setLoadingProximos] = useState(false);
  const [loadingCalendario, setLoadingCalendario] = useState(false);
  const [mesCalendario, setMesCalendario] = useState<Date>(new Date());
  const [proximosHorarios, setProximosHorarios] = useState<Array<{ fecha: string; etiqueta: string; horarios: string[] }>>([]);
  const [fechasConDisponibilidad, setFechasConDisponibilidad] = useState<string[]>([]);
  const [hourFormatPreference] = useState(() => loadHourFormatPreference());

  const fechasConDisponibilidadSet = useMemo(() => new Set(fechasConDisponibilidad), [fechasConDisponibilidad]);
  const psicologoSeleccionado = useMemo(
    () => psicologos.find((item) => String(item.psicologaid) === psicologo),
    [psicologos, psicologo]
  );
  const hoyTexto = formatearFechaLocal(hoy);

  const obtenerFechasProximas = (dias = 7) => {
    const base = new Date();
    base.setHours(0, 0, 0, 0);

    return Array.from({ length: dias }, (_, index) => {
      const fecha = new Date(base);
      fecha.setDate(base.getDate() + index);
      return fecha;
    });
  };

  const filtrarHorariosPasados = (fechaSeleccionada: string, horariosDisponibles: string[]) => {
    const esHoy = formatearFechaLocal(new Date()) === fechaSeleccionada;
    if (!esHoy) {
      return horariosDisponibles;
    }

    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    return horariosDisponibles.filter((horario: string) => horario > horaActual);
  };

  const esFechaSeleccionable = (candidate: Date) => {
    if (candidate < hoy) {
      return false;
    }

    if (candidate > finRango) {
      return false;
    }

    if (!psicologo) {
      return true;
    }

    if (loadingCalendario) {
      return false;
    }

    return fechasConDisponibilidadSet.has(formatearFechaLocal(candidate));
  };

  const manejarCambioMes = (nextMonth: Date) => {
    const normalizado = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), 1);
    if (normalizado < inicioRango) {
      setMesCalendario(inicioRango);
      return;
    }

    if (normalizado > finMesRango) {
      setMesCalendario(finMesRango);
      return;
    }

    setMesCalendario(normalizado);
  };

  const seleccionarProximoDia = (fecha: string) => {
    const siguienteFecha = new Date(`${fecha}T00:00:00`);
    setDate(siguienteFecha);
    setMesCalendario(new Date(siguienteFecha.getFullYear(), siguienteFecha.getMonth(), 1));
    setHora('');
  };

  const usarPrimerDiaDisponible = () => {
    if (proximosHorarios.length === 0) {
      toast.error('No hay dias proximos disponibles para este profesional.');
      return;
    }

    const primerDia = proximosHorarios[0];
    seleccionarProximoDia(primerDia.fecha);
    toast.success('Se selecciono el primer dia disponible. Ahora elige tu horario.');
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [psicologosRes, tiposCitaRes] = await Promise.all([
          apiFetch(API_ENDPOINTS.PSICOLOGAS),
          apiFetch(API_ENDPOINTS.CITAS_TIPOS)
        ]);

        if (psicologosRes.ok) {
          const psicologosData = await psicologosRes.json();
          console.log('Psicólogos recibidos:', psicologosData);
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

            const horariosValidos = filtrarHorariosPasados(fechaSeleccionada, Array.isArray(data) ? data : []);
            if (horariosValidos.length === 0 && fechaSeleccionada === formatearFechaLocal(new Date())) {
              toast.error('No hay horarios disponibles para hoy. Selecciona otra fecha.');
            }

            setHorarios(horariosValidos);
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

  useEffect(() => {
    if (!psicologo) {
      setProximosHorarios([]);
      return;
    }

    const fetchProximosHorarios = async () => {
      setLoadingProximos(true);
      try {
        const fechas = obtenerFechasProximas(7);
        const resultados = await Promise.all(
          fechas.map(async (fechaDate) => {
            const fecha = formatearFechaLocal(fechaDate);
            const response = await apiFetch(`${API_ENDPOINTS.PSICOLOGAS}/${psicologo}/disponibilidad?fecha=${fecha}`);
            if (!response.ok) {
              return null;
            }

            const data = await response.json();
            const horarios = filtrarHorariosPasados(fecha, Array.isArray(data) ? data : []);
            if (horarios.length === 0) {
              return null;
            }

            return {
              fecha,
              etiqueta: fechaDate.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' }),
              horarios,
            };
          })
        );

        setProximosHorarios(resultados.filter((item): item is { fecha: string; etiqueta: string; horarios: string[] } => item !== null));
      } catch {
        setProximosHorarios([]);
      } finally {
        setLoadingProximos(false);
      }
    };

    fetchProximosHorarios();
  }, [psicologo]);

  useEffect(() => {
    if (!psicologo) {
      setFechasConDisponibilidad([]);
      return;
    }

    const fetchDisponibilidadMes = async () => {
      setLoadingCalendario(true);
      setFechasConDisponibilidad([]);

      try {
        const year = mesCalendario.getFullYear();
        const month = mesCalendario.getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();

        const fechasMes = Array.from({ length: lastDay }, (_, index) => {
          const fecha = new Date(year, month, index + 1);
          return formatearFechaLocal(fecha);
        }).filter((fecha) => {
          const fechaDate = new Date(`${fecha}T00:00:00`);
          if (fecha < hoyTexto) {
            return false;
          }

          return fechaDate <= finRango;
        });

        const resultados = await Promise.all(
          fechasMes.map(async (fecha) => {
            const response = await apiFetch(`${API_ENDPOINTS.PSICOLOGAS}/${psicologo}/disponibilidad?fecha=${fecha}`);
            if (!response.ok) {
              return null;
            }

            const data = await response.json();
            const horarios = filtrarHorariosPasados(fecha, Array.isArray(data) ? data : []);
            return horarios.length > 0 ? fecha : null;
          })
        );

        setFechasConDisponibilidad(resultados.filter((fecha): fecha is string => fecha !== null));
      } catch {
        setFechasConDisponibilidad([]);
      } finally {
        setLoadingCalendario(false);
      }
    };

    fetchDisponibilidadMes();
  }, [hoyTexto, psicologo, mesCalendario]);

  useEffect(() => {
    if (!date || !psicologo || loadingCalendario) {
      return;
    }

    if (!esFechaSeleccionable(date)) {
      setDate(undefined);
      setHora('');
    }
  }, [date, psicologo, loadingCalendario, fechasConDisponibilidadSet]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validación: No permitir citas en el pasado
    if (date) {
      const esHoy = formatearFechaLocal(new Date()) === formatearFechaLocal(date);
      if (esHoy) {
        const ahora = new Date();
        const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        if (hora <= horaActual) {
          toast.error('No puedes agendar una cita en una hora que ya pasó. Selecciona una hora posterior.');
          return;
        }
      }
    }

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
    } catch (error: any) {
      toast.error(error?.message || 'Error al agendar la cita.');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-0 space-y-8">
      <div>
        <h1 className="text-white mb-2 text-xl sm:text-2xl">Solicitar Cita</h1>
        <p className="text-slate-300 text-sm sm:text-base">
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
                  <Select value={psicologo} onValueChange={(value) => {
                    setPsicologo(value);
                    setDate(undefined);
                    setHora('');
                    setMesCalendario(inicioRango);
                  }} required>
                                      <SelectTrigger id="psicologo" className="bg-slate-700/50 border-slate-600 text-slate-200">
                                        <SelectValue 
                                          placeholder={loadingInicial ? 'Cargando profesionales...' : 'Elige un profesional'}
                                        />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {psicologos.map((psi) => (
                                          <SelectItem 
                                            key={psi.psicologaid} 
                                            value={String(psi.psicologaid)}
                                          >
                                            <div className="flex items-center gap-2 w-full">
                                              {psi.fotoperfil && (
                                                <img
                                                  src={psi.fotoperfil}
                                                  alt={`${psi.nombre}`}
                                                  className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                  loading="lazy"
                                                />
                                              )}
                                              {!psi.fotoperfil && (
                                                <User className="w-5 h-5 flex-shrink-0 text-slate-400" />
                                              )}
                                              <span>{`${psi.nombre} ${psi.apellidopaterno}`}</span>
                                            </div>
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
                                        {horarios.length === 0 && !loadingHorarios && (
                                          <SelectItem value="__sin_horarios__" disabled>
                                            {psicologo && date ? 'No hay horarios disponibles' : 'Selecciona psicólogo y fecha'}
                                          </SelectItem>
                                        )}
                                        {horarios.map((h) => (
                                          <SelectItem key={h} value={h}>
                                            {formatHourLabel(h, hourFormatPreference)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-slate-200 flex items-center gap-2">
                                        <CalendarDays className="w-4 h-4" />
                                        Próximos dias disponibles
                                      </Label>
                                      {loadingProximos && <span className="text-xs text-slate-400">Buscando...</span>}
                                    </div>
                                    <div className="rounded-lg border border-slate-600 bg-slate-700/30 p-3 space-y-3">
                                      {!psicologo ? (
                                        <p className="text-sm text-slate-400">Selecciona un psicologo para ver dias sugeridos.</p>
                                      ) : loadingProximos ? (
                                        <p className="text-sm text-slate-400">Consultando próximos espacios...</p>
                                      ) : proximosHorarios.length === 0 ? (
                                        <p className="text-sm text-slate-400">No hay horarios próximos disponibles.</p>
                                      ) : (
                                        <>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full border-teal-500/40 text-teal-300 hover:bg-teal-500/10"
                                            onClick={usarPrimerDiaDisponible}
                                          >
                                            Usar primer dia disponible
                                          </Button>
                                          <div className="flex flex-wrap gap-2">
                                            {proximosHorarios.slice(0, 6).map((item) => {
                                              const activo = date && formatearFechaLocal(date) === item.fecha;

                                              return (
                                                <Button
                                                  key={item.fecha}
                                                  type="button"
                                                  variant="outline"
                                                  className={activo
                                                    ? 'border-teal-400 bg-teal-500/20 text-teal-100 hover:bg-teal-500/30'
                                                    : 'border-slate-500 text-slate-200 hover:bg-slate-600/50'
                                                  }
                                                  onClick={() => seleccionarProximoDia(item.fecha)}
                                                >
                                                  {item.etiqueta} · {item.horarios.length} horarios
                                                </Button>
                                              );
                                            })}
                                          </div>
                                          <p className="text-xs text-slate-400">
                                            Primero selecciona el dia aqui y despues elige la hora en el apartado Horario.
                                          </p>
                                        </>
                                      )}
                                    </div>
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
                            <div className="space-y-6 w-full">
                              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                                <CardHeader>
                                  <CardTitle className="text-slate-100">Selecciona una fecha</CardTitle>
                                  <CardDescription className="text-slate-400">
                                    Elige un día con disponibilidad dentro de los próximos {CLIENT_CONFIG.APPOINTMENT_WINDOW_PATIENT_DAYS} días.
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={(nextDate: Date | undefined) => {
                                      if (!nextDate || !esFechaSeleccionable(nextDate)) {
                                        return;
                                      }
                                      setDate(nextDate);
                                      setHora('');
                                    }}
                                    month={mesCalendario}
                                    onMonthChange={manejarCambioMes}
                                    fromMonth={inicioRango}
                                    toMonth={finMesRango}
                                    className="rounded-md border w-full max-w-full"
                                    disabled={(candidateDate: Date) => !esFechaSeleccionable(candidateDate)}
                                    modifiers={{
                                      disponible: (candidateDate) => esFechaSeleccionable(candidateDate),
                                    }}
                                    modifiersClassNames={{
                                      disponible: 'ring-1 ring-teal-400/40 bg-teal-500/10 text-teal-200',
                                    }}
                                  />
                                  {loadingCalendario && <p className="text-xs text-slate-400">Actualizando disponibilidad...</p>}
                                </CardContent>
                              </Card>
                  
                              {date && psicologo && hora && tipo && (
                                <Card className="bg-gradient-to-br from-teal-900/40 to-violet-900/40 border-teal-500/50 backdrop-blur-sm shadow-lg">
                                  <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-slate-100">
                                      <CalendarIcon className="w-5 h-5 stroke-2 text-teal-400" />
                                      Resumen de la Cita
                                    </CardTitle>
                                  </CardHeader>
                                  <CardContent className="space-y-2">
                                    <div className="flex items-center gap-3 rounded-lg border border-slate-600/60 bg-slate-900/30 p-2">
                                      {psicologoSeleccionado?.fotoperfil ? (
                                        <img
                                          src={psicologoSeleccionado.fotoperfil}
                                          alt={`${psicologoSeleccionado.nombre} ${psicologoSeleccionado.apellidopaterno}`}
                                          className="w-10 h-10 rounded-full object-cover border border-teal-400/40"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full border border-slate-500 bg-slate-700/60 flex items-center justify-center">
                                          <User className="w-5 h-5 text-slate-300" />
                                        </div>
                                      )}
                                      <div className="min-w-0">
                                        <p className="text-xs text-slate-400">Profesional seleccionado</p>
                                        <p className="text-slate-100 truncate">{psicologoSeleccionado ? `${psicologoSeleccionado.nombre} ${psicologoSeleccionado.apellidopaterno}` : 'Pendiente'}</p>
                                      </div>
                                    </div>
                                    <p className="text-slate-200">
                                      <span className="font-medium text-teal-300">Psicólogo:</span> {psicologoSeleccionado?.nombre} {psicologoSeleccionado?.apellidopaterno}
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
                                      <span className="font-medium text-violet-300">Hora:</span> {formatHourLabel(hora, hourFormatPreference)}
                                    </p>
                                  </CardContent>
                                </Card>
                              )}
                            </div>
                          </div>
                  
                          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                            <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={!date || !psicologo || !hora || !tipo}>
                              Confirmar Cita
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => onNavigate('inicio')}
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full sm:w-auto"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </div>
                    );
                  }
                  