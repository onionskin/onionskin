var Promise = require('bluebird');
module.exports = IndexedDB;

function IndexedDB () {
  this.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  this.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
  this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
}

IndexedDB.available = (function () {
  return typeof window !== 'undefined' && (
    'indexedDB' in window ||
    'mozIndexedDB' in window ||
    'webkitIndexedDB' in window ||
    'msIndexedDB' in window
  );
})();
