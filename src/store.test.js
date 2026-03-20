'use strict';
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');

let store;
try { store = require('./store'); } catch { store = null; }

describe('store (CACHE-01)', () => {
  beforeEach(() => {
    if (store) store.clear();
  });

  test('get returns null for an unknown id', () => {
    assert.ok(store, 'store.js not found');
    assert.equal(store.get('ntv-unknown'), null);
  });

  test('set then get returns the stored URL string', () => {
    assert.ok(store, 'store.js not found');
    store.set('ntv-nickpicks', 'https://example.com/stream.m3u8');
    assert.equal(store.get('ntv-nickpicks'), 'https://example.com/stream.m3u8');
  });

  test('clear empties the store (get returns null after clear)', () => {
    assert.ok(store, 'store.js not found');
    store.set('ntv-nickpicks', 'https://example.com/stream.m3u8');
    store.clear();
    assert.equal(store.get('ntv-nickpicks'), null);
  });

  test('all() returns the underlying Map (iterable)', () => {
    assert.ok(store, 'store.js not found');
    store.set('ntv-nickpicks', 'https://example.com/stream.m3u8');
    store.set('ntv-cnclassic', 'https://example.com/cn.m3u8');
    const all = store.all();
    assert.ok(all != null, 'all() must return a value');
    assert.ok(typeof all[Symbol.iterator] === 'function', 'all() result must be iterable');
    const entries = [...all];
    assert.equal(entries.length, 2, 'all() must contain exactly 2 entries');
  });

  test('set overwrites an existing entry with a new URL', () => {
    assert.ok(store, 'store.js not found');
    store.set('ntv-nickpicks', 'https://example.com/old.m3u8');
    store.set('ntv-nickpicks', 'https://example.com/new.m3u8');
    assert.equal(store.get('ntv-nickpicks'), 'https://example.com/new.m3u8');
  });
});
