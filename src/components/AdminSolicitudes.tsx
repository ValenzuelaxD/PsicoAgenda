import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { apiFetch, API_ENDPOINTS } from '../utils/api';

interface SolicitudRegistroPsicologa {
  solicitudid: number;
  nombre: string;
  apellidopaterno: string;
  apellidomaterno?: string | null;
  correo: string;
  telefono?: string | null;
  cedulaprofesional: string;
  especialidad?: string | null;
  estadosolicitud: 'Pendiente' | 'Aprobada' | 'Rechazada';
  motivorevision?: string | null;
  fechasolicitud: string;
  fecharevision?: string | null;
}

export function AdminSolicitudes() {
  const [loading, setLoading] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [solicitudes, setSolicitudes] = useState<SolicitudRegistroPsicologa[]>([]);

  const cargarSolicitudes = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(API_ENDPOINTS.ADMIN_SOLICITUDES_PSICOLOGAS);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No fue posible cargar las solicitudes.');
      }

      setSolicitudes(data.solicitudes || []);
    } catch (error: any) {
      toast.error('Error al cargar solicitudes', {
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const resumen = useMemo(() => {
    return {
      pendientes: solicitudes.filter((s) => s.estadosolicitud === 'Pendiente').length,
      aprobadas: solicitudes.filter((s) => s.estadosolicitud === 'Aprobada').length,
      rechazadas: solicitudes.filter((s) => s.estadosolicitud === 'Rechazada').length,
    };
  }, [solicitudes]);

  const aprobarSolicitud = async (solicitudId: number) => {
    try {
      setProcesandoId(solicitudId);
      const response = await apiFetch(API_ENDPOINTS.ADMIN_APROBAR_SOLICITUD_PSICOLOGA(solicitudId), {
        method: 'PUT',
        body: JSON.stringify({ motivoRevision: 'Solicitud aprobada por administrador.' }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo aprobar la solicitud.');
      }

      toast.success('Solicitud aprobada', {
        description: 'La cuenta de psicóloga fue creada correctamente.',
      });
      await cargarSolicitudes();
    } catch (error: any) {
      toast.error('Error al aprobar', { description: error.message });
    } finally {
      setProcesandoId(null);
    }
  };

  const rechazarSolicitud = async (solicitudId: number) => {
    const motivo = window.prompt('Motivo del rechazo (obligatorio):', '');
    if (!motivo || !motivo.trim()) {
      toast.error('Debes capturar un motivo para rechazar la solicitud.');
      return;
    }

    try {
      setProcesandoId(solicitudId);
      const response = await apiFetch(API_ENDPOINTS.ADMIN_RECHAZAR_SOLICITUD_PSICOLOGA(solicitudId), {
        method: 'PUT',
        body: JSON.stringify({ motivoRevision: motivo.trim() }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo rechazar la solicitud.');
      }

      toast.success('Solicitud rechazada', {
        description: 'La solicitud fue marcada como rechazada.',
      });
      await cargarSolicitudes();
    } catch (error: any) {
      toast.error('Error al rechazar', { description: error.message });
    } finally {
      setProcesandoId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-slate-100 mb-1">Solicitudes de Psicologas</h1>
        <p className="text-slate-300">Revisa, aprueba o rechaza las altas pendientes.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-amber-500/30">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Pendientes</p>
            <p className="text-slate-100 text-2xl">{resumen.pendientes}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-teal-500/30">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Aprobadas</p>
            <p className="text-slate-100 text-2xl">{resumen.aprobadas}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-rose-500/30">
          <CardContent className="pt-6">
            <p className="text-slate-400 text-sm">Rechazadas</p>
            <p className="text-slate-100 text-2xl">{resumen.rechazadas}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">Bandeja de revisión</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-slate-400">Cargando solicitudes...</p>
          ) : solicitudes.length === 0 ? (
            <p className="text-slate-400">No hay solicitudes registradas.</p>
          ) : (
            solicitudes.map((solicitud) => {
              const nombreCompleto = [
                solicitud.nombre,
                solicitud.apellidopaterno,
                solicitud.apellidomaterno,
              ]
                .filter(Boolean)
                .join(' ');

              const esPendiente = solicitud.estadosolicitud === 'Pendiente';

              return (
                <div
                  key={solicitud.solicitudid}
                  className="rounded-xl border border-slate-700 bg-slate-900/40 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <p className="text-slate-100">{nombreCompleto}</p>
                      <p className="text-slate-400 text-sm">{solicitud.correo}</p>
                    </div>
                    <Badge
                      className={
                        solicitud.estadosolicitud === 'Pendiente'
                          ? 'bg-amber-600 text-white'
                          : solicitud.estadosolicitud === 'Aprobada'
                            ? 'bg-teal-600 text-white'
                            : 'bg-rose-600 text-white'
                      }
                    >
                      {solicitud.estadosolicitud}
                    </Badge>
                  </div>

                  <div className="text-sm text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <p><span className="text-slate-400">Cedula:</span> {solicitud.cedulaprofesional}</p>
                    <p><span className="text-slate-400">Especialidad:</span> {solicitud.especialidad || 'Sin especificar'}</p>
                    <p><span className="text-slate-400">Telefono:</span> {solicitud.telefono || 'No capturado'}</p>
                    <p><span className="text-slate-400">Solicitud:</span> {new Date(solicitud.fechasolicitud).toLocaleString()}</p>
                  </div>

                  {!!solicitud.motivorevision && (
                    <p className="text-sm text-slate-300 rounded-md bg-slate-800 p-2 border border-slate-700">
                      <span className="text-slate-400">Motivo de revision:</span> {solicitud.motivorevision}
                    </p>
                  )}

                  {esPendiente && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        onClick={() => aprobarSolicitud(solicitud.solicitudid)}
                        disabled={procesandoId === solicitud.solicitudid}
                        className="bg-teal-600 hover:bg-teal-700"
                      >
                        Aprobar
                      </Button>
                      <Button
                        type="button"
                        onClick={() => rechazarSolicitud(solicitud.solicitudid)}
                        disabled={procesandoId === solicitud.solicitudid}
                        className="bg-rose-600 hover:bg-rose-700 text-white"
                      >
                        Rechazar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
