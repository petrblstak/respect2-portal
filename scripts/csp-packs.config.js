module.exports = {
  baseline: {
    'default-src': ["'self'"],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'"],
    'frame-src': ["'self'"],
  },
  packs: {
    // Google Analytics 4 endpoints (without GTM container management).
    ga4: {
      'script-src': ['https://*.googletagmanager.com'],
      'connect-src': ['https://*.google-analytics.com', 'https://*.analytics.google.com', 'https://*.googletagmanager.com'],
      'img-src': ['https://*.google-analytics.com', 'https://*.googletagmanager.com'],
    },
    // Google Tag Manager endpoints for container bootstrap and telemetry.
    gtm: {
      'script-src': ['https://www.googletagmanager.com'],
      'connect-src': ['https://www.googletagmanager.com', 'https://www.google.com'],
      'img-src': ['https://www.googletagmanager.com'],
      'frame-src': ['https://www.googletagmanager.com'],
    },
    clarity: {
      'script-src': ['https://*.clarity.ms', 'https://c.bing.com'],
      'connect-src': ['https://*.clarity.ms', 'https://c.bing.com'],
      'img-src': ['https://*.clarity.ms', 'https://c.bing.com'],
    },
    recaptcha: {
      'script-src': ['https://www.google.com', 'https://www.gstatic.com', 'https://www.recaptcha.net'],
      'connect-src': ['https://www.google.com', 'https://www.gstatic.com', 'https://www.recaptcha.net'],
      'frame-src': ['https://www.google.com', 'https://recaptcha.google.com', 'https://www.recaptcha.net'],
    },
    youtube: {
      'frame-src': ['https://*.youtube-nocookie.com', 'https://*.youtube.com'],
      'img-src': ['https://i.ytimg.com', 'https://*.ytimg.com'],
    },
    vimeo: {
      'frame-src': ['https://player.vimeo.com', 'https://*.vimeo.com'],
    },
    sentry: {
      'connect-src': ['https://*.ingest.sentry.io'],
      'script-src': ['https://browser.sentry-cdn.com'],
    },
    sharepoint: {
      'frame-src': ['https://*.sharepoint.com'],
    },
    googleDrive: {
      'frame-src': ['https://drive.google.com', 'https://docs.google.com'],
    },
    microsoftFiles: {
      'frame-src': ['https://*.sharepoint.com', 'https://onedrive.live.com'],
    },
  },
};
