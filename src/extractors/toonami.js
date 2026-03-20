'use strict';

const BASE = 'http://api.toonamiaftermath.com:3000';

const CHANNELS = [
  { id: 'ntv-toonamiaftermath-est',      slug: 'est' },
  { id: 'ntv-toonamiaftermath-pst',      slug: 'pst' },
  { id: 'ntv-toonamiaftermath-movies',   slug: 'movies' },
  { id: 'ntv-toonamiaftermath-radio',    slug: 'radio' },
  { id: 'ntv-toonamiaftermath-snickest', slug: 'snick-est' },
  { id: 'ntv-toonamiaftermath-snickpst', slug: 'snick-pst' },
  { id: 'ntv-toonamiaftermath-mtv97',    slug: 'mtv97' },
];

// URLs are statically constructed — no HTTP fetch needed at extract time.
// Note: API is HTTP-only (port 3000). HTTPS returns 404.
// Mixed-content warning: if addon is served over HTTPS, some Stremio clients
// may block these HTTP stream URLs. Desktop Stremio is unaffected.
async function extract() {
  return CHANNELS.map(({ id, slug }) => ({
    id,
    url: `${BASE}/${slug}/playlist.m3u8`,
  }));
}

module.exports = { extract, name: 'toonami' };
