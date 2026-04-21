const axios = require('axios');

const ZOOM_OAUTH_URL = 'https://zoom.us/oauth/token';
const ZOOM_API_BASE_URL = 'https://api.zoom.us/v2';

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'si', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return defaultValue;
};

const parsePositiveInt = (value, defaultValue) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
};

const ZOOM_HTTP_TIMEOUT_MS = parsePositiveInt(process.env.ZOOM_HTTP_TIMEOUT_MS, 12000);

const getZoomConfig = () => ({
  accountId: String(process.env.ZOOM_ACCOUNT_ID || '').trim(),
  clientId: String(process.env.ZOOM_CLIENT_ID || '').trim(),
  clientSecret: String(process.env.ZOOM_CLIENT_SECRET || '').trim(),
  userId: String(process.env.ZOOM_USER_ID || '').trim(),
});

const isZoomIntegrationEnabled = () => parseBoolean(process.env.ENABLE_ZOOM_INTEGRATION, false);

const assertZoomConfig = () => {
  const cfg = getZoomConfig();

  if (!cfg.accountId || !cfg.clientId || !cfg.clientSecret || !cfg.userId) {
    throw new Error('Configuracion de Zoom incompleta. Revisa ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET y ZOOM_USER_ID.');
  }

  return cfg;
};

const formatAxiosError = (error) => {
  if (!error) return 'Error desconocido en Zoom.';

  const status = error.response?.status;
  const zoomMessage = error.response?.data?.message;
  const genericMessage = error.message || 'Error sin detalle.';

  if (status && zoomMessage) {
    return `Zoom HTTP ${status}: ${zoomMessage}`;
  }

  if (status) {
    return `Zoom HTTP ${status}: ${genericMessage}`;
  }

  return genericMessage;
};

const obtenerTokenZoom = async () => {
  const cfg = assertZoomConfig();
  const credentials = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString('base64');

  const response = await axios.post(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(cfg.accountId)}`,
    null,
    {
      timeout: ZOOM_HTTP_TIMEOUT_MS,
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    }
  );

  const token = response.data?.access_token;
  if (!token) {
    throw new Error('Zoom no devolvio access_token.');
  }

  return token;
};

const crearClienteZoom = async () => {
  const token = await obtenerTokenZoom();

  return axios.create({
    baseURL: ZOOM_API_BASE_URL,
    timeout: ZOOM_HTTP_TIMEOUT_MS,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
};

const buildMeetingPayload = ({ topic, startTime, durationMin, timezone, agenda }) => {
  const fecha = new Date(startTime);
  if (Number.isNaN(fecha.getTime())) {
    throw new Error('Fecha de inicio invalida para Zoom.');
  }

  return {
    topic,
    type: 2,
    start_time: fecha.toISOString(),
    duration: durationMin,
    timezone,
    agenda,
    settings: {
      waiting_room: true,
      join_before_host: false,
      mute_upon_entry: true,
      host_video: true,
      participant_video: true,
      auto_recording: 'none',
      approval_type: 0,
      audio: 'both',
    },
  };
};

const crearReunionZoom = async ({ topic, startTime, durationMin = 60, timezone = 'America/Mexico_City', agenda = '' }) => {
  try {
    const cfg = assertZoomConfig();
    const client = await crearClienteZoom();
    const payload = buildMeetingPayload({ topic, startTime, durationMin, timezone, agenda });

    const response = await client.post(`/users/${encodeURIComponent(cfg.userId)}/meetings`, payload);

    return {
      meetingId: String(response.data?.id || ''),
      joinUrl: response.data?.join_url || '',
      startUrl: response.data?.start_url || '',
      password: response.data?.password || '',
      raw: response.data,
    };
  } catch (error) {
    throw new Error(formatAxiosError(error));
  }
};

const actualizarReunionZoom = async (
  meetingId,
  { topic, startTime, durationMin = 60, timezone = 'America/Mexico_City', agenda = '' }
) => {
  if (!meetingId) {
    throw new Error('meetingId es requerido para actualizar Zoom.');
  }

  try {
    const client = await crearClienteZoom();
    const payload = buildMeetingPayload({ topic, startTime, durationMin, timezone, agenda });

    await client.patch(`/meetings/${encodeURIComponent(String(meetingId))}`, payload);
    return true;
  } catch (error) {
    throw new Error(formatAxiosError(error));
  }
};

const obtenerReunionZoom = async (meetingId) => {
  if (!meetingId) {
    throw new Error('meetingId es requerido para consultar Zoom.');
  }

  try {
    const client = await crearClienteZoom();
    const response = await client.get(`/meetings/${encodeURIComponent(String(meetingId))}`);

    return {
      meetingId: String(response.data?.id || meetingId),
      joinUrl: response.data?.join_url || '',
      startUrl: response.data?.start_url || '',
      password: response.data?.password || '',
      raw: response.data,
    };
  } catch (error) {
    throw new Error(formatAxiosError(error));
  }
};

const cancelarReunionZoom = async (meetingId) => {
  if (!meetingId) {
    throw new Error('meetingId es requerido para cancelar Zoom.');
  }

  try {
    const client = await crearClienteZoom();
    await client.delete(`/meetings/${encodeURIComponent(String(meetingId))}`);
    return true;
  } catch (error) {
    throw new Error(formatAxiosError(error));
  }
};

module.exports = {
  isZoomIntegrationEnabled,
  crearReunionZoom,
  actualizarReunionZoom,
  obtenerReunionZoom,
  cancelarReunionZoom,
};
