import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar';
import { Menu, X } from 'lucide-react';
import useIsMobile from '../hooks/useIsMobile';
import { Inicio } from './Inicio';
import { AgendarCita } from './AgendarCita';
import { MisCitas } from './MisCitas';
import { Perfil } from './Perfil';
import { Historial } from './Historial';
import { RegistroPaciente } from './RegistroPaciente';
import { BuscarPaciente } from './BuscarPaciente';
import { BitacoraPaciente } from './BitacoraPaciente';
import { VerificarDisponibilidad } from './VerificarDisponibilidad';
import { NotificationCenter } from './NotificationCenter';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../utils/api';

interface DashboardProps {
  userName: string;
  userType: 'psicologo' | 'paciente';
  onLogout: () => void;
}

export type ViewType = 'inicio' | 'agendar' | 'citas' | 'historial' | 'perfil' | 
  'registro-paciente' | 'buscar-paciente' | 'bitacora' | 'mi-agenda';

export function Dashboard({ userName, userType, onLogout }: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>('inicio');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | undefined>(undefined);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(API_ENDPOINTS.NOTIFICACIONES, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const notifications = await response.json();
          const unread = notifications.filter((n: any) => !n.leida).length;
          setNotificacionesNoLeidas(unread);

          if (unread > 0) {
            const mensaje = unread > 1
              ? `Tienes ${unread} notificaciones nuevas`
              : `Tienes ${unread} notificacion nueva`;

            toast.info(mensaje, {
              description: 'Por favor revisa tus notificaciones en la esquina superior derecha',
              duration: 7000,
              className: 'bg-gradient-to-r from-teal-600 to-violet-600',
            });
          }
        } else {
          // No hay notificaciones o hubo un error - no importa, continuar cargando
          console.warn('No se pudieron cargar notificaciones:', response.status);
        }
      } catch (error) {
        // Error cargando notificaciones - no bloquear la carga del dashboard
        console.warn("Error fetching unread notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUnreadNotifications();
  }, []);

  const handleNavigate = (view: ViewType, pacienteId?: number) => {
    setCurrentView(view);
    if (pacienteId !== undefined) setSelectedPacienteId(pacienteId);
  };

  const renderView = () => {
    switch (currentView) {
      case 'inicio':
        return <Inicio userName={userName} userType={userType} onNavigate={handleNavigate} />;
      case 'agendar':
        return <AgendarCita onNavigate={handleNavigate} />;
      case 'citas':
        return <MisCitas userType={userType} onNavigate={handleNavigate} />;
      case 'historial':
        return <Historial />;
      case 'perfil':
        return <Perfil userName={userName} userType={userType} />;
      case 'registro-paciente':
        return <RegistroPaciente onNavigate={handleNavigate} />;
      case 'buscar-paciente':
        return <BuscarPaciente onNavigate={handleNavigate} />;
      case 'bitacora':
        return <BitacoraPaciente pacienteId={selectedPacienteId} />;
      case 'mi-agenda':
        return <VerificarDisponibilidad onNavigate={handleNavigate} />;
      default:
        return <Inicio userName={userName} userType={userType} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Sidebar (desktop only) */}
      {!isMobile && (
        <Sidebar
          currentView={currentView}
          userType={userType}
          onNavigate={handleNavigate}
          onLogout={onLogout}
        />
      )}

      {/* Mobile panel (overlay + aside) */}
      {isMobile && drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="fixed left-0 top-0 z-50 h-[100dvh] w-[85vw] max-w-72 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-slate-100">Menu</h3>
              <button onClick={() => setDrawerOpen(false)} className="text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2">
              <Sidebar
                currentView={currentView}
                userType={userType}
                onNavigate={(v) => {
                  handleNavigate(v);
                  setDrawerOpen(false);
                }}
                onLogout={onLogout}
                isMobile
              />
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main className={`flex-1 min-w-0 ${isMobile ? 'ml-0' : 'ml-64'} bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900`}>
        {/* Top Bar con Notificaciones */}
        <div className="sticky top-0 z-30 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700 px-4 py-3 sm:py-4">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <button
                onClick={() => setDrawerOpen(true)}
                className="sm:hidden p-2 rounded-md bg-slate-700/30 text-slate-100"
                aria-label="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h2 className="text-slate-100 text-base sm:text-lg">PsicoAgenda</h2>
                <p className="text-slate-400 text-xs sm:text-sm truncate">Sistema de gestion psicologica profesional</p>
              </div>
            </div>
            <NotificationCenter userType={userType} />
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          <AnimatePresence>
            <motion.div 
              key={currentView}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}