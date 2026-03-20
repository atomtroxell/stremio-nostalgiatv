'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

let extractor;
try { extractor = require('./swimrewind'); } catch { extractor = null; }

describe('swimrewind extractor (SRC-04)', () => {
  test('module loads', () => {
    assert.ok(extractor, 'swimrewind.js not found — RED until Plan 02');
  });

  test('extract() returns exactly 1 channel', async () => {
    assert.ok(extractor, 'swimrewind.js not found');
    const results = await extractor.extract();
    assert.ok(Array.isArray(results), 'extract() must return an array');
    assert.equal(results.length, 1, `expected 1 channel, got ${results.length}`);
  });

  test('entry id is ntv-swimrewind', async () => {
    assert.ok(extractor, 'swimrewind.js not found');
    const results = await extractor.extract();
    assert.equal(results[0].id, 'ntv-swimrewind');
  });

  test('entry url is the Owncast HLS endpoint', async () => {
    assert.ok(extractor, 'swimrewind.js not found');
    const results = await extractor.extract();
    assert.equal(results[0].url, 'https://swimrewind.com/hls/stream.m3u8');
  });

  test('exports name property equal to swimrewind', () => {
    assert.ok(extractor, 'swimrewind.js not found');
    assert.equal(extractor.name, 'swimrewind');
  });
});
