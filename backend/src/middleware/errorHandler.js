export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Route not found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  if (err?.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format' });
  }

  if (err?.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Duplicate value' });
  }

  if (err?.message === 'Only images allowed' || String(err?.message || '').includes('images are allowed')) {
    return res.status(400).json({ message: err.message });
  }

  const status = err?.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = status >= 500 ? 'Internal server error' : (err?.message || 'Request failed');
  return res.status(status).json({ message });
}

