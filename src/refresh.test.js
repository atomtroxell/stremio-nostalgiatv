'use strict';
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let refresh;
try { refresh = require('./refresh'); } catch { refresh = null; }
let store;
try { store = require('./store'); } catch { store = null; }

const stubResolveUrl = async (url) => 'https://resolved.example.com/final.m3u8';

const failingExtractor = {
  name: 'failing',
  extract: async () => { throw new Error('network error'); },
};

const workingExtractor = {
  name: 'working',
  extract: async () => [{ id: 'ntv-test', url: 'https://original.example.com/stream' }],
};

describe('refresh (CACHE-01, CACHE-02, CACHE-03)', () => {
  beforeEach(() => {
    if (store) store.clear();
  });

  test('CACHE-01: refreshWith with a working extractor writes results to the store', async () => {
    assert.ok(refresh, 'refresh.js not found');
    assert.ok(store, 'store.js not found');
    assert.equal(typeof refresh.refreshWith, 'function', 'refresh.refreshWith must be a function');
    await refresh.refreshWith([workingExtractor], stubResolveUrl);
    assert.ok(store.get('ntv-test') !== null, 'store should have entry for ntv-test after refresh');
  });

  test('CACHE-02: refreshWith stores the resolveUrlFn return value, not the original extractor URL', async () => {
    assert.ok(refresh, 'refresh.js not found');
    assert.ok(store, 'store.js not found');
    await refresh.refreshWith([workingExtractor], stubResolveUrl);
    assert.equal(
      store.get('ntv-test'),
      'https://resolved.example.com/final.m3u8',
      'stored URL must be the resolveUrlFn return value'
    );
  });

  test('CACHE-03: working extractor writes to store even when failing extractor throws first', async () => {
    assert.ok(refresh, 'refresh.js not found');
    assert.ok(store, 'store.js not found');
    await refresh.refreshWith([failingExtractor, workingExtractor], stubResolveUrl);
    assert.ok(
      store.get('ntv-test') !== null,
      'working extractor result should be in store despite failing extractor'
    );
  });

  test('CACHE-03: refreshWith resolves without error even when all extractors fail', async () => {
    assert.ok(refresh, 'refresh.js not found');
    await assert.doesNotReject(
      () => refresh.refreshWith([failingExtractor], stubResolveUrl),
      'refreshWith must not throw when all extractors fail'
    );
  });

  test('CACHE-03: falls back to original URL when resolveUrlFn throws (e.g. bad server headers)', async () => {
    assert.ok(refresh, 'refresh.js not found');
    assert.ok(store, 'store.js not found');
    const throwingResolve = async () => { throw new Error('Parse Error: Content-Length can\'t be present with Transfer-Encoding'); };
    await refresh.refreshWith([workingExtractor], throwingResolve);
    assert.equal(
      store.get('ntv-test'),
      'https://original.example.com/stream',
      'should fall back to original extractor URL when resolve fails'
    );
  });
});
