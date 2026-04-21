const db = require('../db');
const {
  isZoomIntegrationEnabled,
  crearReunionZoom,
  actualizarReunionZoom,
  obtenerReunionZoom,
  cancelarReunionZoom,
} = require('./zoomService');
const { isEmailIntegrationEnabled, enviarCorreo } = require('./mailService');

const APP_TIMEZONE = String(process.env.APP_TIMEZONE || 'America/Mexico_City').trim();

const normalizarTexto = (value) => {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
};

const esModalidadEnLinea = (modalidad) => {
  const normalized = normalizarTexto(modalidad);
  return normalized === 'en linea' || normalized === 'enlinea' || normalized === 'virtual' || normalized.includes('linea');
};

const esEstadoConfirmada = (estado) => {
  const normalized = normalizarTexto(estado);
  return normalized === 'confirmada';
};

const esEstadoCancelada = (estado) => {
  const normalized = normalizarTexto(estado);
  return normalized === 'cancelada' || normalized === 'cancelado';
};

const escapeHtml = (value) => {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const obtenerNombreCompleto = (nombre, apellido) => {
  return `${String(nombre || '').trim()} ${String(apellido || '').trim()}`.trim();
};

const formatearFechaHora = (fecha) => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return 'fecha no disponible';
  }

  return date.toLocaleString('es-MX', {
    timeZone: APP_TIMEZONE,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const obtenerCitaVirtual = async (citaId) => {
  const result = await db.query(
    `
      SELECT
        citaid,
        zoom_meeting_id,
        zoom_join_url,
        zoom_start_url,
        zoom_password,
        zoom_status,
        integration_attempts,
        last_error
      FROM citas_virtuales
      WHERE citaid = $1
    `,
    [citaId]
  );

  return result.rows[0] || null;
};

const guardarEstadoCitaVirtual = async ({
  citaId,
  meetingId = null,
  joinUrl = null,
  startUrl = null,
  password = null,
  zoomStatus,
  lastError = null,
}) => {
  await db.query(
    `
      INSERT INTO citas_virtuales (
        citaid,
        zoom_meeting_id,
        zoom_join_url,
        zoom_start_url,
        zoom_password,
        zoom_status,
        integration_attempts,
        last_error,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 1, $7, NOW())
      ON CONFLICT (citaid)
      DO UPDATE SET
        zoom_meeting_id = EXCLUDED.zoom_meeting_id,
        zoom_join_url = EXCLUDED.zoom_join_url,
        zoom_start_url = EXCLUDED.zoom_start_url,
        zoom_password = EXCLUDED.zoom_password,
        zoom_status = EXCLUDED.zoom_status,
        integration_attempts = COALESCE(citas_virtuales.integration_attempts, 0) + 1,
        last_error = EXCLUDED.last_error,
        updated_at = NOW()
    `,
    [citaId, meetingId, joinUrl, startUrl, password, zoomStatus, lastError]
  );
};

const crearLogCorreo = async ({ citaId, destinatario, tipo, asunto, estado, ultimoError = null }) => {
  const result = await db.query(
    `
      INSERT INTO correos_cita (
        citaid,
        destinatario,
        tipo,
        asunto,
        estado,
        intentos,
        ultimo_error,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, 1, $6, NOW(), NOW())
      RETURNING correoid
    `,
    [citaId, destinatario, tipo, asunto, estado, ultimoError]
  );

  return result.rows[0]?.correoid;
};

const actualizarLogCorreo = async ({ correoId, estado, providerMessageId = null, ultimoError = null, enviadoEn = null }) => {
  if (!correoId) return;

  await db.query(
    `
      UPDATE correos_cita
      SET
        estado = $1,
        provider_message_id = $2,
        ultimo_error = $3,
        enviado_en = COALESCE($4, enviado_en),
        updated_at = NOW()
      WHERE correoid = $5
    `,
    [estado, providerMessageId, ultimoError, enviadoEn, correoId]
  );
};

const construirTemplatesConfirmacion = ({ contexto, joinUrl, startUrl, password, tipoEvento }) => {
  const pacienteNombre = obtenerNombreCompleto(contexto.paciente_nombre, contexto.paciente_apellido);
  const psicologaNombre = obtenerNombreCompleto(contexto.psicologa_nombre, contexto.psicologa_apellido);
  const fechaTexto = formatearFechaHora(contexto.fechahora);
  const esReagenda = tipoEvento === 'reagenda';

  const asuntoPaciente = esReagenda
    ? 'PsicoAgenda: actualizacion de acceso a tu cita en linea'
    : 'PsicoAgenda: acceso a tu cita en linea';

  const asuntoPsicologa = esReagenda
    ? 'PsicoAgenda: reunion Zoom actualizada'
    : 'PsicoAgenda: reunion Zoom creada';

  const textoPaciente = [
    `Hola ${pacienteNombre},`,
    '',
    esReagenda
      ? `Tu cita con ${psicologaNombre} fue reagendada.`
      : `Tu cita con ${psicologaNombre} fue programada.`,
    `Fecha y hora: ${fechaTexto} (${APP_TIMEZONE})`,
    `Enlace de acceso: ${joinUrl}`,
    password ? `Codigo de acceso: ${password}` : '',
    '',
    'Si no puedes asistir, por favor avisa con anticipacion desde PsicoAgenda.',
  ]
    .filter(Boolean)
    .join('\n');

  const htmlPaciente = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:16px;">
      <h2 style="margin-bottom:8px;">PsicoAgenda</h2>
      <p>Hola <strong>${escapeHtml(pacienteNombre)}</strong>,</p>
      <p>${esReagenda ? 'Tu cita fue reagendada.' : 'Tu cita fue programada.'}</p>
      <p><strong>Psicologa:</strong> ${escapeHtml(psicologaNombre)}<br/>
      <strong>Fecha y hora:</strong> ${escapeHtml(fechaTexto)} (${escapeHtml(APP_TIMEZONE)})</p>
      <p><strong>Enlace de acceso:</strong><br/>
      <a href="${escapeHtml(joinUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(joinUrl)}</a></p>
      ${password ? `<p><strong>Codigo de acceso:</strong> ${escapeHtml(password)}</p>` : ''}
      <p>Si no puedes asistir, por favor avisa con anticipacion desde PsicoAgenda.</p>
    </div>
  `;

  const textoPsicologa = [
    `Hola ${psicologaNombre},`,
    '',
    esReagenda
      ? `La reunion Zoom para la cita con ${pacienteNombre} fue actualizada.`
      : `Se creo una reunion Zoom para la cita con ${pacienteNombre}.`,
    `Fecha y hora: ${fechaTexto} (${APP_TIMEZONE})`,
    `Join URL: ${joinUrl}`,
    startUrl ? `Start URL (solo anfitrion): ${startUrl}` : '',
    password ? `Codigo de acceso: ${password}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const htmlPsicologa = `
    <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:16px;">
      <h2 style="margin-bottom:8px;">PsicoAgenda</h2>
      <p>Hola <strong>${escapeHtml(psicologaNombre)}</strong>,</p>
      <p>${esReagenda
        ? `La reunion Zoom para la cita con ${escapeHtml(pacienteNombre)} fue actualizada.`
        : `Se creo una reunion Zoom para la cita con ${escapeHtml(pacienteNombre)}.`}</p>
      <p><strong>Fecha y hora:</strong> ${escapeHtml(fechaTexto)} (${escapeHtml(APP_TIMEZONE)})</p>
      <p><strong>Join URL:</strong><br/>
      <a href="${escapeHtml(joinUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(joinUrl)}</a></p>
      ${startUrl ? `<p><strong>Start URL (solo anfitrion):</strong><br/><a href="${escapeHtml(startUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(startUrl)}</a></p>` : ''}
      ${password ? `<p><strong>Codigo de acceso:</strong> ${escapeHtml(password)}</p>` : ''}
    </div>
  `;

  return {
    paciente: {
      asunto: asuntoPaciente,
      texto: textoPaciente,
      html: htmlPaciente,
    },
    psicologa: {
      asunto: asuntoPsicologa,
      texto: textoPsicologa,
      html: htmlPsicologa,
    },
  };
};

const construirTemplateCancelacion = ({ contexto }) => {
  const pacienteNombre = obtenerNombreCompleto(contexto.paciente_nombre, contexto.paciente_apellido);
  const psicologaNombre = obtenerNombreCompleto(contexto.psicologa_nombre, contexto.psicologa_apellido);
  const fechaTexto = formatearFechaHora(contexto.fechahora);

  const asunto = 'PsicoAgenda: cita en linea cancelada';

  return {
    paciente: {
      asunto,
      texto: [
        `Hola ${pacienteNombre},`,
        '',
        `La cita en linea con ${psicologaNombre} del ${fechaTexto} fue cancelada.`,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:16px;">
          <h2 style="margin-bottom:8px;">PsicoAgenda</h2>
          <p>Hola <strong>${escapeHtml(pacienteNombre)}</strong>,</p>
          <p>La cita en linea con ${escapeHtml(psicologaNombre)} del ${escapeHtml(fechaTexto)} fue cancelada.</p>
        </div>
      `,
    },
    psicologa: {
      asunto,
      texto: [
        `Hola ${psicologaNombre},`,
        '',
        `La cita en linea con ${pacienteNombre} del ${fechaTexto} fue cancelada.`,
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#0f172a;max-width:680px;margin:0 auto;padding:16px;">
          <h2 style="margin-bottom:8px;">PsicoAgenda</h2>
          <p>Hola <strong>${escapeHtml(psicologaNombre)}</strong>,</p>
          <p>La cita en linea con ${escapeHtml(pacienteNombre)} del ${escapeHtml(fechaTexto)} fue cancelada.</p>
        </div>
      `,
    },
  };
};

const enviarCorreoConBitacora = async ({ citaId, destinatario, tipo, asunto, texto, html }) => {
  let correoId = null;

  try {
    correoId = await crearLogCorreo({
      citaId,
      destinatario,
      tipo,
      asunto,
      estado: 'pendiente',
    });
  } catch (error) {
    console.error('[virtualAppointments] No se pudo registrar correo pendiente:', error.message);
  }

  try {
    const result = await enviarCorreo({
      to: destinatario,
      subject: asunto,
      text: texto,
      html,
    });

    await actualizarLogCorreo({
      correoId,
      estado: 'enviado',
      providerMessageId: result?.messageId || null,
      ultimoError: null,
      enviadoEn: new Date(),
    });
  } catch (error) {
    await actualizarLogCorreo({
      correoId,
      estado: 'error',
      providerMessageId: null,
      ultimoError: error.message,
      enviadoEn: null,
    });
    throw error;
  }
};

const construirPayloadZoom = (contexto) => {
  const pacienteNombre = obtenerNombreCompleto(contexto.paciente_nombre, contexto.paciente_apellido);
  const psicologaNombre = obtenerNombreCompleto(contexto.psicologa_nombre, contexto.psicologa_apellido);

  return {
    topic: `Sesion PsicoAgenda - ${pacienteNombre} con ${psicologaNombre}`,
    startTime: contexto.fechahora,
    durationMin: Number(contexto.duracionmin || 60),
    timezone: APP_TIMEZONE,
    agenda: `Cita ${contexto.citaid} en PsicoAgenda`,
  };
};

const sincronizarMeetingActivo = async ({ contexto, registroActual, tipoEvento }) => {
  const payload = construirPayloadZoom(contexto);

  if (!isZoomIntegrationEnabled()) {
    await guardarEstadoCitaVirtual({
      citaId: contexto.citaid,
      meetingId: registroActual?.zoom_meeting_id || null,
      joinUrl: registroActual?.zoom_join_url || null,
      startUrl: registroActual?.zoom_start_url || null,
      password: registroActual?.zoom_password || null,
      zoomStatus: 'pendiente',
      lastError: 'Integracion Zoom deshabilitada por configuracion.',
    });

    return {
      meetingId: registroActual?.zoom_meeting_id || '',
      joinUrl: registroActual?.zoom_join_url || '',
      startUrl: registroActual?.zoom_start_url || '',
      password: registroActual?.zoom_password || '',
    };
  }

  if (registroActual?.zoom_meeting_id) {
    await actualizarReunionZoom(registroActual.zoom_meeting_id, payload);

    let detalle;
    try {
      detalle = await obtenerReunionZoom(registroActual.zoom_meeting_id);
    } catch {
      detalle = {
        meetingId: registroActual.zoom_meeting_id,
        joinUrl: registroActual.zoom_join_url || '',
        startUrl: registroActual.zoom_start_url || '',
        password: registroActual.zoom_password || '',
      };
    }

    await guardarEstadoCitaVirtual({
      citaId: contexto.citaid,
      meetingId: detalle.meetingId,
      joinUrl: detalle.joinUrl,
      startUrl: detalle.startUrl,
      password: detalle.password,
      zoomStatus: tipoEvento === 'reagenda' ? 'actualizada' : 'creada',
      lastError: null,
    });

    return detalle;
  }

  const nueva = await crearReunionZoom(payload);

  await guardarEstadoCitaVirtual({
    citaId: contexto.citaid,
    meetingId: nueva.meetingId,
    joinUrl: nueva.joinUrl,
    startUrl: nueva.startUrl,
    password: nueva.password,
    zoomStatus: 'creada',
    lastError: null,
  });

  return nueva;
};

const enviarCorreosAcceso = async ({ contexto, joinUrl, startUrl, password, tipoEvento }) => {
  if (!isEmailIntegrationEnabled()) {
    return;
  }

  if (!joinUrl) {
    console.warn('[virtualAppointments] Sin joinUrl, no se enviaron correos de acceso.');
    return;
  }

  const templates = construirTemplatesConfirmacion({ contexto, joinUrl, startUrl, password, tipoEvento });
  const tipo = tipoEvento === 'reagenda' ? 'reagenda' : 'confirmacion';

  if (contexto.paciente_correo) {
    await enviarCorreoConBitacora({
      citaId: contexto.citaid,
      destinatario: contexto.paciente_correo,
      tipo,
      asunto: templates.paciente.asunto,
      texto: templates.paciente.texto,
      html: templates.paciente.html,
    });
  }

  if (contexto.psicologa_correo) {
    await enviarCorreoConBitacora({
      citaId: contexto.citaid,
      destinatario: contexto.psicologa_correo,
      tipo,
      asunto: templates.psicologa.asunto,
      texto: templates.psicologa.texto,
      html: templates.psicologa.html,
    });
  }
};

const enviarCorreosCancelacion = async ({ contexto }) => {
  if (!isEmailIntegrationEnabled()) {
    return;
  }

  const templates = construirTemplateCancelacion({ contexto });

  if (contexto.paciente_correo) {
    await enviarCorreoConBitacora({
      citaId: contexto.citaid,
      destinatario: contexto.paciente_correo,
      tipo: 'cancelacion',
      asunto: templates.paciente.asunto,
      texto: templates.paciente.texto,
      html: templates.paciente.html,
    });
  }

  if (contexto.psicologa_correo) {
    await enviarCorreoConBitacora({
      citaId: contexto.citaid,
      destinatario: contexto.psicologa_correo,
      tipo: 'cancelacion',
      asunto: templates.psicologa.asunto,
      texto: templates.psicologa.texto,
      html: templates.psicologa.html,
    });
  }
};

const sincronizarCitaVirtualCreada = async (contexto) => {
  if (!contexto || !esModalidadEnLinea(contexto.modalidad)) {
    return;
  }

  try {
    if (!esEstadoConfirmada(contexto.estado)) {
      await guardarEstadoCitaVirtual({
        citaId: contexto.citaid,
        meetingId: null,
        joinUrl: null,
        startUrl: null,
        password: null,
        zoomStatus: 'pendiente',
        lastError: null,
      });
      return;
    }

    const registroActual = await obtenerCitaVirtual(contexto.citaid);
    const reunion = await sincronizarMeetingActivo({
      contexto,
      registroActual,
      tipoEvento: 'confirmacion',
    });

    await enviarCorreosAcceso({
      contexto,
      joinUrl: reunion.joinUrl,
      startUrl: reunion.startUrl,
      password: reunion.password,
      tipoEvento: 'confirmacion',
    });
  } catch (error) {
    await guardarEstadoCitaVirtual({
      citaId: contexto.citaid,
      meetingId: null,
      joinUrl: null,
      startUrl: null,
      password: null,
      zoomStatus: 'error',
      lastError: error.message,
    });

    console.error('[virtualAppointments] Error al sincronizar cita creada:', error.message);
  }
};

const sincronizarCitaVirtualActualizada = async ({ contextoAnterior, contextoActualizado }) => {
  const modalidadAnteriorEnLinea = esModalidadEnLinea(contextoAnterior?.modalidad);
  const modalidadActualEnLinea = esModalidadEnLinea(contextoActualizado?.modalidad);
  const estadoAnterior = contextoAnterior?.estado;
  const estadoActual = contextoActualizado?.estado;

  if (!modalidadAnteriorEnLinea && !modalidadActualEnLinea) {
    return;
  }

  try {
    const contextoObjetivo = contextoActualizado || contextoAnterior;
    const registroActual = await obtenerCitaVirtual(contextoObjetivo.citaid);

    if (modalidadActualEnLinea && esEstadoCancelada(estadoActual)) {
      if (registroActual?.zoom_meeting_id && isZoomIntegrationEnabled()) {
        try {
          await cancelarReunionZoom(registroActual.zoom_meeting_id);
        } catch (errorZoom) {
          console.error('[virtualAppointments] Error al cancelar reunion por estado cancelada:', errorZoom.message);
        }
      }

      await guardarEstadoCitaVirtual({
        citaId: contextoObjetivo.citaid,
        meetingId: null,
        joinUrl: null,
        startUrl: null,
        password: null,
        zoomStatus: 'cancelada',
        lastError: null,
      });

      await enviarCorreosCancelacion({ contexto: contextoActualizado });
      return;
    }

    if (modalidadActualEnLinea && esEstadoConfirmada(estadoActual)) {
      const tipoEvento = esEstadoConfirmada(estadoAnterior) ? 'reagenda' : 'confirmacion';
      const reunion = await sincronizarMeetingActivo({
        contexto: contextoActualizado,
        registroActual,
        tipoEvento,
      });

      await enviarCorreosAcceso({
        contexto: contextoActualizado,
        joinUrl: reunion.joinUrl,
        startUrl: reunion.startUrl,
        password: reunion.password,
        tipoEvento,
      });
      return;
    }

    if (modalidadActualEnLinea && !esEstadoConfirmada(estadoActual)) {
      if (registroActual?.zoom_meeting_id && isZoomIntegrationEnabled()) {
        try {
          await cancelarReunionZoom(registroActual.zoom_meeting_id);
        } catch (errorZoom) {
          console.error('[virtualAppointments] Error al cancelar reunion por estado no confirmado:', errorZoom.message);
        }
      }

      await guardarEstadoCitaVirtual({
        citaId: contextoObjetivo.citaid,
        meetingId: null,
        joinUrl: null,
        startUrl: null,
        password: null,
        zoomStatus: 'pendiente',
        lastError: null,
      });
      return;
    }

    if (modalidadAnteriorEnLinea && registroActual?.zoom_meeting_id && isZoomIntegrationEnabled()) {
      try {
        await cancelarReunionZoom(registroActual.zoom_meeting_id);
      } catch (errorZoom) {
        console.error('[virtualAppointments] Error al cancelar reunion en cambio a presencial:', errorZoom.message);
      }
    }

    await guardarEstadoCitaVirtual({
      citaId: contextoObjetivo.citaid,
      meetingId: registroActual?.zoom_meeting_id || null,
      joinUrl: registroActual?.zoom_join_url || null,
      startUrl: registroActual?.zoom_start_url || null,
      password: registroActual?.zoom_password || null,
      zoomStatus: 'cancelada',
      lastError: null,
    });
  } catch (error) {
    await guardarEstadoCitaVirtual({
      citaId: contextoActualizado?.citaid || contextoAnterior?.citaid,
      meetingId: null,
      joinUrl: null,
      startUrl: null,
      password: null,
      zoomStatus: 'error',
      lastError: error.message,
    });

    console.error('[virtualAppointments] Error al sincronizar cita actualizada:', error.message);
  }
};

const sincronizarCitaVirtualCancelada = async (contexto) => {
  if (!contexto || !esModalidadEnLinea(contexto.modalidad)) {
    return;
  }

  try {
    const registroActual = await obtenerCitaVirtual(contexto.citaid);

    if (registroActual?.zoom_meeting_id && isZoomIntegrationEnabled()) {
      try {
        await cancelarReunionZoom(registroActual.zoom_meeting_id);
      } catch (errorZoom) {
        console.error('[virtualAppointments] Error al cancelar reunion en Zoom:', errorZoom.message);
      }
    }

    await guardarEstadoCitaVirtual({
      citaId: contexto.citaid,
      meetingId: registroActual?.zoom_meeting_id || null,
      joinUrl: registroActual?.zoom_join_url || null,
      startUrl: registroActual?.zoom_start_url || null,
      password: registroActual?.zoom_password || null,
      zoomStatus: 'cancelada',
      lastError: null,
    });

    await enviarCorreosCancelacion({ contexto });
  } catch (error) {
    await guardarEstadoCitaVirtual({
      citaId: contexto.citaid,
      meetingId: null,
      joinUrl: null,
      startUrl: null,
      password: null,
      zoomStatus: 'error',
      lastError: error.message,
    });

    console.error('[virtualAppointments] Error al sincronizar cita cancelada:', error.message);
  }
};

module.exports = {
  esModalidadEnLinea,
  sincronizarCitaVirtualCreada,
  sincronizarCitaVirtualActualizada,
  sincronizarCitaVirtualCancelada,
};
