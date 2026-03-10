import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Download, TrendingUp, Users, Clock, DollarSign, FileText, Filter, X, CheckCircle2, Mail } from 'lucide-react';
import { Progress } from './ui/progress';
import { toast } from 'sonner';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'motion/react';

export function ReportesCitas() {
  const [periodo, setPeriodo] = useState('mes-actual');
  const [tipoCita, setTipoCita] = useState('todas');
  
  // Estado para el modal de generar reporte
  const [modalAbierto, setModalAbierto] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('2025-11-01');
  const [fechaFin, setFechaFin] = useState('2025-11-27');
  const [estadosSeleccionados, setEstadosSeleccionados] = useState({
    completadas: true,
    pendientes: true,
    canceladas: true,
    enCurso: true,
  });
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState('todos');
  const [reporteGenerado, setReporteGenerado] = useState(false);
  const [mostrarConfirmacionCorreo, setMostrarConfirmacionCorreo] = useState(false);

  const estadisticas = {
    totalCitas: 45,
    citasCompletadas: 38,
    citasCanceladas: 5,
    citasPendientes: 2,
    pacientesActivos: 12,
    horasTerapia: 42.5,
    ingresos: 45000,
  };

  const citasPorTipo = [
    { tipo: 'Terapia Individual', cantidad: 28, porcentaje: 62 },
    { tipo: 'Terapia de Pareja', cantidad: 8, porcentaje: 18 },
    { tipo: 'Terapia Familiar', cantidad: 5, porcentaje: 11 },
    { tipo: 'Consulta Inicial', cantidad: 4, porcentaje: 9 },
  ];

  const citasPorPaciente = [
    { paciente: 'Ana García Martínez', sesiones: 12, ultimaCita: '8 Nov 2025' },
    { paciente: 'Carlos Ramírez López', sesiones: 8, ultimaCita: '6 Nov 2025' },
    { paciente: 'María Fernández Torres', sesiones: 7, ultimaCita: '5 Nov 2025' },
    { paciente: 'Pedro González Sánchez', sesiones: 6, ultimaCita: '4 Nov 2025' },
    { paciente: 'Laura Martínez Ruiz', sesiones: 5, ultimaCita: '3 Nov 2025' },
  ];
  
  // Datos de ejemplo para el reporte personalizado
  const citasEjemplo = [
    { id: 1, fecha: '2025-11-05', hora: '10:00', paciente: 'Ana García Martínez', tipo: 'Terapia Individual', estado: 'Completada', duracion: '50 min', costo: '$1,000' },
    { id: 2, fecha: '2025-11-06', hora: '11:00', paciente: 'Carlos Ramírez López', tipo: 'Terapia de Pareja', estado: 'Completada', duracion: '60 min', costo: '$1,200' },
    { id: 3, fecha: '2025-11-07', hora: '14:00', paciente: 'María Fernández Torres', tipo: 'Terapia Individual', estado: 'Completada', duracion: '50 min', costo: '$1,000' },
    { id: 4, fecha: '2025-11-08', hora: '09:00', paciente: 'Pedro González Sánchez', tipo: 'Consulta Inicial', estado: 'Completada', duracion: '50 min', costo: '$800' },
    { id: 5, fecha: '2025-11-10', hora: '15:00', paciente: 'Laura Martínez Ruiz', tipo: 'Terapia Individual', estado: 'Cancelada', duracion: '50 min', costo: '$0' },
    { id: 6, fecha: '2025-11-12', hora: '10:30', paciente: 'Ana García Martínez', tipo: 'Terapia Individual', estado: 'Completada', duracion: '50 min', costo: '$1,000' },
    { id: 7, fecha: '2025-11-13', hora: '16:00', paciente: 'Carlos Ramírez López', tipo: 'Terapia de Pareja', estado: 'Completada', duracion: '60 min', costo: '$1,200' },
    { id: 8, fecha: '2025-11-28', hora: '11:00', paciente: 'María Fernández Torres', tipo: 'Terapia Individual', estado: 'Pendiente', duracion: '50 min', costo: '$1,000' },
    { id: 9, fecha: '2025-11-29', hora: '13:00', paciente: 'Pedro González Sánchez', tipo: 'Terapia Familiar', estado: 'Pendiente', duracion: '60 min', costo: '$1,200' },
    { id: 10, fecha: '2025-11-30', hora: '10:00', paciente: 'Laura Martínez Ruiz', tipo: 'Terapia Individual', estado: 'En Curso', duracion: '50 min', costo: '$1,000' },
  ];
  
  // Datos para el gráfico de distribución temporal
  const datosGrafico = [
    { fecha: '1-7 Nov', completadas: 12, canceladas: 1, pendientes: 0 },
    { fecha: '8-14 Nov', completadas: 15, canceladas: 2, pendientes: 1 },
    { fecha: '15-21 Nov', completadas: 8, canceladas: 1, pendientes: 0 },
    { fecha: '22-27 Nov', completadas: 3, canceladas: 1, pendientes: 1 },
  ];
  
  const listaPacientes = [
    'Todos los pacientes',
    'Ana García Martínez',
    'Carlos Ramírez López',
    'María Fernández Torres',
    'Pedro González Sánchez',
    'Laura Martínez Ruiz',
  ];
  
  const handleGenerarReporte = () => {
    setReporteGenerado(true);
    toast.success('Reporte generado exitosamente', {
      description: 'El reporte se ha generado con los filtros seleccionados'
    });
  };
  
  const handleLimpiarFiltros = () => {
    setFechaInicio('2025-11-01');
    setFechaFin('2025-11-27');
    setEstadosSeleccionados({
      completadas: true,
      pendientes: true,
      canceladas: true,
      enCurso: true,
    });
    setPacienteSeleccionado('todos');
    setReporteGenerado(false);
  };
  
  const handleExportarReportePDF = () => {
    toast.success('Exportando reporte en PDF', {
      description: 'El archivo se descargará en unos momentos'
    });
  };
  
  const handleExportarReporteExcel = () => {
    toast.success('Exportando reporte en Excel', {
      description: 'El archivo se descargará en unos momentos'
    });
  };
  
  const toggleEstado = (estado: keyof typeof estadosSeleccionados) => {
    setEstadosSeleccionados(prev => ({
      ...prev,
      [estado]: !prev[estado]
    }));
  };
  
  // Filtrar citas según los criterios seleccionados
  const citasFiltradas = citasEjemplo.filter(cita => {
    const dentroRangoFecha = cita.fecha >= fechaInicio && cita.fecha <= fechaFin;
    const estadoCumple = 
      (estadosSeleccionados.completadas && cita.estado === 'Completada') ||
      (estadosSeleccionados.pendientes && cita.estado === 'Pendiente') ||
      (estadosSeleccionados.canceladas && cita.estado === 'Cancelada') ||
      (estadosSeleccionados.enCurso && cita.estado === 'En Curso');
    const pacienteCumple = pacienteSeleccionado === 'todos' || cita.paciente === pacienteSeleccionado;
    
    return dentroRangoFecha && estadoCumple && pacienteCumple;
  });
  
  // Calcular estadísticas del reporte
  const estadisticasReporte = {
    total: citasFiltradas.length,
    completadas: citasFiltradas.filter(c => c.estado === 'Completada').length,
    pendientes: citasFiltradas.filter(c => c.estado === 'Pendiente').length,
    canceladas: citasFiltradas.filter(c => c.estado === 'Cancelada').length,
    enCurso: citasFiltradas.filter(c => c.estado === 'En Curso').length,
    ingresoTotal: citasFiltradas.reduce((sum, c) => {
      const monto = parseInt(c.costo.replace(/[$,]/g, '')) || 0;
      return sum + monto;
    }, 0),
  };

  const handleExportarReporte = () => {
    setMostrarConfirmacionCorreo(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white mb-2">Reportes de Citas</h1>
          <p className="text-slate-300">
            Análisis y estadísticas de tu práctica profesional
          </p>
        </div>
        <Button className="bg-teal-600 hover:bg-teal-700" onClick={handleExportarReporte}>
          <Download className="w-4 h-4 mr-2 stroke-2" />
          Exportar Reporte
        </Button>
      </div>

      {/* Filtros */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-slate-200">Período</label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="mes-actual">Mes Actual</SelectItem>
                  <SelectItem value="mes-anterior">Mes Anterior</SelectItem>
                  <SelectItem value="trimestre">Último Trimestre</SelectItem>
                  <SelectItem value="año">Año Actual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-slate-200">Tipo de Cita</label>
              <Select value={tipoCita} onValueChange={setTipoCita}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="todas">Todas las Citas</SelectItem>
                  <SelectItem value="individual">Terapia Individual</SelectItem>
                  <SelectItem value="pareja">Terapia de Pareja</SelectItem>
                  <SelectItem value="familiar">Terapia Familiar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Total Citas</p>
                <p className="text-slate-100">{estadisticas.totalCitas}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Pacientes Activos</p>
                <p className="text-slate-100">{estadisticas.pacientesActivos}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Horas de Terapia</p>
                <p className="text-slate-100">{estadisticas.horasTerapia}h</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-violet-400 to-violet-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Ingresos</p>
                <p className="text-slate-100">${estadisticas.ingresos.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white stroke-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Citas */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <TrendingUp className="w-5 h-5" />
            Estado de Citas
          </CardTitle>
          <CardDescription className="text-slate-400">Resumen del período seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-slate-300">Completadas</span>
              <span className="text-slate-100">{estadisticas.citasCompletadas} de {estadisticas.totalCitas}</span>
            </div>
            <Progress value={(estadisticas.citasCompletadas / estadisticas.totalCitas) * 100} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg">
              <p className="text-teal-100">{estadisticas.citasCompletadas}</p>
              <p className="text-teal-300">Completadas</p>
            </div>
            <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-100">{estadisticas.citasCanceladas}</p>
              <p className="text-red-300">Canceladas</p>
            </div>
            <div className="text-center p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
              <p className="text-violet-100">{estadisticas.citasPendientes}</p>
              <p className="text-violet-300">Pendientes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generar Reporte de Citas */}
      <Card className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm border-slate-700 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <FileText className="w-6 h-6 text-teal-400 stroke-2" />
                Generar Reporte de Citas
              </CardTitle>
              <CardDescription className="text-slate-400 mt-2">
                Crea reportes personalizados filtrando por fechas, estados y pacientes específicos
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros del Reporte */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
            {/* Rango de Fechas */}
            <div className="space-y-3">
              <Label className="text-slate-200">
                <Calendar className="w-4 h-4 inline mr-2 stroke-2" />
                Fecha de Inicio
              </Label>
              <Input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>
            
            <div className="space-y-3">
              <Label className="text-slate-200">
                <Calendar className="w-4 h-4 inline mr-2 stroke-2" />
                Fecha de Fin
              </Label>
              <Input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="bg-slate-700 border-slate-600 text-slate-100"
              />
            </div>
            
            {/* Seleccionar Paciente */}
            <div className="space-y-3">
              <Label className="text-slate-200">
                <Users className="w-4 h-4 inline mr-2 stroke-2" />
                Paciente
              </Label>
              <Select value={pacienteSeleccionado} onValueChange={setPacienteSeleccionado}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="todos">Todos los pacientes</SelectItem>
                  {listaPacientes.slice(1).map((paciente, index) => (
                    <SelectItem key={index} value={paciente}>{paciente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Estados de Cita */}
            <div className="space-y-3 md:col-span-2 lg:col-span-3">
              <Label className="text-slate-200">
                <Filter className="w-4 h-4 inline mr-2 stroke-2" />
                Estado de las Citas
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <Checkbox
                    id="completadas"
                    checked={estadosSeleccionados.completadas}
                    onCheckedChange={() => toggleEstado('completadas')}
                    className="border-teal-400 data-[state=checked]:bg-teal-600"
                  />
                  <label htmlFor="completadas" className="text-slate-200 cursor-pointer">
                    Completadas
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <Checkbox
                    id="pendientes"
                    checked={estadosSeleccionados.pendientes}
                    onCheckedChange={() => toggleEstado('pendientes')}
                    className="border-violet-400 data-[state=checked]:bg-violet-600"
                  />
                  <label htmlFor="pendientes" className="text-slate-200 cursor-pointer">
                    Pendientes
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <Checkbox
                    id="canceladas"
                    checked={estadosSeleccionados.canceladas}
                    onCheckedChange={() => toggleEstado('canceladas')}
                    className="border-red-400 data-[state=checked]:bg-red-600"
                  />
                  <label htmlFor="canceladas" className="text-slate-200 cursor-pointer">
                    Canceladas
                  </label>
                </div>
                
                <div className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <Checkbox
                    id="enCurso"
                    checked={estadosSeleccionados.enCurso}
                    onCheckedChange={() => toggleEstado('enCurso')}
                    className="border-amber-400 data-[state=checked]:bg-amber-600"
                  />
                  <label htmlFor="enCurso" className="text-slate-200 cursor-pointer">
                    En Curso
                  </label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Botones de Acción */}
          <div className="flex flex-wrap gap-3">
            <Button 
              onClick={handleGenerarReporte}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            >
              <CheckCircle2 className="w-4 h-4 mr-2 stroke-2" />
              Generar Reporte
            </Button>
            <Button 
              onClick={handleLimpiarFiltros}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              <X className="w-4 h-4 mr-2 stroke-2" />
              Limpiar Filtros
            </Button>
          </div>
          
          {/* Vista Previa del Reporte */}
          {reporteGenerado && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-6 pt-6 border-t border-slate-700"
            >
              {/* Estadísticas del Reporte */}
              <div>
                <h3 className="text-slate-100 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-teal-400 stroke-2" />
                  Resumen del Reporte
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="text-center p-4 bg-slate-700/50 rounded-lg border border-slate-600">
                    <p className="text-slate-100">{estadisticasReporte.total}</p>
                    <p className="text-slate-400">Total</p>
                  </div>
                  <div className="text-center p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg">
                    <p className="text-teal-100">{estadisticasReporte.completadas}</p>
                    <p className="text-teal-300">Completadas</p>
                  </div>
                  <div className="text-center p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
                    <p className="text-violet-100">{estadisticasReporte.pendientes}</p>
                    <p className="text-violet-300">Pendientes</p>
                  </div>
                  <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
                    <p className="text-red-100">{estadisticasReporte.canceladas}</p>
                    <p className="text-red-300">Canceladas</p>
                  </div>
                  <div className="text-center p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
                    <p className="text-amber-100">{estadisticasReporte.enCurso}</p>
                    <p className="text-amber-300">En Curso</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-teal-900/20 to-violet-900/20 border border-teal-500/30 rounded-lg">
                    <p className="text-teal-100">${estadisticasReporte.ingresoTotal.toLocaleString()}</p>
                    <p className="text-teal-300">Ingresos</p>
                  </div>
                </div>
              </div>
              
              {/* Gráfico de Distribución */}
              <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                <h3 className="text-slate-100 mb-4">Distribución Temporal de Citas</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={datosGrafico}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="fecha" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#e2e8f0'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="completadas" fill="#14b8a6" name="Completadas" />
                    <Bar dataKey="canceladas" fill="#ef4444" name="Canceladas" />
                    <Bar dataKey="pendientes" fill="#a78bfa" name="Pendientes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              {/* Tabla de Citas Filtradas */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-100">Detalle de Citas ({citasFiltradas.length})</h3>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      onClick={handleExportarReportePDF}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Download className="w-4 h-4 mr-2 stroke-2" />
                      PDF
                    </Button>
                    <Button 
                      size="sm"
                      onClick={handleExportarReporteExcel}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Download className="w-4 h-4 mr-2 stroke-2" />
                      Excel
                    </Button>
                  </div>
                </div>
                
                <div className="border border-slate-700 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-800 hover:bg-slate-800">
                          <TableHead className="text-slate-300">Fecha</TableHead>
                          <TableHead className="text-slate-300">Hora</TableHead>
                          <TableHead className="text-slate-300">Paciente</TableHead>
                          <TableHead className="text-slate-300">Tipo</TableHead>
                          <TableHead className="text-slate-300">Estado</TableHead>
                          <TableHead className="text-slate-300">Duración</TableHead>
                          <TableHead className="text-slate-300">Costo</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {citasFiltradas.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                              No se encontraron citas con los filtros seleccionados
                            </TableCell>
                          </TableRow>
                        ) : (
                          citasFiltradas.map((cita) => (
                            <TableRow key={cita.id} className="border-slate-700">
                              <TableCell className="text-slate-300">{cita.fecha}</TableCell>
                              <TableCell className="text-slate-300">{cita.hora}</TableCell>
                              <TableCell className="text-slate-100">{cita.paciente}</TableCell>
                              <TableCell className="text-slate-300">{cita.tipo}</TableCell>
                              <TableCell>
                                <Badge 
                                  className={
                                    cita.estado === 'Completada' ? 'bg-teal-600' :
                                    cita.estado === 'Pendiente' ? 'bg-violet-600' :
                                    cita.estado === 'Cancelada' ? 'bg-red-600' :
                                    'bg-amber-600'
                                  }
                                >
                                  {cita.estado}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-300">{cita.duracion}</TableCell>
                              <TableCell className="text-slate-100">{cita.costo}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Citas por Tipo */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Distribución por Tipo de Cita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {citasPorTipo.map((item, index) => (
              <div key={index}>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-300">{item.tipo}</span>
                  <span className="text-slate-100">{item.cantidad} ({item.porcentaje}%)</span>
                </div>
                <Progress value={item.porcentaje} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Pacientes */}
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Pacientes con Más Sesiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {citasPorPaciente.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                >
                  <div>
                    <p className="text-slate-100">{item.paciente}</p>
                    <p className="text-slate-400">Última cita: {item.ultimaCita}</p>
                  </div>
                  <Badge className="bg-teal-600">{item.sesiones} sesiones</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de Confirmación de Envío por Correo */}
      <Dialog open={mostrarConfirmacionCorreo} onOpenChange={setMostrarConfirmacionCorreo}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="sr-only">Reporte enviado al correo</DialogTitle>
            <DialogDescription className="sr-only">Confirmación de envío del reporte al correo electrónico</DialogDescription>
          </DialogHeader>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="text-center py-6"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Mail className="w-8 h-8 text-white stroke-2" />
            </div>
            <h2 className="text-white text-xl font-semibold mb-2">¡Reporte Enviado!</h2>
            <p className="text-slate-300 mb-6">
              El reporte ha sido enviado correctamente a tu correo electrónico
            </p>
            <Button
              onClick={() => setMostrarConfirmacionCorreo(false)}
              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800"
            >
              Aceptar
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>
    </div>
  );
}