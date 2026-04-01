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
import { Calendar as DateCalendar } from './ui/calendar';
import { ViewType } from './Dashboard';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Cita, ESTADO_CITA, MODALIDAD_CITA } from '../utils/types';
import { apiFetch, API_ENDPOINTS } from '../utils/api';

interface MisCitasProps {
  userType: 'psicologo' | 'paciente' | 'admin';
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
  const [horasDisponiblesReagenda, setHorasDisponiblesReagenda] = useState<string[]>([]);
  const [horasDisponiblesEdicion, setHorasDisponiblesEdicion] = useState<string[]>([]);
  const [loadingHorasReagenda, setLoadingHorasReagenda] = useState(false);
  const [loadingHorasEdicion, setLoadingHorasEdicion] = useState(false);
  const [diasDisponiblesReagenda, setDiasDisponiblesReagenda] = useState<string[]>([]);
  const [diasDisponiblesEdicion, setDiasDisponiblesEdicion] = useState<string[]>([]);
  const [loadingDiasReagenda, setLoadingDiasReagenda] = useState(false);
  const [loadingDiasEdicion, setLoadingDiasEdicion] = useState(false);
  const [mesCalendarioReagenda, setMesCalendarioReagenda] = useState(new Date());
  const [mesCalendarioEdicion, setMesCalendarioEdicion] = useState(new Date());

  const fetchCitas = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiFetch(API_ENDPOINTS.CITAS);

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

  useEffect(() => {
    fetchCitas();
  }, []);


  // Estados para Consultar Agenda
  const [mesActual, setMesActual] = useState(new Date());
  const [busquedaAgenda, setBusquedaAgenda] = useState('');
  const [filtroPaciente, setFiltroPaciente] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [citaSeleccionadaAgenda, setCitaSeleccionadaAgenda] = useState<number | null>(null);

  const listaPacientesUnicos = Array.from(new Set(citas.map(c => `${c.paciente_nombre} ${c.paciente_apellido}`)));

  const esEstado = (estado: string, objetivo: string) => estado?.toLowerCase() === objetivo.toLowerCase();
  const obtenerEstiloEstado = (estado: string) => {
    if (esEstado(estado, ESTADO_CITA.CONFIRMADA)) {
      return {
        label: 'Confirmada',
        badgeClass: 'bg-green-600 text-white',
        softBadgeClass: 'bg-green-600/20 text-green-300 border-green-600/50',
        indicatorClass: 'bg-green-500',
      };
    }

    if (esEstado(estado, ESTADO_CITA.CANCELADA)) {
      return {
        label: 'Cancelada',
        badgeClass: 'bg-red-600 text-white',
        softBadgeClass: 'bg-red-600/20 text-red-300 border-red-600/50',
        indicatorClass: 'bg-red-500',
      };
    }

    if (esEstado(estado, ESTADO_CITA.COMPLETADA)) {
      return {
        label: 'Completada',
        badgeClass: 'bg-slate-600 text-white',
        softBadgeClass: 'bg-slate-600/20 text-slate-300 border-slate-600/50',
        indicatorClass: 'bg-slate-500',
      };
    }

    return {
      label: 'Pendiente',
      badgeClass: 'bg-amber-600 text-white',
      softBadgeClass: 'bg-amber-600/20 text-amber-300 border-amber-600/50',
      indicatorClass: 'bg-amber-500',
    };
  };
  const esModalidadEnLinea = (modalidad: string) => modalidad?.toLowerCase() === MODALIDAD_CITA.EN_LINEA.toLowerCase() || modalidad?.toLowerCase() === 'virtual';
  const obtenerUbicacion = (cita: Cita & { ubicacion?: string }) => {
    if (cita.ubicacion) {
      return cita.ubicacion;
    }

    return esModalidadEnLinea(cita.modalidad) ? 'Sesion en linea' : 'Consultorio por confirmar';
  };
  const extraerFechaHoraLocal = (fechaHora: string) => {
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

  const formatearFechaInput = (fechaHora: string) => extraerFechaHoraLocal(fechaHora).fecha;

  const formatearHoraInput = (fechaHora: string) => extraerFechaHoraLocal(fechaHora).hora;

  const formatearFechaVisual = (fechaHora: string) => {
    const fecha = formatearFechaInput(fechaHora);
    if (!fecha) {
      return '--/--/----';
    }

    const [year, month, day] = fecha.split('-');
    return `${day}/${month}/${year}`;
  };

  const formatearHoraVisual = (fechaHora: string) => {
    const hora = formatearHoraInput(fechaHora);
    if (!hora) {
      return '--:--';
    }

    const [hourRaw, minuteRaw] = hora.split(':').map(Number);
    if (Number.isNaN(hourRaw) || Number.isNaN(minuteRaw)) {
      return hora;
    }

    const sufijo = hourRaw >= 12 ? 'p.m.' : 'a.m.';
    const hour12 = ((hourRaw + 11) % 12) + 1;
    return `${hour12}:${String(minuteRaw).padStart(2, '0')}:00 ${sufijo}`;
  };

  const obtenerFechaMinimaReagenda = () => {
    const hoy = new Date();
    const year = hoy.getFullYear();
    const month = `${hoy.getMonth() + 1}`.padStart(2, '0');
    const day = `${hoy.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatearFechaLocal = (fecha: Date) => {
    const year = fecha.getFullYear();
    const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
    const day = `${fecha.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const convertirInputADate = (fecha: string) => {
    if (!fecha) {
      return undefined;
    }

    const date = new Date(`${fecha}T00:00:00`);
    return Number.isNaN(date.getTime()) ? undefined : date;
  };

  const esFechaHoraPasada = (fecha: string, hora: string) => {
    const fechaHora = new Date(`${fecha}T${String(hora).slice(0, 5)}:00`);
    return !Number.isNaN(fechaHora.getTime()) && fechaHora < new Date();
  };

  const filtrarHorariosPasados = (fechaSeleccionada: string, horariosDisponibles: string[]) => {
    const hoy = obtenerFechaMinimaReagenda();
    if (fechaSeleccionada !== hoy) {
      return horariosDisponibles;
    }

    const ahora = new Date();
    const horaActual = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    return horariosDisponibles.filter((horario) => horario > horaActual);
  };

  const obtenerHorasDisponibles = async (cita: Cita, fechaSeleccionada: string) => {
    if (!cita.psicologaid || !fechaSeleccionada) {
      return [];
    }

    const params = new URLSearchParams({ fecha: fechaSeleccionada });
    params.set('citaIdExcluir', String(cita.citaid));

    const response = await apiFetch(`${API_ENDPOINTS.PSICOLOGAS}/${cita.psicologaid}/disponibilidad?${params.toString()}`);
    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const horarios = Array.isArray(data) ? data : [];
    return filtrarHorariosPasados(fechaSeleccionada, horarios);
  };

  const obtenerDiasDisponiblesMes = async (cita: Cita, mesCalendario: Date) => {
    if (!cita.psicologaid) {
      return [];
    }

    const year = mesCalendario.getFullYear();
    const month = mesCalendario.getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const fechasMes = Array.from({ length: lastDay }, (_, index) => {
      const fecha = new Date(year, month, index + 1);
      return formatearFechaLocal(fecha);
    });

    const resultados = await Promise.all(
      fechasMes.map(async (fecha) => {
        const params = new URLSearchParams({ fecha, citaIdExcluir: String(cita.citaid) });
        const response = await apiFetch(`${API_ENDPOINTS.PSICOLOGAS}/${cita.psicologaid}/disponibilidad?${params.toString()}`);
        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        const horarios = filtrarHorariosPasados(fecha, Array.isArray(data) ? data : []);
        return horarios.length > 0 ? fecha : null;
      })
    );

    return resultados.filter((fecha): fecha is string => fecha !== null);
  };

  const actualizarFechaHoraCita = (cita: Cita, fecha: string, hora: string) => {
    // Mantener formato local y evitar conversiones a UTC mientras el usuario edita.
    return { ...cita, fechahora: `${fecha}T${hora}:00` };
  };

  useEffect(() => {
    if (!citaAReagendar) {
      setHorasDisponiblesReagenda([]);
      return;
    }

    const cargarHoras = async () => {
      setLoadingHorasReagenda(true);
      try {
        const fechaSeleccionada = formatearFechaInput(citaAReagendar.fechahora);
        const horaSeleccionada = formatearHoraInput(citaAReagendar.fechahora);
        const disponibles = await obtenerHorasDisponibles(citaAReagendar, fechaSeleccionada);
        setHorasDisponiblesReagenda(disponibles);

        if (disponibles.length > 0 && !disponibles.includes(horaSeleccionada)) {
          setCitaAReagendar((prev) => {
            if (!prev) {
              return prev;
            }

            return actualizarFechaHoraCita(prev, fechaSeleccionada, disponibles[0]);
          });
        }
      } catch {
        setHorasDisponiblesReagenda([]);
      } finally {
        setLoadingHorasReagenda(false);
      }
    };

    cargarHoras();
  }, [citaAReagendar?.citaid, citaAReagendar?.fechahora]);

  useEffect(() => {
    if (!citaAReagendar) {
      setDiasDisponiblesReagenda([]);
      return;
    }

    const cargarDias = async () => {
      setLoadingDiasReagenda(true);
      try {
        const dias = await obtenerDiasDisponiblesMes(citaAReagendar, mesCalendarioReagenda);
        setDiasDisponiblesReagenda(dias);
      } catch {
        setDiasDisponiblesReagenda([]);
      } finally {
        setLoadingDiasReagenda(false);
      }
    };

    cargarDias();
  }, [citaAReagendar?.citaid, mesCalendarioReagenda]);

  useEffect(() => {
    if (!citaAReagendar) {
      return;
    }

    const fecha = convertirInputADate(formatearFechaInput(citaAReagendar.fechahora));
    if (fecha) {
      setMesCalendarioReagenda(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
    }
  }, [citaAReagendar?.citaid]);

  useEffect(() => {
    if (!citaAEditar) {
      setHorasDisponiblesEdicion([]);
      return;
    }

    const cargarHoras = async () => {
      setLoadingHorasEdicion(true);
      try {
        const fechaSeleccionada = formatearFechaInput(citaAEditar.fechahora);
        const horaSeleccionada = formatearHoraInput(citaAEditar.fechahora);
        const disponibles = await obtenerHorasDisponibles(citaAEditar, fechaSeleccionada);
        setHorasDisponiblesEdicion(disponibles);

        if (disponibles.length > 0 && !disponibles.includes(horaSeleccionada)) {
          setCitaAEditar((prev) => {
            if (!prev) {
              return prev;
            }

            return actualizarFechaHoraCita(prev, fechaSeleccionada, disponibles[0]);
          });
        }
      } catch {
        setHorasDisponiblesEdicion([]);
      } finally {
        setLoadingHorasEdicion(false);
      }
    };

    cargarHoras();
  }, [citaAEditar?.citaid, citaAEditar?.fechahora]);

  useEffect(() => {
    if (!citaAEditar) {
      setDiasDisponiblesEdicion([]);
      return;
    }

    const cargarDias = async () => {
      setLoadingDiasEdicion(true);
      try {
        const dias = await obtenerDiasDisponiblesMes(citaAEditar, mesCalendarioEdicion);
        setDiasDisponiblesEdicion(dias);
      } catch {
        setDiasDisponiblesEdicion([]);
      } finally {
        setLoadingDiasEdicion(false);
      }
    };

    cargarDias();
  }, [citaAEditar?.citaid, mesCalendarioEdicion]);

  useEffect(() => {
    if (!citaAEditar) {
      return;
    }

    const fecha = convertirInputADate(formatearFechaInput(citaAEditar.fechahora));
    if (fecha) {
      setMesCalendarioEdicion(new Date(fecha.getFullYear(), fecha.getMonth(), 1));
    }
  }, [citaAEditar?.citaid]);


  const handleCancelarCita = async () => {
    if (citaACancelar) {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.CITAS}/${citaACancelar}/cancel`, {
          method: 'PUT',
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No fue posible cancelar la cita.');
        }

        setCitas((prev) => prev.map((cita) => (cita.citaid === citaACancelar ? { ...cita, ...data } : cita)));
        toast.success('Cita cancelada exitosamente', {
          description: `Se ha notificado al ${userType === 'psicologo' ? 'paciente' : 'profesional'}`,
        });
      } catch (error: any) {
        toast.error(error.message || 'Error al cancelar la cita.');
      }
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

  const handleGuardarEdicionCita = async (e: React.FormEvent) => {
    e.preventDefault();
    if (citaAEditar) {
      try {
        const fechaSeleccionada = formatearFechaInput(citaAEditar.fechahora);
        const horaSeleccionada = formatearHoraInput(citaAEditar.fechahora);

        if (esFechaHoraPasada(fechaSeleccionada, horaSeleccionada)) {
          toast.error('No puedes reagendar una cita en una fecha u hora pasada.');
          return;
        }

        if (horasDisponiblesEdicion.length === 0 || !horasDisponiblesEdicion.includes(horaSeleccionada)) {
          toast.error('Selecciona una hora disponible para la fecha elegida.');
          return;
        }

        const response = await apiFetch(`${API_ENDPOINTS.CITAS}/${citaAEditar.citaid}`, {
          method: 'PUT',
          body: JSON.stringify({
            fecha: fechaSeleccionada,
            hora: horaSeleccionada,
            modalidad: citaAEditar.modalidad,
            estado: citaAEditar.estado,
            notasPsicologa: citaAEditar.notaspsicologa || '',
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No fue posible actualizar la cita.');
        }

        setCitas((prev) => prev.map((cita) => (cita.citaid === citaAEditar.citaid ? { ...cita, ...data, paciente_nombre: cita.paciente_nombre, paciente_apellido: cita.paciente_apellido, ubicacion: cita.ubicacion } : cita)));
        toast.success('Cita modificada exitosamente', {
          description: 'Los cambios han sido guardados.',
        });
        setCitaAEditar(null);
      } catch (error: any) {
        toast.error(error.message || 'Error al guardar la cita.');
      }
    }
  };

  const handleConfirmarCita = async (citaId: number) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.CITAS}/${citaId}/confirm`, {
        method: 'PUT',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible confirmar la cita.');
      }

      setCitas((prev) => prev.map((cita) => (cita.citaid === citaId ? { ...cita, ...data } : cita)));
      toast.success('Cita confirmada exitosamente', {
        description: 'El estado ya se actualizó en la base de datos.',
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al confirmar la cita.');
    }
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
  
  const handleGuardarReagendamiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (citaAReagendar) {
      try {
        const fechaSeleccionada = formatearFechaInput(citaAReagendar.fechahora);
        const horaSeleccionada = formatearHoraInput(citaAReagendar.fechahora);

        if (esFechaHoraPasada(fechaSeleccionada, horaSeleccionada)) {
          toast.error('No puedes reagendar una cita en una fecha u hora pasada.');
          return;
        }

        if (horasDisponiblesReagenda.length === 0 || !horasDisponiblesReagenda.includes(horaSeleccionada)) {
          toast.error('Selecciona una hora disponible para la fecha elegida.');
          return;
        }

        const response = await apiFetch(`${API_ENDPOINTS.CITAS}/${citaAReagendar.citaid}`, {
          method: 'PUT',
          body: JSON.stringify({
            fecha: fechaSeleccionada,
            hora: horaSeleccionada,
            modalidad: citaAReagendar.modalidad,
            estado: ESTADO_CITA.PENDIENTE,
            notasPaciente: citaAReagendar.notaspaciente || citaAReagendar.notas || '',
          }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No fue posible reagendar la cita.');
        }

        setCitas((prev) => prev.map((cita) => (cita.citaid === citaAReagendar.citaid ? { ...cita, ...data, psicologa_nombre: cita.psicologa_nombre, psicologa_apellido: cita.psicologa_apellido, ubicacion: cita.ubicacion } : cita)));
        toast.success('Reagendamiento guardado', {
          description: 'La cita fue actualizada y notificada.',
        });
        setCitaAReagendar(null);
      } catch (error: any) {
        toast.error(error.message || 'Error al reagendar la cita.');
      }
    }
  };

  if (loading) {
    return <div>Cargando citas...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const ahora = new Date();
  const citasProximas = citas
    .filter((c) => new Date(c.fechahora) >= ahora)
    .sort((a, b) => new Date(a.fechahora).getTime() - new Date(b.fechahora).getTime());

  const citasPasadas = citas
    .filter((c) => new Date(c.fechahora) < ahora)
    .sort((a, b) => new Date(b.fechahora).getTime() - new Date(a.fechahora).getTime());
  const citaConNotas = citasPasadas.find(c => c.citaid === citaNotasVisibles);
  const esMismoMes = (fecha: Date, referencia: Date) => fecha.getMonth() === referencia.getMonth() && fecha.getFullYear() === referencia.getFullYear();
  const esMismoDia = (fecha: Date, referencia: Date) => fecha.toDateString() === referencia.toDateString();
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay());
  inicioSemana.setHours(0, 0, 0, 0);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(inicioSemana.getDate() + 7);
  const citasMesActual = citas.filter((cita) => esMismoMes(new Date(cita.fechahora), mesActual));
  const citasHoy = citas.filter((cita) => esMismoDia(new Date(cita.fechahora), ahora));
  const citasSemana = citas.filter((cita) => {
    const fecha = new Date(cita.fechahora);
    return fecha >= inicioSemana && fecha < finSemana;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-8">
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
        <TabsList className="bg-slate-800 border-slate-700 w-full justify-start overflow-x-auto gap-1">
          <TabsTrigger value="proximas" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white whitespace-nowrap">Próximas Citas</TabsTrigger>
          <TabsTrigger value="pasadas" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white whitespace-nowrap">Historial</TabsTrigger>
          <TabsTrigger value="agenda" className="data-[state=active]:bg-teal-600 data-[state=active]:text-white whitespace-nowrap">Consultar Agenda</TabsTrigger>
        </TabsList>

        <TabsContent value="proximas" className="space-y-4 mt-6">
          {citasProximas.map((cita) => (
            <HoverCard key={cita.citaid}>
              <HoverCardTrigger asChild>
                <Card className="hover:shadow-lg transition-shadow bg-slate-800/50 backdrop-blur-sm border-slate-700">
                  <CardContent className="pt-6">
                {(() => {
                  const estadoVisual = obtenerEstiloEstado(cita.estado);
                  return (
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      {esModalidadEnLinea(cita.modalidad) ? (
                        <Video className="w-8 h-8 text-white stroke-2" />
                      ) : (
                        <Calendar className="w-8 h-8 text-white stroke-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        
                        <Badge
                          variant="secondary"
                          className={estadoVisual.badgeClass}
                        >
                          {estadoVisual.label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-slate-300">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="break-words">{userType === 'psicologo' ? `${cita.paciente_nombre} ${cita.paciente_apellido}` : `${cita.psicologa_nombre} ${cita.psicologa_apellido}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatearFechaVisual(cita.fechahora)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatearHoraVisual(cita.fechahora)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span className="break-words">{obtenerUbicacion(cita as Cita & { ubicacion?: string })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full lg:w-auto">
                    {esModalidadEnLinea(cita.modalidad) && (
                      <Button size="sm" onClick={handleUnirseVideollamada} className="bg-teal-600 hover:bg-teal-700 w-full lg:w-auto">Unirse a Videollamada</Button>
                    )}
                    {esEstado(cita.estado, ESTADO_CITA.PENDIENTE) && userType === 'paciente' && (
                      <Button size="sm" variant="outline" onClick={() => handleConfirmarCita(cita.citaid)} className="border-green-600 text-green-400 hover:bg-green-600/20 w-full lg:w-auto">
                        Confirmar Cita
                      </Button>
                    )}
                    {userType === 'psicologo' && (
                      <Button size="sm" variant="outline" onClick={() => handleModificarCita(cita.citaid)} className="border-violet-600 text-violet-400 hover:bg-violet-600/20 w-full lg:w-auto">
                        <Edit className="w-4 h-4 mr-2" />
                        Modificar
                      </Button>
                    )}
                    {userType === 'paciente' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleModificarCita(cita.citaid)}
                        className="border-violet-600 text-violet-400 hover:bg-violet-600/20 w-full lg:w-auto"
                      >
                        Reagendar
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCitaACancelar(cita.citaid)}
                      className="border-red-600 text-red-400 hover:bg-red-600/20 w-full lg:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  </div>
                </div>
                  );
                })()}
                  </CardContent>
                </Card>
              </HoverCardTrigger>
              <HoverCardContent align="start" className="w-80 bg-slate-900 border-slate-700 text-slate-100">
                <div className="space-y-2 text-sm">
                  <p className="text-teal-300">Resumen de la cita</p>
                  <p><span className="text-slate-400">Modalidad:</span> {cita.modalidad}</p>
                  <p><span className="text-slate-400">Duración:</span> {cita.duracionmin} min</p>
                  <p><span className="text-slate-400">Estado:</span> {cita.estado}</p>
                  <p className="break-words"><span className="text-slate-400">Ubicación:</span> {obtenerUbicacion(cita as Cita & { ubicacion?: string })}</p>
                  {cita.notasresumen && (
                    <p className="break-words"><span className="text-slate-400">Notas:</span> {cita.notasresumen}</p>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          ))}
        </TabsContent>

        <TabsContent value="pasadas" className="space-y-4 mt-6">
          {citasPasadas.map((cita) => (
            <Card key={cita.citaid} className="bg-slate-800/30 backdrop-blur-sm border-slate-700">
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0">
                      {esModalidadEnLinea(cita.modalidad) ? (
                        <Video className="w-8 h-8 text-slate-400" />
                      ) : (
                        <Calendar className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        
                        <Badge variant="outline" className="border-slate-600 text-slate-400">Completada</Badge>
                      </div>
                      <div className="space-y-1 text-slate-400">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span className="break-words">{userType === 'psicologo' ? `${cita.paciente_nombre} ${cita.paciente_apellido}` : `${cita.psicologa_nombre} ${cita.psicologa_apellido}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatearFechaVisual(cita.fechahora)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{formatearHoraVisual(cita.fechahora)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => userType === 'psicologo' ? onNavigate('bitacora') : handleVerNotas(cita.citaid)} 
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 w-full lg:w-auto"
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
                      <p className="text-slate-100">{citasHoy.length} citas</p>
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
                      <p className="text-slate-100">{citasSemana.length} citas</p>
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
                      <p className="text-slate-100">{citasMesActual.length} citas</p>
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
                        <SelectItem value={ESTADO_CITA.CONFIRMADA}>Confirmadas</SelectItem>
                        <SelectItem value={ESTADO_CITA.PENDIENTE}>Pendientes</SelectItem>
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
                    <span className="text-slate-300">En linea</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Lista de Citas Filtradas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-100">
                  Citas del Mes ({citasMesActual.filter(c => {
                    const nombrePaciente = `${c.paciente_nombre} ${c.paciente_apellido}`.trim();
                    const cumpleBusqueda = busquedaAgenda === '' || nombrePaciente.toLowerCase().includes(busquedaAgenda.toLowerCase());
                    const cumplePaciente = filtroPaciente === 'todos' || nombrePaciente === filtroPaciente;
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
              
              {citasMesActual
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
                                  esModalidadEnLinea(cita.modalidad) 
                                    ? 'bg-gradient-to-br from-violet-500 to-violet-600' 
                                    : 'bg-gradient-to-br from-teal-500 to-teal-600'
                                } rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                              >
                                {esModalidadEnLinea(cita.modalidad) ? (
                                  <Video className="w-8 h-8 text-white stroke-2" />
                                ) : (
                                  <MapPin className="w-8 h-8 text-white stroke-2" />
                                )}
                              </div>
                              <div className={`w-16 h-1 rounded-full ${obtenerEstiloEstado(cita.estado).indicatorClass}`}></div>
                            </div>
                            
                            {/* Información de la cita */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                
                                <Badge className={obtenerEstiloEstado(cita.estado).badgeClass}>
                                  {obtenerEstiloEstado(cita.estado).label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={esModalidadEnLinea(cita.modalidad) ? 'border-violet-500 text-violet-400' : 'border-teal-500 text-teal-400'}
                                >
                                  {esModalidadEnLinea(cita.modalidad) ? 'En linea' : 'Presencial'}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-slate-300">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{`${cita.paciente_nombre} ${cita.paciente_apellido}`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatearFechaVisual(cita.fechahora)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatearHoraVisual(cita.fechahora)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{obtenerUbicacion(cita as Cita & { ubicacion?: string })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones rápidas */}
                          <div className="flex flex-col gap-2">
                            {esModalidadEnLinea(cita.modalidad) && (
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
              
              {citasMesActual.filter(c => {
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
                      <p className="text-slate-100">{citasProximas.filter(c => esEstado(c.estado, ESTADO_CITA.CONFIRMADA)).length} citas</p>
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
                    <span className="text-slate-300">En linea</span>
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
                      className="hover:shadow-lg transition-all bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:border-teal-500/50"
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4 flex-1">
                            {/* Indicador de estado y modalidad */}
                            <div className="flex flex-col gap-2">
                              <div 
                                className={`w-16 h-16 ${
                                  esModalidadEnLinea(cita.modalidad) 
                                    ? 'bg-gradient-to-br from-violet-500 to-violet-600' 
                                    : 'bg-gradient-to-br from-teal-500 to-teal-600'
                                } rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg`}
                              >
                                {esModalidadEnLinea(cita.modalidad) ? (
                                  <Video className="w-8 h-8 text-white stroke-2" />
                                ) : (
                                  <MapPin className="w-8 h-8 text-white stroke-2" />
                                )}
                              </div>
                              <div className={`w-16 h-1 rounded-full ${
                                esEstado(cita.estado, ESTADO_CITA.CONFIRMADA) ? 'bg-green-500' : 'bg-amber-500'
                              }`}></div>
                            </div>
                            
                            {/* Información de la cita */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                
                                <Badge className={obtenerEstiloEstado(cita.estado).badgeClass}>
                                  {obtenerEstiloEstado(cita.estado).label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={esModalidadEnLinea(cita.modalidad) ? 'border-violet-500 text-violet-400' : 'border-teal-500 text-teal-400'}
                                >
                                  {esModalidadEnLinea(cita.modalidad) ? 'En linea' : 'Presencial'}
                                </Badge>
                              </div>
                              <div className="space-y-1 text-slate-300">
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{`${cita.psicologa_nombre} ${cita.psicologa_apellido}`}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>{formatearFechaVisual(cita.fechahora)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4" />
                                  <span>{formatearHoraVisual(cita.fechahora)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4" />
                                  <span>{obtenerUbicacion(cita as Cita & { ubicacion?: string })}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Acciones rápidas */}
                          <div className="flex flex-col gap-2">
                            {esModalidadEnLinea(cita.modalidad) && (
                              <Button size="sm" onClick={() => handleUnirseVideollamada()} className="bg-teal-600 hover:bg-teal-700">
                                <Video className="w-4 h-4 mr-2" />
                                Unirse
                              </Button>
                            )}
                            {esEstado(cita.estado, ESTADO_CITA.PENDIENTE) && (
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
                    <span className="text-sm">{formatearFechaVisual(citaConNotas.fechahora)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 stroke-2" />
                    <span className="text-sm">{formatearHoraVisual(citaConNotas.fechahora)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <User className="w-4 h-4 text-violet-400 stroke-2" />
                  <span className="text-sm">{`${citaConNotas.psicologa_nombre} ${citaConNotas.psicologa_apellido}`}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  
                  <Badge className="bg-slate-700 text-slate-300 border-slate-600 text-xs">
                    {esModalidadEnLinea(citaConNotas.modalidad) ? 'En linea' : 'Presencial'}
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
                    {citaConNotas.notasresumen || citaConNotas.notas || 'Sin notas disponibles.'}
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
                  <span className="font-semibold text-slate-100">
                    {userType === 'paciente'
                      ? `${citaAReagendar.psicologa_nombre} ${citaAReagendar.psicologa_apellido}`
                      : `${citaAReagendar.paciente_nombre} ${citaAReagendar.paciente_apellido}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  
                  <Badge className="bg-slate-700 text-slate-300 border-slate-600">
                    {esModalidadEnLinea(citaAReagendar.modalidad) ? 'En linea' : 'Presencial'}
                  </Badge>
                  <Badge className={obtenerEstiloEstado(citaAReagendar.estado).softBadgeClass}>
                    {obtenerEstiloEstado(citaAReagendar.estado).label}
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
                  <div className="rounded-md border border-slate-600 bg-slate-700/40 p-3">
                    <DateCalendar
                      mode="single"
                      selected={convertirInputADate(formatearFechaInput(citaAReagendar.fechahora))}
                      month={mesCalendarioReagenda}
                      onMonthChange={setMesCalendarioReagenda}
                      onSelect={(fecha) => {
                        if (!fecha) {
                          return;
                        }

                        setCitaAReagendar(
                          actualizarFechaHoraCita(
                            citaAReagendar,
                            formatearFechaLocal(fecha),
                            formatearHoraInput(citaAReagendar.fechahora)
                          )
                        );
                      }}
                      fromDate={new Date(`${obtenerFechaMinimaReagenda()}T00:00:00`)}
                      disabled={(candidate) => {
                        const fecha = formatearFechaLocal(candidate);
                        return candidate < new Date(`${obtenerFechaMinimaReagenda()}T00:00:00`) || !diasDisponiblesReagenda.includes(fecha);
                      }}
                      modifiers={{
                        disponible: (candidate) => diasDisponiblesReagenda.includes(formatearFechaLocal(candidate)),
                      }}
                      modifiersClassNames={{
                        disponible: 'ring-1 ring-blue-400/50 bg-blue-500/20 text-blue-200',
                      }}
                      className="bg-transparent"
                    />
                    <p className="text-xs text-slate-300 mt-2">
                      Fecha seleccionada: {formatearFechaVisual(citaAReagendar.fechahora)}
                    </p>
                  </div>
                  {loadingDiasReagenda && <p className="text-xs text-slate-400">Cargando dias disponibles...</p>}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 stroke-2" />
                    Hora
                  </Label>
                  <Select
                    value={formatearHoraInput(citaAReagendar.fechahora)}
                    onValueChange={(value) => setCitaAReagendar(actualizarFechaHoraCita(citaAReagendar, formatearFechaInput(citaAReagendar.fechahora), value))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder={loadingHorasReagenda ? 'Cargando horarios...' : 'Selecciona una hora'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {loadingHorasReagenda && <SelectItem value="__loading_reagenda" disabled>Cargando horarios...</SelectItem>}
                      {!loadingHorasReagenda && horasDisponiblesReagenda.length === 0 && (
                        <SelectItem value="__sin_horas_reagenda" disabled>No hay horarios disponibles</SelectItem>
                      )}
                      {!loadingHorasReagenda && horasDisponiblesReagenda.map((horaDisponible) => (
                        <SelectItem key={horaDisponible} value={horaDisponible}>{horaDisponible}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    {esModalidadEnLinea(citaAEditar.modalidad) ? 'En linea' : 'Presencial'}
                  </Badge>
                  <Badge className={obtenerEstiloEstado(citaAEditar.estado).softBadgeClass}>
                    {obtenerEstiloEstado(citaAEditar.estado).label}
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
                  <div className="rounded-md border border-slate-600 bg-slate-700/40 p-3">
                    <DateCalendar
                      mode="single"
                      selected={convertirInputADate(formatearFechaInput(citaAEditar.fechahora))}
                      month={mesCalendarioEdicion}
                      onMonthChange={setMesCalendarioEdicion}
                      onSelect={(fecha) => {
                        if (!fecha) {
                          return;
                        }

                        setCitaAEditar(
                          actualizarFechaHoraCita(
                            citaAEditar,
                            formatearFechaLocal(fecha),
                            formatearHoraInput(citaAEditar.fechahora)
                          )
                        );
                      }}
                      fromDate={new Date(`${obtenerFechaMinimaReagenda()}T00:00:00`)}
                      disabled={(candidate) => {
                        const fecha = formatearFechaLocal(candidate);
                        return candidate < new Date(`${obtenerFechaMinimaReagenda()}T00:00:00`) || !diasDisponiblesEdicion.includes(fecha);
                      }}
                      modifiers={{
                        disponible: (candidate) => diasDisponiblesEdicion.includes(formatearFechaLocal(candidate)),
                      }}
                      modifiersClassNames={{
                        disponible: 'ring-1 ring-blue-400/50 bg-blue-500/20 text-blue-200',
                      }}
                      className="bg-transparent"
                    />
                    <p className="text-xs text-slate-300 mt-2">
                      Fecha seleccionada: {formatearFechaVisual(citaAEditar.fechahora)}
                    </p>
                  </div>
                  {loadingDiasEdicion && <p className="text-xs text-slate-400">Cargando dias disponibles...</p>}
                </div>
                
                <div className="space-y-2">
                  <Label className="text-slate-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-400 stroke-2" />
                    Hora
                  </Label>
                  <Select
                    value={formatearHoraInput(citaAEditar.fechahora)}
                    onValueChange={(value) => setCitaAEditar(actualizarFechaHoraCita(citaAEditar, formatearFechaInput(citaAEditar.fechahora), value))}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder={loadingHorasEdicion ? 'Cargando horarios...' : 'Selecciona una hora'} />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {loadingHorasEdicion && <SelectItem value="__loading_edicion" disabled>Cargando horarios...</SelectItem>}
                      {!loadingHorasEdicion && horasDisponiblesEdicion.length === 0 && (
                        <SelectItem value="__sin_horas_edicion" disabled>No hay horarios disponibles</SelectItem>
                      )}
                      {!loadingHorasEdicion && horasDisponiblesEdicion.map((horaDisponible) => (
                        <SelectItem key={horaDisponible} value={horaDisponible}>{horaDisponible}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                    <SelectItem value={ESTADO_CITA.CONFIRMADA}>✅ Confirmada</SelectItem>
                    <SelectItem value={ESTADO_CITA.PENDIENTE}>⏳ Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-400 stroke-2" />
                  Notas del Paciente
                </Label>
                <Textarea
                  value={citaAEditar.notaspaciente || 'Sin notas del paciente'}
                  className="bg-slate-900 border-slate-700 text-slate-400 min-h-[80px]"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-200 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-violet-400 stroke-2" />
                  Notas de la Psicóloga (Opcional)
                </Label>
                <Textarea
                  value={citaAEditar.notaspsicologa || ''}
                  onChange={(e) => setCitaAEditar({ ...citaAEditar, notaspsicologa: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-slate-100 min-h-[80px]"
                  placeholder="Agrega notas clínicas o administrativas de uso interno para esta cita..."
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