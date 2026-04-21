const React = require('react');
const { render } = require('@react-email/render');
const {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} = require('react-email');

const {
  APP_WEB_URL,
  SUPPORT_EMAIL,
  psicoAgendaEmailTailwindConfig,
  getPublicAssetUrl,
} = require('../emails/theme');

const h = React.createElement;

const obtenerNombreCompleto = (nombre, apellido) => {
  return `${String(nombre || '').trim()} ${String(apellido || '').trim()}`.trim();
};

const formatearFechaHora = (fecha, timezone) => {
  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) {
    return 'fecha no disponible';
  }

  return date.toLocaleString('es-MX', {
    timeZone: timezone,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const limpiarTexto = (value, fallback = 'no disponible') => {
  const safeValue = String(value || '').trim();
  return safeValue || fallback;
};

function PsicoAgendaTransactionalEmail({
  preview,
  statusLabel,
  statusTone,
  title,
  greeting,
  intro,
  details,
  primaryAction,
  secondaryAction,
  recommendations,
  footerNote,
}) {
  const logoUrl = getPublicAssetUrl('favicon.png');
  const badgeClassName = statusTone === 'danger'
    ? 'inline-block rounded-full border border-ps-rose-200 bg-ps-rose-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ps-rose-700'
    : 'inline-block rounded-full border border-ps-teal-100 bg-ps-teal-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ps-teal-700';

  const actionFallbackUrl = (primaryAction && primaryAction.href) || (secondaryAction && secondaryAction.href) || APP_WEB_URL;

  return h(
    Tailwind,
    { config: psicoAgendaEmailTailwindConfig },
    h(
      Html,
      null,
      h(Head, null),
      h(Preview, null, preview),
      h(
        Body,
        { className: 'm-0 bg-ps-slate-100 px-2 py-4 font-sans text-ps-slate-900' },
        h(
          Container,
          {
            className:
              'mx-auto my-0 w-full max-w-2xl overflow-hidden rounded-2xl border border-ps-slate-200 bg-ps-white shadow-email',
          },
          h(
            Section,
            { className: 'bg-ps-slate-900 px-6 py-5' },
            h(
              Row,
              null,
              h(
                Column,
                { className: 'w-3/4 align-middle' },
                h(
                  Row,
                  null,
                  h(
                    Column,
                    { className: 'w-10 align-middle' },
                    h(Img, {
                      src: logoUrl,
                      alt: 'PsicoAgenda',
                      width: 28,
                      height: 28,
                      className: 'block rounded-md bg-ps-white p-1',
                    })
                  ),
                  h(
                    Column,
                    { className: 'align-middle' },
                    h(Text, { className: 'm-0 pl-2 text-base font-semibold text-ps-white' }, 'PsicoAgenda'),
                    h(Text, { className: 'm-0 pl-2 text-xs text-ps-slate-300' }, 'Citas virtuales seguras')
                  )
                )
              ),
              h(
                Column,
                { align: 'right', className: 'w-1/4 align-middle' },
                h(
                  Link,
                  {
                    href: `mailto:${SUPPORT_EMAIL}`,
                    className: 'text-xs text-ps-slate-300 no-underline',
                  },
                  SUPPORT_EMAIL
                )
              )
            )
          ),
          h(
            Section,
            { className: 'border-b border-ps-slate-200 bg-ps-slate-50 px-6 py-7' },
            h(Text, { className: badgeClassName }, statusLabel),
            h(Heading, { as: 'h1', className: 'm-0 mt-4 text-3xl font-semibold text-ps-slate-900' }, title),
            h(Text, { className: 'm-0 mt-4 text-base font-medium text-ps-slate-900' }, greeting),
            h(Text, { className: 'm-0 mt-3 text-sm leading-6 text-ps-slate-700' }, intro)
          ),
          h(
            Section,
            { className: 'px-6 py-6' },
            h(
              Section,
              { className: 'rounded-xl border border-ps-slate-200 bg-ps-white px-5 py-4' },
              h(
                Text,
                { className: 'm-0 mb-3 text-xs font-semibold uppercase tracking-wide text-ps-slate-500' },
                'Detalle de la cita'
              ),
              ...(details || []).map((item, index) =>
                h(
                  Text,
                  {
                    key: `detail-${index}`,
                    className: 'm-0 mb-2 text-sm leading-6 text-ps-slate-700',
                  },
                  h('strong', null, `${item.label}: `),
                  limpiarTexto(item.value)
                )
              )
            )
          ),
          h(
            Section,
            { className: 'px-6 pb-2' },
            h(
              Section,
              { className: 'rounded-xl bg-ps-slate-50 px-5 py-5 text-center' },
              primaryAction
                ? h(
                    Button,
                    {
                      href: primaryAction.href,
                      className:
                        'mb-3 inline-block rounded-lg bg-ps-teal-600 px-6 py-3 text-sm font-semibold text-ps-white',
                    },
                    primaryAction.label
                  )
                : null,
              secondaryAction
                ? h(
                    Button,
                    {
                      href: secondaryAction.href,
                      className:
                        'inline-block rounded-lg bg-ps-violet-600 px-6 py-3 text-sm font-semibold text-ps-white',
                    },
                    secondaryAction.label
                  )
                : null,
              h(
                Text,
                { className: 'm-0 mt-4 text-xs leading-5 text-ps-slate-500' },
                'Si algun boton no abre correctamente, copia y pega esta URL en tu navegador:'
              ),
              h(
                Link,
                {
                  href: actionFallbackUrl,
                  className: 'text-xs leading-5 text-ps-teal-700 underline',
                },
                actionFallbackUrl
              )
            )
          ),
          recommendations && recommendations.length > 0
            ? h(
                Section,
                { className: 'px-6 py-6' },
                h(
                  Section,
                  { className: 'rounded-xl border border-ps-slate-200 bg-ps-white px-5 py-4' },
                  h(
                    Text,
                    {
                      className: 'm-0 mb-3 text-xs font-semibold uppercase tracking-wide text-ps-slate-500',
                    },
                    'Recomendaciones'
                  ),
                  ...recommendations.map((tip, index) =>
                    h(
                      Text,
                      {
                        key: `tip-${index}`,
                        className: 'm-0 mb-2 text-sm leading-6 text-ps-slate-700',
                      },
                      `- ${tip}`
                    )
                  )
                )
              )
            : null,
          h(Hr, { className: 'mx-6 my-0 border-ps-slate-200' }),
          h(
            Section,
            { className: 'px-6 py-6' },
            h(
              Text,
              { className: 'm-0 text-xs leading-6 text-ps-slate-500' },
              footerNote || 'Este correo fue enviado automaticamente por PsicoAgenda.'
            ),
            h(
              Text,
              { className: 'm-0 mt-3 text-xs leading-6 text-ps-slate-500' },
              'Soporte: ',
              h(
                Link,
                {
                  href: `mailto:${SUPPORT_EMAIL}`,
                  className: 'text-ps-teal-700 underline',
                },
                SUPPORT_EMAIL
              ),
              ' | Sitio: ',
              h(
                Link,
                {
                  href: APP_WEB_URL,
                  className: 'text-ps-teal-700 underline',
                },
                'psicoagenda.online'
              )
            )
          )
        )
      )
    )
  );
}

const renderTransactionalHtml = async (props) => {
  const component = h(PsicoAgendaTransactionalEmail, props);
  return render(component);
};

const construirTemplatesAccesoZoom = async ({ contexto, joinUrl, startUrl, password, tipoEvento, timezone }) => {
  const pacienteNombre = obtenerNombreCompleto(contexto.paciente_nombre, contexto.paciente_apellido);
  const psicologaNombre = obtenerNombreCompleto(contexto.psicologa_nombre, contexto.psicologa_apellido);
  const fechaTexto = formatearFechaHora(contexto.fechahora, timezone);
  const esReagenda = tipoEvento === 'reagenda';

  const asuntoPaciente = esReagenda
    ? 'PsicoAgenda: actualizacion de acceso a tu cita en linea'
    : 'PsicoAgenda: acceso a tu cita en linea';

  const asuntoPsicologa = esReagenda
    ? 'PsicoAgenda: reunion Zoom actualizada'
    : 'PsicoAgenda: reunion Zoom creada';

  const pacienteHtml = await renderTransactionalHtml({
    preview: esReagenda ? 'Tu acceso a Zoom fue actualizado' : 'Tu acceso a Zoom esta listo',
    statusLabel: esReagenda ? 'Cita reagendada' : 'Cita confirmada',
    statusTone: 'success',
    title: 'Tu sesion virtual en PsicoAgenda',
    greeting: `Hola ${limpiarTexto(pacienteNombre, 'paciente')},`,
    intro: esReagenda
      ? `Tu cita con ${limpiarTexto(psicologaNombre, 'tu psicologa')} fue reagendada. Ya puedes usar tu nuevo enlace.`
      : `Tu cita con ${limpiarTexto(psicologaNombre, 'tu psicologa')} fue confirmada. Ya puedes ingresar con el boton de abajo.`,
    details: [
      { label: 'Psicologa', value: psicologaNombre },
      { label: 'Fecha y hora', value: `${fechaTexto} (${timezone})` },
      { label: 'Modalidad', value: limpiarTexto(contexto.modalidad, 'en linea') },
      { label: 'Codigo de acceso', value: password || 'No requerido' },
    ],
    primaryAction: {
      label: 'Unirme a la sesion por Zoom',
      href: joinUrl,
    },
    secondaryAction: {
      label: 'Abrir PsicoAgenda',
      href: APP_WEB_URL,
    },
    recommendations: [
      'Conectate 5 minutos antes para revisar audio y camara.',
      'Si necesitas reprogramar, hazlo desde la plataforma con anticipacion.',
      'Guarda este correo para acceder rapido a tu sesion.',
    ],
    footerNote: 'Este correo contiene enlaces unicos de acceso para tu cita virtual.',
  });

  const psicologaHtml = await renderTransactionalHtml({
    preview: esReagenda ? 'Reunion Zoom actualizada' : 'Reunion Zoom creada para tu cita',
    statusLabel: esReagenda ? 'Reunion actualizada' : 'Reunion creada',
    statusTone: 'success',
    title: 'Detalle de reunion Zoom para tu cita',
    greeting: `Hola ${limpiarTexto(psicologaNombre, 'psicologa')},`,
    intro: esReagenda
      ? `Se actualizo la reunion Zoom para la cita con ${limpiarTexto(pacienteNombre, 'tu paciente')}.`
      : `Se genero correctamente la reunion Zoom para la cita con ${limpiarTexto(pacienteNombre, 'tu paciente')}.`,
    details: [
      { label: 'Paciente', value: pacienteNombre },
      { label: 'Fecha y hora', value: `${fechaTexto} (${timezone})` },
      { label: 'Modalidad', value: limpiarTexto(contexto.modalidad, 'en linea') },
      { label: 'Codigo de acceso', value: password || 'No requerido' },
    ],
    primaryAction: {
      label: startUrl ? 'Iniciar reunion (host)' : 'Abrir enlace de reunion',
      href: startUrl || joinUrl,
    },
    secondaryAction: startUrl
      ? {
          label: 'Ver enlace para paciente',
          href: joinUrl,
        }
      : {
          label: 'Abrir PsicoAgenda',
          href: APP_WEB_URL,
        },
    recommendations: [
      'Verifica tu conexion y webcam antes de iniciar la sesion.',
      'Comparte solo el enlace de paciente, nunca el enlace de host.',
      'Si la cita cambia de horario, PsicoAgenda actualizara el enlace.',
    ],
    footerNote: 'Este correo incluye accesos para coordinacion de tu cita virtual.',
  });

  return {
    paciente: {
      asunto: asuntoPaciente,
      texto: [
        `Hola ${pacienteNombre},`,
        '',
        esReagenda
          ? `Tu cita con ${psicologaNombre} fue reagendada y tu acceso fue actualizado.`
          : `Tu cita con ${psicologaNombre} fue confirmada.`,
        `Fecha y hora: ${fechaTexto} (${timezone})`,
        `Enlace para unirte: ${joinUrl}`,
        password ? `Codigo de acceso: ${password}` : '',
        `Soporte: ${SUPPORT_EMAIL}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: pacienteHtml,
    },
    psicologa: {
      asunto: asuntoPsicologa,
      texto: [
        `Hola ${psicologaNombre},`,
        '',
        esReagenda
          ? `La reunion Zoom para la cita con ${pacienteNombre} fue actualizada.`
          : `Se creo una reunion Zoom para la cita con ${pacienteNombre}.`,
        `Fecha y hora: ${fechaTexto} (${timezone})`,
        `Enlace principal: ${startUrl || joinUrl}`,
        startUrl ? `Enlace paciente: ${joinUrl}` : '',
        password ? `Codigo de acceso: ${password}` : '',
        `Soporte: ${SUPPORT_EMAIL}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: psicologaHtml,
    },
  };
};

const construirTemplatesCancelacionZoom = async ({ contexto, timezone }) => {
  const pacienteNombre = obtenerNombreCompleto(contexto.paciente_nombre, contexto.paciente_apellido);
  const psicologaNombre = obtenerNombreCompleto(contexto.psicologa_nombre, contexto.psicologa_apellido);
  const fechaTexto = formatearFechaHora(contexto.fechahora, timezone);
  const asunto = 'PsicoAgenda: cita en linea cancelada';

  const pacienteHtml = await renderTransactionalHtml({
    preview: 'Tu cita virtual fue cancelada',
    statusLabel: 'Cita cancelada',
    statusTone: 'danger',
    title: 'Aviso de cancelacion de cita',
    greeting: `Hola ${limpiarTexto(pacienteNombre, 'paciente')},`,
    intro: `La cita en linea con ${limpiarTexto(psicologaNombre, 'tu psicologa')} fue cancelada.`,
    details: [
      { label: 'Psicologa', value: psicologaNombre },
      { label: 'Fecha y hora cancelada', value: `${fechaTexto} (${timezone})` },
      { label: 'Modalidad', value: limpiarTexto(contexto.modalidad, 'en linea') },
      { label: 'Estado', value: 'Cancelada' },
    ],
    primaryAction: {
      label: 'Revisar mis citas',
      href: APP_WEB_URL,
    },
    secondaryAction: {
      label: 'Contactar soporte',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    recommendations: [
      'Si necesitas una nueva fecha, solicita otra cita desde la plataforma.',
      'Si no reconoces esta cancelacion, contacta soporte inmediatamente.',
    ],
    footerNote: 'No respondas con informacion clinica sensible por correo electronico.',
  });

  const psicologaHtml = await renderTransactionalHtml({
    preview: 'Se cancelo una cita virtual',
    statusLabel: 'Cita cancelada',
    statusTone: 'danger',
    title: 'Cita virtual cancelada en PsicoAgenda',
    greeting: `Hola ${limpiarTexto(psicologaNombre, 'psicologa')},`,
    intro: `La cita en linea con ${limpiarTexto(pacienteNombre, 'tu paciente')} fue cancelada.`,
    details: [
      { label: 'Paciente', value: pacienteNombre },
      { label: 'Fecha y hora cancelada', value: `${fechaTexto} (${timezone})` },
      { label: 'Modalidad', value: limpiarTexto(contexto.modalidad, 'en linea') },
      { label: 'Estado', value: 'Cancelada' },
    ],
    primaryAction: {
      label: 'Abrir agenda en PsicoAgenda',
      href: APP_WEB_URL,
    },
    secondaryAction: {
      label: 'Soporte tecnico',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    recommendations: [
      'Confirma en tu agenda que el espacio quedo libre.',
      'Si la cancelacion fue por error, reprograma la cita desde PsicoAgenda.',
    ],
    footerNote: 'Este aviso se genero automaticamente por una actualizacion de estado.',
  });

  return {
    paciente: {
      asunto,
      texto: [
        `Hola ${pacienteNombre},`,
        '',
        `La cita en linea con ${psicologaNombre} del ${fechaTexto} fue cancelada.`,
        `Soporte: ${SUPPORT_EMAIL}`,
      ].join('\n'),
      html: pacienteHtml,
    },
    psicologa: {
      asunto,
      texto: [
        `Hola ${psicologaNombre},`,
        '',
        `La cita en linea con ${pacienteNombre} del ${fechaTexto} fue cancelada.`,
        `Soporte: ${SUPPORT_EMAIL}`,
      ].join('\n'),
      html: psicologaHtml,
    },
  };
};

const construirTemplateBienvenidaRegistro = async ({
  nombre,
  apellidoPaterno,
  correo,
  password,
  estadoSolicitud = 'Pendiente',
}) => {
  const nombreCompleto = obtenerNombreCompleto(nombre, apellidoPaterno) || 'psicologa';
  const asunto = 'Bienvenido a tu PsicoAgenda';

  const html = await renderTransactionalHtml({
    preview: 'Tus credenciales de acceso a PsicoAgenda',
    statusLabel: 'Bienvenida',
    statusTone: 'success',
    title: 'Bienvenido a tu PsicoAgenda',
    greeting: `Hola ${limpiarTexto(nombreCompleto, 'psicologa')},`,
    intro: 'Tu solicitud de registro fue recibida. Te compartimos tus datos de acceso para que los tengas a la mano y puedas compartirlos con tus pacientes cuando lo necesites.',
    details: [
      { label: 'Correo', value: limpiarTexto(correo, 'no disponible') },
      { label: 'Contrasena', value: limpiarTexto(password, 'no disponible') },
      { label: 'Estado del registro', value: limpiarTexto(estadoSolicitud, 'Pendiente') },
    ],
    primaryAction: {
      label: 'Abrir PsicoAgenda',
      href: APP_WEB_URL,
    },
    secondaryAction: {
      label: 'Contactar soporte',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    recommendations: [
      'Guarda este correo en un lugar seguro.',
      'Evita compartir tus credenciales en canales publicos.',
      'Cuando tu registro sea aprobado, podras iniciar sesion de inmediato.',
    ],
    footerNote: 'Si no reconoces esta solicitud, contacta soporte inmediatamente.',
  });

  const texto = [
    `Hola ${nombreCompleto},`,
    '',
    'Bienvenido a tu PsicoAgenda.',
    'Tu solicitud de registro fue recibida y esta en revision por un administrador.',
    '',
    `Correo: ${correo}`,
    `Contrasena: ${password}`,
    `Estado del registro: ${estadoSolicitud}`,
    '',
    `Accede a la plataforma: ${APP_WEB_URL}`,
    `Soporte: ${SUPPORT_EMAIL}`,
  ].join('\n');

  return {
    asunto,
    texto,
    html,
  };
};

const construirTemplateCambioPassword = async ({
  nombre,
  apellidoPaterno,
  fechaCambio,
  timezone = 'America/Mexico_City',
}) => {
  const nombreCompleto = obtenerNombreCompleto(nombre, apellidoPaterno) || 'usuario';
  const asunto = 'PsicoAgenda: tu contrasena fue actualizada';
  const fechaFormateada = formatearFechaHora(fechaCambio || new Date(), timezone);

  const html = await renderTransactionalHtml({
    preview: 'Se detecto un cambio de contrasena en tu cuenta',
    statusLabel: 'Seguridad',
    statusTone: 'success',
    title: 'Cambio de contrasena confirmado',
    greeting: `Hola ${limpiarTexto(nombreCompleto, 'usuario')},`,
    intro: 'Te confirmamos que la contrasena de tu cuenta fue actualizada correctamente desde la seccion Mi perfil > Seguridad.',
    details: [
      { label: 'Evento', value: 'Cambio de contrasena' },
      { label: 'Fecha y hora', value: `${fechaFormateada} (${timezone})` },
      { label: 'Plataforma', value: 'PsicoAgenda' },
    ],
    primaryAction: {
      label: 'Abrir PsicoAgenda',
      href: APP_WEB_URL,
    },
    secondaryAction: {
      label: 'Contactar soporte',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    recommendations: [
      'Si no reconoces este cambio, restablece tu contrasena de inmediato.',
      'Cierra sesiones activas en dispositivos que no reconozcas.',
      'Evita reutilizar contrasenas en otros servicios.',
    ],
    footerNote: 'Este es un aviso de seguridad automatico de PsicoAgenda.',
  });

  const texto = [
    `Hola ${nombreCompleto},`,
    '',
    'Tu contrasena en PsicoAgenda fue actualizada correctamente.',
    `Fecha y hora del cambio: ${fechaFormateada} (${timezone})`,
    '',
    'Si no reconoces esta accion, cambia tu contrasena de inmediato y contacta a soporte.',
    `Soporte: ${SUPPORT_EMAIL}`,
    `Plataforma: ${APP_WEB_URL}`,
  ].join('\n');

  return {
    asunto,
    texto,
    html,
  };
};

const construirTemplateRecuperacionPassword = async ({
  nombre,
  apellidoPaterno,
  resetUrl,
  expiracionMinutos = 30,
}) => {
  const nombreCompleto = obtenerNombreCompleto(nombre, apellidoPaterno) || 'usuario';
  const asunto = 'PsicoAgenda: recupera tu contrasena';

  const html = await renderTransactionalHtml({
    preview: 'Solicitud para restablecer tu contrasena',
    statusLabel: 'Seguridad',
    statusTone: 'success',
    title: 'Recuperacion de contrasena',
    greeting: `Hola ${limpiarTexto(nombreCompleto, 'usuario')},`,
    intro: `Recibimos una solicitud para restablecer tu contrasena. Este enlace estara disponible por ${expiracionMinutos} minutos.`,
    details: [
      { label: 'Evento', value: 'Solicitud de recuperacion de contrasena' },
      { label: 'Tiempo de validez', value: `${expiracionMinutos} minutos` },
      { label: 'Plataforma', value: 'PsicoAgenda' },
    ],
    primaryAction: {
      label: 'Restablecer contrasena',
      href: resetUrl,
    },
    secondaryAction: {
      label: 'Contactar soporte',
      href: `mailto:${SUPPORT_EMAIL}`,
    },
    recommendations: [
      'Si no solicitaste este cambio, ignora este correo.',
      'No compartas este enlace con terceros.',
      'Al finalizar, inicia sesion con tu nueva contrasena.',
    ],
    footerNote: 'Este correo de recuperacion fue generado automaticamente por PsicoAgenda.',
  });

  const texto = [
    `Hola ${nombreCompleto},`,
    '',
    'Recibimos una solicitud para restablecer tu contrasena en PsicoAgenda.',
    `Este enlace expira en ${expiracionMinutos} minutos:`,
    resetUrl,
    '',
    'Si no solicitaste este cambio, ignora este correo y contacta a soporte.',
    `Soporte: ${SUPPORT_EMAIL}`,
  ].join('\n');

  return {
    asunto,
    texto,
    html,
  };
};

module.exports = {
  construirTemplatesAccesoZoom,
  construirTemplatesCancelacionZoom,
  construirTemplateBienvenidaRegistro,
  construirTemplateCambioPassword,
  construirTemplateRecuperacionPassword,
  renderTransactionalHtml,
};
