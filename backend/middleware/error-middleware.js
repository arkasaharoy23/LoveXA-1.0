

'use strict';

function errorMiddleware(err, req, res, next) { 
  const isDev = process.env.NODE_ENV === 'development';

  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, errors });
  }

  
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'A proposal with this ID already exists. Please try again.',
    });
  }

  
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'Invalid proposal ID format.' });
  }

  
  if (err.code === 'ENOENT' && !req.path.startsWith('/api')) {
    console.error(`[Error 404] Missing file: ${err.path || req.path}`);
    return res.status(404).type('text/plain').send('Page not found.');
  }

  const status  = err.statusCode || err.status || 500;
  const message = err.message    || 'Something went wrong. Please try again.';

  console.error(`[Error ${status}]`, err);

  if (req.path.startsWith('/api')) {
    return res.status(status).json({
      success: false,
      message,
      ...(isDev && { stack: err.stack }),
    });
  }

  return res.status(status).type('text/plain').send(message);
}

module.exports = errorMiddleware;
