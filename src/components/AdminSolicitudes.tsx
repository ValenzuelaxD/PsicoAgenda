import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
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
  const [solicitudRechazoId, setSolicitudRechazoId] = useState<number | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

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

  const rechazarSolicitud = async (solicitudId: number, motivo: string) => {
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

  const abrirDialogoRechazo = (solicitudId: number) => {
    setSolicitudRechazoId(solicitudId);
    setMotivoRechazo('');
  };

  const cerrarDialogoRechazo = () => {
    setSolicitudRechazoId(null);
    setMotivoRechazo('');
  };

  const confirmarRechazo = async () => {
    if (!solicitudRechazoId) return;

    await rechazarSolicitud(solicitudRechazoId, motivoRechazo);
    if (motivoRechazo.trim()) {
      cerrarDialogoRechazo();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-slate-100 mb-1">Solicitudes de Psicologas</h1>
        <p className="text-slate-300">
          Revisa, <span className="text-teal-300">aprueba</span> o <span className="text-rose-300">rechaza</span> las altas pendientes.
        </p>
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
            <p className="text-rose-300 text-sm">Rechazadas</p>
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
                        onClick={() => abrirDialogoRechazo(solicitud.solicitudid)}
                        disabled={procesandoId === solicitud.solicitudid}
                        className="bg-rose-600 hover:bg-rose-700 text-rose-50 font-semibold"
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

      <Dialog open={solicitudRechazoId !== null} onOpenChange={(open) => !open && cerrarDialogoRechazo()}>
        <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-rose-300">Rechazar Solicitud</DialogTitle>
            <DialogDescription className="text-slate-400">
              Captura el motivo del rechazo. Este motivo quedará registrado para auditoría.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="motivo-rechazo" className="text-slate-200">Motivo</Label>
            <Textarea
              id="motivo-rechazo"
              value={motivoRechazo}
              onChange={(event) => setMotivoRechazo(event.target.value)}
              placeholder="Ejemplo: La cédula no coincide con la documentación enviada."
              className="min-h-28 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cerrarDialogoRechazo}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={confirmarRechazo}
              disabled={!motivoRechazo.trim() || (solicitudRechazoId !== null && procesandoId === solicitudRechazoId)}
              className="bg-rose-600 hover:bg-rose-700 text-rose-50 font-semibold"
            >
              Confirmar Rechazo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
