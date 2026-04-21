import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Calendar, Edit, Save, Plus, Check, User, Search } from 'lucide-react';
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
import { API_ENDPOINTS, apiFetch } from '../utils/api';

interface BitacoraPacienteProps {
  pacienteId?: number;
}

type CasoEspecialTipo =
  | 'urgencia'
  | 'familiar'
  | 'fuera_horario'
  | 'riesgo_autolesivo'
  | 'violencia'
  | 'abandono'
  | 'otro';

type SeveridadCaso = 'Baja' | 'Media' | 'Alta' | 'Critica';
type EstadoCaso = 'Abierto' | 'Seguimiento' | 'Escalado' | 'Cerrado';

interface CasoEspecialMeta {
  tipos: CasoEspecialTipo[];
  severidad: SeveridadCaso;
  estado: EstadoCaso;
}

interface BitacoraEntrada extends HistorialClinico {
  observacionesLimpias: string;
  casoEspecial: CasoEspecialMeta | null;
}

const META_PREFIX = '[PSICOAGENDA_CASO_ESPECIAL]';

const TIPOS_CASO_OPCIONES: Array<{ value: CasoEspecialTipo; label: string }> = [
  { value: 'urgencia', label: 'Urgencia' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'fuera_horario', label: 'Fuera de horario' },
  { value: 'riesgo_autolesivo', label: 'Riesgo autolesivo' },
  { value: 'violencia', label: 'Violencia' },
  { value: 'abandono', label: 'Abandono' },
  { value: 'otro', label: 'Otro' },
];

const SEVERIDAD_OPCIONES: SeveridadCaso[] = ['Baja', 'Media', 'Alta', 'Critica'];
const ESTADO_OPCIONES: EstadoCaso[] = ['Abierto', 'Seguimiento', 'Escalado', 'Cerrado'];

const clasesSeveridad: Record<SeveridadCaso, string> = {
  Baja: 'bg-emerald-600 text-white',
  Media: 'bg-amber-500 text-slate-900',
  Alta: 'bg-orange-500 text-white',
  Critica: 'bg-rose-600 text-white',
};

const clasesEstado: Record<EstadoCaso, string> = {
  Abierto: 'bg-sky-600 text-white',
  Seguimiento: 'bg-violet-600 text-white',
  Escalado: 'bg-fuchsia-600 text-white',
  Cerrado: 'bg-slate-600 text-white',
};

const claseBotonOpcion = (activo: boolean, claseActiva: string) => {
  if (activo) {
    return `${claseActiva} border-transparent hover:opacity-90`;
  }

  return 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700';
};

const claseSeveridadActiva = (nivel: SeveridadCaso) => {
  switch (nivel) {
    case 'Baja':
      return 'bg-emerald-600 text-white border-transparent hover:opacity-90';
    case 'Media':
      return 'bg-amber-500 text-slate-900 border-transparent hover:opacity-90';
    case 'Alta':
      return 'bg-orange-500 text-white border-transparent hover:opacity-90';
    case 'Critica':
      return 'bg-rose-600 text-white border-transparent hover:opacity-90';
    default:
      return 'bg-teal-600 text-white border-transparent hover:opacity-90';
  }
};

const claseEstadoActiva = (estado: EstadoCaso) => {
  switch (estado) {
    case 'Abierto':
      return 'bg-sky-600 text-white border-transparent hover:opacity-90';
    case 'Seguimiento':
      return 'bg-violet-600 text-white border-transparent hover:opacity-90';
    case 'Escalado':
      return 'bg-fuchsia-600 text-white border-transparent hover:opacity-90';
    case 'Cerrado':
      return 'bg-slate-600 text-white border-transparent hover:opacity-90';
    default:
      return 'bg-teal-600 text-white border-transparent hover:opacity-90';
  }
};

const esTipoCasoValido = (value: string): value is CasoEspecialTipo =>
  TIPOS_CASO_OPCIONES.some((opcion) => opcion.value === value);

const esSeveridadValida = (value: string): value is SeveridadCaso =>
  SEVERIDAD_OPCIONES.includes(value as SeveridadCaso);

const esEstadoValido = (value: string): value is EstadoCaso =>
  ESTADO_OPCIONES.includes(value as EstadoCaso);

const parseObservaciones = (textoOriginal: string | undefined): { observacionesLimpias: string; casoEspecial: CasoEspecialMeta | null } => {
  const texto = String(textoOriginal || '');
  const indiceMeta = texto.lastIndexOf(META_PREFIX);

  if (indiceMeta === -1) {
    return {
      observacionesLimpias: texto,
      casoEspecial: null,
    };
  }

  const observacionesLimpias = texto.slice(0, indiceMeta).trimEnd();
  const rawMeta = texto.slice(indiceMeta + META_PREFIX.length).trim();

  try {
    const parsed = JSON.parse(rawMeta);
    const tipos = Array.isArray(parsed?.tipos)
      ? parsed.tipos.filter((tipo: string) => esTipoCasoValido(tipo))
      : [];
    const severidad = esSeveridadValida(String(parsed?.severidad || '')) ? parsed.severidad : 'Media';
    const estado = esEstadoValido(String(parsed?.estado || '')) ? parsed.estado : 'Abierto';

    if (tipos.length === 0) {
      return {
        observacionesLimpias: texto,
        casoEspecial: null,
      };
    }

    return {
      observacionesLimpias,
      casoEspecial: {
        tipos,
        severidad,
        estado,
      },
    };
  } catch {
    return {
      observacionesLimpias: texto,
      casoEspecial: null,
    };
  }
};

const buildObservacionesPayload = (observacionesLimpias: string, casoEspecial: CasoEspecialMeta | null): string => {
  const texto = String(observacionesLimpias || '').trim();
  if (!casoEspecial || casoEspecial.tipos.length === 0) {
    return texto;
  }

  return `${texto}\n\n${META_PREFIX}${JSON.stringify(casoEspecial)}`;
};

const normalizarEntrada = (entrada: HistorialClinico): BitacoraEntrada => {
  const parsed = parseObservaciones(entrada.observaciones);
  return {
    ...entrada,
    observacionesLimpias: parsed.observacionesLimpias,
    casoEspecial: parsed.casoEspecial,
  };
};

export function BitacoraPaciente({ pacienteId }: BitacoraPacienteProps) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [entradas, setEntradas] = useState<BitacoraEntrada[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [loadingHistorial, setLoadingHistorial] = useState(false);

  const [editando, setEditando] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [tiposCaso, setTiposCaso] = useState<CasoEspecialTipo[]>([]);
  const [severidadCaso, setSeveridadCaso] = useState<SeveridadCaso>('Media');
  const [estadoCaso, setEstadoCaso] = useState<EstadoCaso>('Abierto');

  const [editarEntrada, setEditarEntrada] = useState<BitacoraEntrada | null>(null);
  const [notaEditar, setNotaEditar] = useState('');
  const [diagnosticoEditar, setDiagnosticoEditar] = useState('');
  const [tratamientoEditar, setTratamientoEditar] = useState('');
  const [tiposCasoEditar, setTiposCasoEditar] = useState<CasoEspecialTipo[]>([]);
  const [severidadCasoEditar, setSeveridadCasoEditar] = useState<SeveridadCaso>('Media');
  const [estadoCasoEditar, setEstadoCasoEditar] = useState<EstadoCaso>('Abierto');

  const [filtroCasoEspecial, setFiltroCasoEspecial] = useState<'todos' | 'solo'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | CasoEspecialTipo>('todos');
  const [filtroSeveridad, setFiltroSeveridad] = useState<'todas' | SeveridadCaso>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoCaso>('todos');

  const [mostrarExito, setMostrarExito] = useState(false);

  const fetchPacientesList = async () => {
    try {
      const response = await apiFetch(API_ENDPOINTS.PACIENTES);
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
      }
      if (!response.ok) throw new Error('Error al cargar pacientes');
      const data = await response.json();
      setPacientes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoadingPacientes(false);
    }
  };

  // Carga inicial de pacientes
  useEffect(() => {
    fetchPacientesList();
  }, []);

  // Refrescar datos cada 30 segundos para capturar cambios en sesiones completadas
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPacientesList();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Auto-seleccionar paciente cuando llega el prop pacienteId
  useEffect(() => {
    if (pacienteId !== undefined && pacientes.length > 0) {
      const found = pacientes.find((p) => p.pacienteid === pacienteId);
      if (found) setPacienteSeleccionado(found);
    }
  }, [pacienteId, pacientes]);

  // Cargar historial cuando cambia el paciente seleccionado
  useEffect(() => {
    if (!pacienteSeleccionado) {
      setEntradas([]);
      return;
    }
    const fetchHistorial = async () => {
      setLoadingHistorial(true);
      try {
        const response = await apiFetch(
          `${API_ENDPOINTS.HISTORIAL_CLINICO}/${pacienteSeleccionado.pacienteid}`
        );
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        }
        if (!response.ok) throw new Error('Error al cargar el historial');
        const data = await response.json();
        setEntradas(Array.isArray(data) ? data.map(normalizarEntrada) : []);
      } catch (err: any) {
        toast.error(err.message);
      } finally {
        setLoadingHistorial(false);
      }
    };
    fetchHistorial();
  }, [pacienteSeleccionado]);

  const pacientesFiltrados = pacientes.filter((p) =>
    `${p.nombre ?? ''} ${p.apellidopaterno ?? ''}`
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  const entradasFiltradas = useMemo(() => {
    return entradas.filter((entrada) => {
      const meta = entrada.casoEspecial;

      if (filtroCasoEspecial === 'solo' && !meta) {
        return false;
      }

      if (filtroTipo !== 'todos' && (!meta || !meta.tipos.includes(filtroTipo))) {
        return false;
      }

      if (filtroSeveridad !== 'todas' && (!meta || meta.severidad !== filtroSeveridad)) {
        return false;
      }

      if (filtroEstado !== 'todos' && (!meta || meta.estado !== filtroEstado)) {
        return false;
      }

      return true;
    });
  }, [entradas, filtroCasoEspecial, filtroTipo, filtroSeveridad, filtroEstado]);

  const toggleTipoCaso = (tipo: CasoEspecialTipo) => {
    setTiposCaso((prev) =>
      prev.includes(tipo) ? prev.filter((item) => item !== tipo) : [...prev, tipo]
    );
  };

  const toggleTipoCasoEditar = (tipo: CasoEspecialTipo) => {
    setTiposCasoEditar((prev) =>
      prev.includes(tipo) ? prev.filter((item) => item !== tipo) : [...prev, tipo]
    );
  };

  const handleGuardarNota = async () => {
    if (!nuevaNota || !diagnostico || !tratamiento || !pacienteSeleccionado) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const metaCaso = tiposCaso.length > 0
      ? {
          tipos: tiposCaso,
          severidad: severidadCaso,
          estado: estadoCaso,
        }
      : null;

    try {
      const response = await apiFetch(API_ENDPOINTS.HISTORIAL_CLINICO, {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado.pacienteid,
          observaciones: buildObservacionesPayload(nuevaNota, metaCaso),
          diagnostico,
          tratamiento,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar la nota');
      const nuevaEntrada = normalizarEntrada(await response.json());
      setEntradas([nuevaEntrada, ...entradas]);
      toast.success('Entrada de bitácora guardada exitosamente');
      setNuevaNota('');
      setDiagnostico('');
      setTratamiento('');
      setTiposCaso([]);
      setSeveridadCaso('Media');
      setEstadoCaso('Abierto');
      setEditando(false);
      setMostrarExito(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAbrirEditar = (entrada: HistorialClinico) => {
    setEditarEntrada(entrada);
    setNotaEditar(entrada.observacionesLimpias ?? '');
    setDiagnosticoEditar(entrada.diagnostico ?? '');
    setTratamientoEditar(entrada.tratamiento ?? '');
    setTiposCasoEditar(entrada.casoEspecial?.tipos || []);
    setSeveridadCasoEditar(entrada.casoEspecial?.severidad || 'Media');
    setEstadoCasoEditar(entrada.casoEspecial?.estado || 'Abierto');
  };

  const handleGuardarEdicion = async () => {
    if (!notaEditar || !diagnosticoEditar || !tratamientoEditar || !editarEntrada) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const metaCasoEditar = tiposCasoEditar.length > 0
      ? {
          tipos: tiposCasoEditar,
          severidad: severidadCasoEditar,
          estado: estadoCasoEditar,
        }
      : null;

    try {
      const response = await apiFetch(
        `${API_ENDPOINTS.HISTORIAL_CLINICO}/${editarEntrada.historialid}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            observaciones: buildObservacionesPayload(notaEditar, metaCasoEditar),
            diagnostico: diagnosticoEditar,
            tratamiento: tratamientoEditar,
          }),
        }
      );
      if (!response.ok) throw new Error('Error al actualizar la nota');
      const entradaActualizada = normalizarEntrada(await response.json());
      setEntradas(
        entradas.map((e) =>
          e.historialid === entradaActualizada.historialid ? entradaActualizada : e
        )
      );
      setEditarEntrada(null);
      setMostrarExito(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] overflow-hidden bg-slate-950 px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 sm:mb-10 lg:mb-12 flex-shrink-0">
        <div className="min-w-0">
          <h1 className="text-white mb-1 text-xl sm:text-2xl font-bold">Bitacora de Paciente</h1>
          <p className="text-slate-300 text-sm">
            Consulta y registra el historial clinico de tus pacientes
          </p>
        </div>
        {pacienteSeleccionado && (
          <Button
            onClick={() => setEditando(true)}
            className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto flex-shrink-0"
          >
            <Plus className="w-4 h-4 mr-2 stroke-2" />
            Nueva Entrada
          </Button>
        )}
      </div>

      {/* Layout de dos columnas con scroll independiente */}
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4 sm:gap-6 flex-1 overflow-hidden min-h-0">
        {/* Panel izquierdo: lista de pacientes */}
        <div className="min-w-0 flex flex-col gap-3 overflow-y-auto lg:pr-1 max-h-[36dvh] lg:max-h-none">
          {/* Buscador fijo al tope del panel */}
          <div className="relative sticky top-0 z-10 bg-slate-900 pb-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <Input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar paciente..."
                className="h-11 bg-slate-800 border-slate-600 text-slate-100 placeholder:text-slate-500 leading-normal w-full"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
            <Button
              onClick={() => fetchPacientesList()}
              variant="outline"
              size="icon"
              className="flex-shrink-0 h-11"
              title="Refrescar datos"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {loadingPacientes ? (
            <p className="text-slate-400 text-sm text-center py-4">Cargando pacientes...</p>
          ) : pacientesFiltrados.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">Sin resultados</p>
          ) : (
            pacientesFiltrados.map((paciente) => (
              <Card
                key={paciente.pacienteid}
                className={`cursor-pointer transition-all hover:shadow-md bg-slate-800/50 backdrop-blur-sm border-slate-700 ${
                  pacienteSeleccionado?.pacienteid === paciente.pacienteid
                    ? 'border-teal-500 bg-gradient-to-r from-teal-900/30 to-violet-900/30 shadow-lg'
                    : ''
                }`}
                onClick={() => {
                  setPacienteSeleccionado(paciente);
                  setEditando(false);
                }}
              >
                <CardContent className="py-4">
                  <div className="flex min-h-10 items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {paciente.fotoperfil ? (
                        <img
                          src={paciente.fotoperfil}
                          alt={`Foto de ${paciente.nombre || 'paciente'}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white stroke-2" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {`${paciente.nombre} ${paciente.apellidopaterno}`}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {paciente.edad} años · {paciente.sesionesTotales ?? 0} sesiones
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Panel derecho: información y bitácora */}
        <div className="min-w-0 flex-1 overflow-y-auto space-y-6 lg:pr-1">
          {pacienteSeleccionado ? (
            <>
              {/* Resumen del paciente */}
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-violet-600 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {pacienteSeleccionado.fotoperfil ? (
                        <img
                          src={pacienteSeleccionado.fotoperfil}
                          alt={`Foto de ${pacienteSeleccionado.nombre || 'paciente'}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white stroke-2" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs uppercase tracking-wide text-teal-300 mb-1">
                        Paciente seleccionado
                      </p>
                      <h2 className="text-white font-semibold">
                        {`${pacienteSeleccionado.nombre} ${pacienteSeleccionado.apellidopaterno}`}
                      </h2>
                      <p className="text-slate-400 text-sm">
                        {pacienteSeleccionado.edad} años ·{' '}
                        {pacienteSeleccionado.sesionesTotales ?? 0} sesiones completadas
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Historial de entradas */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3">
                  <h2 className="text-white">Historial de Sesiones</h2>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-3">
                    <p className="text-sm text-slate-300">Filtros de casos especiales</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setFiltroCasoEspecial(filtroCasoEspecial === 'solo' ? 'todos' : 'solo')}
                        className={filtroCasoEspecial === 'solo'
                          ? 'border-teal-500 bg-teal-500/20 text-teal-100 hover:bg-teal-500/30'
                          : 'border-slate-600 text-slate-200 hover:bg-slate-700'}
                      >
                        {filtroCasoEspecial === 'solo' ? 'Solo casos especiales' : 'Todos los registros'}
                      </Button>

                      <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value as 'todos' | CasoEspecialTipo)}
                        className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                      >
                        <option value="todos">Tipo: todos</option>
                        {TIPOS_CASO_OPCIONES.map((tipo) => (
                          <option key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filtroSeveridad}
                        onChange={(e) => setFiltroSeveridad(e.target.value as 'todas' | SeveridadCaso)}
                        className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                      >
                        <option value="todas">Severidad: todas</option>
                        {SEVERIDAD_OPCIONES.map((nivel) => (
                          <option key={nivel} value={nivel}>
                            {nivel}
                          </option>
                        ))}
                      </select>

                      <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value as 'todos' | EstadoCaso)}
                        className="h-9 rounded-md border border-slate-600 bg-slate-800 px-3 text-sm text-slate-100"
                      >
                        <option value="todos">Estado: todos</option>
                        {ESTADO_OPCIONES.map((estado) => (
                          <option key={estado} value={estado}>
                            {estado}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                {loadingHistorial ? (
                  <p className="text-slate-400">Cargando historial...</p>
                ) : entradasFiltradas.length === 0 ? (
                  <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700">
                    <CardContent className="py-12 text-center">
                      <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                      <p className="text-slate-400">
                        No hay entradas que coincidan con los filtros actuales.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  entradasFiltradas.map((entrada) => (
                    <Card
                      key={entrada.historialid}
                      className="bg-slate-800/50 backdrop-blur-sm border-slate-700"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-2 text-slate-100 flex-wrap">
                              {entrada.diagnostico && (
                                <Badge variant="default">{entrada.diagnostico}</Badge>
                              )}
                              {entrada.tratamiento && (
                                <Badge variant="secondary">{entrada.tratamiento}</Badge>
                              )}
                              {!entrada.diagnostico && !entrada.tratamiento && (
                                <Badge variant="outline" className="text-slate-200 border-slate-500">Entrada clinica</Badge>
                              )}
                              {entrada.casoEspecial?.tipos.map((tipo) => {
                                const tipoLabel = TIPOS_CASO_OPCIONES.find((opcion) => opcion.value === tipo)?.label || tipo;
                                return (
                                  <Badge key={`${entrada.historialid}-${tipo}`} className="bg-slate-700 text-slate-100 border border-slate-600">
                                    {tipoLabel}
                                  </Badge>
                                );
                              })}
                              {entrada.casoEspecial && (
                                <>
                                  <Badge className={clasesSeveridad[entrada.casoEspecial.severidad]}>
                                    {entrada.casoEspecial.severidad}
                                  </Badge>
                                  <Badge className={clasesEstado[entrada.casoEspecial.estado]}>
                                    {entrada.casoEspecial.estado}
                                  </Badge>
                                </>
                              )}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1 text-slate-400">
                              <Calendar className="w-3 h-3" />
                              {new Date(entrada.fechaentrada).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleAbrirEditar(entrada)}
                            className="text-slate-300 hover:bg-slate-700 shrink-0"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="text-slate-200 mb-2">Notas de la Sesión</h4>
                        <p className="text-slate-300 whitespace-pre-wrap">{entrada.observacionesLimpias}</p>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          ) : (
            <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700 h-full">
              <CardContent className="flex flex-col items-center justify-center h-full py-24">
                <User className="w-16 h-16 text-slate-500 mb-4" />
                <p className="text-slate-400 text-center">
                  Selecciona un paciente de la lista para ver o registrar su bitácora.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Diálogo de edición */}
      <Dialog open={editando} onOpenChange={setEditando}>
        <DialogContent className="w-[calc(100%-1rem)] max-w-[720px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Nueva Entrada de Bitácora</DialogTitle>
            <DialogDescription className="text-slate-400">
              Registra las observaciones de la sesión actual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-[70dvh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="diagnostico" className="text-slate-200">
                Diagnóstico
              </Label>
              <Input
                id="diagnostico"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tratamiento" className="text-slate-200">
                Tratamiento
              </Label>
              <Input
                id="tratamiento"
                value={tratamiento}
                onChange={(e) => setTratamiento(e.target.value)}
                className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notas" className="text-slate-200">
                Notas de la Sesión
              </Label>
              <Textarea
                id="notas"
                value={nuevaNota}
                onChange={(e) => setNuevaNota(e.target.value)}
                placeholder="Observaciones, técnicas aplicadas, temas tratados, tareas asignadas..."
                rows={6}
                className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
              />
            </div>

            <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
              <p className="text-sm text-slate-200">Caso especial (opcional)</p>
              <div className="flex flex-wrap gap-2">
                {TIPOS_CASO_OPCIONES.map((tipo) => {
                  const activo = tiposCaso.includes(tipo.value);
                  return (
                    <Button
                      key={tipo.value}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => toggleTipoCaso(tipo.value)}
                      className={claseBotonOpcion(activo, 'bg-teal-600 text-white')}
                    >
                      {tipo.label}
                    </Button>
                  );
                })}
              </div>

              {tiposCaso.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-slate-300">Severidad</Label>
                    <div className="flex flex-wrap gap-2">
                      {SEVERIDAD_OPCIONES.map((nivel) => (
                        <Button
                          key={nivel}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSeveridadCaso(nivel)}
                          className={severidadCaso === nivel ? claseSeveridadActiva(nivel) : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                        >
                          {nivel}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-300">Estado del caso</Label>
                    <div className="flex flex-wrap gap-2">
                      {ESTADO_OPCIONES.map((estado) => (
                        <Button
                          key={estado}
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEstadoCaso(estado)}
                          className={estadoCaso === estado ? claseEstadoActiva(estado) : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                        >
                          {estado}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setEditando(false)}
              className="border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button onClick={handleGuardarNota} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2 stroke-2" />
              Guardar Entrada
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de edición */}
      {editarEntrada !== null && (
        <Dialog open={true} onOpenChange={() => setEditarEntrada(null)}>
          <DialogContent className="w-[calc(100%-1rem)] max-w-[600px] bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-slate-100">Editar Bitácora del Paciente</DialogTitle>
              <DialogDescription className="text-slate-400">
                Actualiza las observaciones de la sesión
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnostico-editar" className="text-slate-200">
                  Diagnóstico
                </Label>
                <Input
                  id="diagnostico-editar"
                  value={diagnosticoEditar}
                  onChange={(e) => setDiagnosticoEditar(e.target.value)}
                  className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tratamiento-editar" className="text-slate-200">
                  Tratamiento
                </Label>
                <Input
                  id="tratamiento-editar"
                  value={tratamientoEditar}
                  onChange={(e) => setTratamientoEditar(e.target.value)}
                  className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas-editar" className="text-slate-200">
                  Notas de la Sesión
                </Label>
                <Textarea
                  id="notas-editar"
                  value={notaEditar}
                  onChange={(e) => setNotaEditar(e.target.value)}
                  placeholder="Observaciones, técnicas aplicadas, temas tratados, tareas asignadas..."
                  rows={6}
                  className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                <p className="text-sm text-slate-200">Caso especial (opcional)</p>
                <div className="flex flex-wrap gap-2">
                  {TIPOS_CASO_OPCIONES.map((tipo) => {
                    const activo = tiposCasoEditar.includes(tipo.value);
                    return (
                      <Button
                        key={tipo.value}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => toggleTipoCasoEditar(tipo.value)}
                        className={claseBotonOpcion(activo, 'bg-teal-600 text-white')}
                      >
                        {tipo.label}
                      </Button>
                    );
                  })}
                </div>

                {tiposCasoEditar.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-slate-300">Severidad</Label>
                      <div className="flex flex-wrap gap-2">
                        {SEVERIDAD_OPCIONES.map((nivel) => (
                          <Button
                            key={nivel}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setSeveridadCasoEditar(nivel)}
                            className={severidadCasoEditar === nivel ? claseSeveridadActiva(nivel) : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                          >
                            {nivel}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-300">Estado del caso</Label>
                      <div className="flex flex-wrap gap-2">
                        {ESTADO_OPCIONES.map((estado) => (
                          <Button
                            key={estado}
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => setEstadoCasoEditar(estado)}
                            className={estadoCasoEditar === estado ? claseEstadoActiva(estado) : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                          >
                            {estado}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setEditarEntrada(null)}
                className="border-slate-600 text-slate-200 hover:bg-slate-700 w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button onClick={handleGuardarEdicion} className="bg-teal-600 hover:bg-teal-700 w-full sm:w-auto">
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setMostrarExito(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl max-w-md w-full p-5 sm:p-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', damping: 15 }}
                className="w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 stroke-2 text-white" />
              </motion.div>
              <div className="text-center space-y-4">
                <h2 className="text-white text-xl sm:text-2xl">¡Cambios Guardados!</h2>
                <p className="text-slate-300">
                  La entrada de bitácora ha sido actualizada correctamente.
                </p>
                <Button
                  onClick={() => setMostrarExito(false)}
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 mt-6"
                >
                  Aceptar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
