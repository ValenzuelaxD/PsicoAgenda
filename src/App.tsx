import { useState, useEffect, useCallback } from 'react';
import { Autenticar } from './components/Autenticar';
import { Dashboard } from './components/Dashboard';
import { SplashScreen } from './components/SplashScreen';
import { LoadingSplash } from './components/LoadingSplash';
import { Toaster } from 'sonner';
import { API_ENDPOINTS } from './utils/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userType, setUserType] = useState<'psicologo' | 'paciente' | 'admin'>('paciente');
  const [userPhoto, setUserPhoto] = useState('');
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
          setUserPhoto(userData.fotoperfil || '');
          setUserType(
            userData.rol === 'admin'
              ? 'admin'
              : userData.rol === 'psicologa'
                ? 'psicologo'
                : 'paciente'
          );
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

  const handleLogin = (name: string, type: 'psicologo' | 'paciente' | 'admin') => {
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

  const refreshSessionProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.PERFIL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUserName('');
        setUserPhoto('');
        setUserType('paciente');
        setIsAuthenticated(false);
        return;
      }

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      const profile = data.profile || {};
      const nombreCompleto = profile.nombreCompleto || profile.nombre || 'Usuario';

      setUserName(nombreCompleto);
      setUserPhoto(profile.fotoPerfil || '');

      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const userData = JSON.parse(userRaw);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...userData,
            nombre: nombreCompleto,
            correo: profile.email || userData.correo,
          })
        );
      }
    } catch (error) {
      console.error('No se pudo sincronizar el perfil:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      refreshSessionProfile();
    }
  }, [isAuthenticated, refreshSessionProfile]);

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
          userPhoto={userPhoto}
          onLogout={handleLogout} 
          onProfileUpdated={refreshSessionProfile}
        />
      )}
      <Toaster position="top-right" richColors />
    </>
  );
}