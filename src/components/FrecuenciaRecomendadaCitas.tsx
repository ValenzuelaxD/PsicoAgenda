import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CalendarClock, Save, RefreshCw, Plus, Minus, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, CLIENT_CONFIG, apiFetch } from '../utils/api';
import { FrecuenciaRecomendadaCita } from '../utils/types';

type ModoModulo = 'psicologo' | 'paciente';

type UnidadFrecuencia = 'dias' | 'semanas' | 'meses';

interface FrecuenciaRecomendadaCitasProps {
  modo: ModoModulo;
  pacienteId?: number;
  ultimaSesion?: string;
  onSolicitarCitaConFecha?: (data: { fechaISO: string; psicologaId?: number }) => void;
}

const LABEL_UNIDAD_PLURAL: Record<UnidadFrecuencia, string> = {
  dias: 'días',
  semanas: 'semanas',
  meses: 'meses',
};

const LABEL_UNIDAD_SINGULAR: Record<UnidadFrecuencia, string> = {
  dias: 'día',
  semanas: 'semana',
  meses: 'mes',
};

const OPCIONES_UNIDAD: UnidadFrecuencia[] = ['dias', 'semanas', 'meses'];

function formatearFecha(fecha?: string): string {
  if (!fecha) return 'Sin fecha';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function formatearFechaLarga(fecha?: string): string {
  if (!fecha) return 'Sin fecha';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function construirTexto(cadaCantidad: number, unidad: UnidadFrecuencia): string {
  const labelUnidad = cadaCantidad === 1 ? LABEL_UNIDAD_SINGULAR[unidad] : LABEL_UNIDAD_PLURAL[unidad];
  return `Cada ${cadaCantidad} ${labelUnidad}`;
}

function sumarFrecuenciaAFecha(fechaBase: string | undefined, cadaCantidad: number, unidad: UnidadFrecuencia): string | null {
  if (!fechaBase) return null;

  const fechaBaseLocal = (() => {
    const coincidencia = String(fechaBase).trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (coincidencia) {
      return coincidencia[1];
    }

    const fechaParseada = new Date(fechaBase);
    if (Number.isNaN(fechaParseada.getTime())) {
      return null;
    }

    const year = fechaParseada.getFullYear();
    const month = `${fechaParseada.getMonth() + 1}`.padStart(2, '0');
    const day = `${fechaParseada.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  })();

  if (!fechaBaseLocal) return null;

  const fecha = new Date(`${fechaBaseLocal}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return null;

  const cantidad = Number(cadaCantidad);
  if (!Number.isInteger(cantidad) || cantidad <= 0) return null;

  const siguiente = new Date(fecha);
  if (unidad === 'dias') {
    siguiente.setDate(siguiente.getDate() + cantidad);
  } else if (unidad === 'semanas') {
    siguiente.setDate(siguiente.getDate() + cantidad * 7);
  } else {
    siguiente.setMonth(siguiente.getMonth() + cantidad);
  }

  const year = siguiente.getFullYear();
  const month = `${siguiente.getMonth() + 1}`.padStart(2, '0');
  const day = `${siguiente.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatearFechaISO(fecha: Date): string {
  const year = fecha.getFullYear();
  const month = `${fecha.getMonth() + 1}`.padStart(2, '0');
  const day = `${fecha.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function esFechaPasada(fechaISO: string): boolean {
  const fecha = new Date(`${fechaISO}T00:00:00`);
  if (Number.isNaN(fecha.getTime())) return false;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return fecha < hoy;
}

export function FrecuenciaRecomendadaCitas({
  modo,
  pacienteId,
  ultimaSesion,
  onSolicitarCitaConFecha,
}: FrecuenciaRecomendadaCitasProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecomendadaCita | null>(null);
  const [cadaCantidad, setCadaCantidad] = useState(1);
  const [unidad, setUnidad] = useState<UnidadFrecuencia>('semanas');
  const [nota, setNota] = useState('');
  const [fechaSiguienteDisponible, setFechaSiguienteDisponible] = useState<string | null>(null);
  const [buscandoFechaDisponible, setBuscandoFechaDisponible] = useState(false);

  const endpoint = useMemo(() => {
    if (modo === 'paciente') return API_ENDPOINTS.FRECUENCIA_CITAS_MI;
    if (!pacienteId) return '';
    return API_ENDPOINTS.FRECUENCIA_CITAS_PACIENTE(pacienteId);
  }, [modo, pacienteId]);

  const cargarFrecuencia = async () => {
    if (!endpoint) return;
    setLoading(true);
    try {
      const response = await apiFetch(endpoint);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'No fue posible cargar la frecuencia recomendada.');
      }

      const data = await response.json();
      const frecuenciaActual = (data?.frecuencia || null) as FrecuenciaRecomendadaCita | null;
      setFrecuencia(frecuenciaActual);

      if (frecuenciaActual) {
        setCadaCantidad(Number(frecuenciaActual.cadaCantidad) || 1);
        setUnidad((frecuenciaActual.unidad as UnidadFrecuencia) || 'semanas');
        setNota(String(frecuenciaActual.nota || ''));
      } else {
        setCadaCantidad(1);
        setUnidad('semanas');
        setNota('');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar frecuencia recomendada.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEditando(false);
    cargarFrecuencia();
  }, [endpoint]);

  const frecuenciaActual = frecuencia
    ? frecuencia.recomendacionTexto || construirTexto(frecuencia.cadaCantidad, frecuencia.unidad)
    : 'Sin recomendación registrada';

  const fechaSiguienteRecomendada = useMemo(() => {
    if (modo !== 'paciente' || !frecuencia) {
      return null;
    }

    return sumarFrecuenciaAFecha(ultimaSesion, frecuencia.cadaCantidad, frecuencia.unidad);
  }, [frecuencia, modo, ultimaSesion]);

  const fechaBaseBusqueda = useMemo(() => {
    if (!fechaSiguienteRecomendada) {
      return null;
    }

    const fechaBase = new Date(`${fechaSiguienteRecomendada}T00:00:00`);
    if (Number.isNaN(fechaBase.getTime())) {
      return null;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    if (fechaBase <= hoy) {
      return formatearFechaISO(manana);
    }

    return fechaSiguienteRecomendada;
  }, [fechaSiguienteRecomendada]);

  useEffect(() => {
    if (modo !== 'paciente' || !frecuencia || !frecuencia.psicologaId || !fechaBaseBusqueda) {
      setFechaSiguienteDisponible(null);
      return;
    }

    let cancelado = false;

    const buscarSiguienteDisponible = async () => {
      setBuscandoFechaDisponible(true);
      setFechaSiguienteDisponible(null);

      try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const manana = new Date(hoy);
        manana.setDate(manana.getDate() + 1);
        const base = new Date(`${fechaBaseBusqueda}T00:00:00`);
        const limite = new Date(hoy);
        limite.setDate(limite.getDate() + CLIENT_CONFIG.APPOINTMENT_WINDOW_PATIENT_DAYS);
        limite.setHours(23, 59, 59, 999);

        const inicio = base > manana ? base : manana;
        const fechas: string[] = [];
        const cursor = new Date(inicio);
        while (cursor <= limite) {
          fechas.push(formatearFechaISO(cursor));
          cursor.setDate(cursor.getDate() + 1);
        }

        for (const fecha of fechas) {
          const response = await apiFetch(`${API_ENDPOINTS.PSICOLOGAS}/${frecuencia.psicologaId}/disponibilidad?fecha=${fecha}`);
          if (!response.ok) {
            continue;
          }

          const horarios = await response.json();
          if (Array.isArray(horarios) && horarios.length > 0) {
            if (!cancelado) {
              setFechaSiguienteDisponible(fecha);
            }
            return;
          }
        }

        if (!cancelado) {
          setFechaSiguienteDisponible(null);
        }
      } catch {
        if (!cancelado) {
          setFechaSiguienteDisponible(null);
        }
      } finally {
        if (!cancelado) {
          setBuscandoFechaDisponible(false);
        }
      }
    };

    buscarSiguienteDisponible();

    return () => {
      cancelado = true;
    };
  }, [modo, frecuencia, fechaBaseBusqueda]);

  const fechaSiguienteVisual = fechaSiguienteDisponible || fechaBaseBusqueda || fechaSiguienteRecomendada;
  const fechaParaSolicitar = fechaSiguienteDisponible || fechaBaseBusqueda || fechaSiguienteRecomendada;
  const fechaSiguienteRecomendadaLabel = fechaSiguienteVisual
    ? formatearFechaLarga(fechaSiguienteVisual)
    : 'Aún no se puede calcular';

  const fechaSiguienteSubtitulo = fechaBaseBusqueda && fechaSiguienteDisponible && fechaBaseBusqueda !== fechaSiguienteDisponible
    ? `La fecha ideal ya pasó o no tiene cupo, así que se ajustó a la primera fecha disponible.`
    : fechaBaseBusqueda && esFechaPasada(fechaBaseBusqueda)
      ? 'La fecha ideal ya pasó; se ajustó a la primera fecha disponible.'
      : fechaBaseBusqueda
        ? `Basada en tu última cita del ${formatearFechaLarga(ultimaSesion)}`
        : 'Necesitamos una última cita registrada para calcularla.';

  const guardarFrecuencia = async () => {
    if (modo !== 'psicologo' || !endpoint) return;

    const cantidad = Number(cadaCantidad);
    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 365) {
      toast.error('La frecuencia debe ser un número entero entre 1 y 365.');
      return;
    }

    setSaving(true);
    try {
      const response = await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify({
          cadaCantidad: cantidad,
          unidad,
          nota,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'No fue posible guardar la frecuencia recomendada.');
      }

      const data = await response.json();
      const guardada = (data?.frecuencia || null) as FrecuenciaRecomendadaCita | null;
      setFrecuencia(guardada);
      setEditando(false);
      toast.success('Frecuencia recomendada guardada correctamente.');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar la frecuencia recomendada.');
    } finally {
      setSaving(false);
    }
  };

  const nombreProfesional = frecuencia?.psicologaNombre
    ? `${frecuencia.psicologaNombre} ${frecuencia.psicologaApellido || ''}`.trim()
    : '';

  const incrementarCantidad = () => setCadaCantidad((prev) => Math.min(365, prev + 1));
  const disminuirCantidad = () => setCadaCantidad((prev) => Math.max(1, prev - 1));

  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-teal-300" />
            Frecuencia Recomendada de Citas
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={cargarFrecuencia}
              disabled={loading || saving}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p className="text-slate-400 text-sm">Cargando frecuencia recomendada...</p>
        ) : (
          <>
            <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Recomendación actual</p>
              <p className="text-slate-100 text-lg font-semibold">{frecuenciaActual}</p>
              {frecuencia?.nota ? (
                <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{frecuencia.nota}</p>
              ) : null}
              <div className="mt-2 text-xs text-slate-400 space-y-1">
                {modo === 'paciente' && nombreProfesional ? (
                  <p>Recomendado por: {nombreProfesional}</p>
                ) : null}
                {frecuencia?.fechaModificacion ? (
                  <p>Última actualización: {formatearFecha(frecuencia.fechaModificacion)}</p>
                ) : null}
              </div>
            </div>

            {modo === 'paciente' && (
              <div className="rounded-lg border border-teal-500/30 bg-slate-900/40 p-4 space-y-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-teal-300">Siguiente fecha recomendada</p>
                  <p className="text-slate-100 text-lg font-semibold">{fechaSiguienteRecomendadaLabel}</p>
                  <p className="text-xs text-slate-400">{buscandoFechaDisponible ? 'Buscando horarios disponibles más cercanos...' : fechaSiguienteSubtitulo}</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-300">
                    Puedes usar esta fecha como punto de partida para agendar tu siguiente cita.
                  </p>
                  <Button
                    type="button"
                    onClick={() => {
                      if (fechaParaSolicitar && onSolicitarCitaConFecha) {
                        onSolicitarCitaConFecha({
                          fechaISO: fechaParaSolicitar,
                          psicologaId: frecuencia?.psicologaId,
                        });
                      }
                    }}
                    disabled={!fechaParaSolicitar || !onSolicitarCitaConFecha}
                    className="bg-teal-600 hover:bg-teal-700 shrink-0"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Solicitar con esta fecha
                  </Button>
                </div>
              </div>
            )}

            {modo === 'psicologo' && (
              <div className="rounded-lg border border-teal-500/30 bg-slate-900/40 p-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label className="text-slate-200">Frecuencia</Label>
                    <p className="text-xs text-slate-400">
                      {construirTexto(cadaCantidad, unidad)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 w-fit">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={disminuirCantidad}
                      disabled={saving || cadaCantidad <= 1}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700 h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <div className="rounded-md border border-slate-600 bg-slate-800 px-2 py-1 text-center text-slate-100 font-semibold text-sm min-w-[2rem]">
                      {cadaCantidad}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={incrementarCantidad}
                      disabled={saving || cadaCantidad >= 365}
                      className="border-slate-600 text-slate-200 hover:bg-slate-700 h-8 w-8 p-0 flex-shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-200">Unidad</Label>
                  <Select value={unidad} onValueChange={(value) => setUnidad(value as UnidadFrecuencia)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                      <SelectValue placeholder="Selecciona una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {OPCIONES_UNIDAD.map((opcion) => (
                        <SelectItem key={opcion} value={opcion}>
                          {cadaCantidad === 1 ? LABEL_UNIDAD_SINGULAR[opcion] : LABEL_UNIDAD_PLURAL[opcion]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-slate-200">Observación (opcional)</Label>
                  <Textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    placeholder="Ejemplo: Mantener sesiones semanales durante el próximo mes"
                    rows={3}
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={guardarFrecuencia}
                    disabled={saving}
                    className="bg-teal-600 hover:bg-teal-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Guardando...' : 'Guardar frecuencia'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
