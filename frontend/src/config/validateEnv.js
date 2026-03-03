const requiredAtBuildTime = ['REACT_APP_API_URL'];

export function validateFrontendEnv() {
  const missing = requiredAtBuildTime.filter(
    (key) => !String(process.env[key] || '').trim()
  );
  if (!missing.length) return;

  const message =
    `Missing frontend env: ${missing.join(', ')}. ` +
    'Set them in frontend/.env.local (or environment) and restart frontend.';

  if (process.env.NODE_ENV === 'production') {
    // Keep runtime alive, but still surface a hard warning in console.
    // Fallback URL logic in api.js will continue to work.
    // eslint-disable-next-line no-console
    console.error(message);
    return;
  }

  // eslint-disable-next-line no-console
  console.warn(message);
}
