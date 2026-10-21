export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Clone and sanitize body for logging if needed
  const sanitizedBody = req.body ? { ...req.body } : {};
  if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
  if (sanitizedBody.confirmPassword) sanitizedBody.confirmPassword = '[REDACTED]';
  if (sanitizedBody.token) sanitizedBody.token = '[REDACTED]';

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const color = status >= 500 ? '\x1b[31m' : status >= 400 ? '\x1b[33m' : status >= 300 ? '\x1b[36m' : '\x1b[32m';
    const reset = '\x1b[0m';
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${color}${status}${reset} - ${duration}ms`
    );
  });

  next();
};
