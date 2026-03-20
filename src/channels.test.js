'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

let channels;
try { channels = require('./channels'); } catch { channels = null; }

describe('channels', () => {
  test('module loads', () => {
    assert.ok(channels, 'channels.js not found');
  });

  test('all channels have a non-empty string name field (META-01)', () => {
    assert.ok(channels, 'channels.js not found');
    assert.ok(Array.isArray(channels), 'channels must be an array');
    for (const ch of channels) {
      assert.equal(typeof ch.name, 'string', `channel ${ch.id} name must be a string`);
      assert.ok(ch.name.length > 0, `channel ${ch.id} name must be non-empty`);
    }
  });

  test('all channels have a non-empty string description field (META-02)', () => {
    assert.ok(channels, 'channels.js not found');
    assert.ok(Array.isArray(channels), 'channels must be an array');
    for (const ch of channels) {
      assert.equal(typeof ch.description, 'string', `channel ${ch.id} description must be a string`);
      assert.ok(ch.description.length > 0, `channel ${ch.id} description must be non-empty`);
    }
  });

  test('all channel id values start with "ntv-"', () => {
    assert.ok(channels, 'channels.js not found');
    assert.ok(Array.isArray(channels), 'channels must be an array');
    for (const ch of channels) {
      assert.ok(
        typeof ch.id === 'string' && ch.id.startsWith('ntv-'),
        `channel id "${ch.id}" must start with "ntv-"`
      );
    }
  });

  test('no duplicate channel IDs', () => {
    assert.ok(channels, 'channels.js not found');
    assert.ok(Array.isArray(channels), 'channels must be an array');
    const ids = channels.map((ch) => ch.id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, 'duplicate channel IDs found');
  });
});
