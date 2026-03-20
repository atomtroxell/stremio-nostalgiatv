'use strict';

const store = new Map();

function get(id) {
  return store.get(id) || null;
}

function set(id, url) {
  store.set(id, url);
}

function clear() {
  store.clear();
}

function all() {
  return store;
}

module.exports = { get, set, clear, all };
