const requiredEnv = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'ADMIN_USERNAME',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'DEPUTY_ADMIN_USERNAME',
  'DEPUTY_ADMIN_EMAIL',
  'DEPUTY_ADMIN_PASSWORD',
  'TEACHER_DEFAULT_PASSWORD',
];

export default function validateEnv() {
  const missing = requiredEnv.filter((key) => !String(process.env[key] || '').trim());
  if (!missing.length) return;

  const hint = [
    'Missing required environment variables:',
    ...missing.map((key) => `- ${key}`),
    '',
    'Add them to backend/.env and restart backend.',
  ].join('\n');

  throw new Error(hint);
}
