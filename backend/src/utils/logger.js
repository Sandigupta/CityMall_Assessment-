const winston = require('winston');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Create custom format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    return log;
  })
);

// Create logger instance
const logger = winston.createLogger({
  levels: logLevels,
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  defaultMeta: { 
    service: 'disaster-response-api',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: []
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
} else {
  // Production console output (structured)
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    )
  }));
}

// Add file transports for production
if (process.env.NODE_ENV === 'production') {
  // Error log file
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));

  // Combined log file
  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 10485760, // 10MB
    maxFiles: 5,
    tailable: true
  }));
}

// Add structured logging methods for different contexts
logger.disaster = (action, disasterId, details = {}) => {
  logger.info('Disaster action', {
    context: 'disaster',
    action,
    disasterId,
    ...details
  });
};

logger.api = (method, endpoint, statusCode, responseTime, details = {}) => {
  logger.info('API request', {
    context: 'api',
    method,
    endpoint,
    statusCode,
    responseTime: `${responseTime}ms`,
    ...details
  });
};

logger.auth = (action, userId, details = {}) => {
  logger.info('Auth action', {
    context: 'auth',
    action,
    userId,
    ...details
  });
};

logger.external = (service, action, success, details = {}) => {
  logger.info('External service call', {
    context: 'external',
    service,
    action,
    success,
    ...details
  });
};

logger.cache = (action, key, hit = null, details = {}) => {
  logger.debug('Cache operation', {
    context: 'cache',
    action,
    key,
    hit,
    ...details
  });
};

logger.websocket = (event, clientId, details = {}) => {
  logger.debug('WebSocket event', {
    context: 'websocket',
    event,
    clientId,
    ...details
  });
};

// Request logging middleware
logger.requestMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.api(
      req.method,
      req.originalUrl,
      res.statusCode,
      duration,
      {
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        userId: req.user?.id
      }
    );
  });
  
  next();
};

// Error logging helper
logger.logError = (error, context = {}) => {
  logger.error('Application error', {
    message: error.message,
    stack: error.stack,
    ...context
  });
};

// Performance logging helper
logger.logPerformance = (operation, duration, details = {}) => {
  const level = duration > 1000 ? 'warn' : 'debug';
  logger[level]('Performance metric', {
    operation,
    duration: `${duration}ms`,
    ...details
  });
};

module.exports = logger;