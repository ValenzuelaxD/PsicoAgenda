import { motion } from 'motion/react';
import { Home, Calendar, CalendarCheck, FileText, User, LogOut, Users, Search, BookOpen, CalendarPlus, BarChart3 } from 'lucide-react';
import { ViewType } from './Dashboard';
import { toast } from 'sonner';
import logo from '../assets/8073927aac7f277f9a509202fa2f1e9e38c58702.png';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface SidebarProps {
  currentView: ViewType;
  userType: 'psicologo' | 'paciente';
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
}

export function Sidebar({ currentView, userType, onNavigate, onLogout }: SidebarProps) {
  const [mostrarConfirmacionLogout, setMostrarConfirmacionLogout] = useState(false);

  // RF_US_003, RF_US_010-014, RF_US_023, RF_US_002/007
  const pacienteMenuItems = [
    { id: 'inicio' as ViewType, label: 'Inicio', icon: Home },
    { id: 'agendar' as ViewType, label: 'Solicitar Cita', icon: Calendar },
    { id: 'citas' as ViewType, label: 'Mis Citas', icon: CalendarCheck },
    { id: 'historial' as ViewType, label: 'Historial Clínico', icon: FileText },
    { id: 'perfil' as ViewType, label: 'Mi Perfil', icon: User },
  ];

  // RF_US_004, RF_US_005/024, RF_US_006, RF_US_008, RF_US_009/011/012, RF_US_015, RF_US_002
  const psicologoMenuItems = [
    { id: 'inicio' as ViewType, label: 'Inicio', icon: Home },
    { id: 'registro-paciente' as ViewType, label: 'Registrar Paciente', icon: Users },
    { id: 'buscar-paciente' as ViewType, label: 'Buscar Paciente', icon: Search },
    { id: 'programar-cita' as ViewType, label: 'Programar Cita', icon: CalendarPlus },
    { id: 'citas' as ViewType, label: 'Gestionar Citas', icon: CalendarCheck },
    { id: 'bitacora' as ViewType, label: 'Bitácora de Pacientes', icon: BookOpen },
    { id: 'reportes' as ViewType, label: 'Reportes de Citas', icon: BarChart3 },
    { id: 'perfil' as ViewType, label: 'Mi Perfil', icon: User },
  ];

  const menuItems = userType === 'psicologo' ? psicologoMenuItems : pacienteMenuItems;

  const handleLogout = () => {
    toast.success('Cerrando sesión...', {
      description: 'Hasta pronto!'
    });
    setMostrarConfirmacionLogout(false);
    onLogout();
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-slate-700 flex flex-col shadow-2xl z-50">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col items-center gap-2"
        >
          <img src={logo} alt="PsicoAgenda" className="h-20 w-auto" />
          <p className="text-teal-400 text-center text-sm">{userType === 'psicologo' ? 'Panel Psicólogo' : 'Panel Paciente'}</p>
        </motion.div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg'
                  : 'text-slate-100 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 stroke-2" />
              <span className={isActive ? 'text-white' : 'text-slate-100'}>{item.label}</span>
            </motion.button>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-slate-700">
        <motion.button
          onClick={() => setMostrarConfirmacionLogout(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 0.5 }}
          >
            <LogOut className="w-5 h-5 stroke-2" />
          </motion.div>
          <span>Cerrar Sesión</span>
        </motion.button>
      </div>

      {/* Modal de Confirmación de Logout */}
      <AlertDialog open={mostrarConfirmacionLogout} onOpenChange={setMostrarConfirmacionLogout}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-100 flex items-center gap-2">
              <LogOut className="w-5 h-5 text-red-400 stroke-2" />
              ¿Cerrar sesión?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-300">
              ¿Estás seguro que deseas cerrar sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout} 
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Sí, cerrar sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  );
}