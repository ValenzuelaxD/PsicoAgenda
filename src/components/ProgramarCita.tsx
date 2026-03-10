import { motion, AnimatePresence } from 'motion/react';
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar } from './ui/calendar';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Check, Calendar as CalendarIcon, User } from 'lucide-react';
import { toast } from 'sonner';
import { ViewType } from './Dashboard';

interface ProgramarCitaProps {
  onNavigate: (view: ViewType) => void;
}

export function ProgramarCita({ onNavigate }: ProgramarCitaProps) {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [paciente, setPaciente] = useState('');
  const [hora, setHora] = useState('');
  const [tipo, setTipo] = useState('');
  const [duracion, setDuracion] = useState('50');
  const [modalidad, setModalidad] = useState('');
  const [notas, setNotas] = useState('');
  const [mostrarExito, setMostrarExito] = useState(false);

  const pacientes = [
    'Ana García Martínez',
    'Carlos Ramírez López',
    'María Fernández Torres',
    'Pedro González Sánchez',
  ];

  const horarios = [
    '8:00 AM',
    '9:00 AM',
    '10:00 AM',
    '11:00 AM',
    '12:00 PM',
    '1:00 PM',
    '2:00 PM',
    '3:00 PM',
    '4:00 PM',
    '5:00 PM',
    '6:00 PM',
  ];

  const tiposCita = [
    'Consulta Inicial',
    'Terapia Individual',
    'Terapia de Pareja',
    'Terapia Familiar',
    'Seguimiento',
    'Evaluación',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMostrarExito(true);
  };

  const handleCerrarModal = () => {
    setMostrarExito(false);
    // Limpiar formulario
    setPaciente('');
    setHora('');
    setTipo('');
    setModalidad('');
    setNotas('');
    setDate(new Date());
    // Navegar a gestión de citas
    onNavigate('citas');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-white mb-2">Programar Cita</h1>
        <p className="text-slate-300">
          Agenda una nueva sesión para uno de tus pacientes
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Cita</CardTitle>
                <CardDescription>
                  Configura los datos de la sesión
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="paciente">Seleccionar Paciente</Label>
                  <Select value={paciente} onValueChange={setPaciente} required>
                    <SelectTrigger id="paciente">
                      <SelectValue placeholder="Elige un paciente" />
                    </SelectTrigger>
                    <SelectContent>
                      {pacientes.map((pac) => (
                        <SelectItem key={pac} value={pac}>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {pac}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de Sesión</Label>
                  <Select value={tipo} onValueChange={setTipo} required>
                    <SelectTrigger id="tipo">
                      <SelectValue placeholder="Selecciona el tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposCita.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hora">Horario</Label>
                  <Select value={hora} onValueChange={setHora} required>
                    <SelectTrigger id="hora">
                      <SelectValue placeholder="Selecciona la hora" />
                    </SelectTrigger>
                    <SelectContent>
                      {horarios.map((h) => (
                        <SelectItem key={h} value={h}>
                          {h}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duracion">Duración (minutos)</Label>
                  <Input
                    id="duracion"
                    type="number"
                    value={duracion}
                    onChange={(e) => setDuracion(e.target.value)}
                    min="30"
                    max="120"
                    step="15"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="modalidad">Modalidad</Label>
                  <Select value={modalidad} onValueChange={setModalidad} required>
                    <SelectTrigger id="modalidad">
                      <SelectValue placeholder="Selecciona la modalidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="presencial">Presencial</SelectItem>
                      <SelectItem value="virtual">Virtual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notas">Notas Internas (Opcional)</Label>
                  <Textarea
                    id="notas"
                    placeholder="Notas para la sesión..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Seleccionar Fecha</CardTitle>
                <CardDescription>
                  Elige el día para la sesión
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                  disabled={(date) => date < new Date()}
                />
              </CardContent>
            </Card>

            {date && paciente && hora && tipo && (
              <Card className="bg-gradient-to-r from-teal-50 to-violet-50 border-teal-200 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    <CalendarIcon className="w-5 h-5 stroke-2 text-teal-600" />
                    Resumen de la Cita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-slate-800">
                    <span className="font-medium">Paciente:</span> {paciente}
                  </p>
                  <p className="text-slate-800">
                    <span className="font-medium">Tipo:</span> {tipo}
                  </p>
                  <p className="text-slate-800">
                    <span className="font-medium">Fecha:</span>{' '}
                    {date.toLocaleDateString('es-ES', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-slate-800">
                    <span className="font-medium">Hora:</span> {hora}
                  </p>
                  <p className="text-slate-800">
                    <span className="font-medium">Duración:</span> {duracion} min
                  </p>
                  {modalidad && (
                    <p className="text-slate-800">
                      <span className="font-medium">Modalidad:</span> {modalidad === 'presencial' ? 'Presencial' : 'Virtual'}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <Button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700" disabled={!date || !paciente || !hora || !tipo || !modalidad}>
            Programar Cita
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
                  <h2 className="text-white text-2xl">¡Cita Programada Exitosamente!</h2>
                  <p className="text-slate-300">
                    La cita con <span className="text-teal-400">{paciente}</span> ha sido agendada para el{' '}
                    <span className="text-teal-400">
                      {date?.toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>{' '}
                    a las <span className="text-teal-400">{hora}</span>.
                  </p>
                  <p className="text-slate-400 text-sm">
                    El paciente recibirá una notificación por correo electrónico y WhatsApp.
                  </p>

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