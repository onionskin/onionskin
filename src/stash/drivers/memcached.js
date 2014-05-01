module.exports = Memcached;

var Promise = require('bluebird');
var Utils = require('./utils');

function Memcached(serverLocations, options) {
  var MemcachedLib = require('memcached');
  this.client = new MemcachedLib(serverLocations, options);
  this._set = Promise.promisify(this.client.set, this.client);
  this._get = Promise.promisify(this.client.get, this.client);
  this._del = Promise.promisify(this.client.del, this.client);
  this._incr = Promise.promisify(this.client.incr, this.client);
  this.flush = Promise.promisify(this.client.flush, this.client);
}

Memcached.available = (function () {
  try {
    require.resolve('memcached');
    return true;
  } catch (err) {
    return false;
  }
})();

Memcached.prototype.put = function (key, value, expiration) {
  var that = this;
  value = Utils.assemble(value, expiration);
  return this._key(key).then(function (key) {
    that._set(key, value, expiration || 604800);
  });
};

Memcached.prototype.get = function (key) {
  var that = this;

  return this._key(key).then(function (key) {
    return that._get(key);
  }).then(function (data) {
    return data ? JSON.parse(data) : (data || null);
  });
};

Memcached.prototype.delete = function (key) {
  var that = this;
  return this._key(key).then(function (key) {
    key = key.replace(/\d+$/, '_ns');
    return that._incr(key, 1);
  });
};

Memcached.prototype.isLocked = function (key) {
  var that = this;
  return this._key(key).then(function (key) {
    return that._get(key + '_lock').then(function (locked) {
      return Boolean(locked);
    });
  });
};

Memcached.prototype.lock = function (key) {
  var that = this;
  return this._key(key).then(function (key) {
    return that._set(key + '_lock', 1, 60);
  });
};

Memcached.prototype.unlock = function (key) {
  var that = this;
  return this._key(key).then(function (key) {
    return that._del(key + '_lock');
  });
};

Memcached.prototype._key = function (key) {
  var that = this;
  key = Utils.key([], key);
  return Promise.reduce(key.split('/'), function (path, key) {
    path.push(key);
    return that._get(path.join('/') + '_ns').then(function (count) {
      var commit = function (path, key, count) {
        path.pop();
        path.push(key + count);
        return path;
      };

      if (count === false) {
        count = Date.now();
        return that._set(path.join('/') + '_ns', count, 0).then(function () {
          return commit(path, key, count);
        });
      } else {
          return commit(path, key, count);
      }
    });
  }, []).then(function (key) {
    return key.join('/');
  });
};
