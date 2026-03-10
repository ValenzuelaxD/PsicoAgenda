import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Calendar, Edit, Save, Plus, Check, User } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Paciente, HistorialClinico } from '../utils/types';
import { API_ENDPOINTS } from '../utils/api';

export function BitacoraPaciente() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<string>('');
  const [entradas, setEntradas] = useState<HistorialClinico[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editando, setEditando] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  
  const [editarEntrada, setEditarEntrada] = useState<HistorialClinico | null>(null);
  const [notaEditar, setNotaEditar] = useState('');
  const [diagnosticoEditar, setDiagnosticoEditar] = useState('');
  const [tratamientoEditar, setTratamientoEditar] = useState('');
  
  const [mostrarExito, setMostrarExito] = useState(false);

  useEffect(() => {
    const fetchPacientes = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_ENDPOINTS.PACIENTES, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }

        if (!response.ok) {
          throw new Error('Error al cargar pacientes');
        }

        const data = await response.json();
        setPacientes(data);
        if (data.length > 0) {
          setPacienteSeleccionado(data[0].pacienteid.toString());
        }
      } catch (err: any) {
        setError(err.message);
        toast.error(err.message);
      }
    };
    fetchPacientes();
  }, []);

  useEffect(() => {
    if (pacienteSeleccionado) {
      const fetchHistorial = async () => {
        setLoading(true);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No autenticado. Por favor inicia sesión.');
          }

          const response = await fetch(`${API_ENDPOINTS.HISTORIAL_CLINICO}/${pacienteSeleccionado}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
          }

          if (!response.ok) {
            throw new Error('Error al cargar el historial');
          }

          const data = await response.json();
          setEntradas(data);
        } catch (err: any) {
          setError(err.message);
          toast.error(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchHistorial();
    }
  }, [pacienteSeleccionado]);

  const pacienteActual = pacientes.find(p => p.pacienteid.toString() === pacienteSeleccionado);

  const handleGuardarNota = async () => {
    if (!nuevaNota || !diagnostico || !tratamiento) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(API_ENDPOINTS.HISTORIAL_CLINICO, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado,
          observaciones: nuevaNota,
          diagnostico,
          tratamiento
        })
      });

      if (!response.ok) throw new Error('Error al guardar la nota');
      
      const nuevaEntrada = await response.json();
      setEntradas([nuevaEntrada, ...entradas]);
      toast.success('Entrada de bitácora guardada exitosamente');
      setNuevaNota('');
      setDiagnostico('');
      setTratamiento('');
      setEditando(false);
      setMostrarExito(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  
  const handleAbrirEditar = (entrada: HistorialClinico) => {
    setEditarEntrada(entrada);
    setNotaEditar(entrada.observaciones);
    setDiagnosticoEditar(entrada.diagnostico);
    setTratamientoEditar(entrada.tratamiento);
  };
  
  const handleGuardarEdicion = async () => {
    if (!notaEditar || !diagnosticoEditar || !tratamientoEditar || !editarEntrada) {
      toast.error('Por favor completa todos los campos');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`/api/historialclinico/${editarEntrada.historialid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          observaciones: notaEditar,
          diagnostico: diagnosticoEditar,
          tratamiento: tratamientoEditar
        })
      });
      
      if (!response.ok) throw new Error('Error al actualizar la nota');

      const entradaActualizada = await response.json();
      setEntradas(entradas.map(e => e.historialid === entradaActualizada.historialid ? entradaActualizada : e));
      setEditarEntrada(null);
      setMostrarExito(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };


  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header con selector de paciente */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white mb-2">Bitácora de Paciente</h1>
            <p className="text-slate-300">
              Consulta y registra el historial clínico de tus pacientes
            </p>
          </div>
          <Button onClick={() => setEditando(!editando)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2 stroke-2" />
            Nueva Entrada
          </Button>
        </div>

        {/* Selector de Paciente */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="selector-paciente" className="text-slate-200 mb-2 block">
                  Seleccionar Paciente
                </Label>
                <Select value={pacienteSeleccionado} onValueChange={setPacienteSeleccionado}>
                                  <SelectTrigger id="selector-paciente" className="bg-slate-700 border-slate-600 text-slate-100">
                                    <div className="flex items-center gap-2">
                                      <User className="w-4 h-4" />
                                      <SelectValue />
                                    </div>
                                  </SelectTrigger>
                                  <SelectContent className="bg-slate-800 border-slate-700">
                                    {pacientes.map((pac) => (
                                      <SelectItem key={pac.pacienteid} value={pac.pacienteid.toString()}>
                                        <div className="flex items-center gap-2">
                                          <User className="w-4 h-4" />
                                          <span>{`${pac.nombre} ${pac.apellidopaterno}`}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="flex gap-6 pt-6">
                                <div className="text-center">
                                  <p className="text-slate-400 text-sm">Edad</p>
                                  <p className="text-white">{pacienteActual?.edad} años</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-slate-400 text-sm">Sesiones</p>
                                  <p className="text-white">{pacienteActual?.sesionesTotales}</p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                
                      {/* Nueva Entrada */}
                      {editando && (
                        <Card className="border-teal-500/30 bg-slate-800/50 backdrop-blur-sm">
                          <CardHeader>
                            <CardTitle className="text-slate-100">Nueva Entrada de Bitácora</CardTitle>
                            <CardDescription className="text-slate-400">Registra las observaciones de la sesión actual</CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="diagnostico" className="text-slate-200">Diagnóstico</Label>
                              <Input id="diagnostico" value={diagnostico} onChange={(e) => setDiagnostico(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="tratamiento" className="text-slate-200">Tratamiento</Label>
                              <Input id="tratamiento" value={tratamiento} onChange={(e) => setTratamiento(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="notas" className="text-slate-200">Notas de la Sesión</Label>
                              <Textarea
                                id="notas"
                                value={nuevaNota}
                                onChange={(e) => setNuevaNota(e.target.value)}
                                placeholder="Observaciones, técnicas aplicadas, temas tratados, tareas asignadas..."
                                rows={6}
                                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                              />
                            </div>
                
                            <div className="flex gap-4">
                              <Button onClick={handleGuardarNota} className="bg-teal-600 hover:bg-teal-700">
                                <Save className="w-4 h-4 mr-2 stroke-2" />
                                Guardar Entrada
                              </Button>
                              <Button variant="outline" onClick={() => setEditando(false)} className="border-slate-600 text-slate-200 hover:bg-slate-700">
                                Cancelar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                
                      {/* Historial de Entradas */}
                      <div className="space-y-4">
                        <h2 className="text-white">Historial de Sesiones</h2>
                
                        {loading ? <p>Cargando historial...</p> : entradas.map((entrada) => (
                          <Card key={entrada.historialid} className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div>
                                  <CardTitle className="flex items-center gap-3 text-slate-100">
                                    <Badge variant="default">{entrada.diagnostico}</Badge>
                                    <Badge variant="secondary">{entrada.tratamiento}</Badge>
                                  </CardTitle>
                                  <CardDescription className="flex items-center gap-2 mt-1 text-slate-400">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(entrada.fechaentrada).toLocaleDateString()}
                                  </CardDescription>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => handleAbrirEditar(entrada)} className="text-slate-300 hover:bg-slate-700">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div>
                                <h4 className="text-slate-200 mb-2">Notas de la Sesión</h4>
                                <p className="text-slate-300">{entrada.observaciones}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Dialog para editar entrada */}
                      {editarEntrada !== null && (
                        <Dialog open={true} onOpenChange={() => setEditarEntrada(null)}>
                          <DialogContent className="sm:max-w-[600px] bg-slate-800 border-slate-700">
                            <DialogHeader>
                              <DialogTitle className="text-slate-100">Editar Bitácora del Paciente</DialogTitle>
                              <DialogDescription className="text-slate-400">Actualiza las observaciones de la sesión</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="diagnostico-editar" className="text-slate-200">Diagnóstico</Label>
                                <Input id="diagnostico-editar" value={diagnosticoEditar} onChange={(e) => setDiagnosticoEditar(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="tratamiento-editar" className="text-slate-200">Tratamiento</Label>
                                <Input id="tratamiento-editar" value={tratamientoEditar} onChange={(e) => setTratamientoEditar(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="notas-editar" className="text-slate-200">Notas de la Sesión</Label>
                                <Textarea
                                  id="notas-editar"
                                  value={notaEditar}
                                  onChange={(e) => setNotaEditar(e.target.value)}
                                  placeholder="Observaciones, técnicas aplicadas, temas tratados, tareas asignadas..."
                                  rows={6}
                                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditarEntrada(null)} className="border-slate-600 text-slate-200 hover:bg-slate-700">
                                Cancelar
                              </Button>
                              <Button onClick={handleGuardarEdicion} className="bg-teal-600 hover:bg-teal-700">
                                <Save className="w-4 h-4 mr-2 stroke-2" />
                                Guardar Cambios
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
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
                              onClick={() => setMostrarExito(false)}
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
                                  <h2 className="text-white text-2xl">¡Cambios Guardados!</h2>
                                  <p className="text-slate-300">
                                    La entrada de bitácora ha sido actualizada correctamente.
                                  </p>
                
                                  {/* Botón */}
                                  <Button
                                    onClick={() => setMostrarExito(false)}
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
                