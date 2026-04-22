import { motion } from 'motion/react';
import { Home, Calendar, CalendarCheck, FileText, Users, Search, BookOpen, CalendarDays, ShieldCheck } from 'lucide-react';
import { ViewType } from './Dashboard';
import logo from '../assets/8073927aac7f277f9a509202fa2f1e9e38c58702.png';
import { ThemePreferences, buildThemeSurfaceStyle } from '../utils/theme';

interface SidebarProps {
  currentView: ViewType;
  userType: 'psicologo' | 'paciente' | 'admin';
  onNavigate: (view: ViewType) => void;
  themePreferences: ThemePreferences;
  isMobile?: boolean;
}

export function Sidebar({ currentView, userType, onNavigate, themePreferences, isMobile = false }: SidebarProps) {

  // Desktop: fixed sidebar visible on sm+; Mobile: render full-width content suitable for Drawer
  const containerClass = isMobile
    ? 'w-full h-full min-h-0 bg-gradient-to-b from-slate-800 to-slate-900 flex flex-col z-50 overflow-y-scroll sidebar-scrollbar [scrollbar-gutter:stable]'
    : 'hidden sm:flex fixed left-0 top-0 h-[100dvh] w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 flex flex-col shadow-2xl z-50 overflow-y-scroll sidebar-scrollbar [scrollbar-gutter:stable]';

  // RF_US_003, RF_US_010-014, RF_US_023, RF_US_002/007
  const pacienteMenuItems = [
    { id: 'inicio' as ViewType, label: 'Inicio', icon: Home },
    { id: 'agendar' as ViewType, label: 'Solicitar Cita', icon: Calendar },
    { id: 'citas' as ViewType, label: 'Mis Citas', icon: CalendarCheck },
    { id: 'historial' as ViewType, label: 'Historial Clínico', icon: FileText },
  ];

  // RF_US_004, RF_US_005/024, RF_US_006, RF_US_008, RF_US_009/011/012, RF_US_015, RF_US_002
  const psicologoMenuItems = [
    { id: 'inicio' as ViewType, label: 'Inicio', icon: Home },
    { id: 'mi-agenda' as ViewType, label: 'Mi Agenda', icon: CalendarDays },
    { id: 'programar-cita' as ViewType, label: 'Programar Cita', icon: Calendar },
    { id: 'registro-paciente' as ViewType, label: 'Registrar Paciente', icon: Users },
    { id: 'buscar-paciente' as ViewType, label: 'Buscar Paciente', icon: Search },
    { id: 'citas' as ViewType, label: 'Gestionar Citas', icon: CalendarCheck },
    { id: 'bitacora' as ViewType, label: 'Bitácora de Pacientes', icon: BookOpen },
    { id: 'reportes' as ViewType, label: 'Reportes de Citas', icon: FileText },
  ];

  const adminMenuItems = [
    { id: 'admin-solicitudes' as ViewType, label: 'Solicitudes Psicologas', icon: ShieldCheck },
  ];

  const menuItems = userType === 'admin'
    ? adminMenuItems
    : userType === 'psicologo'
      ? psicologoMenuItems
      : pacienteMenuItems;

  return (
    <aside className={containerClass} style={buildThemeSurfaceStyle(themePreferences)}>
      {/* Logo */}
      <div className={`${isMobile ? 'p-4' : 'p-6'} border-b`} style={{ borderColor: 'var(--theme-border)' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-2"
        >
          <img src={logo} alt="PsicoAgenda" className={`${isMobile ? 'h-16' : 'h-20'} w-auto`} />
          <p className="text-center text-sm" style={{ color: 'var(--theme-primary)' }}>
            {userType === 'admin' ? 'Panel Admin' : userType === 'psicologo' ? 'Panel Psicologo' : 'Panel Paciente'}
          </p>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className={`${isMobile ? 'p-3' : 'p-4'} flex-1 min-h-0 space-y-2`}>
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? 'shadow-lg'
                  : 'hover:text-white'
              }`}
              style={isActive ? { backgroundImage: 'linear-gradient(90deg, var(--theme-primary), var(--theme-accent))', color: 'var(--theme-primary-contrast)' } : { color: 'var(--theme-text)' }}
            >
              <Icon className="w-5 h-5 stroke-2" />
              <span className="min-w-0 truncate text-left">{item.label}</span>
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}