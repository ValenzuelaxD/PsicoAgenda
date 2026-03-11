import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Calendar as CalendarIcon, Clock, User } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import { apiFetch, API_ENDPOINTS } from '../utils/api';
import { MODALIDAD_CITA, Paciente } from '../utils/types';

interface ProgramarCitaProps {
  onNavigate: (view: ViewType) => void;
}

const DURACIONES = ['30', '45', '60', '90'] as const;

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function ProgramarCita({ onNavigate }: ProgramarCitaProps) {
  const [date, setDate] = useState<Date>(new Date());
  const [pacienteId, setPacienteId] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState<string>('60');
  const [modalidad, setModalidad] = useState<string>(MODALIDAD_CITA.PRESENCIAL);
  const [notas, setNotas] = useState('');
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState<string[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const fechaSeleccionada = useMemo(() => formatDate(date), [date]);
  const pacienteSeleccionado = pacientes.find((paciente: Paciente) => String(paciente.pacienteid) === pacienteId);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const response = await apiFetch(API_ENDPOINTS.PACIENTES);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No fue posible cargar los pacientes.');
        }

        setPacientes(Array.isArray(data) ? data : []);
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar pacientes.');
      } finally {
        setLoadingPacientes(false);
      }
    };

    fetchPacientes();
  }, []);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      setLoadingHorarios(true);
      setHora('');

      try {
        const response = await apiFetch(`${API_ENDPOINTS.CITAS_DISPONIBILIDAD}?fecha=${fechaSeleccionada}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'No fue posible consultar la disponibilidad.');
        }

        setHorariosDisponibles(Array.isArray(data) ? data : []);
      } catch (error: any) {
        setHorariosDisponibles([]);
        toast.error(error.message || 'Error al consultar disponibilidad.');
      } finally {
        setLoadingHorarios(false);
      }
    };

    fetchDisponibilidad();
  }, [fechaSeleccionada]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hora || !pacienteId) {
      toast.error('Completa los campos requeridos para programar la cita.');
      return;
    }

    setGuardando(true);

    try {
      const response = await apiFetch(API_ENDPOINTS.CITAS, {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: Number(pacienteId),
          fecha: fechaSeleccionada,
          hora,
          modalidad,
          duracionMin: Number(duracion),
          notas: notas.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'No fue posible programar la cita.');
      }

      toast.success('Cita programada exitosamente.', {
        description: 'La cita quedó registrada en la agenda real y se enviaron notificaciones.',
      });

      setPacienteId('');
      setHora('');
      setDuracion('60');
      setModalidad(MODALIDAD_CITA.PRESENCIAL);
      setNotas('');
      onNavigate('citas');
    } catch (error: any) {
      toast.error(error.message || 'Error al programar la cita.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Programar Cita</h1>
        <p className="text-slate-300">Agenda una sesión real usando pacientes y horarios obtenidos desde la base de datos.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Cita</CardTitle>
                <CardDescription>Los cambios se guardan directamente en el backend.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente">Paciente</Label>
                  <Select value={pacienteId} onValueChange={setPacienteId} disabled={loadingPacientes}>
                    <SelectTrigger id="paciente">
                      <SelectValue placeholder={loadingPacientes ? 'Cargando pacientes...' : 'Selecciona un paciente'} />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((paciente: Paciente) => (
                        <SelectItem key={paciente.pacienteid} value={String(paciente.pacienteid)}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {`${paciente.nombre} ${paciente.apellidopaterno}`}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora">Horario disponible</Label>
                  <Select value={hora} onValueChange={setHora} disabled={loadingHorarios || horariosDisponibles.length === 0}>
                    <SelectTrigger id="hora">
                      <SelectValue placeholder={loadingHorarios ? 'Consultando disponibilidad...' : horariosDisponibles.length === 0 ? 'No hay horarios disponibles' : 'Selecciona la hora'} />
                    </SelectTrigger>
                    <SelectContent>
                      {horariosDisponibles.map((item: string) => (
                        <SelectItem key={item} value={item}>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {item}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración</Label>
                  <Select value={duracion} onValueChange={setDuracion}>
                    <SelectTrigger id="duracion">
                      <SelectValue placeholder="Selecciona la duración" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURACIONES.map((item) => (
                        <SelectItem key={item} value={item}>{item} minutos</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modalidad">Modalidad</Label>
                  <Select value={modalidad} onValueChange={setModalidad}>
                    <SelectTrigger id="modalidad">
                      <SelectValue placeholder="Selecciona la modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={MODALIDAD_CITA.PRESENCIAL}>Presencial</SelectItem>
                      <SelectItem value={MODALIDAD_CITA.EN_LINEA}>En linea</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas internas</Label>
                  <Textarea
                    id="notas"
                    placeholder="Observaciones para la cita"
                    value={notas}
                    onChange={(event) => setNotas(event.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fecha</CardTitle>
                <CardDescription>La disponibilidad se calcula con tu agenda registrada.</CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(nextDate: Date | undefined) => nextDate && setDate(nextDate)}
                  className="rounded-md border"
                  disabled={(candidateDate: Date) => candidateDate < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-teal-50 to-violet-50 border-teal-200 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <CalendarIcon className="w-5 h-5 stroke-2 text-teal-600" />
                  Resumen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-slate-800">
                <p><span className="font-medium">Paciente:</span> {pacienteSeleccionado ? `${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellidopaterno}` : 'Pendiente'}</p>
                <p><span className="font-medium">Fecha:</span> {date.toLocaleDateString('es-ES')}</p>
                <p><span className="font-medium">Hora:</span> {hora || 'Pendiente'}</p>
                <p><span className="font-medium">Duración:</span> {duracion} min</p>
                <p><span className="font-medium">Modalidad:</span> {modalidad}</p>
                <p><span className="font-medium">Horarios libres:</span> {loadingHorarios ? 'Consultando...' : horariosDisponibles.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={guardando || !pacienteId || !hora}>
            {guardando ? 'Guardando...' : 'Programar Cita'}
          </Button>
          <Button type="button" variant="outline" onClick={() => onNavigate('citas')}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
