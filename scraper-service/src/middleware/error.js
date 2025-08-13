// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Error handler middleware
const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Specific error handling
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation Error';
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // Rate limit error
  if (err.message && err.message.includes('Too many requests')) {
    statusCode = 429;
  }

  // Puppeteer specific errors
  if (err.message && err.message.includes('Protocol error')) {
    statusCode = 422;
    message = 'Browser automation failed';
  }

  if (err.message && err.message.includes('TimeoutError')) {
    statusCode = 408;
    message = 'Request timeout - page took too long to load';
  }

  // Network errors
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    statusCode = 422;
    message = 'Unable to connect to the specified URL';
  }

  console.error(`Error ${statusCode}: ${message}`);
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = {
  asyncHandler,
  notFoundHandler,
  errorHandler
};