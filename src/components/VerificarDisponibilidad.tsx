import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { CalendarDays, Clock3, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import { apiFetch, API_ENDPOINTS } from '../utils/api';
import { Agenda } from '../utils/types';

interface VerificarDisponibilidadProps {
  onNavigate: (view: ViewType) => void;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;

export function VerificarDisponibilidad({ onNavigate }: VerificarDisponibilidadProps) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [agendaEnEdicion, setAgendaEnEdicion] = useState<Agenda | null>(null);
  const [formulario, setFormulario] = useState({
    diasemana: 'Lunes',
    horainicio: '09:00',
    horafin: '10:00',
    disponible: true,
  });

  const normalizarHora = (hora: string) => String(hora || '').slice(0, 5);

  const calcularDuracion = (horainicio: string, horafin: string) => {
    const [inicioHora, inicioMin] = normalizarHora(horainicio).split(':').map(Number);
    const [finHora, finMin] = normalizarHora(horafin).split(':').map(Number);
    return ((finHora * 60 + finMin) - (inicioHora * 60 + inicioMin)) / 60;
  };

  const resetFormulario = () => {
    setAgendaEnEdicion(null);
    setFormulario({ diasemana: 'Lunes', horainicio: '09:00', horafin: '10:00', disponible: true });
  };

  const cargarAgenda = async () => {
    setLoading(true);

    try {
      const response = await apiFetch(API_ENDPOINTS.AGENDAS);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible cargar tu agenda.');
      }

      setAgendas(Array.isArray(data) ? data : []);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar tu agenda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarAgenda();
  }, []);

  const agendasPorDia = useMemo(() => {
    return DIAS_SEMANA.reduce<Record<string, Agenda[]>>((acc, dia) => {
      acc[dia] = agendas
        .filter((agenda) => agenda.diasemana === dia)
        .sort((a, b) => normalizarHora(a.horainicio).localeCompare(normalizarHora(b.horainicio)));
      return acc;
    }, {});
  }, [agendas]);

  const totalBloques = agendas.length;
  const bloquesDisponibles = agendas.filter((agenda) => agenda.disponible).length;
  const horasTotales = agendas.reduce((total, agenda) => total + Math.max(0, calcularDuracion(agenda.horainicio, agenda.horafin)), 0);
  const diasConfigurados = Object.values(agendasPorDia).filter((bloques) => bloques.length > 0).length;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setGuardando(true);

    try {
      const endpoint = agendaEnEdicion ? `${API_ENDPOINTS.AGENDAS}/${agendaEnEdicion.agendaid}` : API_ENDPOINTS.AGENDAS;
      const response = await apiFetch(endpoint, {
        method: agendaEnEdicion ? 'PUT' : 'POST',
        body: JSON.stringify(formulario),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible guardar el bloque.');
      }

      toast.success(agendaEnEdicion ? 'Bloque actualizado.' : 'Bloque agregado.', {
        description: 'La disponibilidad visible al paciente se actualizó con este cambio.',
      });

      resetFormulario();
      await cargarAgenda();
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el bloque.');
    } finally {
      setGuardando(false);
    }
  };

  const iniciarEdicion = (agenda: Agenda) => {
    setAgendaEnEdicion(agenda);
    setFormulario({
      diasemana: agenda.diasemana,
      horainicio: normalizarHora(agenda.horainicio),
      horafin: normalizarHora(agenda.horafin),
      disponible: agenda.disponible,
    });
  };

  const toggleDisponibilidad = async (agenda: Agenda) => {
    try {
      const response = await apiFetch(`${API_ENDPOINTS.AGENDAS}/${agenda.agendaid}`, {
        method: 'PUT',
        body: JSON.stringify({
          diasemana: agenda.diasemana,
          horainicio: normalizarHora(agenda.horainicio),
          horafin: normalizarHora(agenda.horafin),
          disponible: !agenda.disponible,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible actualizar el estado del bloque.');
      }

      setAgendas((prev) => prev.map((item) => (item.agendaid === agenda.agendaid ? data : item)));
      toast.success(!agenda.disponible ? 'Bloque habilitado.' : 'Bloque deshabilitado.');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el bloque.');
    }
  };

  const eliminarBloque = async (agenda: Agenda) => {
    if (!window.confirm(`¿Eliminar el bloque de ${agenda.diasemana} ${normalizarHora(agenda.horainicio)}-${normalizarHora(agenda.horafin)}?`)) {
      return;
    }

    try {
      const response = await apiFetch(`${API_ENDPOINTS.AGENDAS}/${agenda.agendaid}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible eliminar el bloque.');
      }

      setAgendas((prev) => prev.filter((item) => item.agendaid !== agenda.agendaid));
      if (agendaEnEdicion?.agendaid === agenda.agendaid) {
        resetFormulario();
      }
      toast.success('Bloque eliminado correctamente.');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el bloque.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Mi Agenda</h1>
        <p className="text-slate-300">
          Configura los bloques reales que el sistema usa para mostrar horarios disponibles al paciente.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Bloques Activos</p>
                <p className="text-slate-100">{bloquesDisponibles}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDays className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Horas Configuradas</p>
                <p className="text-slate-100">{horasTotales.toFixed(1)} h</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Clock3 className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-violet-500/10 to-violet-600/10 border-violet-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Días Configurados</p>
                <p className="text-slate-100">{diasConfigurados}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDays className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-600/20 to-slate-700/20 border-slate-600/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Total de Bloques</p>
                <p className="text-slate-100">{totalBloques}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-slate-600 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 h-fit">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              {agendaEnEdicion ? <Pencil className="w-5 h-5 text-amber-400 stroke-2" /> : <Plus className="w-5 h-5 text-teal-400 stroke-2" />}
              {agendaEnEdicion ? 'Editar Bloque' : 'Nuevo Bloque'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              Define el día, el rango horario y si el bloque debe estar disponible para agendar citas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diasemana" className="text-slate-200">Día de la semana</Label>
                <Select
                  value={formulario.diasemana}
                  onValueChange={(value) => setFormulario((prev) => ({ ...prev, diasemana: value }))}
                >
                  <SelectTrigger id="diasemana" className="bg-slate-700/50 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Selecciona un día" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAS_SEMANA.map((dia) => (
                      <SelectItem key={dia} value={dia}>{dia}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="horainicio" className="text-slate-200">Hora inicio</Label>
                  <Input
                    id="horainicio"
                    type="time"
                    value={formulario.horainicio}
                    onChange={(event) => setFormulario((prev) => ({ ...prev, horainicio: event.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-slate-100"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horafin" className="text-slate-200">Hora fin</Label>
                  <Input
                    id="horafin"
                    type="time"
                    value={formulario.horafin}
                    onChange={(event) => setFormulario((prev) => ({ ...prev, horafin: event.target.value }))}
                    className="bg-slate-700/50 border-slate-600 text-slate-100"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/40 p-4">
                <div>
                  <p className="text-slate-100">Disponible para agendar</p>
                  <p className="text-sm text-slate-400">Si lo apagas, el bloque seguirá existiendo pero no aparecerá como horario libre.</p>
                </div>
                <Switch
                  checked={formulario.disponible}
                  onCheckedChange={(checked) => setFormulario((prev) => ({ ...prev, disponible: checked }))}
                />
              </div>

              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-sm text-slate-300">
                <p>Duración del bloque: <span className="text-teal-300">{Math.max(0, calcularDuracion(formulario.horainicio, formulario.horafin)).toFixed(1)} h</span></p>
                <p className="mt-1">Los pacientes verán espacios de 60 minutos dentro de este rango.</p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={guardando}>
                  {agendaEnEdicion ? <Save className="w-4 h-4 mr-2 stroke-2" /> : <Plus className="w-4 h-4 mr-2 stroke-2" />}
                  {guardando ? 'Guardando...' : agendaEnEdicion ? 'Guardar cambios' : 'Agregar bloque'}
                </Button>
                {agendaEnEdicion && (
                  <Button type="button" variant="outline" onClick={resetFormulario} className="border-slate-600 text-slate-200 hover:bg-slate-700">
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-slate-100">Bloques Registrados</CardTitle>
                <CardDescription className="text-slate-400">Estos horarios alimentan la disponibilidad real usada en solicitud y programación de citas.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => onNavigate('citas')} className="border-slate-600 text-slate-200 hover:bg-slate-700">
                Ir a Gestionar Citas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-slate-400">Cargando agenda...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {DIAS_SEMANA.map((dia) => (
                  <Card key={dia} className="bg-slate-900/30 border-slate-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-slate-100 text-base">{dia}</CardTitle>
                        <Badge className="bg-slate-700 text-slate-200">{agendasPorDia[dia].length} bloque(s)</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {agendasPorDia[dia].length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">
                          Sin bloques registrados para este día.
                        </div>
                      ) : (
                        agendasPorDia[dia].map((agenda) => (
                          <div key={agenda.agendaid} className="rounded-xl border border-slate-700 bg-slate-800/60 p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <Badge className={agenda.disponible ? 'bg-green-600' : 'bg-slate-600'}>
                                    {agenda.disponible ? 'Disponible' : 'Deshabilitado'}
                                  </Badge>
                                  <Badge variant="outline" className="border-teal-500/40 text-teal-300">
                                    {normalizarHora(agenda.horainicio)} - {normalizarHora(agenda.horafin)}
                                  </Badge>
                                </div>
                                <p className="text-slate-300 text-sm">Duración total: {Math.max(0, calcularDuracion(agenda.horainicio, agenda.horafin)).toFixed(1)} h</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="icon" variant="outline" onClick={() => iniciarEdicion(agenda)} className="border-slate-600 text-slate-200 hover:bg-slate-700">
                                  <Pencil className="w-4 h-4 stroke-2" />
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => eliminarBloque(agenda)} className="border-red-500/40 text-red-300 hover:bg-red-500/10">
                                  <Trash2 className="w-4 h-4 stroke-2" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between rounded-lg border border-slate-700 px-3 py-2">
                              <span className="text-sm text-slate-300">Visible para agendar</span>
                              <Switch checked={agenda.disponible} onCheckedChange={() => toggleDisponibilidad(agenda)} />
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
