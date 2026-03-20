'use strict';
require('dotenv').config();
const express = require('express');
const { getRouter } = require('stremio-addon-sdk');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');
const addonInterface = require('./src/addon');
const { refresh } = require('./src/refresh');

const PORT = process.env.PORT || 7000;

const app = express();

// Trust Cloudflare proxy so req.ip is the real client IP, not Cloudflare's
app.set('trust proxy', 1);

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});

// Rate limiting — 120 requests per 15 minutes per real client IP
// validate.keyGeneratorIpFallback disabled because cf-connecting-ip is always a plain IP string
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
  keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip,
  validate: { keyGeneratorIpFallback: false },
}));

// Landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Stremio addon routes
app.use(getRouter(addonInterface));

// Static assets — served at root so /favicon.ico, /site.webmanifest, etc. resolve correctly
// Also aliased at /public to match image paths used in index.html (/public/images/...)
const publicDir = express.static(path.join(process.cwd(), 'public'));
app.use(publicDir);
app.use('/public', publicDir);

// Trigger immediate refresh at startup (node-cron v4 removed runOnInit)
refresh().catch((err) => console.warn('[startup] Initial refresh failed:', err.message));

// Schedule subsequent refreshes every 5 minutes
// noOverlap: true requires the callback to return the Promise
cron.schedule('*/5 * * * *', () => {
  return refresh().catch((err) => console.warn('[cron] Refresh failed:', err.message));
}, { noOverlap: true });

app.listen(PORT, () => {
  console.log(`Nostalgia TV running on http://127.0.0.1:${PORT}/manifest.json`);
});
