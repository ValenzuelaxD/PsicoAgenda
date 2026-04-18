import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { apiFetch, API_ENDPOINTS } from '../utils/api';

const HISTORIAL_CACHE_PREFIX = 'historial_paciente_cache_v1';
const HISTORIAL_CACHE_TTL_MS = 90 * 1000;

export function Historial() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const construirClaveCacheHistorial = () => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) {
        return `${HISTORIAL_CACHE_PREFIX}:anon`;
      }

      const parsedUser = JSON.parse(rawUser);
      const userId = String(parsedUser?.usuarioid || parsedUser?.id || 'anon');
      return `${HISTORIAL_CACHE_PREFIX}:${userId}`;
    } catch {
      return `${HISTORIAL_CACHE_PREFIX}:anon`;
    }
  };

  const leerCacheHistorial = () => {
    try {
      const raw = sessionStorage.getItem(construirClaveCacheHistorial());
      if (!raw) {
        return null;
      }

      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return null;
      }

      const expiracion = Number(parsed.expiracion || 0);
      if (!Number.isFinite(expiracion) || expiracion < Date.now()) {
        sessionStorage.removeItem(construirClaveCacheHistorial());
        return null;
      }

      return {
        historial: Array.isArray(parsed.historial) ? parsed.historial : [],
        estadisticas: parsed.estadisticas || {},
      };
    } catch {
      return null;
    }
  };

  const guardarCacheHistorial = (payload: { historial: any[]; estadisticas: any }) => {
    try {
      sessionStorage.setItem(
        construirClaveCacheHistorial(),
        JSON.stringify({
          expiracion: Date.now() + HISTORIAL_CACHE_TTL_MS,
          historial: payload.historial,
          estadisticas: payload.estadisticas,
        })
      );
    } catch {
      // Ignorar errores de serialización o cuota.
    }
  };

  const invalidarCacheHistorial = () => {
    try {
      sessionStorage.removeItem(construirClaveCacheHistorial());
    } catch {
      // Ignorar errores de storage.
    }
  };

  useEffect(() => {
    const fetchHistorial = async (
      { forzar = false, silencioso = false }: { forzar?: boolean; silencioso?: boolean } = {}
    ) => {
      try {
        if (!silencioso) {
          setLoading(true);
          setError(null);
        }

        if (!forzar) {
          const dataCache = leerCacheHistorial();
          if (dataCache) {
            setHistorial(dataCache.historial);
            setEstadisticas(dataCache.estadisticas);
            if (!silencioso) {
              setLoading(false);
            }

            void fetchHistorial({ forzar: true, silencioso: true });
            return;
          }
        }

        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No autenticado. Por favor inicia sesión.');
        }

        const response = await apiFetch(API_ENDPOINTS.MI_HISTORIAL);

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          invalidarCacheHistorial();
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar el historial clínico');
        }

        const data = await response.json();
        const payload = {
          historial: Array.isArray(data?.historial) ? data.historial : [],
          estadisticas: data?.estadisticas || {},
        };

        setHistorial(payload.historial);
        setEstadisticas(payload.estadisticas);
        guardarCacheHistorial(payload);
      } catch (err: any) {
        if (!silencioso) {
          setError(err.message);
          toast.error(err.message);
        }
      } finally {
        if (!silencioso) {
          setLoading(false);
        }
      }
    };

    fetchHistorial();
  }, []);

  const calcularTiempoEnTerapia = () => {
    if (!estadisticas?.primera_sesion) return 'N/A';
    
    const inicio = new Date(estadisticas.primera_sesion);
    const ahora = new Date();
    const meses = Math.floor((ahora.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
    
    if (meses < 1) return 'Menos de 1 mes';
    if (meses === 1) return '1 mes';
    return `${meses} meses`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
        <div className="text-center py-12">
          <p className="text-slate-400">Cargando historial clínico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-white mb-2 text-xl sm:text-2xl">Historial Clínico</h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Revisa tus sesiones pasadas y tu progreso terapéutico
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Total Sesiones</p>
              <p className="text-white text-3xl font-semibold">{estadisticas?.total_sesiones || 0}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Tiempo en Terapia</p>
              <p className="text-teal-400 text-2xl font-semibold">{calcularTiempoEnTerapia()}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-slate-400 mb-1">Última Sesión</p>
              <p className="text-violet-400 text-lg font-semibold">
                {estadisticas?.ultima_sesion 
                  ? new Date(estadisticas.ultima_sesion).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'N/A'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historial de Sesiones */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="text-white">Sesiones Anteriores ({historial.length})</h2>
        </div>

        {historial.length === 0 ? (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-slate-300 mb-2">No hay registros en tu historial</h3>
              <p className="text-slate-400 text-sm">
                Tu historial clínico se irá construyendo conforme completes sesiones con tu psicólogo/a
              </p>
            </CardContent>
          </Card>
        ) : (
          historial.map((entrada, index) => (
            <Card key={entrada.historialid} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
                      {entrada.psicologa_fotoperfil ? (
                        <img
                          src={entrada.psicologa_fotoperfil}
                          alt={`Foto de ${entrada.psicologa_nombre || 'psicóloga'}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FileText className="w-6 h-6 text-white stroke-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-slate-100">
                        Sesión #{historial.length - index} - {entrada.modalidad || 'Presencial'}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1 text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {entrada.fechacita 
                            ? new Date(entrada.fechacita).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                            : new Date(entrada.fechaentrada).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                          }
                        </span>
                        {entrada.duracionmin && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {entrada.duracionmin} min
                            </span>
                          </>
                        )}
                        {entrada.psicologa_nombre && (
                          <>
                            <span>•</span>
                            <span>
                              {entrada.psicologa_nombre} {entrada.psicologa_apellido}
                            </span>
                          </>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="bg-teal-600 w-fit">Completada</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {entrada.diagnostico && (
                  <div>
                    <h4 className="text-slate-200 mb-2">Diagnóstico</h4>
                    <p className="text-slate-300">{entrada.diagnostico}</p>
                  </div>
                )}

                {entrada.tratamiento && (
                  <div>
                    <h4 className="text-slate-200 mb-2">Tratamiento</h4>
                    <p className="text-slate-300">{entrada.tratamiento}</p>
                  </div>
                )}

                {entrada.observaciones && (
                  <div>
                    <h4 className="text-slate-200 mb-2">Observaciones</h4>
                    <p className="text-slate-300">{entrada.observaciones}</p>
                  </div>
                )}

                {!entrada.diagnostico && !entrada.tratamiento && !entrada.observaciones && (
                  <div className="text-center py-4">
                    <p className="text-slate-400 text-sm">Sin notas registradas para esta sesión</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}