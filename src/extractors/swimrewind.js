'use strict';

// Swim Rewind runs Owncast. Standard Owncast HLS path: /hls/stream.m3u8
// Master playlist contains 3 quality variants (relative URLs: 0/stream.m3u8 etc.)
// Return the absolute master URL — Stremio's HLS player handles ABR selection.
async function extract() {
  return [
    { id: 'ntv-swimrewind', url: 'https://swimrewind.com/hls/stream.m3u8' },
  ];
}

module.exports = { extract, name: 'swimrewind' };
