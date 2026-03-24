import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Calendar, Clock, FileText, Filter, TrendingUp, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { apiFetch, API_ENDPOINTS } from '../utils/api';
import { ReporteCitasResponse } from '../utils/types';

type EstadoFiltro = 'Completada' | 'Pendiente' | 'Cancelada' | 'Reagendada';

const getMonthBounds = () => {
  const now = new Date();
  const inicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fin = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    inicio: inicio.toISOString().slice(0, 10),
    fin: fin.toISOString().slice(0, 10),
  };
};

const ESTADOS_DISPONIBLES: EstadoFiltro[] = ['Completada', 'Pendiente', 'Cancelada', 'Reagendada'];

export function ReportesCitas() {
  const rangoInicial = useMemo(() => getMonthBounds(), []);
  const [fechaInicio, setFechaInicio] = useState(rangoInicial.inicio);
  const [fechaFin, setFechaFin] = useState(rangoInicial.fin);
  const [modalidad, setModalidad] = useState('todas');
  const [pacienteId, setPacienteId] = useState('todos');
  const [estadosSeleccionados, setEstadosSeleccionados] = useState<Record<EstadoFiltro, boolean>>({
    Completada: true,
    Pendiente: true,
    Cancelada: true,
    Reagendada: true,
  });
  const [data, setData] = useState<ReporteCitasResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const estadosActivos = ESTADOS_DISPONIBLES.filter((estado) => estadosSeleccionados[estado]);

  useEffect(() => {
    const fetchReporte = async () => {
      setLoading(true);

      try {
        const params = new URLSearchParams({ fechaInicio, fechaFin });

        if (modalidad !== 'todas') {
          params.set('modalidad', modalidad);
        }

        if (pacienteId !== 'todos') {
          params.set('pacienteId', pacienteId);
        }

        if (estadosActivos.length > 0) {
          params.set('estados', estadosActivos.join(','));
        }

        const response = await apiFetch(`${API_ENDPOINTS.REPORTES_CITAS}?${params.toString()}`);
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'No fue posible generar el reporte.');
        }

        const reporte = await response.json();
        setData(reporte);
      } catch (error: any) {
        toast.error(error.message || 'Error al cargar el reporte.');
      } finally {
        setLoading(false);
      }
    };

    fetchReporte();
  }, [fechaInicio, fechaFin, modalidad, pacienteId, estadosActivos.join(',')]);

  const toggleEstado = (estado: EstadoFiltro) => {
    setEstadosSeleccionados((prev) => ({
      ...prev,
      [estado]: !prev[estado],
    }));
  };

  const limpiarFiltros = () => {
    const rango = getMonthBounds();
    setFechaInicio(rango.inicio);
    setFechaFin(rango.fin);
    setModalidad('todas');
    setPacienteId('todos');
    setEstadosSeleccionados({
      Completada: true,
      Pendiente: true,
      Cancelada: true,
      Reagendada: true,
    });
  };

  const resumen = data?.resumen;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-0 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-white mb-2 text-xl sm:text-2xl">Reportes de Citas</h1>
        <p className="text-slate-300 text-sm sm:text-base">Indicadores y listados obtenidos directamente desde la base de datos.</p>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardContent className="pt-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-200">Fecha de inicio</Label>
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Fecha de fin</Label>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="bg-slate-700 border-slate-600 text-slate-100" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Modalidad</Label>
              <Select value={modalidad} onValueChange={setModalidad}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="Presencial">Presencial</SelectItem>
                  <SelectItem value="En linea">En linea</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-200">Paciente</Label>
              <Select value={pacienteId} onValueChange={setPacienteId}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="todos">Todos</SelectItem>
                  {data?.pacientes.map((paciente) => (
                    <SelectItem key={paciente.pacienteid} value={String(paciente.pacienteid)}>{paciente.paciente}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-slate-200 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Estados
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {ESTADOS_DISPONIBLES.map((estado) => (
                <div key={estado} className="flex items-center space-x-2 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <Checkbox id={estado} checked={estadosSeleccionados[estado]} onCheckedChange={() => toggleEstado(estado)} />
                  <label htmlFor={estado} className="text-slate-200 cursor-pointer">{estado}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={limpiarFiltros} className="border-slate-600 text-slate-200 hover:bg-slate-700 w-full sm:w-auto">
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Total Citas</p>
                <p className="text-slate-100">{loading ? '...' : resumen?.total_citas ?? 0}</p>
              </div>
              <Calendar className="w-6 h-6 text-teal-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Pacientes Activos</p>
                <p className="text-slate-100">{loading ? '...' : resumen?.pacientes_activos ?? 0}</p>
              </div>
              <Users className="w-6 h-6 text-violet-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Horas de Terapia</p>
                <p className="text-slate-100">{loading ? '...' : resumen?.horas_terapia ?? 0}</p>
              </div>
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-1">Pendientes</p>
                <p className="text-slate-100">{loading ? '...' : resumen?.citas_pendientes ?? 0}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-100">
            <TrendingUp className="w-5 h-5" />
            Estado de Citas
          </CardTitle>
          <CardDescription className="text-slate-400">Distribución del período seleccionado</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="text-center p-4 bg-teal-900/20 border border-teal-500/30 rounded-lg">
              <p className="text-teal-100">{loading ? '...' : resumen?.citas_completadas ?? 0}</p>
              <p className="text-teal-300">Completadas</p>
            </div>
            <div className="text-center p-4 bg-violet-900/20 border border-violet-500/30 rounded-lg">
              <p className="text-violet-100">{loading ? '...' : resumen?.citas_pendientes ?? 0}</p>
              <p className="text-violet-300">Pendientes</p>
            </div>
            <div className="text-center p-4 bg-red-900/20 border border-red-500/30 rounded-lg">
              <p className="text-red-100">{loading ? '...' : resumen?.citas_canceladas ?? 0}</p>
              <p className="text-red-300">Canceladas</p>
            </div>
            <div className="text-center p-4 bg-amber-900/20 border border-amber-500/30 rounded-lg">
              <p className="text-amber-100">{loading ? '...' : resumen?.citas_reagendadas ?? 0}</p>
              <p className="text-amber-300">Reagendadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Distribución Temporal</CardTitle>
            <CardDescription className="text-slate-400">Citas agrupadas por día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="fecha" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#e2e8f0',
                  }}
                />
                <Legend />
                <Bar dataKey="completadas" fill="#14b8a6" name="Completadas" />
                <Bar dataKey="pendientes" fill="#8b5cf6" name="Pendientes" />
                <Bar dataKey="canceladas" fill="#ef4444" name="Canceladas" />
                <Bar dataKey="reagendadas" fill="#f59e0b" name="Reagendadas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Distribución por Modalidad</CardTitle>
            <CardDescription className="text-slate-400">Participación de cada modalidad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.modalidades || []).map((item) => (
              <div key={item.modalidad} className="flex items-start sm:items-center justify-between gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                <div>
                  <p className="text-slate-100">{item.modalidad}</p>
                  <p className="text-slate-400">{item.cantidad} citas</p>
                </div>
                <Badge className="bg-teal-600">{item.porcentaje}%</Badge>
              </div>
            ))}
            {!loading && (data?.modalidades.length || 0) === 0 && <p className="text-slate-400">No hay datos para la modalidad seleccionada.</p>}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Pacientes con Más Sesiones</CardTitle>
            <CardDescription className="text-slate-400">Top 10 del período filtrado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.pacientes || []).map((item) => (
                <div key={item.pacienteid} className="flex items-start sm:items-center justify-between gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600">
                  <div className="min-w-0">
                    <p className="text-slate-100 break-words">{item.paciente}</p>
                    <p className="text-slate-400">Última cita: {new Date(item.ultima_cita).toLocaleDateString('es-ES')}</p>
                  </div>
                  <Badge className="bg-violet-600">{item.sesiones} sesiones</Badge>
                </div>
              ))}
              {!loading && (data?.pacientes.length || 0) === 0 && <p className="text-slate-400">No hay pacientes para mostrar.</p>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Detalle de Citas
            </CardTitle>
            <CardDescription className="text-slate-400">Listado completo según los filtros activos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-slate-700 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-800 hover:bg-slate-800">
                      <TableHead className="text-slate-300">Fecha</TableHead>
                      <TableHead className="text-slate-300">Hora</TableHead>
                      <TableHead className="text-slate-300">Paciente</TableHead>
                      <TableHead className="text-slate-300">Modalidad</TableHead>
                      <TableHead className="text-slate-300">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">Cargando reporte...</TableCell>
                      </TableRow>
                    ) : (data?.citas.length || 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-slate-400 py-8">No se encontraron citas con los filtros seleccionados.</TableCell>
                      </TableRow>
                    ) : (
                      data?.citas.map((cita) => (
                        <TableRow key={cita.citaid} className="border-slate-700">
                          <TableCell className="text-slate-300">{new Date(cita.fecha).toLocaleDateString('es-ES')}</TableCell>
                          <TableCell className="text-slate-300">{cita.hora}</TableCell>
                          <TableCell className="text-slate-100">{cita.paciente}</TableCell>
                          <TableCell className="text-slate-300">{cita.modalidad}</TableCell>
                          <TableCell>
                            <Badge className={
                              cita.estado === 'Completada'
                                ? 'bg-teal-600'
                                : cita.estado === 'Pendiente'
                                  ? 'bg-violet-600'
                                  : cita.estado === 'Cancelada'
                                    ? 'bg-red-600'
                                    : 'bg-amber-600'
                            }>
                              {cita.estado}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}