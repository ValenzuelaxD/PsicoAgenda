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
import { ProgramarCita } from './ProgramarCita';
import { NotificationCenter } from './NotificationCenter';
import { AdminSolicitudes } from './AdminSolicitudes';
import { ReportesCitas } from './ReportesCitas';
import { ErrorBoundary } from './ErrorBoundary';
import { ThemePreferences, buildThemeShellStyle, buildThemeSurfaceStyle } from '../utils/theme';

interface DashboardProps {
  userName: string;
  userType: 'psicologo' | 'paciente' | 'admin';
  userPhoto: string;
  imagenTema: string;
  themePreferences: ThemePreferences;
  onLogout: () => void;
  onProfileUpdated: () => void;
  onThemeUpdated: (theme: ThemePreferences) => void;
}

export type ViewType = 'inicio' | 'agendar' | 'citas' | 'historial' | 'perfil' | 
  'registro-paciente' | 'buscar-paciente' | 'bitacora' | 'mi-agenda' | 'programar-cita' | 'reportes' | 'admin-solicitudes';

export function Dashboard({
  userName,
  userType,
  userPhoto,
  imagenTema,
  themePreferences,
  onLogout,
  onProfileUpdated,
  onThemeUpdated,
}: DashboardProps) {
  const [currentView, setCurrentView] = useState<ViewType>(
    userType === 'admin' ? 'admin-solicitudes' : 'inicio'
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<number | undefined>(undefined);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!isMobile) {
      setDrawerOpen(false);
    }
  }, [isMobile]);

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
        return (
          <Perfil
            userName={userName}
            userType={userType}
            onProfileUpdated={onProfileUpdated}
            themePreferences={themePreferences}
            onThemeUpdated={onThemeUpdated}
          />
        );
      case 'registro-paciente':
        return <RegistroPaciente onNavigate={handleNavigate} />;
      case 'buscar-paciente':
        return <BuscarPaciente onNavigate={handleNavigate} />;
      case 'bitacora':
        return <BitacoraPaciente pacienteId={selectedPacienteId} />;
      case 'mi-agenda':
        return <VerificarDisponibilidad onNavigate={handleNavigate} />;
      case 'programar-cita':
        return <ProgramarCita onNavigate={handleNavigate} />;
      case 'reportes':
        return <ReportesCitas />;
      case 'admin-solicitudes':
        return <AdminSolicitudes />;
      default:
        return <Inicio userName={userName} userType={userType} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div 
      className="flex min-h-screen" 
      style={buildThemeShellStyle(themePreferences)}
    >
      {/* Sidebar (desktop only) */}
      {!isMobile && (
        <Sidebar
          currentView={currentView}
          userType={userType}
          onNavigate={handleNavigate}
          themePreferences={themePreferences}
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
          <aside className="fixed left-0 top-0 z-50 h-[100dvh] w-[85vw] max-w-72 shadow-2xl flex flex-col" style={buildThemeSurfaceStyle(themePreferences)}>
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--theme-border)' }}>
              <h3 style={{ color: 'var(--theme-text)' }}>Menu</h3>
              <button onClick={() => setDrawerOpen(false)} style={{ color: 'var(--theme-text)' }}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex-1 min-h-0 overflow-hidden">
              <Sidebar
                currentView={currentView}
                userType={userType}
                themePreferences={themePreferences}
                onNavigate={(v) => {
                  handleNavigate(v);
                  setDrawerOpen(false);
                }}
                isMobile
              />
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={`flex-1 min-w-0 ${isMobile ? 'ml-0' : 'ml-64'}`}
        style={{
          backgroundColor: 'transparent',
          backdropFilter: 'blur(0px)',
        }}
      >
        {/* Top Bar con Notificaciones */}
        <div
          className="sticky top-0 z-30 backdrop-blur-sm border-b px-4 py-3 sm:py-4"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--theme-surface-strong) 82%, transparent)',
            borderColor: 'var(--theme-border)',
          }}
        >
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              {isMobile && (
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="inline-flex sm:hidden p-2 rounded-md bg-slate-700/30 text-slate-100"
                  aria-label="Abrir menú"
                >
                  <Menu className="w-5 h-5" />
                </button>
              )}
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg" style={{ color: 'var(--theme-text)' }}>PsicoAgenda</h2>
              </div>
            </div>
            <NotificationCenter
              userType={userType}
              userName={userName}
              userPhoto={userPhoto}
              onLogout={onLogout}
              onGoToProfile={() => handleNavigate('perfil')}
            />
          </div>
        </div>

        <div 
          className="relative p-4 sm:p-6 lg:p-8 min-h-[calc(100dvh-72px)]"
          style={{
            backgroundImage: imagenTema ? `url('${imagenTema}')` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: isMobile ? 'scroll' : 'fixed',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Overlay dinámico según el modo */}
          {imagenTema && (
            <div 
              className="absolute inset-0 pointer-events-none" 
              style={{
                background: 'linear-gradient(180deg, rgba(var(--theme-overlay-rgb, 2, 6, 23), var(--theme-overlay-top-alpha, 0.48)), rgba(var(--theme-overlay-rgb, 2, 6, 23), var(--theme-overlay-bottom-alpha, 0.68)))',
              }}
            />
          )}
          
          <div 
            className={`theme-readable relative z-10 ${themePreferences.mode === 'light' ? 'theme-light' : ''}`}
            style={{
              color: themePreferences.mode === 'light' ? '#1a1a1a' : 'inherit'
            }}
          >
            <ErrorBoundary
              resetKey={currentView}
              onReset={() => setCurrentView((prev) => prev)}
              fallbackTitle="No pudimos cargar este apartado"
              fallbackDescription="Se detectó un error inesperado. Intenta recargar la vista o cambia de apartado."
            >
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
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}