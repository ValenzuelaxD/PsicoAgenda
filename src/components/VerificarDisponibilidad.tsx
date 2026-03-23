import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { CalendarDays, Clock3, Pencil, Plus, Save, Trash2, Eye, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import { apiFetch, API_ENDPOINTS } from '../utils/api';
import { Agenda } from '../utils/types';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface VerificarDisponibilidadProps {
  onNavigate: (view: ViewType) => void;
}

const DIAS_SEMANA = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'] as const;

export function VerificarDisponibilidad({ onNavigate }: VerificarDisponibilidadProps) {
  const [agendas, setAgendas] = useState<Agenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [agendaEnEdicion, setAgendaEnEdicion] = useState<Agenda | null>(null);
  const [mostraGuia, setMostraGuia] = useState(false);
  const [mostraPreview, setMostraPreview] = useState(false);
  const [diasExpandidos, setDiasExpandidos] = useState<Record<string, boolean>>({});
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

  const generarSlotsDisponibles = (horainicio: string, horafin: string) => {
    const slots = [];
    const [inicioHora, inicioMin] = normalizarHora(horainicio).split(':').map(Number);
    const [finHora, finMin] = normalizarHora(horafin).split(':').map(Number);
    
    let horaActual = inicioHora;
    let minActual = inicioMin;
    const finTotalMin = finHora * 60 + finMin;
    
    while (horaActual * 60 + minActual < finTotalMin) {
      const horaFormato = String(horaActual).padStart(2, '0');
      const minFormato = String(minActual).padStart(2, '0');
      slots.push(`${horaFormato}:${minFormato}`);
      
      minActual += 60;
      if (minActual >= 60) {
        horaActual += Math.floor(minActual / 60);
        minActual = minActual % 60;
      }
    }
    
    return slots;
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
        throw new Error(data.message || 'No fue posible cargar tus horarios.');
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
        throw new Error(data.message || 'No fue posible guardar el horario.');
      }

      toast.success(agendaEnEdicion ? 'Horario actualizado ✓' : 'Horario agregado ✓', {
        description: agendaEnEdicion 
          ? `${formulario.diasemana} ${normalizarHora(formulario.horainicio)}-${normalizarHora(formulario.horafin)} actualizado`
          : `${formulario.diasemana} ${normalizarHora(formulario.horainicio)}-${normalizarHora(formulario.horafin)} agregado`,
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
      toast.success(!agenda.disponible ? '✓ Horario reactivado' : '⊘ Horario pausado', {
        description: `${agenda.diasemana} ${normalizarHora(agenda.horainicio)}-${normalizarHora(agenda.horafin)}`
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el bloque.');
    }
  };

  const eliminarBloque = async (agenda: Agenda) => {
    if (!window.confirm(`¿Eliminar el horario de ${agenda.diasemana} ${normalizarHora(agenda.horainicio)}-${normalizarHora(agenda.horafin)}?`)) {
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
      toast.success('🗑️ Horario eliminado', {
        description: `${agenda.diasemana} ${normalizarHora(agenda.horainicio)}-${normalizarHora(agenda.horafin)} ha sido eliminado`,
      });
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el bloque.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Encabezado */}
      <div>
        <h1 className="text-white mb-2 flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-teal-400" />
          Horario de Atención
        </h1>
        <p className="text-slate-300">
          Define cuándo estás disponible para atender pacientes. Los patientes verán estos horarios al solicitar citas.
        </p>
      </div>

      {/* Estadísticas Simplificadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-2">Tu Disponibilidad</p>
                <p className="text-2xl font-semibold text-slate-100">
                  {diasConfigurados > 0 ? `${diasConfigurados} día${diasConfigurados !== 1 ? 's' : ''}` : 'Sin configurar'}
                </p>
                {diasConfigurados > 0 && (
                  <p className="text-sm text-slate-400 mt-1">
                    {DIAS_SEMANA.filter(dia => agendasPorDia[dia].length > 0).join(', ')}
                  </p>
                )}
                <p className="text-sm text-teal-300 mt-2 font-medium">{horasTotales.toFixed(1)} horas totales</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarDays className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-2">Horarios Activos</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-green-300">{bloquesDisponibles}</p>
                  <p className="text-slate-400">/ {totalBloques} total</p>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  {totalBloques === bloquesDisponibles 
                    ? '✓ Todos activos' 
                    : `${totalBloques - bloquesDisponibles} pausado${totalBloques - bloquesDisponibles !== 1 ? 's' : ''}`}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Guía Visual - Cómo Funciona */}
      <Collapsible open={mostraGuia} onOpenChange={setMostraGuia}>
        <Card className="bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/30">
          <CardHeader className="pb-4">
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-400" />
                  <CardTitle className="text-slate-100">¿Cómo funciona?</CardTitle>
                </div>
                {mostraGuia ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
              </div>
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="space-y-3 border-t border-slate-700 pt-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">1</div>
                  <div>
                    <p className="text-slate-100 font-medium">Creas un horario de atención</p>
                    <p className="text-slate-400 text-sm">Ej: Lunes de 14:00 a 16:00</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">2</div>
                  <div>
                    <p className="text-slate-100 font-medium">Se divide en espacios de 60 minutos</p>
                    <p className="text-slate-400 text-sm">Pacientes ven: 14:00 y 15:00 disponibles</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">3</div>
                  <div>
                    <p className="text-slate-100 font-medium">El paciente elige su horario</p>
                    <p className="text-slate-400 text-sm">Puede agendar cualquiera de esos espacios</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">4</div>
                  <div>
                    <p className="text-slate-100 font-medium">Puedes pausar horarios temporalmente</p>
                    <p className="text-slate-400 text-sm">Usa el toggle para ocultar sin eliminar</p>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-200">Los cambios se reflejan inmediatamente para los pacientes</p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_minmax(0,1fr)] gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 h-fit">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              {agendaEnEdicion ? <Pencil className="w-5 h-5 text-amber-400 stroke-2" /> : <Plus className="w-5 h-5 text-teal-400 stroke-2" />}
              {agendaEnEdicion ? 'Editar Horario' : 'Nuevo Horario'}
            </CardTitle>
            <CardDescription className="text-slate-400">
              {agendaEnEdicion 
                ? 'Actualiza los datos de este horario de atención'
                : 'Agrega un nuevo horario en el que estés disponible'}
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
                  <p className="text-slate-100 font-medium">Mostrar a Pacientes</p>
                  <p className="text-xs text-slate-400 mt-1">Si está activo, los pacientes ven este horario. Si lo desactivas, se oculta pero puedes reactivarlo después.</p>
                </div>
                <Switch
                  checked={formulario.disponible}
                  onCheckedChange={(checked) => setFormulario((prev) => ({ ...prev, disponible: checked }))}
                />
              </div>

              <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4 text-sm text-slate-300 space-y-2">
                <p><span className="text-teal-300 font-semibold">Duración:</span> {Math.max(0, calcularDuracion(formulario.horainicio, formulario.horafin)).toFixed(1)} horas</p>
                <p><span className="text-teal-300 font-semibold">Espacios disponibles:</span> {Math.max(0, calcularDuracion(formulario.horainicio, formulario.horafin))}</p>
                <p className="text-xs text-teal-200">Cada espacio dura 60 minutos para que el paciente pueda agendar</p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={guardando}>
                  {agendaEnEdicion ? <Save className="w-4 h-4 mr-2 stroke-2" /> : <Plus className="w-4 h-4 mr-2 stroke-2" />}
                  {guardando ? 'Guardando...' : agendaEnEdicion ? 'Guardar Cambios' : 'Agregar Horario'}
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
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-slate-100">Horarios Configurados</CardTitle>
                <CardDescription className="text-slate-400 mt-1">
                  Aquí aparecen todos tus horarios de atención. Los pacientes verán estos espacios cuando soliciten una cita.
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setMostraPreview(!mostraPreview)} 
                  className="border-slate-600 text-slate-200 hover:bg-slate-700 whitespace-nowrap"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vista del Paciente
                </Button>
              </div>
            </div>
          </CardHeader>

          {mostraPreview && (
            <CardContent className="pt-0 pb-6 border-b border-slate-700">
              <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-4">
                <div className="flex items-start gap-2">
                  <Eye className="w-5 h-5 text-blue-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium mb-3">Vista del Paciente - Próximas Citas Disponibles</p>
                    {totalBloques === 0 ? (
                      <p className="text-slate-400 text-sm">Sin horarios configurados aún</p>
                    ) : (
                      <div className="space-y-2">
                        {agendas.filter(a => a.disponible).map((agenda) => {
                          const slots = generarSlotsDisponibles(agenda.horainicio, agenda.horafin);
                          return slots.length > 0 && (
                            <div key={agenda.agendaid} className="bg-slate-900/50 rounded-lg p-3">
                              <p className="text-slate-300 font-medium text-sm mb-2">{agenda.diasemana}</p>
                              <div className="flex flex-wrap gap-2">
                                {slots.map((slot) => (
                                  <div key={slot} className="px-3 py-1 bg-teal-600/30 border border-teal-500/50 rounded text-teal-200 text-xs font-medium">
                                    {slot}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          )}

          <CardContent>
            {loading ? (
              <div className="py-12 text-center text-slate-400">Cargando horarios...</div>
            ) : (
              <div className="space-y-3">
                {DIAS_SEMANA.map((dia) => {
                  const horariosDelDia = agendasPorDia[dia];
                  const estaExpandido = diasExpandidos[dia] !== false; // Expandido por defecto si hay horarios
                  
                  return (
                    <Collapsible 
                      key={dia} 
                      open={estaExpandido && horariosDelDia.length > 0}
                      onOpenChange={(open) => setDiasExpandidos(prev => ({ ...prev, [dia]: open }))}
                    >
                      <div className="rounded-lg border border-slate-700 bg-slate-900/30 overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <span className="font-medium text-slate-100">{dia}</span>
                              <Badge className="bg-slate-700 text-slate-200 text-xs">
                                {horariosDelDia.length} horario{horariosDelDia.length !== 1 ? 's' : ''}
                              </Badge>
                              {horariosDelDia.some(h => !h.disponible) && (
                                <Badge className="bg-amber-700/50 text-amber-200 text-xs">
                                  {horariosDelDia.filter(h => !h.disponible).length} pausado
                                </Badge>
                              )}
                            </div>
                            {horariosDelDia.length > 0 && (
                              estaExpandido ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="border-t border-slate-700 px-4 py-3 space-y-3 bg-slate-950/30">
                            {horariosDelDia.length === 0 ? (
                              <p className="text-slate-500 text-sm italic">Sin horarios en este día</p>
                            ) : (
                              horariosDelDia.map((agenda) => {
                                const duracion = Math.max(0, calcularDuracion(agenda.horainicio, agenda.horafin));
                                const slots = generarSlotsDisponibles(agenda.horainicio, agenda.horafin);
                                
                                return (
                                  <div key={agenda.agendaid} className="rounded-lg border border-slate-600 bg-slate-800/40 p-4 space-y-3">
                                    {/* Info del Horario */}
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                          <Badge className={agenda.disponible ? 'bg-green-600/80 text-green-100' : 'bg-slate-600 text-slate-300'}>
                                            {agenda.disponible ? '✓ Activo' : '⊘ Pausado'}
                                          </Badge>
                                          <Badge variant="outline" className="border-teal-500/40 text-teal-300">
                                            {normalizarHora(agenda.horainicio)} - {normalizarHora(agenda.horafin)}
                                          </Badge>
                                        </div>
                                        <p className="text-slate-400 text-sm">
                                          Duración: <span className="text-slate-200 font-medium">{duracion.toFixed(1)} h</span> • 
                                          <span className="text-slate-200 font-medium ml-1">{slots.length} espacio{slots.length !== 1 ? 's' : ''}</span>
                                        </p>
                                      </div>
                                    </div>

                                    {/* Botones de Acción */}
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => iniciarEdicion(agenda)}
                                        className="flex-1 border-slate-600 text-slate-200 hover:bg-slate-700"
                                      >
                                        <Pencil className="w-4 h-4 mr-2 stroke-2" />
                                        Editar
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => toggleDisponibilidad(agenda)}
                                        className={agenda.disponible 
                                          ? "flex-1 border-amber-500/40 text-amber-300 hover:bg-amber-500/10" 
                                          : "flex-1 border-green-500/40 text-green-300 hover:bg-green-500/10"}
                                      >
                                        {agenda.disponible ? 'Pausar' : 'Reactivar'}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        onClick={() => eliminarBloque(agenda)}
                                        className="flex-1 border-red-500/40 text-red-300 hover:bg-red-500/10"
                                      >
                                        <Trash2 className="w-4 h-4 stroke-2" />
                                      </Button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            {/* Mensaje contextual */}
            {totalBloques > 0 && (
              <div className="mt-6 rounded-lg border border-slate-700 bg-slate-900/50 p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-slate-300 font-medium mb-1">Próximo paso</p>
                  <p className="text-slate-400">
                    Ahora puedes ir a <Button 
                      variant="link" 
                      onClick={() => onNavigate('citas')} 
                      className="p-0 h-auto text-teal-400 hover:text-teal-300 underline"
                    >
                      Gestionar Citas
                    </Button> para programar citas aprovechando estos horarios.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
