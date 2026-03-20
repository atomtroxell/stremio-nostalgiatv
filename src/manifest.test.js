'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

let manifest;
try { manifest = require('./manifest'); } catch { manifest = null; }

describe('manifest', () => {
  test('module loads', () => {
    assert.ok(manifest, 'manifest.js not found');
  });

  test('idPrefixes is a non-empty array (CORE-02 — Android bug prevention)', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.ok(Array.isArray(manifest.idPrefixes), 'idPrefixes must be an array');
    assert.ok(manifest.idPrefixes.length > 0, 'idPrefixes must not be empty');
  });

  test('types includes "tv"', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.ok(Array.isArray(manifest.types), 'types must be an array');
    assert.ok(manifest.types.includes('tv'), 'types must include "tv"');
  });

  test('resources includes "catalog", "meta", and "stream"', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.ok(Array.isArray(manifest.resources), 'resources must be an array');
    assert.ok(manifest.resources.includes('catalog'), 'resources must include "catalog"');
    assert.ok(manifest.resources.includes('meta'), 'resources must include "meta"');
    assert.ok(manifest.resources.includes('stream'), 'resources must include "stream"');
  });

  test('catalogs has at least one entry with type "tv"', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.ok(Array.isArray(manifest.catalogs), 'catalogs must be an array');
    assert.ok(manifest.catalogs.length > 0, 'catalogs must not be empty');
    const tvCatalog = manifest.catalogs.find((c) => c.type === 'tv');
    assert.ok(tvCatalog, 'catalogs must have at least one entry with type "tv"');
  });

  test('id and version fields are non-empty strings', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.equal(typeof manifest.id, 'string', 'id must be a string');
    assert.ok(manifest.id.length > 0, 'id must be non-empty');
    assert.equal(typeof manifest.version, 'string', 'version must be a string');
    assert.ok(manifest.version.length > 0, 'version must be non-empty');
  });

  test('logo is a non-empty string (UI-02)', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.equal(typeof manifest.logo, 'string', 'manifest.logo must be a string');
    assert.ok(manifest.logo.length > 0, 'manifest.logo must be non-empty');
  });

  test('background is a non-empty string (UI-02)', () => {
    assert.ok(manifest, 'manifest.js not found');
    assert.equal(typeof manifest.background, 'string', 'manifest.background must be a string');
    assert.ok(manifest.background.length > 0, 'manifest.background must be non-empty');
  });
});
