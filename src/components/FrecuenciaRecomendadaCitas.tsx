import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { CalendarClock, Save, Edit3, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { API_ENDPOINTS, apiFetch } from '../utils/api';
import { FrecuenciaRecomendadaCita } from '../utils/types';

type ModoModulo = 'psicologo' | 'paciente';

type UnidadFrecuencia = 'dias' | 'semanas' | 'meses';

interface FrecuenciaRecomendadaCitasProps {
  modo: ModoModulo;
  pacienteId?: number;
}

const LABEL_UNIDAD: Record<UnidadFrecuencia, string> = {
  dias: 'días',
  semanas: 'semanas',
  meses: 'meses',
};

const OPCIONES_UNIDAD: UnidadFrecuencia[] = ['dias', 'semanas', 'meses'];

function formatearFecha(fecha?: string): string {
  if (!fecha) return 'Sin fecha';
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return 'Sin fecha';
  return date.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function construirTexto(cadaCantidad: number, unidad: UnidadFrecuencia): string {
  return `Cada ${cadaCantidad} ${LABEL_UNIDAD[unidad]}`;
}

export function FrecuenciaRecomendadaCitas({ modo, pacienteId }: FrecuenciaRecomendadaCitasProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editando, setEditando] = useState(false);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaRecomendadaCita | null>(null);
  const [cadaCantidad, setCadaCantidad] = useState(1);
  const [unidad, setUnidad] = useState<UnidadFrecuencia>('semanas');
  const [nota, setNota] = useState('');

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

  const textoFrecuencia = frecuencia
    ? frecuencia.recomendacionTexto || construirTexto(frecuencia.cadaCantidad, frecuencia.unidad)
    : 'Sin recomendación registrada';

  const nombreProfesional = frecuencia?.psicologaNombre
    ? `${frecuencia.psicologaNombre} ${frecuencia.psicologaApellido || ''}`.trim()
    : '';

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
            {modo === 'psicologo' && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditando((prev) => !prev)}
                disabled={loading || saving}
                className="border-teal-500/50 text-teal-300 hover:bg-teal-500/20"
              >
                <Edit3 className="w-4 h-4 mr-2" />
                {editando ? 'Cancelar' : 'Editar frecuencia'}
              </Button>
            )}
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
              <p className="text-slate-100 text-lg font-semibold">{textoFrecuencia}</p>
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

            {modo === 'psicologo' && editando && (
              <div className="rounded-lg border border-teal-500/30 bg-slate-900/40 p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-[10rem_minmax(0,1fr)] gap-3">
                  <div className="space-y-1">
                    <Label className="text-slate-200">Cada cuánto</Label>
                    <Input
                      type="number"
                      min={1}
                      max={365}
                      value={cadaCantidad}
                      onChange={(e) => setCadaCantidad(Number(e.target.value || 1))}
                      className="bg-slate-700 border-slate-600 text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-slate-200">Unidad</Label>
                    <select
                      value={unidad}
                      onChange={(e) => setUnidad(e.target.value as UnidadFrecuencia)}
                      className="w-full h-10 rounded-md border border-slate-600 bg-slate-700 px-3 text-slate-100"
                    >
                      {OPCIONES_UNIDAD.map((opcion) => (
                        <option key={opcion} value={opcion}>
                          {LABEL_UNIDAD[opcion]}
                        </option>
                      ))}
                    </select>
                  </div>
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
