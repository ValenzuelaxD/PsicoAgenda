import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Calendar, Clock, AlertCircle, Info } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../utils/api';
import useIsMobile from '../hooks/useIsMobile';

interface Notification {
  notificacionid: string;
  tipo: 'cita' | 'recordatorio' | 'sistema' | 'info';
  titulo: string;
  descripcion: string;
  fechacreacion: string;
  leida: boolean;
}

interface NotificationCenterProps {
  userType: 'psicologo' | 'paciente' | 'admin';
}

export function NotificationCenter({ userType }: NotificationCenterProps) {
  const isMobile = useIsMobile();
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No estás autenticado.');
        }

        const response = await fetch(API_ENDPOINTS.NOTIFICACIONES, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Error al obtener las notificaciones.');
        }

        const data = await response.json();
        setNotificaciones(data);
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (mostrarPanel) {
      fetchNotificaciones();
    }
  }, [mostrarPanel]);

  useEffect(() => {
    if (!mostrarPanel) {
      return;
    }

    const originalOverflow = document.body.style.overflow;

    // Lock page scroll while the notifications panel is open.
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mostrarPanel]);


  const notificacionesNoLeidas = notificaciones.filter((n) => !n.leida).length;

  const marcarComoLeida = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.NOTIFICACIONES}/${id}/leida`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotificaciones(
        notificaciones.map((n) => (n.notificacionid === id ? { ...n, leida: true } : n))
      );
    } catch (err) {
      toast.error('Error al marcar la notificación como leída.');
    }
  };

  const marcarTodasComoLeidas = async () => {
    const idsNoLeidas = notificaciones.filter(n => !n.leida).map(n => n.notificacionid);
    try {
      const token = localStorage.getItem('token');
      await Promise.all(idsNoLeidas.map(id =>
        fetch(`${API_ENDPOINTS.NOTIFICACIONES}/${id}/leida`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ));
      setNotificaciones(notificaciones.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      toast.error('Error al marcar todas las notificaciones como leídas.');
    }
  };

  const eliminarNotificacion = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_ENDPOINTS.NOTIFICACIONES}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotificaciones(notificaciones.filter((n) => n.notificacionid !== id));
    } catch (err) {
      toast.error('Error al eliminar la notificación.');
    }
  };

  const getIcono = (tipo: Notification['tipo']) => {
    switch (tipo) {
      case 'cita':
        return <Calendar className="w-5 h-5 stroke-2 text-teal-400" />;
      case 'recordatorio':
        return <Clock className="w-5 h-5 stroke-2 text-violet-400" />;
      case 'sistema':
        return <AlertCircle className="w-5 h-5 stroke-2 text-orange-400" />;
      case 'info':
        return <Info className="w-5 h-5 stroke-2 text-blue-400" />;
      default:
        return <Bell className="w-5 h-5 stroke-2 text-slate-400" />;
    }
  };

  return (
    <>
      {/* Botón de notificaciones */}
      <motion.button
        onClick={() => setMostrarPanel(!mostrarPanel)}
        className="relative p-2 rounded-lg hover:bg-slate-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Bell className="w-6 h-6 stroke-2 text-slate-300" />
        {notificacionesNoLeidas > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-teal-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {notificacionesNoLeidas}
          </motion.div>
        )}
      </motion.button>

      {/* Panel de notificaciones */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence initial={false} mode="wait">
          {mostrarPanel && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50"
              style={{ zIndex: 1000 }}
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) {
                  setMostrarPanel(false);
                }
              }}
            >
              {/* Panel lateral */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
                onPointerDown={(event) => event.stopPropagation()}
                className="absolute right-0 top-0 bottom-0 bg-slate-800 shadow-2xl flex flex-col overflow-hidden"
                style={
                  isMobile
                    ? {
                        height: '100dvh',
                        width: '100vw',
                        maxWidth: '100vw',
                        paddingTop: 'env(safe-area-inset-top, 0px)',
                        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                        willChange: 'transform'
                      }
                    : {
                        height: '100dvh',
                        width: 'min(92vw, 360px)',
                        borderLeft: '1px solid rgb(51 65 85)',
                        willChange: 'transform'
                      }
                }
              >
                {/* Header */}
                <div className="px-3 py-2 border-b border-slate-700 bg-gradient-to-r from-teal-900/30 to-violet-900/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 stroke-2 text-teal-400" />
                      <h2 className="text-slate-100 text-sm">Notificaciones</h2>
                      {notificacionesNoLeidas > 0 && (
                        <Badge className="bg-teal-500 text-white text-xs px-1.5 py-0 h-4">
                          {notificacionesNoLeidas}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {notificacionesNoLeidas > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={marcarTodasComoLeidas}
                          className="text-teal-400 hover:text-teal-300 hover:bg-slate-700 text-[10px] h-6 px-2"
                        >
                          Marcar leídas
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMostrarPanel(false)}
                        className={`hover:bg-slate-700 p-0 ${isMobile ? 'h-11 w-11 mr-2' : 'h-9 w-9'}`}
                      >
                        <X className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'} stroke-2 text-slate-300`} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Lista de notificaciones */}
                <div
                  className="flex-1 min-h-0 p-3 space-y-2"
                  style={{
                    overflowY: 'auto',
                    overscrollBehavior: 'contain',
                    WebkitOverflowScrolling: 'touch',
                    touchAction: 'pan-y'
                  }}
                >
                  {loading ? (
                    <div className="text-center py-12">
                      <p className="text-slate-400">Cargando...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <p className="text-red-400">{error}</p>
                    </div>
                  ) : notificaciones.length === 0 ? (
                    <div className="text-center py-12">
                      <Bell className="w-12 h-12 stroke-2 text-slate-600 mx-auto mb-3" />
                      <p className="text-slate-400">No tienes notificaciones</p>
                    </div>
                  ) : (
                    notificaciones.map((notificacion, index) => (
                      <motion.div
                        key={notificacion.notificacionid}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className={`bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-all cursor-pointer ${
                            !notificacion.leida ? 'border-l-4 border-l-teal-500' : ''
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              <div className="flex-shrink-0">
                                {getIcono(notificacion.tipo)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <h3 className="text-slate-100 text-sm">
                                    {notificacion.titulo}
                                  </h3>
                                  {!notificacion.leida && (
                                    <Badge className="bg-teal-500 text-white text-xs px-1.5 py-0 h-5 flex-shrink-0">
                                      Nueva
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-slate-400 text-sm mb-2">
                                  {notificacion.descripcion}
                                </p>
                                <div className="flex items-center justify-between">
                                  <span className="text-slate-500 text-xs">
                                    {new Date(notificacion.fechacreacion).toLocaleString()}
                                  </span>
                                  <div className="flex gap-1">
                                    {!notificacion.leida && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => marcarComoLeida(notificacion.notificacionid)}
                                        className="h-7 px-2 text-teal-400 hover:text-teal-300 hover:bg-slate-600"
                                      >
                                        <Check className="w-4 h-4 stroke-2" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => eliminarNotificacion(notificacion.notificacionid)}
                                      className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-slate-600"
                                    >
                                      <X className="w-4 h-4 stroke-2" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}