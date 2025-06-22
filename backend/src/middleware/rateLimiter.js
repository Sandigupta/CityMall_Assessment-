








// const rateLimit = require('express-rate-limit')
// const logger = require('../utils/logger')

// const readLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 1000,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Read limit exceeded: ${req.ip}`)
//     res.status(429).json({ error: 'Too many requests, please try again later.' })
//   }
// })

// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 100,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Write limit exceeded: ${req.ip}`)
//     res.status(429).json({ error: 'Too many requests, please try again later.' })
//   }
// })

// const apiLimiter = rateLimit({
//   windowMs: 60 * 1000,
//   max: 30,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`API limit exceeded: ${req.ip}`)
//     res.status(429).json({ error: 'Too many API requests, please slow down.' })
//   }
// })

// const verificationLimiter = rateLimit({
//   windowMs: 5 * 60 * 1000,
//   max: 5,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Verification limit exceeded: ${req.ip}`)
//     res.status(429).json({ error: 'Too many verification requests, wait before retrying.' })
//   }
// })

// const createLimiter = rateLimit({
//   windowMs: 10 * 60 * 1000,
//   max: 20,
//   standardHeaders: true,
//   legacyHeaders: false,
//   handler: (req, res) => {
//     logger.warn(`Create limit exceeded: ${req.ip}`)
//     res.status(429).json({ error: 'Too many creation requests, please slow down.' })
//   }
// })

// module.exports = {
//   readLimiter,
//   generalLimiter,
//   apiLimiter,
//   verificationLimiter,
//   createLimiter
// }








const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 2000, // Increased from 1000
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Read limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased from 100
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Write limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
});

// Main API limiter - this is the one causing issues
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // Increased from 30 to 200 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for certain endpoints during development
    const skipPaths = ['/health', '/mock-social-media', '/official-updates/sources'];
    return skipPaths.some(path => req.path.includes(path));
  },
  handler: (req, res) => {
    logger.warn(`API limit exceeded: ${req.ip} - Path: ${req.path}`);
    res.status(429).json({ 
      error: 'Too many API requests, please slow down.',
      retryAfter: 60,
      path: req.path
    });
  }
});

const verificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Increased from 5
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Verification limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many verification requests, wait before retrying.' });
  }
});

const createLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Increased from 20
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Create limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many creation requests, please slow down.' });
  }
});

// Special limiter for mock endpoints - very lenient
const mockLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // Very high limit for mock data
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Mock API limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many mock requests.' });
  }
});

module.exports = {
  readLimiter,
  generalLimiter,
  apiLimiter,
  verificationLimiter,
  createLimiter,
  mockLimiter
};





