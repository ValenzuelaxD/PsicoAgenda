import { useState, useEffect } from 'react';
import { Autenticar } from './components/Autenticar';
import { Dashboard } from './components/Dashboard';
import { SplashScreen } from './components/SplashScreen';
import { LoadingSplash } from './components/LoadingSplash';
import { Toaster } from 'sonner';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState<'psicologo' | 'paciente'>('paciente');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Verificar si hay sesión válida al cargar
  useEffect(() => {
    const checkAuthentication = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          setUserName(userData.nombre || 'Usuario');
          setUserType(userData.rol === 'psicologa' ? 'psicologo' : 'paciente');
          setIsAuthenticated(true);
        } catch (err) {
          console.error('Error al restaurar sesión:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setIsAuthenticated(false);
        }
      }
      setIsCheckingAuth(false);
    };

    // Esperar a que se complete el splash antes de verificar autenticación
    const timer = setTimeout(checkAuthentication, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (name: string, type: 'psicologo' | 'paciente') => {
    // Verificar que el token exista antes de permitir login
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No se encontró token de autenticación');
      return;
    }

    setIsAuthenticated(true);
    setUserName(name);
    setUserType(type);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Mostrar splash de logout por 1.5 segundos
    setTimeout(() => {
      // Limpiar localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      setIsAuthenticated(false);
      setUserName('');
      setUserType('paciente');
      setIsLoggingOut(false);
    }, 1500);
  };

  if (isCheckingAuth || showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <>
      {isLoggingOut ? (
        <LoadingSplash message="Cerrando sesión..." />
      ) : !isAuthenticated ? (
        <Autenticar onLogin={handleLogin} />
      ) : (
        <Dashboard 
          userName={userName} 
          userType={userType} 
          onLogout={handleLogout} 
        />
      )}
      <Toaster position="top-right" richColors />
    </>
  );
}