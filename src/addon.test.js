'use strict';
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let addon;
try { addon = require('./addon'); } catch { addon = null; }
let store;
try { store = require('./store'); } catch { store = null; }

describe('addon', () => {
  test('module loads', () => {
    assert.ok(addon, 'addon.js not found');
  });

  test('catalogHandler: returns { metas: [...] } array for { type: "tv", id: "ntv-live" } (CORE-03)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.equal(typeof addon.catalogHandler, 'function', 'catalogHandler must be a function');
    const result = await addon.catalogHandler({ type: 'tv', id: 'ntv-live' });
    assert.ok(result && typeof result === 'object', 'result must be an object');
    assert.ok(Array.isArray(result.metas), 'result.metas must be an array');
  });

  test('metaHandler: returns { meta: { id, type, name, description } } for valid channel ID (CORE-04)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.equal(typeof addon.metaHandler, 'function', 'metaHandler must be a function');
    const channels = require('./channels');
    assert.ok(Array.isArray(channels) && channels.length > 0, 'channels.js must export a non-empty array');
    const firstId = channels[0].id;
    const result = await addon.metaHandler({ type: 'tv', id: firstId });
    assert.ok(result && typeof result === 'object', 'result must be an object');
    assert.ok(result.meta && typeof result.meta === 'object', 'result.meta must be an object');
    assert.ok(result.meta.id, 'result.meta.id must be present');
    assert.ok(result.meta.type, 'result.meta.type must be present');
    assert.ok(result.meta.name, 'result.meta.name must be present');
    assert.ok(result.meta.description, 'result.meta.description must be present');
  });

  test('metaHandler: returns { meta: null } for unknown channel ID (CORE-04)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.equal(typeof addon.metaHandler, 'function', 'metaHandler must be a function');
    const result = await addon.metaHandler({ type: 'tv', id: 'ntv-unknown-xyz' });
    assert.ok(result && typeof result === 'object', 'result must be an object');
    assert.equal(result.meta, null, 'result.meta must be null for unknown ID');
  });

  test('streamHandler: returns { streams: [] } for any channel ID (CORE-05)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.equal(typeof addon.streamHandler, 'function', 'streamHandler must be a function');
    const result = await addon.streamHandler({ type: 'tv', id: 'ntv-any' });
    assert.ok(result && typeof result === 'object', 'result must be an object');
    assert.ok(Array.isArray(result.streams), 'result.streams must be an array');
  });
});

describe('addon CACHE-04: store-filtered catalog and stream lookup', () => {
  beforeEach(() => {
    if (store) store.clear();
  });

  test('catalogHandler only returns metas for channels present in the store (CACHE-04)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.ok(store, 'store.js not found');
    store.set('ntv-swimrewind', 'https://swimrewind.com/hls/stream.m3u8');
    const result = await addon.catalogHandler({ type: 'tv', id: 'ntv-live' });
    assert.ok(Array.isArray(result.metas), 'result.metas must be an array');
    assert.equal(result.metas.length, 1, 'should return exactly 1 channel (only what is in store)');
    assert.ok(result.metas.some(m => m.id === 'ntv-swimrewind'), 'ntv-swimrewind must be in metas');
  });

  test('catalogHandler returns all channels when all are in the store (CACHE-04)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.ok(store, 'store.js not found');
    const channels = require('./channels');
    for (const ch of channels) {
      store.set(ch.id, 'https://example.com/stream.m3u8');
    }
    const result = await addon.catalogHandler({ type: 'tv', id: 'ntv-live' });
    assert.ok(Array.isArray(result.metas), 'result.metas must be an array');
    assert.equal(result.metas.length, channels.length, 'all channels in store should all appear in metas');
  });

  test('streamHandler returns { streams: [{ url, title }], cacheMaxAge: 0 } for a channel IN the store (CACHE-04)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.ok(store, 'store.js not found');
    store.set('ntv-swimrewind', 'https://swimrewind.com/hls/stream.m3u8');
    const result = await addon.streamHandler({ type: 'tv', id: 'ntv-swimrewind' });
    assert.ok(result && typeof result === 'object', 'result must be an object');
    assert.ok(Array.isArray(result.streams), 'result.streams must be an array');
    assert.equal(result.streams.length, 1, 'should return 1 stream for channel in store');
    assert.equal(result.streams[0].url, 'https://swimrewind.com/hls/stream.m3u8');
    assert.ok(result.streams[0].title, 'stream must have a title');
    assert.equal(result.cacheMaxAge, 0);
  });

  test('streamHandler returns { streams: [], cacheMaxAge: 0 } for a channel NOT in the store (CACHE-04)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.ok(store, 'store.js not found');
    // store is empty after beforeEach clear
    const result = await addon.streamHandler({ type: 'tv', id: 'ntv-swimrewind' });
    assert.ok(result && typeof result === 'object', 'result must be an object');
    assert.ok(Array.isArray(result.streams), 'result.streams must be an array');
    assert.equal(result.streams.length, 0, 'should return empty streams for channel not in store');
    assert.equal(result.cacheMaxAge, 0);
  });
});

describe('addon UI-01: poster fields', () => {
  beforeEach(() => {
    if (store) store.clear();
  });

  test('catalogHandler returns a non-empty string poster on every meta item (UI-01)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.ok(store, 'store.js not found');
    const channels = require('./channels');
    for (const ch of channels) {
      store.set(ch.id, 'https://example.com/stream.m3u8');
    }
    const result = await addon.catalogHandler({ type: 'tv', id: 'ntv-live' });
    assert.ok(Array.isArray(result.metas), 'result.metas must be an array');
    for (const m of result.metas) {
      assert.equal(typeof m.poster, 'string', `meta ${m.id} poster must be a string`);
      assert.ok(m.poster.length > 0, `meta ${m.id} poster must be non-empty`);
    }
  });

  test('catalogHandler returns posterShape === "square" on every meta item (UI-01)', async () => {
    assert.ok(addon, 'addon.js not found');
    assert.ok(store, 'store.js not found');
    const channels = require('./channels');
    for (const ch of channels) {
      store.set(ch.id, 'https://example.com/stream.m3u8');
    }
    const result = await addon.catalogHandler({ type: 'tv', id: 'ntv-live' });
    assert.ok(Array.isArray(result.metas), 'result.metas must be an array');
    for (const m of result.metas) {
      assert.equal(m.posterShape, 'square', `meta ${m.id} posterShape must be "square"`);
    }
  });

  test('metaHandler returns a non-empty string poster on the meta object (UI-01)', async () => {
    assert.ok(addon, 'addon.js not found');
    const channels = require('./channels');
    const result = await addon.metaHandler({ type: 'tv', id: channels[0].id });
    assert.ok(result && result.meta && typeof result.meta === 'object', 'result.meta must be an object');
    assert.equal(typeof result.meta.poster, 'string', 'meta.poster must be a string');
    assert.ok(result.meta.poster.length > 0, 'meta.poster must be non-empty');
  });

  test('metaHandler returns posterShape === "square" on the meta object (UI-01)', async () => {
    assert.ok(addon, 'addon.js not found');
    const channels = require('./channels');
    const result = await addon.metaHandler({ type: 'tv', id: channels[0].id });
    assert.ok(result && result.meta && typeof result.meta === 'object', 'result.meta must be an object');
    assert.equal(result.meta.posterShape, 'square', 'meta.posterShape must be "square"');
  });
});
