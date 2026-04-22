import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Bell, X, Check, Calendar, Clock, AlertCircle, Info, LogOut, User } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import { API_ENDPOINTS, CLIENT_CONFIG } from '../utils/api';
import useIsMobile from '../hooks/useIsMobile';

interface Notification {
  notificacionid: string;
  tipo: 'cita' | 'recordatorio' | 'sistema' | 'info';
  titulo: string;
  descripcion: string;
  fechacreacion?: string;
  fechaenvio?: string;
  leida: boolean;
}

interface NotificationCenterProps {
  userType: 'psicologo' | 'paciente' | 'admin';
  userName: string;
  userPhoto: string;
  onLogout: () => void;
  onGoToProfile: () => void;
}

export function NotificationCenter({ userType, userName, userPhoto, onLogout, onGoToProfile }: NotificationCenterProps) {
  const isMobile = useIsMobile();
  const [mostrarPanel, setMostrarPanel] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastUnreadCountRef = useRef(0);
  const lastToastAtRef = useRef(0);

  const POLL_INTERVAL_MS = isMobile
    ? CLIENT_CONFIG.NOTIFICATIONS_POLL_INTERVAL_MOBILE_MS
    : CLIENT_CONFIG.NOTIFICATIONS_POLL_INTERVAL_DESKTOP_MS;
  const TOAST_COOLDOWN_MS = CLIENT_CONFIG.NOTIFICATIONS_TOAST_COOLDOWN_MS;

  const updateUnreadState = useCallback((unreadCount: number, allowToast: boolean) => {
    const previousUnreadCount = lastUnreadCountRef.current;

    if (allowToast && unreadCount > previousUnreadCount) {
      const now = Date.now();
      const isCooldownExpired = now - lastToastAtRef.current >= TOAST_COOLDOWN_MS;

      if (isCooldownExpired) {
        const newNotifications = unreadCount - previousUnreadCount;
        const mensaje = newNotifications === 1
          ? 'Tienes 1 notificacion nueva'
          : `Tienes ${newNotifications} notificaciones nuevas`;

        toast.info(mensaje, {
          description: 'Por favor revisa tus notificaciones en la esquina superior derecha',
          duration: 7000,
          className: 'bg-gradient-to-r from-teal-600 to-violet-600',
        });

        lastToastAtRef.current = now;
      }
    }

    lastUnreadCountRef.current = unreadCount;
  }, []);

  const getInitialesUsuario = (nombre: string) => {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return 'U';
    return partes.slice(0, 2).map((parte) => parte[0]?.toUpperCase() || '').join('') || 'U';
  };

  const getEtiquetaRol = () => {
    switch (userType) {
      case 'paciente':
        return 'Paciente';
      case 'psicologo':
        return 'Psicologo';
      default:
        return 'Administrador';
    }
  };

  const fetchNotificaciones = useCallback(async (options: { allowToast?: boolean; silentOnError?: boolean } = {}) => {
    const { allowToast = false, silentOnError = false } = options;
    try {
      if (notificaciones.length === 0) {
        setLoading(true);
      }

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
      updateUnreadState(data.filter((n: Notification) => !n.leida).length, allowToast);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      if (!silentOnError) {
        toast.error(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [notificaciones.length, updateUnreadState]);

  useEffect(() => {
    fetchNotificaciones({ allowToast: true });
  }, [fetchNotificaciones]);

  useEffect(() => {
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      return;
    }

    let intervalId: number | null = null;

    const startPolling = () => {
      if (intervalId !== null || document.hidden) {
        return;
      }

      intervalId = window.setInterval(() => {
        fetchNotificaciones({ allowToast: true, silentOnError: true });
      }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
      if (intervalId !== null) {
        window.clearInterval(intervalId);
        intervalId = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
        return;
      }

      fetchNotificaciones({ allowToast: true, silentOnError: true });
      startPolling();
    };

    const handleWindowFocus = () => {
      if (!document.hidden) {
        fetchNotificaciones({ allowToast: true, silentOnError: true });
      }
    };

    startPolling();
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      stopPolling();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [fetchNotificaciones]);

  useEffect(() => {
    if (mostrarPanel) {
      fetchNotificaciones();
    }
  }, [mostrarPanel, fetchNotificaciones]);

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

  const getFechaNotificacion = (notificacion: Notification) => {
    return notificacion.fechacreacion || notificacion.fechaenvio || '';
  };

  const formatearFechaNotificacion = (notificacion: Notification) => {
    const fechaRaw = getFechaNotificacion(notificacion);
    if (!fechaRaw) return 'Fecha no disponible';

    const matchLocal = fechaRaw.match(/^(\d{4})-(\d{2})-(\d{2})[\sT](\d{2}):(\d{2})(?::\d{2})?$/);
    if (matchLocal) {
      const [, year, month, day, hour, minute] = matchLocal;
      const hourNum = Number(hour);
      const sufijo = hourNum >= 12 ? 'p.m.' : 'a.m.';
      const hour12 = ((hourNum + 11) % 12) + 1;
      return `${day}/${month}/${year}, ${hour12.toString().padStart(2, '0')}:${minute} ${sufijo}`;
    }

    const fecha = new Date(fechaRaw);
    if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible';

    return fecha.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const limpiarSegundosEnTexto = (texto: string) => {
    return texto.replace(/(\b\d{1,2}:\d{2}):\d{2}(\s*[ap]\.?m\.?)/gi, '$1$2');
  };
  const avatarTriggerButton = (
    <button
      type="button"
      className="rounded-full focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-800"
      aria-label={`Abrir menu de perfil de ${userName}`}
    >
      <Avatar className="size-9 border border-slate-600 bg-slate-700 transition-transform duration-200 hover:scale-105">
        <AvatarImage src={userPhoto || undefined} alt={userName} />
        <AvatarFallback className="bg-slate-700 text-slate-200 text-[11px] font-semibold">
          {getInitialesUsuario(userName)}
        </AvatarFallback>
      </Avatar>
    </button>
  );

  const profileMenuContent = (
    <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-700 text-slate-100">
      <DropdownMenuItem
        onClick={onGoToProfile}
        className="cursor-pointer"
      >
        <User className="w-4 h-4" />
        Mi perfil
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-slate-700" />
      <DropdownMenuItem
        onClick={onLogout}
        className="text-red-300 focus:bg-red-950/40 focus:text-red-200 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        Cerrar sesion
      </DropdownMenuItem>
    </DropdownMenuContent>
  );

  return (
    <>
      {/* Botón de notificaciones */}
      <div className="flex items-center gap-3 shrink-0">
        {isMobile ? (
          <>
            <div className="flex flex-col items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {avatarTriggerButton}
                </DropdownMenuTrigger>
                {profileMenuContent}
              </DropdownMenu>
              <div className="text-center">
                <p className="text-[11px] uppercase tracking-wide text-slate-400 truncate w-[120px]">{getEtiquetaRol()}</p>
                <p className="text-sm text-slate-100 font-medium truncate w-[120px]">{userName}</p>
              </div>
            </div>

            <motion.button
              onClick={() => setMostrarPanel(!mostrarPanel)}
              className="relative p-2 rounded-lg hover:bg-slate-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Abrir notificaciones"
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
          </>
        ) : (
          <>
            <div className="flex flex-col items-end min-w-0 max-w-[170px] sm:max-w-[220px]">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 truncate w-full text-right">{getEtiquetaRol()}</p>
              <p className="text-sm text-slate-100 font-medium truncate w-full text-right">{userName}</p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {avatarTriggerButton}
              </DropdownMenuTrigger>
              {profileMenuContent}
            </DropdownMenu>

            <motion.button
              onClick={() => setMostrarPanel(!mostrarPanel)}
              className="relative p-2 rounded-lg hover:bg-slate-700 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Abrir notificaciones"
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
          </>
        )}
      </div>

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
                      <button
                        type="button"
                        onClick={() => setMostrarPanel(false)}
                        aria-label="Cerrar notificaciones"
                        className="inline-flex items-center justify-center -mr-2 rounded-xl text-slate-200 hover:bg-slate-700 active:scale-95 transition"
                        style={{ width: '44px', height: '44px' }}
                      >
                        <X className="text-slate-200" style={{ width: '22px', height: '22px', strokeWidth: 2.5 }} />
                      </button>
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
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <Card
                              className={`bg-slate-700/50 border-slate-600 hover:bg-slate-700 transition-all cursor-pointer border-l-4 ${
                                !notificacion.leida ? 'border-l-teal-500 shadow-[0_0_0_1px_rgba(20,184,166,0.18)]' : 'border-l-slate-500'
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
                                      <Badge
                                        className={`text-white text-xs px-1.5 py-0 h-5 flex-shrink-0 ${
                                          !notificacion.leida ? 'bg-teal-500' : 'bg-slate-500'
                                        }`}
                                      >
                                        {!notificacion.leida ? 'Nueva' : 'Leída'}
                                      </Badge>
                                    </div>
                                    <p className="text-slate-400 text-sm mb-2">
                                      <span className="line-clamp-2 break-words">{limpiarSegundosEnTexto(notificacion.descripcion)}</span>
                                    </p>
                                    <div className="flex items-center justify-between">
                                      <span className="text-slate-500 text-xs">
                                        {formatearFechaNotificacion(notificacion)}
                                      </span>
                                      <div className="flex gap-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => marcarComoLeida(notificacion.notificacionid)}
                                          disabled={notificacion.leida}
                                          className={`h-7 px-2 hover:bg-slate-600 ${
                                            notificacion.leida
                                              ? 'text-slate-500 cursor-not-allowed'
                                              : 'text-teal-400 hover:text-teal-300'
                                          }`}
                                        >
                                          <Check className="w-4 h-4 stroke-2" />
                                        </Button>
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
                          </HoverCardTrigger>
                          <HoverCardContent align="start" className="w-80 bg-slate-900 border-slate-700 text-slate-100">
                            <div className="space-y-2 text-sm">
                              <p className="text-teal-300">Detalle de notificación</p>
                              <p className="break-words"><span className="text-slate-400">Título:</span> {notificacion.titulo}</p>
                              <p><span className="text-slate-400">Tipo:</span> {notificacion.tipo}</p>
                              <p><span className="text-slate-400">Estado:</span> {notificacion.leida ? 'Leída' : 'No leída'}</p>
                              <p><span className="text-slate-400">Fecha:</span> {formatearFechaNotificacion(notificacion)}</p>
                              <p className="break-words"><span className="text-slate-400">Mensaje:</span> {limpiarSegundosEnTexto(notificacion.descripcion)}</p>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
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