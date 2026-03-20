'use strict';

const BASE_URL = process.env.BASE_URL || `http://127.0.0.1:${process.env.PORT || 7000}`;

// Static addon manifest declaration
//
// CRITICAL: idPrefixes MUST be a non-empty array.
// Setting it to null, undefined, or [] causes Android clients to lose
// the stream handler entirely due to Stremio/stremio-bugs#1469
// (Android installation serialization converts null/absent idPrefixes to []).
//
// CRITICAL: resources MUST include "meta".
// Omitting it causes streams to silently fail on Stremio Web and Android
// even though desktop works fine.
module.exports = {
  id: 'com.ntv.livetv',
  version: '1.0.0',
  name: 'Nostalgia TV',
  description: 'Nostalgia TV: Live retro cartoons, classic shows, and music channels from the 90s and 2000s.',
  resources: ['catalog', 'meta', 'stream'],
  types: ['tv'],
  idPrefixes: ['ntv-'],
  catalogs: [
    {
      type: 'tv',
      id: 'ntv-live',
      name: 'Nostalgia TV',
    },
  ],
  logo: `${BASE_URL}/public/images/addon-logo.png`,
  background: `${BASE_URL}/public/images/addon-background.jpg`,
};
