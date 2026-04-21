const nodemailer = require('nodemailer');

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

let transporterCache = null;

const getSmtpConfig = () => {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = parsePositiveInt(process.env.SMTP_PORT, 587);
  const secure = parseBoolean(process.env.SMTP_SECURE, port === 465);
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').trim();
  const fromAddress = String(process.env.MAIL_FROM_ADDRESS || '').trim();
  const fromName = String(process.env.MAIL_FROM_NAME || 'PsicoAgenda').trim();
  const rejectUnauthorized = parseBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true);

  return {
    host,
    port,
    secure,
    user,
    pass,
    fromAddress,
    fromName,
    rejectUnauthorized,
  };
};

const isEmailIntegrationEnabled = () => parseBoolean(process.env.ENABLE_EMAIL_INTEGRATION, false);

const assertSmtpConfig = () => {
  const cfg = getSmtpConfig();

  if (!cfg.host || !cfg.port || !cfg.user || !cfg.pass || !cfg.fromAddress) {
    throw new Error('Configuracion SMTP incompleta. Revisa SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS y MAIL_FROM_ADDRESS.');
  }

  return cfg;
};

const getTransporter = () => {
  if (transporterCache) {
    return transporterCache;
  }

  const cfg = assertSmtpConfig();

  transporterCache = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: {
      user: cfg.user,
      pass: cfg.pass,
    },
    tls: {
      rejectUnauthorized: cfg.rejectUnauthorized,
    },
  });

  return transporterCache;
};

const buildFromHeader = ({ fromName, fromAddress }) => {
  if (!fromName) {
    return fromAddress;
  }
  return `${fromName} <${fromAddress}>`;
};

const enviarCorreo = async ({ to, subject, text, html }) => {
  if (!to) {
    throw new Error('El destinatario del correo es requerido.');
  }

  const cfg = assertSmtpConfig();
  const transporter = getTransporter();

  const info = await transporter.sendMail({
    from: buildFromHeader(cfg),
    to,
    subject,
    text,
    html,
  });

  return info;
};

module.exports = {
  isEmailIntegrationEnabled,
  enviarCorreo,
};
