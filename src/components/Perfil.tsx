import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { User, Mail, Phone, Calendar, MapPin, Bell, Shield, CheckCircle } from 'lucide-react';
import { Switch } from './ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { toast } from 'sonner';
import { API_ENDPOINTS } from '../utils/api';

interface PerfilProps {
  userName: string;
  userType: 'psicologo' | 'paciente';
}

export function Perfil({ userName, userType }: PerfilProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [nombre, setNombre] = useState(userName);
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fotoPerfil, setFotoPerfil] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [direccion, setDireccion] = useState('');
  const [genero, setGenero] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');
  const [notasPersonales, setNotasPersonales] = useState('');
  
  // Campos específicos para psicólogo
  const [cedula, setCedula] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [descripcionProfesional, setDescripcionProfesional] = useState('');
  const [consultorio, setConsultorio] = useState('');

  const [notificacionesEmail, setNotificacionesEmail] = useState(true);
  const [notificacionesWhatsApp, setNotificacionesWhatsApp] = useState(false);
  const [recordatorios, setRecordatorios] = useState(true);

  // Estados para modales
  const [mostrarCambiarPassword, setMostrarCambiarPassword] = useState(false);
  const [mostrar2FA, setMostrar2FA] = useState(false);
  const [mostrarExitoPassword, setMostrarExitoPassword] = useState(false);
  const [mostrarExitoGuardado, setMostrarExitoGuardado] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');

  // Estado para valores originales (para cancelar)
  const [valoresOriginales, setValoresOriginales] = useState({
    nombre: userName,
    email: '',
    telefono: '',
    fotoPerfil: '',
    fechaNacimiento: '',
    direccion: '',
    genero: '',
    contactoEmergencia: '',
    telefonoEmergencia: '',
    notasPersonales: '',
    cedula: '',
    especialidad: '',
    descripcionProfesional: '',
    consultorio: '',
    notificacionesEmail: true,
    notificacionesWhatsApp: false,
    recordatorios: true,
  });

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          toast.error('No hay sesión activa');
          return;
        }

        const response = await fetch(API_ENDPOINTS.PERFIL, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'No se pudo cargar el perfil');
        }

        const data = await response.json();
        const profile = data.profile || {};

        const siguientesValores = {
          nombre: profile.nombreCompleto || userName || '',
          email: profile.email || '',
          telefono: profile.telefono || '',
          fotoPerfil: profile.fotoPerfil || '',
          fechaNacimiento: profile.fechaNacimiento ? String(profile.fechaNacimiento).slice(0, 10) : '',
          direccion: profile.direccion || '',
          genero: profile.genero || '',
          contactoEmergencia: profile.contactoEmergencia || '',
          telefonoEmergencia: profile.telefonoEmergencia || '',
          notasPersonales: profile.notasPersonales || '',
          cedula: profile.cedula || '',
          especialidad: profile.especialidad || '',
          descripcionProfesional: profile.descripcionProfesional || '',
          consultorio: profile.consultorio || '',
          notificacionesEmail,
          notificacionesWhatsApp,
          recordatorios,
        };

        setNombre(siguientesValores.nombre);
        setEmail(siguientesValores.email);
        setTelefono(siguientesValores.telefono);
        setFotoPerfil(siguientesValores.fotoPerfil);
        setFechaNacimiento(siguientesValores.fechaNacimiento);
        setDireccion(siguientesValores.direccion);
        setGenero(siguientesValores.genero);
        setContactoEmergencia(siguientesValores.contactoEmergencia);
        setTelefonoEmergencia(siguientesValores.telefonoEmergencia);
        setNotasPersonales(siguientesValores.notasPersonales);
        setCedula(siguientesValores.cedula);
        setEspecialidad(siguientesValores.especialidad);
        setDescripcionProfesional(siguientesValores.descripcionProfesional);
        setConsultorio(siguientesValores.consultorio);
        setValoresOriginales(siguientesValores);
      } catch (error: any) {
        toast.error('No se pudo cargar tu perfil', {
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarPerfil();
  }, [userName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await fetch(API_ENDPOINTS.PERFIL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nombreCompleto: nombre,
          email,
          telefono,
          fotoPerfil,
          fechaNacimiento: fechaNacimiento || null,
          genero: genero || null,
          direccion,
          contactoEmergencia,
          telefonoEmergencia,
          notasPersonales,
          cedula,
          especialidad,
          descripcionProfesional,
          consultorio,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo guardar el perfil');
      }

      setValoresOriginales({
        nombre,
        email,
        telefono,
        fotoPerfil,
        fechaNacimiento,
        direccion,
        genero,
        contactoEmergencia,
        telefonoEmergencia,
        notasPersonales,
        cedula,
        especialidad,
        descripcionProfesional,
        consultorio,
        notificacionesEmail,
        notificacionesWhatsApp,
        recordatorios,
      });

      const userRaw = localStorage.getItem('user');
      if (userRaw) {
        const userData = JSON.parse(userRaw);
        const primerNombre = nombre.trim().split(' ')[0] || userData.nombre;
        localStorage.setItem('user', JSON.stringify({ ...userData, nombre: primerNombre, correo: email }));
      }

      setMostrarExitoGuardado(true);
    } catch (error: any) {
      toast.error('Error al guardar cambios', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelar = () => {
    // Restaurar valores originales
    setNombre(valoresOriginales.nombre);
    setEmail(valoresOriginales.email);
    setTelefono(valoresOriginales.telefono);
    setFotoPerfil(valoresOriginales.fotoPerfil);
    setFechaNacimiento(valoresOriginales.fechaNacimiento);
    setDireccion(valoresOriginales.direccion);
    setGenero(valoresOriginales.genero);
    setContactoEmergencia(valoresOriginales.contactoEmergencia);
    setTelefonoEmergencia(valoresOriginales.telefonoEmergencia);
    setNotasPersonales(valoresOriginales.notasPersonales);
    setCedula(valoresOriginales.cedula);
    setEspecialidad(valoresOriginales.especialidad);
    setDescripcionProfesional(valoresOriginales.descripcionProfesional);
    setConsultorio(valoresOriginales.consultorio);
    setNotificacionesEmail(valoresOriginales.notificacionesEmail);
    setNotificacionesWhatsApp(valoresOriginales.notificacionesWhatsApp);
    setRecordatorios(valoresOriginales.recordatorios);
    toast.info('Cambios cancelados', {
      description: 'Se han restaurado los valores originales'
    });
  };

  const handleCambiarPassword = async () => {
    if (!passwordActual || !passwordNueva || !passwordConfirmar) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    if (passwordNueva !== passwordConfirmar) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (passwordNueva.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No hay sesión activa');
        return;
      }

      const response = await fetch(API_ENDPOINTS.PERFIL_PASSWORD, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passwordActual,
          passwordNueva,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'No se pudo cambiar la contraseña');
      }

      toast.success('Contraseña actualizada exitosamente', {
        description: 'Tu contraseña ha sido cambiada correctamente'
      });
      setMostrarCambiarPassword(false);
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirmar('');
      setMostrarExitoPassword(true);
    } catch (error: any) {
      toast.error('No se pudo cambiar la contraseña', {
        description: error.message,
      });
    }
  };

  const handleHabilitar2FA = () => {
    toast.success('Correo de verificación enviado', {
      description: 'Hemos enviado un código de verificación a tu correo electrónico. Por favor revisa tu bandeja de entrada.'
    });
    setMostrar2FA(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="py-10 text-center text-slate-300">
            Cargando perfil desde la base de datos...
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-slate-100 mb-2">Mi Perfil</h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Gestiona tu información personal y preferencias
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Información Personal */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription className="text-slate-400">
              Actualiza tus datos personales
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-slate-200">Nombre Completo</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-200">Correo Electrónico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono" className="text-slate-200">Teléfono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="foto-perfil" className="text-slate-200">Foto de Perfil (URL)</Label>
                <Input
                  id="foto-perfil"
                  type="url"
                  value={fotoPerfil}
                  onChange={(e) => setFotoPerfil(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  placeholder="https://.../mi-foto.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha-nacimiento" className="text-slate-200">Fecha de Nacimiento</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fecha-nacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero" className="text-slate-200">Género</Label>
                <Select value={genero} onValueChange={setGenero}>
                  <SelectTrigger id="genero" className="bg-slate-700 border-slate-600 text-slate-100">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Femenino">Femenino</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                    <SelectItem value="Prefiero no decir">Prefiero no decir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion" className="text-slate-200">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="pl-10 bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Profesional (solo para psicólogos) */}
        {userType === 'psicologo' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Información Profesional</CardTitle>
              <CardDescription className="text-slate-400">
                Datos de tu práctica profesional
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cedula" className="text-slate-200">Cédula Profesional</Label>
                  <Input
                    id="cedula"
                    value={cedula}
                    onChange={(e) => setCedula(e.target.value)}
                    placeholder="Número de cédula"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="especialidad" className="text-slate-200">Especialidad</Label>
                  <Input
                    id="especialidad"
                    value={especialidad}
                    onChange={(e) => setEspecialidad(e.target.value)}
                    placeholder="Ej: Terapia Cognitivo-Conductual"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="descripcion" className="text-slate-200">Descripción Profesional</Label>
                  <Textarea
                    id="descripcion"
                    value={descripcionProfesional}
                    onChange={(e) => setDescripcionProfesional(e.target.value)}
                    placeholder="Describe tu experiencia y enfoque terapéutico"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                    rows={3}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="consultorio" className="text-slate-200">Consultorio</Label>
                  <Input
                    id="consultorio"
                    value={consultorio}
                    onChange={(e) => setConsultorio(e.target.value)}
                    placeholder="Ej: Consultorio 201 o enlace de atención"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Contacto de Emergencia (solo para pacientes) */}
        {userType === 'paciente' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Phone className="w-5 h-5" />
                Contacto de Emergencia
              </CardTitle>
              <CardDescription className="text-slate-400">
                Persona a contactar en caso de emergencia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contacto-emergencia" className="text-slate-200">Nombre Completo</Label>
                  <Input
                    id="contacto-emergencia"
                    value={contactoEmergencia}
                    onChange={(e) => setContactoEmergencia(e.target.value)}
                    placeholder="Nombre del contacto"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono-emergencia" className="text-slate-200">Teléfono</Label>
                  <Input
                    id="telefono-emergencia"
                    type="tel"
                    value={telefonoEmergencia}
                    onChange={(e) => setTelefonoEmergencia(e.target.value)}
                    placeholder="+52 555 000 0000"
                    className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Preferencias de Notificaciones */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
            <CardDescription className="text-slate-400">
              Configura cómo deseas recibir notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Notificaciones por Email</Label>
                <p className="text-slate-400">
                  Recibe confirmaciones y recordatorios por correo
                </p>
              </div>
              <Switch
                checked={notificacionesEmail}
                onCheckedChange={setNotificacionesEmail}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Notificaciones por WhatsApp</Label>
                <p className="text-slate-400">
                  Recibe mensajes de texto con recordatorios
                </p>
              </div>
              <Switch
                checked={notificacionesWhatsApp}
                onCheckedChange={setNotificacionesWhatsApp}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-slate-200">Recordatorios de Citas</Label>
                <p className="text-slate-400">
                  Recordatorios 24 horas antes de tu cita
                </p>
              </div>
              <Switch
                checked={recordatorios}
                onCheckedChange={setRecordatorios}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notas Personales */}
        {userType === 'paciente' && (
          <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Notas Personales</CardTitle>
              <CardDescription className="text-slate-400">
                Información adicional que quieras compartir con tu terapeuta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notasPersonales}
                onChange={(e) => setNotasPersonales(e.target.value)}
                placeholder="Alergias, medicamentos, condiciones médicas, etc."
                rows={4}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </CardContent>
          </Card>
        )}

        {/* Seguridad */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Shield className="w-5 h-5" />
              Seguridad
            </CardTitle>
            <CardDescription className="text-slate-400">
              Gestiona la seguridad de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              type="button"
              className="w-full border-slate-600 text-white hover:bg-slate-700 hover:text-white"
              onClick={() => setMostrarCambiarPassword(true)}
            >
              Cambiar Contraseña
            </Button>
            <Button
              variant="outline"
              type="button"
              className="w-full border-slate-600 text-white hover:bg-slate-700 hover:text-white"
              onClick={() => setMostrar2FA(true)}
            >
              Habilitar Autenticación de Dos Factores
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </Button>
          <Button type="button" variant="outline" className="sm:w-auto border-slate-600 text-slate-200 hover:bg-slate-700" onClick={handleCancelar}>
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modal Cambiar Contraseña */}
      <Dialog open={mostrarCambiarPassword} onOpenChange={setMostrarCambiarPassword}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Cambiar Contraseña</DialogTitle>
            <DialogDescription className="text-slate-400">
              Ingresa tu contraseña actual y la nueva contraseña
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password-actual" className="text-slate-200">Contraseña Actual</Label>
              <Input
                id="password-actual"
                type="password"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                placeholder="Contraseña actual"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-nueva" className="text-slate-200">Nueva Contraseña</Label>
              <Input
                id="password-nueva"
                type="password"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                placeholder="Nueva contraseña"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirmar" className="text-slate-200">Confirmar Contraseña</Label>
              <Input
                id="password-confirmar"
                type="password"
                value={passwordConfirmar}
                onChange={(e) => setPasswordConfirmar(e.target.value)}
                placeholder="Confirmar contraseña"
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMostrarCambiarPassword(false)}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleCambiarPassword} className="bg-teal-600 hover:bg-teal-700">
              Cambiar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Habilitar 2FA */}
      <Dialog open={mostrar2FA} onOpenChange={setMostrar2FA}>
        <DialogContent className="sm:max-w-[425px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Habilitar Autenticación de Dos Factores</DialogTitle>
            <DialogDescription className="text-slate-400">
              Habilita la autenticación de dos factores para una mayor seguridad
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-slate-300">
              Se te enviará un código de verificación a tu correo electrónico o número de teléfono.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setMostrar2FA(false)}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleHabilitar2FA} className="bg-teal-600 hover:bg-teal-700">
              Habilitar 2FA
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Exito Cambiar Contraseña */}
      <Dialog open={mostrarExitoPassword} onOpenChange={setMostrarExitoPassword}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-800 to-slate-900 border-teal-600/50 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Confirmación de cambio de contraseña</DialogTitle>
            <DialogDescription>
              Tu contraseña ha sido actualizada exitosamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center py-6 space-y-6">
            {/* Icono de éxito con animación */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-violet-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-12 h-12 text-white stroke-2" />
              </div>
            </div>

            {/* Título y descripción */}
            <div className="space-y-3">
              <h2 className="text-white text-2xl font-semibold">
                ¡Contraseña Actualizada!
              </h2>
              <p className="text-slate-300 max-w-sm">
                Tu contraseña ha sido cambiada exitosamente. Ahora puedes usar tu nueva contraseña para iniciar sesión de forma segura.
              </p>
            </div>

            {/* Información adicional */}
            <div className="w-full bg-teal-900/20 border border-teal-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-teal-300 font-medium mb-1">Seguridad Mejorada</p>
                  <p className="text-slate-400 text-sm">
                    Recuerda mantener tu contraseña segura y no compartirla con nadie.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de cerrar */}
            <Button
              type="button"
              onClick={() => setMostrarExitoPassword(false)}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg"
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Exito Guardado */}
      <Dialog open={mostrarExitoGuardado} onOpenChange={setMostrarExitoGuardado}>
        <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-slate-800 to-slate-900 border-teal-600/50 shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Confirmación de cambios guardados</DialogTitle>
            <DialogDescription>
              Tus cambios han sido guardados exitosamente
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center text-center py-6 space-y-6">
            {/* Icono de éxito con animación */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-violet-500 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center shadow-2xl">
                <CheckCircle className="w-12 h-12 text-white stroke-2" />
              </div>
            </div>

            {/* Título y descripción */}
            <div className="space-y-3">
              <h2 className="text-white text-2xl font-semibold">
                ¡Cambios Guardados!
              </h2>
              <p className="text-slate-300 max-w-sm">
                Tus cambios han sido guardados exitosamente. Ahora puedes usar tu nueva información para continuar.
              </p>
            </div>

            {/* Información adicional */}
            <div className="w-full bg-teal-900/20 border border-teal-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-teal-300 font-medium mb-1">Seguridad Mejorada</p>
                  <p className="text-slate-400 text-sm">
                    Recuerda mantener tu información segura y no compartirla con nadie.
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de cerrar */}
            <Button
              type="button"
              onClick={() => setMostrarExitoGuardado(false)}
              className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg"
            >
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}