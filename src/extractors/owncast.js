'use strict';

// Owncast instances — all use the standard /hls/stream.m3u8 path.
// HLS, no auth required, TV-safe (Android TV / Stremio desktop).
const CHANNELS = [
  { id: 'ntv-ccn',          url: 'https://cartooncartoons.thatsoretro.com/hls/stream.m3u8' },
  { id: 'ntv-afterswim',    url: 'https://owncast.afterswim.org/hls/stream.m3u8' },
  { id: 'ntv-verniy',       url: 'https://live.verniy.tv/hls/stream.m3u8' },
  { id: 'ntv-retrostrange', url: 'https://live.retrostrange.com/hls/stream.m3u8' },
];

async function extract() {
  return CHANNELS.map(({ id, url }) => ({ id, url }));
}

module.exports = { extract, name: 'owncast' };
