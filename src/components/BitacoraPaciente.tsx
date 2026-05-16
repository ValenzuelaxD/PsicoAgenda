import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
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
import { FrecuenciaRecomendadaCitas } from './FrecuenciaRecomendadaCitas';
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
type NivelRiesgoAutolesivo = 'Sin riesgo' | 'Ideación pasiva' | 'Ideación activa' | 'Plan' | 'Intento';
type QuienRealizoContacto = 'Paciente' | 'Familiar' | 'Tutor' | 'Otro';

interface ClinicaMetaBitacora {
  fechaSesion: string;
  numeroSesion: string;
  cedulaProfesional: string;
  codigoCie11: string;
  motivoConsulta: string;
  observacionesAvance: string;
  proximaCitaFecha: string;
  planSeguimiento: string;
  consentimientoVigente: boolean;
  riesgoAutolesivo: {
    nivel: NivelRiesgoAutolesivo | '';
    planSeguridad: string;
    notificadoFamiliar: boolean;
    protocoloCrisis: boolean;
  };
  fueraHorario: {
    quienRealizoContacto: QuienRealizoContacto | '';
    accionTomada: string;
    protocoloCrisis: boolean;
  };
}

interface CasoEspecialMeta {
  tipos: CasoEspecialTipo[];
  severidad: SeveridadCaso;
  estado: EstadoCaso;
  detalle?: {
    accionInmediata?: string;
    planSeguimiento24h?: string;
    relacionFamiliar?: string;
    relacionFamiliarOtro?: string;
    consentimientoFamiliar?: 'Si' | 'No';
    horaFueraHorario?: string;
    motivoFueraHorario?: string;
  };
}

interface BitacoraEntrada extends HistorialClinico {
  observacionesLimpias: string;
  casoEspecial: CasoEspecialMeta | null;
  comentarioFelicitacion: string;
  clinica: ClinicaMetaBitacora | null;
}

const META_PREFIX = '[PSICOAGENDA_CASO_ESPECIAL]';
const FELICITACION_PREFIX = '[PSICOAGENDA_COMENTARIO_FELICITACION]';
const CIE11_PATTERN = /^[A-Z0-9]{2,7}(?:\.[A-Z0-9]{1,4})?$/i;

const padDos = (value: number) => String(value).padStart(2, '0');

const formatearFechaHoraLocalInput = (fecha?: string | Date) => {
  const fechaObj = fecha instanceof Date ? fecha : fecha ? new Date(fecha) : new Date();
  if (Number.isNaN(fechaObj.getTime())) {
    return '';
  }

  return [
    fechaObj.getFullYear(),
    padDos(fechaObj.getMonth() + 1),
    padDos(fechaObj.getDate()),
  ].join('-') + `T${padDos(fechaObj.getHours())}:${padDos(fechaObj.getMinutes())}`;
};

const formatearFechaLocalInput = (fecha?: string | Date) => {
  const fechaObj = fecha instanceof Date ? fecha : fecha ? new Date(fecha) : new Date();
  if (Number.isNaN(fechaObj.getTime())) {
    return '';
  }

  return [
    fechaObj.getFullYear(),
    padDos(fechaObj.getMonth() + 1),
    padDos(fechaObj.getDate()),
  ].join('-');
};

const generarFolioClinico = (historialId?: number) => {
  const ahora = new Date();
  const base = `${ahora.getFullYear()}${padDos(ahora.getMonth() + 1)}${padDos(ahora.getDate())}`;
  const sufijo = historialId ? String(historialId).padStart(5, '0') : `${padDos(ahora.getHours())}${padDos(ahora.getMinutes())}${padDos(ahora.getSeconds())}`;
  return `BIT-${base}-${sufijo}`;
};

const obtenerCedulaProfesionalSesion = () => {
  try {
    const rawUser = localStorage.getItem('user');
    if (!rawUser) {
      return '';
    }

    const user = JSON.parse(rawUser);
    return String(user?.cedulaProfesional || user?.cedulaprofesional || '');
  } catch {
    return '';
  }
};

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
const RELACION_FAMILIAR_OPCIONES = ['Familiar', 'Red de apoyo', 'Otro'] as const;
type RelacionFamiliarOpcion = (typeof RELACION_FAMILIAR_OPCIONES)[number];

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
      return '!bg-emerald-600 !text-white !border-transparent hover:opacity-90';
    case 'Media':
      return '!bg-amber-500 !text-slate-900 !border-transparent hover:opacity-90';
    case 'Alta':
      return '!bg-orange-500 !text-white !border-transparent hover:opacity-90';
    case 'Critica':
      return '!bg-rose-600 !text-white !border-transparent hover:opacity-90';
    default:
      return '!bg-teal-600 !text-white !border-transparent hover:opacity-90';
  }
};

const claseEstadoActiva = (estado: EstadoCaso) => {
  switch (estado) {
    case 'Abierto':
      return '!bg-sky-600 !text-white !border-transparent hover:opacity-90';
    case 'Seguimiento':
      return '!bg-violet-600 !text-white !border-transparent hover:opacity-90';
    case 'Escalado':
      return '!bg-fuchsia-600 !text-white !border-transparent hover:opacity-90';
    case 'Cerrado':
      return '!bg-slate-600 !text-white !border-transparent hover:opacity-90';
    default:
      return '!bg-teal-600 !text-white !border-transparent hover:opacity-90';
  }
};

const claseInactivaSegmento = '!border-slate-600 !bg-slate-800 !text-slate-200 hover:!bg-slate-700';

const esTipoCasoValido = (value: string): value is CasoEspecialTipo =>
  TIPOS_CASO_OPCIONES.some((opcion) => opcion.value === value);

const esSeveridadValida = (value: string): value is SeveridadCaso =>
  SEVERIDAD_OPCIONES.includes(value as SeveridadCaso);

const esEstadoValido = (value: string): value is EstadoCaso =>
  ESTADO_OPCIONES.includes(value as EstadoCaso);

const parseObservaciones = (textoOriginal: string | undefined): {
  observacionesLimpias: string;
  casoEspecial: CasoEspecialMeta | null;
  comentarioFelicitacion: string;
  clinica: ClinicaMetaBitacora | null;
} => {
  const texto = String(textoOriginal || '');
  const sortedMarkers = [
    { key: FELICITACION_PREFIX, index: texto.indexOf(FELICITACION_PREFIX) },
    { key: META_PREFIX, index: texto.indexOf(META_PREFIX) },
  ]
    .filter((marker) => marker.index !== -1)
    .sort((a, b) => a.index - b.index);

  if (sortedMarkers.length === 0) {
    return {
      observacionesLimpias: texto,
      casoEspecial: null,
      comentarioFelicitacion: '',
      clinica: null,
    };
  }

  const getSegmento = (prefix: string) => {
    const startIndex = texto.indexOf(prefix);
    if (startIndex === -1) {
      return '';
    }

    const contentStart = startIndex + prefix.length;
    const nextMarker = sortedMarkers.find((marker) => marker.index > startIndex);
    const contentEnd = nextMarker ? nextMarker.index : texto.length;
    return texto.slice(contentStart, contentEnd).trim();
  };

  const observacionesLimpias = texto.slice(0, sortedMarkers[0].index).trimEnd();
  const comentarioFelicitacion = getSegmento(FELICITACION_PREFIX);
  const rawMeta = getSegmento(META_PREFIX);

  if (!rawMeta) {
    return {
      observacionesLimpias,
      casoEspecial: null,
      comentarioFelicitacion,
      clinica: null,
    };
  }

  try {
    const parsed = JSON.parse(rawMeta);
    const casoEspecialFuente = parsed?.casoEspecial || parsed;
    const clinicaFuente = parsed?.clinica;
    const tipos = Array.isArray(casoEspecialFuente?.tipos)
      ? casoEspecialFuente.tipos.filter((tipo: string) => esTipoCasoValido(tipo))
      : [];
    const severidad = esSeveridadValida(String(casoEspecialFuente?.severidad || '')) ? casoEspecialFuente.severidad : 'Media';
    const estado = esEstadoValida(String(casoEspecialFuente?.estado || '')) ? casoEspecialFuente.estado : 'Abierto';
    const clinica = clinicaFuente
      ? normalizarClinicaMeta(clinicaFuente)
      : null;

    if (tipos.length === 0) {
      return {
        observacionesLimpias,
        casoEspecial: null,
        comentarioFelicitacion,
        clinica,
      };
    }

    return {
      observacionesLimpias,
      casoEspecial: {
        tipos,
        severidad,
        estado,
        detalle: {
          accionInmediata: String(casoEspecialFuente?.detalle?.accionInmediata || ''),
          planSeguimiento24h: String(casoEspecialFuente?.detalle?.planSeguimiento24h || ''),
          relacionFamiliar: String(casoEspecialFuente?.detalle?.relacionFamiliar || ''),
          relacionFamiliarOtro: String(casoEspecialFuente?.detalle?.relacionFamiliarOtro || ''),
          consentimientoFamiliar: casoEspecialFuente?.detalle?.consentimientoFamiliar === 'No' ? 'No' : 'Si',
          horaFueraHorario: String(casoEspecialFuente?.detalle?.horaFueraHorario || ''),
          motivoFueraHorario: String(casoEspecialFuente?.detalle?.motivoFueraHorario || ''),
        },
      },
      comentarioFelicitacion,
      clinica,
    };
  } catch {
    return {
      observacionesLimpias,
      casoEspecial: null,
      comentarioFelicitacion,
      clinica: null,
    };
  }
};

const buildObservacionesPayload = (
  observacionesLimpias: string,
  casoEspecial: CasoEspecialMeta | null,
  comentarioFelicitacion: string,
  clinica?: ClinicaMetaBitacora | null
): string => {
  const texto = String(observacionesLimpias || '').trim();
  const comentarioLimpio = String(comentarioFelicitacion || '').trim();

  const clinicaActiva = clinica
    ? {
        ...clinica,
        fechaSesion: String(clinica.fechaSesion || '').trim(),
        numeroSesion: String(clinica.numeroSesion || '').trim(),
        cedulaProfesional: String(clinica.cedulaProfesional || '').trim(),
        codigoCie11: String(clinica.codigoCie11 || '').trim().toUpperCase(),
        motivoConsulta: String(clinica.motivoConsulta || '').trim(),
        observacionesAvance: String(clinica.observacionesAvance || '').trim(),
        proximaCitaFecha: String(clinica.proximaCitaFecha || '').trim(),
        planSeguimiento: String(clinica.planSeguimiento || '').trim(),
        consentimientoVigente: Boolean(clinica.consentimientoVigente),
        riesgoAutolesivo: {
          ...clinica.riesgoAutolesivo,
          planSeguridad: String(clinica.riesgoAutolesivo?.planSeguridad || '').trim(),
          notificadoFamiliar: Boolean(clinica.riesgoAutolesivo?.notificadoFamiliar),
          protocoloCrisis: Boolean(clinica.riesgoAutolesivo?.protocoloCrisis),
        },
        fueraHorario: {
          ...clinica.fueraHorario,
          accionTomada: String(clinica.fueraHorario?.accionTomada || '').trim(),
          protocoloCrisis: Boolean(clinica.fueraHorario?.protocoloCrisis),
        },
      }
    : null;

  if ((!casoEspecial || casoEspecial.tipos.length === 0) && !comentarioLimpio && !clinicaActiva) {
    return texto;
  }

  const bloquesMetadata: string[] = [];
  const metadata: Record<string, unknown> = {};

  if (comentarioLimpio) {
    bloquesMetadata.push(`${FELICITACION_PREFIX}${comentarioLimpio}`);
  }

  if (casoEspecial && casoEspecial.tipos.length > 0) {
    metadata.casoEspecial = casoEspecial;
  }

  if (clinicaActiva) {
    metadata.clinica = clinicaActiva;
  }

  if (Object.keys(metadata).length > 0) {
    bloquesMetadata.push(`${META_PREFIX}${JSON.stringify(metadata)}`);
  }

  return `${texto}\n\n${bloquesMetadata.join('\n\n')}`.trim();
};

const normalizarDetalleCaso = (detalle: CasoEspecialMeta['detalle'] | undefined) => ({
  accionInmediata: String(detalle?.accionInmediata || ''),
  planSeguimiento24h: String(detalle?.planSeguimiento24h || ''),
  relacionFamiliar: String(detalle?.relacionFamiliar || '') as RelacionFamiliarOpcion | '',
  relacionFamiliarOtro: String(detalle?.relacionFamiliarOtro || ''),
  consentimientoFamiliar: detalle?.consentimientoFamiliar === 'No' ? 'No' : 'Si',
  horaFueraHorario: String(detalle?.horaFueraHorario || ''),
  motivoFueraHorario: String(detalle?.motivoFueraHorario || ''),
});

const normalizarClinicaMeta = (
  clinica: Partial<ClinicaMetaBitacora> | undefined,
  contexto?: { fechaSesion?: string; numeroSesion?: string; cedulaProfesional?: string }
): ClinicaMetaBitacora => ({
  fechaSesion: String(clinica?.fechaSesion || contexto?.fechaSesion || ''),
  numeroSesion: String(clinica?.numeroSesion || contexto?.numeroSesion || ''),
  cedulaProfesional: String(clinica?.cedulaProfesional || contexto?.cedulaProfesional || ''),
  codigoCie11: String(clinica?.codigoCie11 || ''),
  motivoConsulta: String(clinica?.motivoConsulta || ''),
  observacionesAvance: String(clinica?.observacionesAvance || ''),
  proximaCitaFecha: String(clinica?.proximaCitaFecha || ''),
  planSeguimiento: String(clinica?.planSeguimiento || ''),
  consentimientoVigente: Boolean(clinica?.consentimientoVigente),
  riesgoAutolesivo: {
    nivel: (['Sin riesgo', 'Ideación pasiva', 'Ideación activa', 'Plan', 'Intento'] as const).includes(clinica?.riesgoAutolesivo?.nivel as NivelRiesgoAutolesivo)
      ? (clinica?.riesgoAutolesivo?.nivel as NivelRiesgoAutolesivo)
      : '',
    planSeguridad: String(clinica?.riesgoAutolesivo?.planSeguridad || ''),
    notificadoFamiliar: Boolean(clinica?.riesgoAutolesivo?.notificadoFamiliar),
    protocoloCrisis: Boolean(clinica?.riesgoAutolesivo?.protocoloCrisis),
  },
  fueraHorario: {
    quienRealizoContacto: (['Paciente', 'Familiar', 'Tutor', 'Otro'] as const).includes(clinica?.fueraHorario?.quienRealizoContacto as QuienRealizoContacto)
      ? (clinica?.fueraHorario?.quienRealizoContacto as QuienRealizoContacto)
      : '',
    accionTomada: String(clinica?.fueraHorario?.accionTomada || ''),
    protocoloCrisis: Boolean(clinica?.fueraHorario?.protocoloCrisis),
  },
});

const normalizarEntrada = (entrada: HistorialClinico): BitacoraEntrada => {
  const parsed = parseObservaciones(entrada.observaciones);
  return {
    ...entrada,
    observacionesLimpias: parsed.observacionesLimpias,
    casoEspecial: parsed.casoEspecial,
    comentarioFelicitacion: parsed.comentarioFelicitacion,
    clinica: parsed.clinica,
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
  const [nuevaFelicitacion, setNuevaFelicitacion] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [tiposCaso, setTiposCaso] = useState<CasoEspecialTipo[]>([]);
  const [severidadCaso, setSeveridadCaso] = useState<SeveridadCaso>('Media');
  const [estadoCaso, setEstadoCaso] = useState<EstadoCaso>('Abierto');
  const [detalleCaso, setDetalleCaso] = useState(normalizarDetalleCaso(undefined));

  const [editarEntrada, setEditarEntrada] = useState<BitacoraEntrada | null>(null);
  const [notaEditar, setNotaEditar] = useState('');
  const [felicitacionEditar, setFelicitacionEditar] = useState('');
  const [clinicaEditar, setClinicaEditar] = useState<ClinicaMetaBitacora>(normalizarClinicaMeta(undefined));
  const [diagnosticoEditar, setDiagnosticoEditar] = useState('');
  const [tratamientoEditar, setTratamientoEditar] = useState('');
  const [tiposCasoEditar, setTiposCasoEditar] = useState<CasoEspecialTipo[]>([]);
  const [severidadCasoEditar, setSeveridadCasoEditar] = useState<SeveridadCaso>('Media');
  const [estadoCasoEditar, setEstadoCasoEditar] = useState<EstadoCaso>('Abierto');
  const [detalleCasoEditar, setDetalleCasoEditar] = useState(normalizarDetalleCaso(undefined));

  const [filtroCasoEspecial, setFiltroCasoEspecial] = useState<'todos' | 'solo'>('todos');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | CasoEspecialTipo>('todos');
  const [filtroSeveridad, setFiltroSeveridad] = useState<'todas' | SeveridadCaso>('todas');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoCaso>('todos');

  const [mostrarExito, setMostrarExito] = useState(false);
  const ultimaAlertaUrgenciaRef = useRef('');

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

  const resumenCasosEspeciales = useMemo(() => {
    const entradasEspeciales = entradas.filter((entrada) => Boolean(entrada.casoEspecial));
    const urgentesAbiertos = entradasEspeciales.filter((entrada) =>
      entrada.casoEspecial?.tipos.includes('urgencia') && entrada.casoEspecial?.estado !== 'Cerrado'
    ).length;

    const porSeveridad = SEVERIDAD_OPCIONES.reduce((acc, severidad) => {
      acc[severidad] = entradasEspeciales.filter((entrada) => entrada.casoEspecial?.severidad === severidad).length;
      return acc;
    }, {} as Record<SeveridadCaso, number>);

    return {
      totalEspeciales: entradasEspeciales.length,
      urgentesAbiertos,
      porSeveridad,
    };
  }, [entradas]);

  useEffect(() => {
    if (!pacienteSeleccionado) return;
    const cantidadUrgente = resumenCasosEspeciales.urgentesAbiertos;
    if (cantidadUrgente <= 0) return;

    const claveAlerta = `${pacienteSeleccionado.pacienteid}:${cantidadUrgente}`;
    if (ultimaAlertaUrgenciaRef.current === claveAlerta) {
      return;
    }

    ultimaAlertaUrgenciaRef.current = claveAlerta;
    toast.warning('Hay casos de urgencia abiertos', {
      description: `${cantidadUrgente} caso(s) requieren seguimiento prioritario.`,
    });
  }, [pacienteSeleccionado, resumenCasosEspeciales.urgentesAbiertos]);

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

    if (tiposCaso.includes('urgencia') && (!detalleCaso.accionInmediata.trim() || !detalleCaso.planSeguimiento24h.trim())) {
      toast.error('Para urgencia, captura acción inmediata y plan de seguimiento 24h.');
      return;
    }

    if (tiposCaso.includes('familiar') && !detalleCaso.relacionFamiliar.trim()) {
      toast.error('Para caso familiar, indica la relación del familiar o red de apoyo.');
      return;
    }

    if (tiposCaso.includes('familiar') && detalleCaso.relacionFamiliar === 'Otro' && !detalleCaso.relacionFamiliarOtro.trim()) {
      toast.error('Si seleccionas "Otro", especifica la relación.');
      return;
    }

    if (tiposCaso.includes('fuera_horario') && (!detalleCaso.horaFueraHorario.trim() || !detalleCaso.motivoFueraHorario.trim())) {
      toast.error('Para fuera de horario, indica hora y motivo del contacto.');
      return;
    }

    const metaCaso = tiposCaso.length > 0
      ? {
          tipos: tiposCaso,
          severidad: severidadCaso,
          estado: estadoCaso,
          detalle: normalizarDetalleCaso(detalleCaso),
        }
      : null;

    try {
      const response = await apiFetch(API_ENDPOINTS.HISTORIAL_CLINICO, {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: pacienteSeleccionado.pacienteid,
          observaciones: buildObservacionesPayload(nuevaNota, metaCaso, nuevaFelicitacion),
          diagnostico,
          tratamiento,
        }),
      });
      if (!response.ok) throw new Error('Error al guardar la nota');
      const nuevaEntrada = normalizarEntrada(await response.json());
      setEntradas([nuevaEntrada, ...entradas]);
      toast.success('Entrada de bitácora guardada exitosamente');
      setNuevaNota('');
      setNuevaFelicitacion('');
      setDiagnostico('');
      setTratamiento('');
      setTiposCaso([]);
      setSeveridadCaso('Media');
      setEstadoCaso('Abierto');
      setDetalleCaso(normalizarDetalleCaso(undefined));
      setEditando(false);
      setMostrarExito(true);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAbrirEditar = (entrada: BitacoraEntrada) => {
    setEditarEntrada(entrada);
    setNotaEditar(entrada.observacionesLimpias ?? '');
    setFelicitacionEditar(entrada.comentarioFelicitacion ?? '');
    setClinicaEditar(
      normalizarClinicaMeta(entrada.clinica || undefined, {
        fechaSesion: formatearFechaHoraLocalInput(entrada.fechaentrada),
        numeroSesion: generarFolioClinico(entrada.historialid),
        cedulaProfesional: obtenerCedulaProfesionalSesion(),
      })
    );
    setDiagnosticoEditar(entrada.diagnostico ?? '');
    setTratamientoEditar(entrada.tratamiento ?? '');
    setTiposCasoEditar(entrada.casoEspecial?.tipos || []);
    setSeveridadCasoEditar(entrada.casoEspecial?.severidad || 'Media');
    setEstadoCasoEditar(entrada.casoEspecial?.estado || 'Abierto');
    setDetalleCasoEditar(normalizarDetalleCaso(entrada.casoEspecial?.detalle));
  };

  const handleGuardarEdicion = async () => {
    if (!notaEditar || !diagnosticoEditar || !tratamientoEditar || !editarEntrada) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    const clinicaNormalizada = normalizarClinicaMeta(clinicaEditar, {
      fechaSesion: clinicaEditar.fechaSesion || formatearFechaHoraLocalInput(editarEntrada.fechaentrada),
      numeroSesion: clinicaEditar.numeroSesion || generarFolioClinico(editarEntrada.historialid),
      cedulaProfesional: clinicaEditar.cedulaProfesional || obtenerCedulaProfesionalSesion(),
    });

    if (!clinicaNormalizada.fechaSesion || !clinicaNormalizada.numeroSesion || !clinicaNormalizada.cedulaProfesional || !clinicaNormalizada.motivoConsulta || !clinicaNormalizada.proximaCitaFecha || !clinicaNormalizada.planSeguimiento || !clinicaNormalizada.consentimientoVigente) {
      toast.error('Completa los campos clínicos obligatorios del expediente.');
      return;
    }

    if (!clinicaNormalizada.codigoCie11 || !CIE11_PATTERN.test(clinicaNormalizada.codigoCie11)) {
      toast.error('El código CIE-11 tiene un formato inválido.');
      return;
    }

    if (tiposCasoEditar.includes('urgencia') && (!detalleCasoEditar.accionInmediata.trim() || !detalleCasoEditar.planSeguimiento24h.trim())) {
      toast.error('Para urgencia, captura acción inmediata y plan de seguimiento 24h.');
      return;
    }

    if (tiposCasoEditar.includes('riesgo_autolesivo')) {
      if (!clinicaNormalizada.riesgoAutolesivo.nivel || !clinicaNormalizada.riesgoAutolesivo.planSeguridad.trim()) {
        toast.error('Para riesgo autolesivo, selecciona el nivel de riesgo y define el plan de seguridad.');
        return;
      }
    }

    if (tiposCasoEditar.includes('familiar') && !detalleCasoEditar.relacionFamiliar.trim()) {
      toast.error('Para caso familiar, indica la relación del familiar o red de apoyo.');
      return;
    }

    if (tiposCasoEditar.includes('familiar') && detalleCasoEditar.relacionFamiliar === 'Otro' && !detalleCasoEditar.relacionFamiliarOtro.trim()) {
      toast.error('Si seleccionas "Otro", especifica la relación.');
      return;
    }

    if (tiposCasoEditar.includes('fuera_horario') && (!detalleCasoEditar.horaFueraHorario.trim() || !detalleCasoEditar.motivoFueraHorario.trim())) {
      toast.error('Para fuera de horario, indica hora y motivo del contacto.');
      return;
    }

    if (tiposCasoEditar.includes('fuera_horario') && (!clinicaNormalizada.fueraHorario.quienRealizoContacto || !clinicaNormalizada.fueraHorario.accionTomada.trim())) {
      toast.error('Para fuera de horario, indica quién realizó el contacto y la acción tomada.');
      return;
    }

    const metaCasoEditar = tiposCasoEditar.length > 0
      ? {
          tipos: tiposCasoEditar,
          severidad: severidadCasoEditar,
          estado: estadoCasoEditar,
          detalle: normalizarDetalleCaso(detalleCasoEditar),
        }
      : null;

    try {
      const response = await apiFetch(
        `${API_ENDPOINTS.HISTORIAL_CLINICO}/${editarEntrada.historialid}`,
        {
          method: 'PUT',
          body: JSON.stringify({
            observaciones: buildObservacionesPayload(notaEditar, metaCasoEditar, felicitacionEditar, clinicaNormalizada),
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

              <FrecuenciaRecomendadaCitas
                modo="psicologo"
                pacienteId={pacienteSeleccionado.pacienteid}
              />

              {/* Historial de entradas */}
              <div className="space-y-4">
                <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 sm:pr-2 pb-2">
                  <div className="space-y-3 rounded-lg border border-slate-700 bg-slate-900/40 p-3">
                    <p className="text-sm text-slate-200">Datos clínicos obligatorios</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="fecha-sesion-editar" className="text-slate-200">
                          Fecha y hora de la sesión
                        </Label>
                        <Input
                          id="fecha-sesion-editar"
                          type="datetime-local"
                          value={clinicaEditar.fechaSesion}
                          onChange={(e) => setClinicaEditar((prev) => ({ ...prev, fechaSesion: e.target.value }))}
                          className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="folio-sesion-editar" className="text-slate-200">
                          Número de sesión / folio
                        </Label>
                        <Input
                          id="folio-sesion-editar"
                          value={clinicaEditar.numeroSesion}
                          onChange={(e) => setClinicaEditar((prev) => ({ ...prev, numeroSesion: e.target.value }))}
                          className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cedula-profesional-editar" className="text-slate-200">
                          Número de cédula profesional del terapeuta
                        </Label>
                        <Input
                          id="cedula-profesional-editar"
                          value={clinicaEditar.cedulaProfesional}
                          onChange={(e) => setClinicaEditar((prev) => ({ ...prev, cedulaProfesional: e.target.value }))}
                          className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="codigo-cie11-editar" className="text-slate-200">
                          Código CIE-11
                        </Label>
                        <Input
                          id="codigo-cie11-editar"
                          value={clinicaEditar.codigoCie11}
                          onChange={(e) => setClinicaEditar((prev) => ({ ...prev, codigoCie11: e.target.value.toUpperCase() }))}
                          placeholder="Ej. 6A70 o F32.1"
                          className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                          required
                        />
                        <p className="text-xs text-slate-400">Formato alfanumérico con punto opcional.</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="motivo-consulta-editar" className="text-slate-200">
                        Motivo de consulta de la sesión actual
                      </Label>
                      <Textarea
                        id="motivo-consulta-editar"
                        value={clinicaEditar.motivoConsulta}
                        onChange={(e) => setClinicaEditar((prev) => ({ ...prev, motivoConsulta: e.target.value }))}
                        rows={3}
                        className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                        placeholder="Describe el motivo clínico de la sesión actual"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="proxima-cita-fecha-editar" className="text-slate-200">
                          Próxima cita
                        </Label>
                        <Input
                          id="proxima-cita-fecha-editar"
                          type="date"
                          value={clinicaEditar.proximaCitaFecha}
                          onChange={(e) => setClinicaEditar((prev) => ({ ...prev, proximaCitaFecha: e.target.value }))}
                          className="h-11 bg-slate-700 border-slate-600 text-slate-100 leading-normal"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="plan-seguimiento-editar" className="text-slate-200">
                          Próxima cita o plan de seguimiento
                        </Label>
                        <Textarea
                          id="plan-seguimiento-editar"
                          value={clinicaEditar.planSeguimiento}
                          onChange={(e) => setClinicaEditar((prev) => ({ ...prev, planSeguimiento: e.target.value }))}
                          rows={3}
                          className="bg-slate-700 border-slate-600 text-slate-100 placeholder:text-slate-500"
                          placeholder="Indica la conducta terapéutica o plan de seguimiento"
                        />
                      </div>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-slate-700 bg-slate-900/60 p-3">
                      <input
                        id="consentimiento-vigente-editar"
                        type="checkbox"
                        checked={clinicaEditar.consentimientoVigente}
                        onChange={(e) => setClinicaEditar((prev) => ({ ...prev, consentimientoVigente: e.target.checked }))}
                        className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
                        required
                      />
                      <Label htmlFor="consentimiento-vigente-editar" className="text-slate-200 leading-5">
                        Confirmo que el paciente tiene consentimiento informado vigente y firmado
                      </Label>
                    </div>
                  </div>

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

                  <div className="space-y-2">
                    <Label htmlFor="avance-terapeutico-editar" className="text-slate-200">
                      Observaciones de avance terapéutico (opcional)
                    </Label>
                    <Textarea
                      id="avance-terapeutico-editar"
                      value={felicitacionEditar}
                      onChange={(e) => setFelicitacionEditar(e.target.value)}
                      placeholder="Ej. Excelente avance esta semana, sigue asi."
                      rows={3}
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
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                className={severidadCasoEditar === nivel ? claseSeveridadActiva(nivel) : claseInactivaSegmento}
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
                                className={estadoCasoEditar === estado ? claseEstadoActiva(estado) : claseInactivaSegmento}
                              >
                                {estado}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <AnimatePresence initial={false}>
                      {tiposCasoEditar.includes('riesgo_autolesivo') && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3 rounded-lg border border-rose-700/40 bg-rose-900/10 p-3"
                        >
                          <p className="text-sm font-medium text-rose-200">Riesgo autolesivo</p>
                          <div className="space-y-2">
                            <Label className="text-rose-100">Nivel de riesgo</Label>
                            <Select
                              value={clinicaEditar.riesgoAutolesivo.nivel}
                              onValueChange={(value) =>
                                setClinicaEditar((prev) => ({
                                  ...prev,
                                  riesgoAutolesivo: {
                                    ...prev.riesgoAutolesivo,
                                    nivel: value as NivelRiesgoAutolesivo,
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                                <SelectValue placeholder="Selecciona un nivel" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Sin riesgo', 'Ideación pasiva', 'Ideación activa', 'Plan', 'Intento'].map((nivel) => (
                                  <SelectItem key={nivel} value={nivel}>
                                    {nivel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-rose-100">Plan de seguridad aplicado</Label>
                            <Textarea
                              value={clinicaEditar.riesgoAutolesivo.planSeguridad}
                              onChange={(e) =>
                                setClinicaEditar((prev) => ({
                                  ...prev,
                                  riesgoAutolesivo: {
                                    ...prev.riesgoAutolesivo,
                                    planSeguridad: e.target.value,
                                  },
                                }))
                              }
                              rows={3}
                              className="bg-slate-700 border-slate-600 text-slate-100"
                            />
                          </div>

                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            <label className="flex items-start gap-2 text-slate-100">
                              <input
                                type="checkbox"
                                checked={clinicaEditar.riesgoAutolesivo.notificadoFamiliar}
                                onChange={(e) =>
                                  setClinicaEditar((prev) => ({
                                    ...prev,
                                    riesgoAutolesivo: {
                                      ...prev.riesgoAutolesivo,
                                      notificadoFamiliar: e.target.checked,
                                    },
                                  }))
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
                              />
                              <span>¿Se notificó a familiar o tutor?</span>
                            </label>
                            <label className="flex items-start gap-2 text-slate-100">
                              <input
                                type="checkbox"
                                checked={clinicaEditar.riesgoAutolesivo.protocoloCrisis}
                                onChange={(e) =>
                                  setClinicaEditar((prev) => ({
                                    ...prev,
                                    riesgoAutolesivo: {
                                      ...prev.riesgoAutolesivo,
                                      protocoloCrisis: e.target.checked,
                                    },
                                  }))
                                }
                                className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
                              />
                              <span>¿Se activó protocolo de crisis?</span>
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence initial={false}>
                      {tiposCasoEditar.includes('fuera_horario') && (
                        <motion.div
                          initial={{ opacity: 0, y: -8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-3 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3"
                        >
                          <p className="text-sm font-medium text-amber-200">Fuera de horario</p>
                          <div className="space-y-2">
                            <Label className="text-amber-100">¿Quién realizó el contacto?</Label>
                            <Select
                              value={clinicaEditar.fueraHorario.quienRealizoContacto}
                              onValueChange={(value) =>
                                setClinicaEditar((prev) => ({
                                  ...prev,
                                  fueraHorario: {
                                    ...prev.fueraHorario,
                                    quienRealizoContacto: value as QuienRealizoContacto,
                                  },
                                }))
                              }
                            >
                              <SelectTrigger className="border-slate-600 bg-slate-700 text-slate-100">
                                <SelectValue placeholder="Selecciona una opción" />
                              </SelectTrigger>
                              <SelectContent>
                                {['Paciente', 'Familiar', 'Tutor', 'Otro'].map((valor) => (
                                  <SelectItem key={valor} value={valor}>
                                    {valor}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-amber-100">Acción tomada</Label>
                            <Textarea
                              value={clinicaEditar.fueraHorario.accionTomada}
                              onChange={(e) =>
                                setClinicaEditar((prev) => ({
                                  ...prev,
                                  fueraHorario: {
                                    ...prev.fueraHorario,
                                    accionTomada: e.target.value,
                                  },
                                }))
                              }
                              rows={3}
                              className="bg-slate-700 border-slate-600 text-slate-100"
                            />
                          </div>

                          <label className="flex items-start gap-2 text-slate-100">
                            <input
                              type="checkbox"
                              checked={clinicaEditar.fueraHorario.protocoloCrisis}
                              onChange={(e) =>
                                setClinicaEditar((prev) => ({
                                  ...prev,
                                  fueraHorario: {
                                    ...prev.fueraHorario,
                                    protocoloCrisis: e.target.checked,
                                  },
                                }))
                              }
                              className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-teal-600 focus:ring-teal-500"
                            />
                            <span>¿Se activó protocolo de crisis?</span>
                          </label>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h4 className="text-slate-200 mb-2">Notas de la Sesión</h4>
                        <p className="text-slate-300 whitespace-pre-wrap">{entrada.observacionesLimpias}</p>

                        {entrada.comentarioFelicitacion && (
                          <div className="mt-4 rounded-lg border border-emerald-600/40 bg-emerald-900/10 p-3">
                            <p className="text-xs uppercase tracking-wide text-emerald-300 mb-1">Observaciones de avance terapéutico</p>
                            <p className="text-sm text-emerald-100 whitespace-pre-wrap">{entrada.comentarioFelicitacion}</p>
                          </div>
                        )}

                        {entrada.casoEspecial?.detalle && (
                          <div className="mt-4 rounded-lg border border-slate-700 bg-slate-900/40 p-3 space-y-2">
                            <p className="text-xs uppercase tracking-wide text-slate-400">Detalle de caso especial</p>
                            {entrada.casoEspecial.detalle.accionInmediata ? (
                              <p className="text-sm text-slate-300"><span className="text-slate-400">Acción inmediata:</span> {entrada.casoEspecial.detalle.accionInmediata}</p>
                            ) : null}
                            {entrada.casoEspecial.detalle.planSeguimiento24h ? (
                              <p className="text-sm text-slate-300"><span className="text-slate-400">Plan 24h:</span> {entrada.casoEspecial.detalle.planSeguimiento24h}</p>
                            ) : null}
                            {entrada.casoEspecial.detalle.relacionFamiliar ? (
                              <p className="text-sm text-slate-300"><span className="text-slate-400">Relación familiar:</span> {entrada.casoEspecial.detalle.relacionFamiliar === 'Otro' && entrada.casoEspecial.detalle.relacionFamiliarOtro ? `Otro (${entrada.casoEspecial.detalle.relacionFamiliarOtro})` : entrada.casoEspecial.detalle.relacionFamiliar}</p>
                            ) : null}
                            {entrada.casoEspecial.detalle.consentimientoFamiliar ? (
                              <p className="text-sm text-slate-300"><span className="text-slate-400">Consentimiento familiar:</span> {entrada.casoEspecial.detalle.consentimientoFamiliar}</p>
                            ) : null}
                            {entrada.casoEspecial.detalle.horaFueraHorario ? (
                              <p className="text-sm text-slate-300"><span className="text-slate-400">Hora fuera de horario:</span> {entrada.casoEspecial.detalle.horaFueraHorario}</p>
                            ) : null}
                            {entrada.casoEspecial.detalle.motivoFueraHorario ? (
                              <p className="text-sm text-slate-300"><span className="text-slate-400">Motivo fuera de horario:</span> {entrada.casoEspecial.detalle.motivoFueraHorario}</p>
                            ) : null}
                          </div>
                        )}
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
        <DialogContent
          className="w-[56rem] max-w-[95vw] h-[92dvh] sm:h-[42rem] max-h-[92dvh] bg-slate-800 border-slate-700 overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <DialogTitle className="text-slate-100">Nueva Entrada de Bitácora</DialogTitle>
            <DialogDescription className="text-slate-400">
              Registra las observaciones de la sesión actual
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1 sm:pr-2 pb-2">
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
            <div className="space-y-2">
              <Label htmlFor="felicitacion" className="text-slate-200">
                Observaciones de avance terapéutico (opcional)
              </Label>
              <Textarea
                id="felicitacion"
                value={nuevaFelicitacion}
                onChange={(e) => setNuevaFelicitacion(e.target.value)}
                placeholder="Ej. Excelente avance esta semana, sigue asi."
                rows={3}
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
                          className={severidadCaso === nivel ? claseSeveridadActiva(nivel) : claseInactivaSegmento}
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
                          className={estadoCaso === estado ? claseEstadoActiva(estado) : claseInactivaSegmento}
                        >
                          {estado}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {tiposCaso.includes('urgencia') && (
                <div className="space-y-2 rounded-lg border border-rose-700/40 bg-rose-900/10 p-3">
                  <Label className="text-rose-200">Acción inmediata (urgencia)</Label>
                  <Textarea
                    value={detalleCaso.accionInmediata}
                    onChange={(e) => setDetalleCaso((prev) => ({ ...prev, accionInmediata: e.target.value }))}
                    rows={2}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                  <Label className="text-rose-200">Plan de seguimiento 24h</Label>
                  <Textarea
                    value={detalleCaso.planSeguimiento24h}
                    onChange={(e) => setDetalleCaso((prev) => ({ ...prev, planSeguimiento24h: e.target.value }))}
                    rows={2}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              )}

              {tiposCaso.includes('familiar') && (
                <div className="space-y-2 rounded-lg border border-violet-700/40 bg-violet-900/10 p-3">
                  <Label className="text-violet-200">Relación del familiar o red de apoyo</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {RELACION_FAMILIAR_OPCIONES.map((valor) => (
                      <Button
                        key={`relacion-${valor}`}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDetalleCaso((prev) => ({ ...prev, relacionFamiliar: valor }))}
                        className={detalleCaso.relacionFamiliar === valor
                          ? 'bg-violet-600 text-white border-transparent'
                          : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                      >
                        {valor}
                      </Button>
                    ))}
                  </div>

                  {detalleCaso.relacionFamiliar === 'Otro' && (
                    <Input
                      value={detalleCaso.relacionFamiliarOtro}
                      onChange={(e) => setDetalleCaso((prev) => ({ ...prev, relacionFamiliarOtro: e.target.value }))}
                      placeholder="Especifica la relación"
                      className="h-11 bg-slate-700 border-slate-600 text-slate-100"
                    />
                  )}

                  <Label className="text-violet-200">Consentimiento informado</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Si', 'No'] as const).map((valor) => (
                      <Button
                        key={`consent-${valor}`}
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setDetalleCaso((prev) => ({ ...prev, consentimientoFamiliar: valor }))}
                        className={detalleCaso.consentimientoFamiliar === valor
                          ? 'bg-violet-600 text-white border-transparent'
                          : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                      >
                        {valor}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {tiposCaso.includes('fuera_horario') && (
                <div className="space-y-2 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3">
                  <Label className="text-amber-200">Hora del contacto fuera de horario</Label>
                  <Input
                    value={detalleCaso.horaFueraHorario}
                    onChange={(e) => setDetalleCaso((prev) => ({ ...prev, horaFueraHorario: e.target.value }))}
                    placeholder="Ej. 22:30"
                    className="h-11 bg-slate-700 border-slate-600 text-slate-100"
                  />
                  <Label className="text-amber-200">Motivo fuera de horario</Label>
                  <Textarea
                    value={detalleCaso.motivoFueraHorario}
                    onChange={(e) => setDetalleCaso((prev) => ({ ...prev, motivoFueraHorario: e.target.value }))}
                    rows={2}
                    className="bg-slate-700 border-slate-600 text-slate-100"
                  />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 shrink-0">
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
      <AnimatePresence>
        {editarEntrada !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="editar-bitacora-title"
            aria-describedby="editar-bitacora-description"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-3 sm:p-6"
            onClick={() => setEditarEntrada(null)}
          >
            <motion.div
              initial={{ scale: 0.98, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.98, opacity: 0, y: 12 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              onClick={(e) => e.stopPropagation()}
              className="flex w-full max-w-[56rem] max-h-[calc(100dvh-1.5rem)] overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
            >
              <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
                <div className="flex-shrink-0 space-y-2">
                  <h2 id="editar-bitacora-title" className="text-lg font-semibold text-slate-100">
                    Editar Bitácora del Paciente
                  </h2>
                  <p id="editar-bitacora-description" className="text-sm text-slate-400">
                    Actualiza las observaciones de la sesión
                  </p>
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1 sm:pr-2 pb-2">
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

                  <div className="space-y-2">
                    <Label htmlFor="felicitacion-editar" className="text-slate-200">
                      Observaciones de avance terapéutico (opcional)
                    </Label>
                    <Textarea
                      id="felicitacion-editar"
                      value={felicitacionEditar}
                      onChange={(e) => setFelicitacionEditar(e.target.value)}
                      placeholder="Ej. Excelente avance esta semana, sigue asi."
                      rows={3}
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
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                                className={severidadCasoEditar === nivel ? claseSeveridadActiva(nivel) : claseInactivaSegmento}
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
                                className={estadoCasoEditar === estado ? claseEstadoActiva(estado) : claseInactivaSegmento}
                              >
                                {estado}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {tiposCasoEditar.includes('urgencia') && (
                      <div className="space-y-2 rounded-lg border border-rose-700/40 bg-rose-900/10 p-3">
                        <Label className="text-rose-200">Acción inmediata (urgencia)</Label>
                        <Textarea
                          value={detalleCasoEditar.accionInmediata}
                          onChange={(e) => setDetalleCasoEditar((prev) => ({ ...prev, accionInmediata: e.target.value }))}
                          rows={2}
                          className="bg-slate-700 border-slate-600 text-slate-100"
                        />
                        <Label className="text-rose-200">Plan de seguimiento 24h</Label>
                        <Textarea
                          value={detalleCasoEditar.planSeguimiento24h}
                          onChange={(e) => setDetalleCasoEditar((prev) => ({ ...prev, planSeguimiento24h: e.target.value }))}
                          rows={2}
                          className="bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    )}

                    {tiposCasoEditar.includes('familiar') && (
                      <div className="space-y-2 rounded-lg border border-violet-700/40 bg-violet-900/10 p-3">
                        <Label className="text-violet-200">Relación del familiar o red de apoyo</Label>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          {RELACION_FAMILIAR_OPCIONES.map((valor) => (
                            <Button
                              key={`relacion-edit-${valor}`}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setDetalleCasoEditar((prev) => ({ ...prev, relacionFamiliar: valor }))}
                              className={detalleCasoEditar.relacionFamiliar === valor
                                ? 'bg-violet-600 text-white border-transparent'
                                : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                            >
                              {valor}
                            </Button>
                          ))}
                        </div>

                        {detalleCasoEditar.relacionFamiliar === 'Otro' && (
                          <Input
                            value={detalleCasoEditar.relacionFamiliarOtro}
                            onChange={(e) => setDetalleCasoEditar((prev) => ({ ...prev, relacionFamiliarOtro: e.target.value }))}
                            placeholder="Especifica la relación"
                            className="h-11 bg-slate-700 border-slate-600 text-slate-100"
                          />
                        )}

                        <Label className="text-violet-200">Consentimiento informado</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Si', 'No'] as const).map((valor) => (
                            <Button
                              key={`consent-edit-${valor}`}
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => setDetalleCasoEditar((prev) => ({ ...prev, consentimientoFamiliar: valor }))}
                              className={detalleCasoEditar.consentimientoFamiliar === valor
                                ? 'bg-violet-600 text-white border-transparent'
                                : 'border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700'}
                            >
                              {valor}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {tiposCasoEditar.includes('fuera_horario') && (
                      <div className="space-y-2 rounded-lg border border-amber-700/40 bg-amber-900/10 p-3">
                        <Label className="text-amber-200">Hora del contacto fuera de horario</Label>
                        <Input
                          value={detalleCasoEditar.horaFueraHorario}
                          onChange={(e) => setDetalleCasoEditar((prev) => ({ ...prev, horaFueraHorario: e.target.value }))}
                          placeholder="Ej. 22:30"
                          className="h-11 bg-slate-700 border-slate-600 text-slate-100"
                        />
                        <Label className="text-amber-200">Motivo fuera de horario</Label>
                        <Textarea
                          value={detalleCasoEditar.motivoFueraHorario}
                          onChange={(e) => setDetalleCasoEditar((prev) => ({ ...prev, motivoFueraHorario: e.target.value }))}
                          rows={2}
                          className="bg-slate-700 border-slate-600 text-slate-100"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex-shrink-0 flex-col gap-2 sm:flex sm:flex-row sm:justify-end">
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
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
