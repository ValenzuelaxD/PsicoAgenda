require('dotenv').config();
const db = require('./db');

const toBool = (value) => Boolean(String(value || '').trim());

async function main() {
  try {
    const env = process.env;
    const report = {
      ENABLE_ZOOM_INTEGRATION: env.ENABLE_ZOOM_INTEGRATION || '(unset)',
      ENABLE_EMAIL_INTEGRATION: env.ENABLE_EMAIL_INTEGRATION || '(unset)',
      ZOOM_ACCOUNT_ID_SET: toBool(env.ZOOM_ACCOUNT_ID),
      ZOOM_CLIENT_ID_SET: toBool(env.ZOOM_CLIENT_ID),
      ZOOM_CLIENT_SECRET_SET: toBool(env.ZOOM_CLIENT_SECRET),
      ZOOM_USER_ID_SET: toBool(env.ZOOM_USER_ID),
      SMTP_HOST_SET: toBool(env.SMTP_HOST),
      SMTP_USER_SET: toBool(env.SMTP_USER),
      SMTP_PASS_SET: toBool(env.SMTP_PASS),
      MAIL_FROM_ADDRESS_SET: toBool(env.MAIL_FROM_ADDRESS),
    };

    console.log('config-status', report);

    const citaVirtual = await db.query(
      `
        SELECT citaid, zoom_status, integration_attempts, last_error, updated_at
        FROM citas_virtuales
        WHERE citaid = $1
      `,
      [54]
    );

    const correos = await db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM correos_cita
        WHERE citaid = $1
      `,
      [54]
    );

    console.log('citas_virtuales_54', citaVirtual.rows[0] || null);
    console.log('correos_cita_54_total', correos.rows[0]?.total ?? 0);

    process.exit(0);
  } catch (error) {
    console.error('verify-error', error.message);
    process.exit(1);
  }
}

main();
