'use strict';
const { addonBuilder } = require('stremio-addon-sdk');
const manifest = require('./manifest');
const channels = require('./channels');
const store = require('./store');

const builder = new addonBuilder(manifest);

function catalogHandler({ type, id }) {
  if (type === 'tv' && id === 'ntv-live') {
    const metas = channels
      .filter(ch => store.get(ch.id) !== null)
      .map(ch => ({ id: ch.id, type: 'tv', name: ch.name, poster: ch.poster, posterShape: 'square' }));
    return Promise.resolve({ metas });
  }
  return Promise.resolve({ metas: [] });
}

function metaHandler({ type, id }) {
  if (!id || typeof id !== 'string' || !id.startsWith('ntv-')) {
    return Promise.resolve({ meta: null });
  }
  const ch = channels.find(c => c.id === id);
  if (ch) {
    return Promise.resolve({
      meta: {
        id: ch.id,
        type: 'tv',
        name: ch.name,
        description: ch.description,
        poster: ch.poster,
        posterShape: 'square',
      }
    });
  }
  return Promise.resolve({ meta: null });
}

function streamHandler({ type, id }) {
  if (!id || typeof id !== 'string' || !id.startsWith('ntv-')) {
    return Promise.resolve({ streams: [], cacheMaxAge: 0 });
  }
  const url = store.get(id);
  if (url) {
    return Promise.resolve({
      streams: [{ url, title: 'Live' }],
      cacheMaxAge: 0,
    });
  }
  return Promise.resolve({ streams: [], cacheMaxAge: 0 });
}

builder.defineCatalogHandler(catalogHandler);
builder.defineMetaHandler(metaHandler);
builder.defineStreamHandler(streamHandler);

// getInterface() MUST be called after all handlers are defined
const addonInterface = builder.getInterface();

// Expose handler functions on the interface object so tests can call them directly.
// This does not affect serveHTTP — it only reads manifest and get from the interface.
addonInterface.catalogHandler = catalogHandler;
addonInterface.metaHandler = metaHandler;
addonInterface.streamHandler = streamHandler;

module.exports = addonInterface;
