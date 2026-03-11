import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { User, Mail, Phone, Calendar, MapPin, Check, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';
import {
  validarNombre,
  validarEmail,
  validarTelefono,
  validarFecha,
  validarContrasena,
  validarConfirmacionContrasena,
} from '../utils/validators';
import { motion, AnimatePresence } from 'motion/react';
import { API_ENDPOINTS, apiFetch } from '../utils/api';

interface RegistroPacienteProps {
  onNavigate: (view: ViewType) => void;
}

export function RegistroPaciente({ onNavigate }: RegistroPacienteProps) {
  const [nombre, setNombre] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contactoEmergencia, setContactoEmergencia] = useState('');
  const [telefonoEmergencia, setTelefonoEmergencia] = useState('');
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [mostrarExito, setMostrarExito] = useState(false);
  const [credencialesRegistradas, setCredencialesRegistradas] = useState(null as { correo: string; password: string } | null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // Validar campos obligatorios
    const validacionNombre = validarNombre(nombre);
    if (!validacionNombre.valido) {
      toast.error('Error de validación', { description: validacionNombre.error });
      return;
    }

    const validacionApellidos = validarNombre(apellidos);
    if (!validacionApellidos.valido) {
      toast.error('Error de validación', { description: validacionApellidos.error });
      return;
    }

    const validacionEmail = validarEmail(email);
    if (!validacionEmail.valido) {
      toast.error('Error de validación', { description: validacionEmail.error });
      return;
    }

    const validacionTelefono = validarTelefono(telefono);
    if (!validacionTelefono.valido) {
      toast.error('Error de validación', { description: validacionTelefono.error });
      return;
    }

    const validacionFechaNacimiento = validarFecha(fechaNacimiento);
    if (!validacionFechaNacimiento.valido) {
      toast.error('Error de validación', { description: validacionFechaNacimiento.error });
      return;
    }

    if (!genero) {
      toast.error('Campo requerido', { description: 'Por favor selecciona el género' });
      return;
    }
    if (!motivoConsulta.trim()) {
      toast.error('Campo requerido', { description: 'Por favor ingresa el motivo de consulta' });
      return;
    }

    const validacionPassword = validarContrasena(password);
    if (!validacionPassword.valido) {
      toast.error('Error de validación', { description: validacionPassword.error });
      return;
    }

    const validacionConfirmacion = validarConfirmacionContrasena(password, confirmPassword);
    if (!validacionConfirmacion.valido) {
      toast.error('Error de validación', { description: validacionConfirmacion.error });
      return;
    }

    if (telefonoEmergencia.trim()) {
      const validacionTelefonoEmergencia = validarTelefono(telefonoEmergencia);
      if (!validacionTelefonoEmergencia.valido) {
        toast.error('Error de validación', { description: `Teléfono de emergencia: ${validacionTelefonoEmergencia.error}` });
        return;
      }
    }

    try {
      const response = await apiFetch(API_ENDPOINTS.PACIENTES, {
        method: 'POST',
        body: JSON.stringify({
          nombre,
          apellidoPaterno: apellidos.split(' ')[0],
          apellidoMaterno: apellidos.split(' ').slice(1).join(' ') || null,
          correo: email.toLowerCase(),
          telefono,
          fechaNacimiento,
          genero: genero.charAt(0).toUpperCase() + genero.slice(1),
          direccion,
          motivoConsulta,
          contactoEmergencia,
          telefonoEmergencia,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Error al registrar el paciente');
      }

      toast.success('Paciente registrado exitosamente');
      setCredencialesRegistradas({
        correo: email.toLowerCase(),
        password,
      });
      setMostrarExito(true);
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar el paciente');
    }
  };

  const handleCerrarModal = () => {
    setMostrarExito(false);
    // Limpiar el formulario
    setNombre('');
    setApellidos('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setTelefono('');
    setFechaNacimiento('');
    setGenero('');
    setDireccion('');
    setContactoEmergencia('');
    setTelefonoEmergencia('');
    setMotivoConsulta('');
    setCredencialesRegistradas(null);
    // Navegar a buscar paciente
    onNavigate('buscar-paciente');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Registro de Paciente</h1>
        <p className="text-slate-300">
          Ingresa la información del nuevo paciente en el sistema
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
            <CardDescription>Datos básicos del paciente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre(s) *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre del paciente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidos">Apellidos *</Label>
                <Input
                  id="apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  placeholder="Apellidos del paciente"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder="correo@ejemplo.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="pl-10"
                    placeholder="+52 555 123 4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña de Inicio de Sesión *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Mínimo 8 caracteres, mayúscula y número"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Contraseña *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    placeholder="Repite la contraseña"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha-nacimiento">Fecha de Nacimiento *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="fecha-nacimiento"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="genero">Género *</Label>
                <Select value={genero} onValueChange={setGenero}>
                  <SelectTrigger id="genero">
                    <SelectValue placeholder="Selecciona una opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="masculino">Masculino</SelectItem>
                    <SelectItem value="femenino">Femenino</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                    <SelectItem value="no-especificar">Prefiero no especificar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="direccion">Dirección</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <Input
                    id="direccion"
                    value={direccion}
                    onChange={(e) => setDireccion(e.target.value)}
                    className="pl-10"
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto de Emergencia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contacto de Emergencia
            </CardTitle>
            <CardDescription>Información de contacto en caso de emergencia</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contacto-emergencia">Nombre Completo</Label>
                <Input
                  id="contacto-emergencia"
                  value={contactoEmergencia}
                  onChange={(e) => setContactoEmergencia(e.target.value)}
                  placeholder="Nombre del contacto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefono-emergencia">Teléfono</Label>
                <Input
                  id="telefono-emergencia"
                  type="tel"
                  value={telefonoEmergencia}
                  onChange={(e) => setTelefonoEmergencia(e.target.value)}
                  placeholder="+52 555 000 0000"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Clínica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Clínica</CardTitle>
            <CardDescription>Motivo de consulta</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="motivo-consulta">Motivo de Consulta *</Label>
              <Textarea
                id="motivo-consulta"
                value={motivoConsulta}
                onChange={(e) => setMotivoConsulta(e.target.value)}
                placeholder="Describe el motivo principal de la consulta..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700">
            Registrar Paciente
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onNavigate('inicio')}
          >
            Cancelar
          </Button>
        </div>
      </form>

      {/* Modal de éxito */}
      <AnimatePresence>
        {mostrarExito && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
              onClick={handleCerrarModal}
            >
              {/* Modal */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-8"
              >
                {/* Icono de éxito */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                  className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Check className="w-10 h-10 stroke-2 text-white" />
                </motion.div>

                {/* Contenido */}
                <div className="text-center space-y-4">
                  <h2 className="text-white text-2xl">¡Paciente Registrado Exitosamente!</h2>
                  <p className="text-slate-300">
                    El paciente <span className="text-teal-400">{nombre} {apellidos}</span> ha sido agregado al sistema correctamente.
                  </p>

                  {credencialesRegistradas && (
                    <div className="bg-slate-900 border border-slate-600 rounded-lg p-4 text-left space-y-2">
                      <p className="text-slate-200 text-sm font-medium">Credenciales de inicio de sesión</p>
                      <p className="text-slate-300 text-sm">
                        Correo: <span className="text-teal-400">{credencialesRegistradas.correo}</span>
                      </p>
                      <p className="text-slate-300 text-sm">
                        Contraseña: <span className="text-teal-400">{credencialesRegistradas.password}</span>
                      </p>
                      <p className="text-amber-300 text-xs">
                        Comparte estas credenciales con el paciente para que pueda iniciar sesión.
                      </p>
                    </div>
                  )}

                  {/* Botón */}
                  <Button
                    onClick={handleCerrarModal}
                    className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 mt-6"
                  >
                    Aceptar
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}