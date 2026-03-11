import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { UserCircle, Lock, Mail, FileCheck } from 'lucide-react';
import { toast } from 'sonner';
import logo from '../assets/8073927aac7f277f9a509202fa2f1e9e38c58702.png';
import { LoadingSplash } from './LoadingSplash';
import { validarEmail, validarCedulaProfesional } from '../utils/validators';
import { API_ENDPOINTS } from '../utils/api';

interface AutenticarProps {
  onLogin: (name: string, type: 'psicologo' | 'paciente') => void;
}

export function Autenticar({ onLogin }: AutenticarProps) {
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginUserType, setLoginUserType] = useState<'psicologo' | 'paciente'>('paciente');

  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUserType, setRegisterUserType] = useState<'psicologo' | 'paciente'>('paciente');
  const [cedulaProfesional, setCedulaProfesional] = useState('');

  // Estado para splash de login
  const [mostrarLoginSplash, setMostrarLoginSplash] = useState(false);

  // Estado para controlar el tab activo
  const [tabActivo, setTabActivo] = useState('login');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginEmail || !loginPassword) {
      toast.error('Error de validación', { description: 'Por favor ingresa email y contraseña' });
      return;
    }

    try {
      setMostrarLoginSplash(true);
      const response = await fetch(API_ENDPOINTS.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      const data = await response.json();

      // Validar que la respuesta tenga los campos esperados
      if (!data.token || !data.user) {
        throw new Error('Respuesta inválida del servidor');
      }

      // Guardar el token en localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Obtener el tipo de usuario correcto desde la respuesta
      const userType = data.user.rol === 'psicologa' ? 'psicologo' : 'paciente';
      const userName = data.user.nombre || loginEmail.split('@')[0];
      
      onLogin(userName, userType);
      toast.success('¡Bienvenido!', { description: 'Has iniciado sesión correctamente' });
    } catch (err: any) {
      toast.error('Error al iniciar sesión', { description: err.message });
      console.error('Error en login:', err);
    } finally {
      setMostrarLoginSplash(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // RF_US_016: Validación de Datos
    const validacionEmail = validarEmail(registerEmail);
    if (!validacionEmail.valido) {
      toast.error('Error de validación', { description: validacionEmail.error });
      return;
    }
    
    // Validar que si es psicólogo, tenga cédula
    if (registerUserType === 'psicologo' && !cedulaProfesional) {
      toast.error('Los psicólogos deben proporcionar su cédula profesional');
      return;
    }
    
    // RF_US_016: Validar formato de cédula profesional
    if (registerUserType === 'psicologo') {
      const validacionCedula = validarCedulaProfesional(cedulaProfesional);
      if (!validacionCedula.valido) {
        toast.error('Error de validación', { description: validacionCedula.error });
        return;
      }
    }
    
    // Validar que todos los campos requeridos estén completos
    if (!registerName || !registerEmail || !registerPassword) {
      toast.error('Error de validación', { description: 'Por favor completa todos los campos' });
      return;
    }

    try {
      const response = await fetch(API_ENDPOINTS.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: registerName,
          apellidoPaterno: registerName.split(' ')[1] || registerName, 
          correo: registerEmail,
          password: registerPassword,
          rol: registerUserType === 'psicologo' ? 'psicologa' : 'paciente',
          // Si es psicólogo, envía la cédula
          ...(registerUserType === 'psicologo' && { cedulaProfesional }),
        }),
      });

      // Validar el estado HTTP primero
      if (!response.ok) {
        let errorMessage = 'Error al registrar';
        try {
          const data = await response.json();
          errorMessage = data.message || data.error || errorMessage;
        } catch {
          errorMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Intentar parsear la respuesta como JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Error al parsear respuesta JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }

      // Validar que tenga los campos esperados
      if (!data.success) {
        throw new Error(data.message || 'Error al registrar el usuario');
      }

      const tipoUsuario = registerUserType === 'psicologo' ? 'psicólogo' : 'paciente';
      toast.success('¡Registro exitoso!', { 
        description: `Tu cuenta de ${tipoUsuario} ha sido creada. Ahora puedes iniciar sesión.` 
      });
      
      // Resetear el formulario de registro
      setRegisterName('');
      setRegisterEmail('');
      setRegisterPassword('');
      setCedulaProfesional('');
      setRegisterUserType('paciente');
      
      // Auto-llenar el email en el formulario de login
      setLoginEmail(registerEmail);
      
      // Cambiar al tab de login después de un breve delay
      setTimeout(() => {
        setTabActivo('login');
      }, 1000);
    } catch (err: any) {
      toast.error('Error al registrar', { description: err.message });
      console.error('Error en register:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-violet-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md" style={{ opacity: 1, transform: 'scale(1)' }}>
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <img
              src={logo}
              alt="PsicoAgenda"
              className="h-24 w-auto sm:h-32"
              style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
            />
          </div>
          <p className="text-slate-300 text-sm sm:text-base px-4">
            Sistema de gestión para profesionales de la salud mental
          </p>
        </div>

        <div style={{ opacity: 1 }}>
          <Card className="shadow-xl border-slate-700 bg-slate-800/90 backdrop-blur-sm">
            <CardHeader className="space-y-1 bg-gradient-to-r from-teal-900/50 to-violet-900/50">
              <CardTitle className="text-slate-100">Autenticar</CardTitle>
              <CardDescription className="text-slate-400">
                Accede a tu cuenta como psicólogo o paciente
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={tabActivo} onValueChange={setTabActivo} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-700">
                  <TabsTrigger value="login" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register" className="data-[state=active]:bg-teal-500 data-[state=active]:text-white">Registrarse</TabsTrigger>
                </TabsList>

                {/* Tab de Inicio de Sesión */}
                <TabsContent value="login">
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-user-type" className="text-slate-200">Tipo de Usuario</Label>
                      <Select
                        value={loginUserType}
                        onValueChange={(value: 'psicologo' | 'paciente') => setLoginUserType(value)}
                      >
                        <SelectTrigger id="login-user-type" className="border-slate-600 bg-slate-700 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="paciente">
                            <div className="flex items-center gap-2">
                              <UserCircle className="w-4 h-4 stroke-2" />
                              <span>Paciente</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="psicologo">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 stroke-2" />
                              <span>Psicólogo</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-slate-200">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 stroke-2" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          className="pl-10 border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-slate-200">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 stroke-2" />
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          className="pl-10 border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                      Iniciar Sesión
                    </Button>
                  </form>
                </TabsContent>

                {/* Tab de Registro */}
                <TabsContent value="register">
                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-user-type" className="text-slate-200">Tipo de Usuario</Label>
                      <Select
                        value={registerUserType}
                        onValueChange={(value: 'psicologo' | 'paciente') => {
                          setRegisterUserType(value);
                          if (value === 'paciente') {
                            setCedulaProfesional('');
                          }
                        }}
                      >
                        <SelectTrigger id="register-user-type" className="border-slate-600 bg-slate-700 text-slate-100">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="paciente">
                            <div className="flex items-center gap-2">
                              <UserCircle className="w-4 h-4 stroke-2" />
                              <span>Paciente</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="psicologo">
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 stroke-2" />
                              <span>Psicólogo</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="text-slate-200">Nombre Completo</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Juan Pérez"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
                        required
                      />
                    </div>

                    {registerUserType === 'psicologo' && (
                      <div className="space-y-2">
                        <Label htmlFor="cedula-profesional" className="text-slate-200">
                          Cédula Profesional *
                        </Label>
                        <div className="relative">
                          <FileCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 stroke-2" />
                          <Input
                            id="cedula-profesional"
                            type="text"
                            placeholder="Número de cédula profesional"
                            value={cedulaProfesional}
                            onChange={(e) => setCedulaProfesional(e.target.value)}
                            className="pl-10 border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
                            required
                          />
                        </div>
                        <p className="text-xs text-slate-400">
                          Tu cédula profesional será verificada antes de aprobar tu cuenta
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="register-email" className="text-slate-200">Correo Electrónico</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 stroke-2" />
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="tu@email.com"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          className="pl-10 border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password" className="text-slate-200">Contraseña</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-400 stroke-2" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          className="pl-10 border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-400 focus:border-teal-500 focus:ring-teal-500"
                          required
                        />
                      </div>
                    </div>

                    <div className="bg-gradient-to-r from-teal-900/50 to-violet-900/50 border border-teal-700/50 rounded-lg p-3">
                      <p className="text-slate-300">
                        {registerUserType === 'psicologo'
                          ? '🩺 Los psicólogos podrán gestionar citas, pacientes y expedientes.'
                          : '👤 Los pacientes podrán agendar citas y ver su historial.'}
                      </p>
                    </div>

                    <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                      Crear Cuenta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        <p className="text-center text-slate-400 mt-6 text-xs sm:text-sm px-4">
          Al autenticarte, aceptas nuestros términos de servicio y política de privacidad
        </p>
      </div>

      {/* Splash de login */}
      {mostrarLoginSplash && (
        <LoadingSplash message="Iniciando sesión..." />
      )}
    </div>
  );
}