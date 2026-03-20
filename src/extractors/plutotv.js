'use strict';

// Pluto TV channels via jmp2.uk proxy (maintained by iptv-org).
// Proxy handles JWT token refresh automatically — no auth to manage.
// Returns 302 redirect to the live Pluto TV CDN; Stremio follows redirects.
// HLS, TV-safe (Android TV / Stremio desktop).
const CHANNELS = [
  { id: 'ntv-pluto-90skids',    url: 'https://jmp2.uk/plu-6452c814939a590008567a3b.m3u8' },
  { id: 'ntv-pluto-foreverkids', url: 'https://jmp2.uk/plu-56171fafada51f8004c4b40f.m3u8' },
  { id: 'ntv-pluto-nick',       url: 'https://jmp2.uk/plu-5ca673e0d0bd6c2689c94ce3.m3u8' },
  { id: 'ntv-pluto-naruto',     url: 'https://jmp2.uk/plu-5da0c85bd2c9c10009370984.m3u8' },
  { id: 'ntv-pluto-onepiece',   url: 'https://jmp2.uk/plu-5f7790b3ed0c88000720b241.m3u8' },
  { id: 'ntv-pluto-sailormoon', url: 'https://jmp2.uk/plu-637e55347427a40007fac703.m3u8' },
  { id: 'ntv-pluto-yugioh',     url: 'https://jmp2.uk/plu-5f4ec10ed9636f00089b8c89.m3u8' },
  { id: 'ntv-pluto-inuyasha',   url: 'https://jmp2.uk/plu-67c63b90a20c0399a381b816.m3u8' },
  { id: 'ntv-pluto-pokemon',    url: 'https://jmp2.uk/plu-6675c7868768aa0008d7f1c7.m3u8' },
  { id: 'ntv-pluto-anime',      url: 'https://jmp2.uk/plu-5812b7d3249444e05d09cc49.m3u8' },
];

async function extract() {
  return CHANNELS.map(({ id, url }) => ({ id, url }));
}

module.exports = { extract, name: 'plutotv' };
