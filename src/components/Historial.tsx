import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { FileText, Calendar, TrendingUp, Clock } from 'lucide-react';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { API_ENDPOINTS } from '../utils/api';

export function Historial() {
  const [historial, setHistorial] = useState<any[]>([]);
  const [estadisticas, setEstadisticas] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistorial = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No autenticado. Por favor inicia sesión.');
        }

        const response = await fetch(API_ENDPOINTS.MI_HISTORIAL, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error al cargar el historial clínico');
        }

        const data = await response.json();
        setHistorial(data.historial || []);
        setEstadisticas(data.estadisticas || {});
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
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
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-12">
          <p className="text-slate-400">Cargando historial clínico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Historial Clínico</h1>
        <p className="text-slate-300">
          Revisa tus sesiones pasadas y tu progreso terapéutico
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
        <div className="flex items-center justify-between">
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
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <FileText className="w-6 h-6 text-white stroke-2" />
                    </div>
                    <div>
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
                  <Badge className="bg-teal-600">Completada</Badge>
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