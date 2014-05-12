module.exports = Redis;

var Promise = require('bluebird');
var Utils = require('./utils');

function Redis () {
  var redis = require('redis');
  this.client = redis.createClient.apply(redis, arguments);
  this._get = Promise.promisify(this.client.get, this.client);
  this._set = Promise.promisify(this.client.set, this.client);
  this._del = Promise.promisify(this.client.del, this.client);
  this._keys = Promise.promisify(this.client.keys, this.client);

  this.flush = Promise.promisify(this.client.flushdb, this.client);
}

Redis.available = (function () {
  try {
    require.resolve('redis');
    return true;
  } catch (err) {
    return false;
  }
})();

Redis.prototype.put = function (key, value, expiration) {
  key = Utils.key('', key);
  value = Utils.assemble(value, expiration);
  return this._set(key, value);
};

Redis.prototype.get = function (key) {
  key = Utils.key('', key);
  return this._get(key).then(function (data) {
    return data ? JSON.parse(data) : data;
  });
};

Redis.prototype.delete = function (key) {
  var that = this;
  key = Utils.key('', key);
  return this._keys(key + '*').then(function (keys) {
    return Promise.all(keys.map(function (key) {
      return that._del(key);
    }));
  });
};

Redis.prototype.lock = function (key) {
  key = Utils.key('', key + '_lock');
  return this._set(key, 1);
};

Redis.prototype.unlock = function (key) {
  key = Utils.key('', key + '_lock');
  return this._del(key);
};

Redis.prototype.isLocked = function (key) {
  key = Utils.key('', key + '_lock');
  return this._get(key).then(function (value) {
    return Boolean(value);
  });
};
