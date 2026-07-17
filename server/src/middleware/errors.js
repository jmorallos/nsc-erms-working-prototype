export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || 'ERROR';
  }
}

export function notFound(req, res, next) {
  if (req.path.startsWith('/api/')) {
    return next(new HttpError(404, 'Not found', 'NOT_FOUND'));
  }
  return next();
}

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_ERROR';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: {
      code,
      message:
        status >= 500 && !['MISSING_TOOL', 'COMMAND_FAILED'].includes(code)
          ? 'Internal server error'
          : err.message,
    },
  });
}
