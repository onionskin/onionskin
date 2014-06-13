var Promise = require('bluebird');
var Utils = require('./utils');

module.exports = IndexedDB;

function IndexedDB(namespace) {
  this.namespace = namespace || 'onionskin';

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
  this.db = function () {
    return new Promise(function (resolve, reject) {
      var request = that.indexedDB.open(that.namespace);
      request.onerror = function (event) {
        reject(event.target.error);
      };
      request.onsuccess = function () {
        resolve(request.result);
      };
      request.onupgradeneeded = function (event) {
        var db = event.target.result;
        var objectStore = db.createObjectStore('cache', { keyPath:  'key' });
        objectStore.createIndex('key', 'key', { unique: true });
      };
    }).bind(this);
  };
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
  value = Utils.assemble(value, expiration, key, false);
  return this._key(key).then(function (k) {
    value.key = k;
    return this._put(value);
  });
};

IndexedDB.prototype._put = function (value) {
  return this.db().then(function (db) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction('cache', 'readwrite');
      var store = transaction.objectStore('cache');
      transaction.onerror = function (err) {
        reject(err.target.error);
      };
      transaction.oncomplete = resolve;
      store.put(value);
    });
  });
};

IndexedDB.prototype.get = function (key) {
  return this._key(key).then(this._get).then(function (value) {
    if (value) {
      delete value.key;
    }
    return value;
  });
};

IndexedDB.prototype._get = function (key) {
  return this.db().then(function (db) {
    var store = db.transaction('cache').objectStore('cache');
    var request = store.get(key);
    return new Promise(function (resolve, reject) {
      request.onerror = function (err) {
        reject(err.target.error);
        db.close();
      };
      request.onsuccess = function () {
        resolve(request.result || null);
        db.close();
      };
    });
  });
};

IndexedDB.prototype.delete = function (key) {
  return this._key(key).then(function (k) {
    return this.db().then(function (db) {
      var transaction = db.transaction('cache', 'readwrite');
      var store = transaction.objectStore('cache');
      var index = store.index('key');
      var keyRange = this.IDBKeyRange.lowerBound(k);

      return new Promise(function (resolve, reject) {
        var cursor = index.openKeyCursor(keyRange);
        var queue = [];

        cursor.onerror = function (event) {
          reject(event.target.error);
        };
        cursor.onsuccess = function (event) {
          var cursor = event.target.result;
          if (cursor) {
            if (cursor.key.substr(0, k.length) === k) {
              queue.push(new Promise(function (resolve, reject) {
                var request = store.delete(cursor.key);
              }));
            }
            cursor.continue();
          }
        };

        transaction.onerror = function (event) {
          reject(event.target.error);
          db.close();
        };
        transaction.oncomplete = function () {
          resolve.apply(this, arguments);
          db.close();
        };
      });
    });
  });
};

IndexedDB.prototype._delete = function (key) {
  return this.db().then(function (db) {
    return new Promise(function (resolve, reject) {
      var transaction = db.transaction('cache', 'readwrite');
      var store = transaction.objectStore('cache');
      transaction.oncomplete = function () {
        resolve();
        db.close();
      };
      transaction.onerror = function (err) {
        reject(err.target.error);
        db.close();
      };
      store.delete(key);
    });
  });
};

IndexedDB.prototype.isLocked = function (key) {
  return this._key(key+'_lock').then(this._get).then(function (value) {
    return Boolean(value);
  });
};
IndexedDB.prototype.lock = function (key) {
  return this._key(key+'_lock').then(function (k) {
    return this._put({ key: k, value: 1 });
  });
};
IndexedDB.prototype.unlock = function (key) {
  return this._key(key+'_lock').then(this._delete);
};

IndexedDB.prototype.flush = function () {
  return this.db().then(function (db) {
    return new Promise(function (resolve, reject) {
      var store = db.transaction('cache', 'readwrite').objectStore('cache');
      var request = store.clear();
      request.onerror = function (err) {
        reject(err.target.error);
        db.close();
      };
      request.onsuccess = function () {
        resolve(request.result);
        db.close();
      };
    });
  });
};

IndexedDB.prototype._key = function (key) {
  key = Utils.key(this.namespace, key);
  return Promise.cast(key).bind(this);
};
