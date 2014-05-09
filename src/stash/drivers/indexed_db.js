var Promise = require('bluebird');
var Utils = require('./utils');

module.exports = IndexedDB;

function IndexedDB (namespace) {
  this.namespace = namespace || 'stash';

  this.indexedDB = window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB;
  this.IDBTransaction = window.IDBTransaction ||
    window.webkitIDBTransaction ||
    window.msIDBTransaction;
  this.IDBKeyRange = window.IDBKeyRange ||
    window.webkitIDBKeyRange ||
    window.msIDBKeyRange;

  var that = this;
  this.db = new Promise(function (resolve, reject) {
    var request = that.indexedDB.open('stash_db');
    request.onerror = reject;
    request.onsuccess = function () {
      resolve(request.result);
    };
    request.onupgradeneeded = function (event) {
      var db = event.target.result;
      var objectStore = db.createObjectStore('cache', { keyPath:  'key' });
      objectStore.createIndex('key', 'key', { unique: true });
    };
  });
}

IndexedDB.available = (function () {
  return typeof window !== 'undefined' && (
    'indexedDB' in window ||
    'mozIndexedDB' in window ||
    'webkitIndexedDB' in window ||
    'msIndexedDB' in window
  );
})();

IndexedDB.prototype.put = function (key, value, expiration) {
  key = Utils.key(this.namespace, key);
  value = Utils.assemble(value, expiration, key, false);
  return this.db.then(function (db) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction('cache', 'readwrite');
      var store = transaction.objectStore('cache');
      transaction.onerror = reject;
      transaction.oncomplete = resolve;
      store.add(value);
    });
  });
};

IndexedDB.prototype.get = function (key) {
  key = Utils.key(this.namespace, key);
  return this.db.then(function (db) {
    var store = db.transaction('cache').objectStore('cache');
    var request = store.get(key);
    return new Promise(function (resolve, reject) {
      request.onerror = reject;
      request.onsuccess = function () {
        if (request.result) {
          delete request.result.key;
        }
        resolve(request.result || null);
      };
    });
  });
};

IndexedDB.prototype.flush = function () {
  return this.db.then(function (db) {
    return new Promise(function (resolve, reject) {
      var store = db.transaction('cache', 'readwrite').objectStore('cache');
      var request = store.clear();
      request.onerror = reject;
      request.onsuccess = resolve;
    });
  });
};
