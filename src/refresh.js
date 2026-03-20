'use strict';
const axios = require('axios');
const store = require('./store');
const extractors = require('./extractors');

// Reject URLs that resolve to private/internal IP ranges to prevent SSRF.
function isPrivateUrl(urlString) {
  let hostname;
  try {
    hostname = new URL(urlString).hostname;
  } catch {
    return true;
  }
  return (
    hostname === 'localhost' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    hostname === '::1'
  );
}

async function resolveUrl(url) {
  if (isPrivateUrl(url)) throw new Error(`Blocked private URL: ${url}`);
  const response = await axios.head(url, {
    maxRedirects: 3,
    timeout: 10000,
    validateStatus: (status) => status >= 200 && status < 400,
  });
  const resolved = response.request.res.responseUrl || url;
  if (isPrivateUrl(resolved)) throw new Error(`Redirect to private URL blocked: ${resolved}`);
  return resolved;
}

async function refreshWith(extractorList, resolveUrlFn) {
  for (const extractor of extractorList) {
    try {
      const results = await extractor.extract();
      for (const { id, url } of results) {
        try {
          const finalUrl = await resolveUrlFn(url);
          store.set(id, finalUrl);
        } catch (urlErr) {
          console.warn(`[refresh] Failed to resolve URL for ${id}: ${urlErr.message} — using original URL`);
          store.set(id, url);
        }
      }
    } catch (extractorErr) {
      const name = extractor.name || '(unknown)';
      console.warn(`[refresh] Extractor "${name}" failed: ${extractorErr.message}`);
    }
  }
}

async function refresh() {
  return refreshWith(extractors, resolveUrl);
}

module.exports = { refresh, refreshWith };
