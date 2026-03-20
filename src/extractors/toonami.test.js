'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

let extractor;
try { extractor = require('./toonami'); } catch { extractor = null; }

describe('toonami extractor (SRC-02)', () => {
  test('module loads', () => {
    assert.ok(extractor, 'toonami.js not found — RED until Plan 02');
  });

  test('extract() returns an array', async () => {
    assert.ok(extractor, 'toonami.js not found');
    const results = await extractor.extract();
    assert.ok(Array.isArray(results), 'extract() must return an array');
  });

  test('extract() returns exactly 7 channels', async () => {
    assert.ok(extractor, 'toonami.js not found');
    const results = await extractor.extract();
    assert.equal(results.length, 7, `expected 7 channels, got ${results.length}`);
  });

  test('every entry has id starting with ntv-toonamiaftermath-', async () => {
    assert.ok(extractor, 'toonami.js not found');
    const results = await extractor.extract();
    for (const entry of results) {
      assert.ok(
        entry.id && entry.id.startsWith('ntv-toonamiaftermath-'),
        `entry id "${entry.id}" does not start with ntv-toonamiaftermath-`
      );
    }
  });

  test('every entry has url starting with http://api.toonamiaftermath.com:3000/', async () => {
    assert.ok(extractor, 'toonami.js not found');
    const results = await extractor.extract();
    for (const entry of results) {
      assert.ok(
        entry.url && entry.url.startsWith('http://api.toonamiaftermath.com:3000/'),
        `entry url "${entry.url}" does not start with http://api.toonamiaftermath.com:3000/`
      );
    }
  });

  test('exports name property equal to toonami', () => {
    assert.ok(extractor, 'toonami.js not found');
    assert.equal(extractor.name, 'toonami');
  });
});
