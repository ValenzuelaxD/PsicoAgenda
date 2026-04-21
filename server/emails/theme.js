const APP_WEB_URL = String(process.env.APP_WEB_URL || 'https://psicoagenda-489800.web.app')
  .trim()
  .replace(/\/+$/, '');

const SUPPORT_EMAIL = String(process.env.MAIL_SUPPORT_ADDRESS || 'info@psicoagenda.online').trim();

const psicoAgendaEmailTailwindConfig = {
  theme: {
    extend: {
      colors: {
        ps: {
          white: '#ffffff',
          slate: {
            50: '#f8fafc',
            100: '#f1f5f9',
            200: '#e2e8f0',
            300: '#cbd5e1',
            500: '#64748b',
            700: '#334155',
            900: '#0f172a',
          },
          teal: {
            100: '#ccfbf1',
            600: '#0d9488',
            700: '#0f766e',
          },
          violet: {
            600: '#7c3aed',
          },
          rose: {
            50: '#fff1f2',
            200: '#fecdd3',
            700: '#be123c',
          },
        },
      },
      boxShadow: {
        email: '0 10px 30px rgba(15, 23, 42, 0.12)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
};

const getPublicAssetUrl = (assetPath = '') => {
  const normalizedAssetPath = String(assetPath).replace(/^\/+/, '');
  return normalizedAssetPath ? `${APP_WEB_URL}/${normalizedAssetPath}` : APP_WEB_URL;
};

module.exports = {
  APP_WEB_URL,
  SUPPORT_EMAIL,
  psicoAgendaEmailTailwindConfig,
  getPublicAssetUrl,
};
