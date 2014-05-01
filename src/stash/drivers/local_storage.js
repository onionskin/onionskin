module.exports = LocalStorage;

var Promise = require('bluebird');
var Utils = require('./utils');

function LocalStorage (namespace) {
  this.namespace = namespace || 'stash';
}

LocalStorage.available = typeof localStorage !== 'undefined';

LocalStorage.prototype.get = function (key) {
  key = Utils.key(this.namespace, key);
  var data = localStorage.getItem(key);
  
  if (data) {
    data = JSON.parse(data);
  }

  return Promise.cast(data);
};

LocalStorage.prototype.put = function (key, value, expiration) {
  key = Utils.key(this.namespace, key);
  var data = Utils.assemble(value, expiration);

  return this.putRaw(key, data);
};

LocalStorage.prototype.putRaw = function (key, value) {
  localStorage.setItem(key, value);
  return Promise.cast();
};

LocalStorage.prototype.delete = function (key) {
  key = Utils.key(this.namespace, key);
  var length = key.length;

  for (var i = 0, l = localStorage.length; i < l; i++) {
    var _key = localStorage.key(i);
    if (_key && _key.substr(0, length) === key) {
      localStorage.removeItem(_key);
    }
  }

  return Promise.cast();
};

LocalStorage.prototype.flush = function () {
  return this.delete('');
};

LocalStorage.prototype.lock = function (key) {
  key = Utils.key(this.namespace, key) + '_lock';
  return this.putRaw(key, 1);
};

LocalStorage.prototype.isLocked = function (key) {
  var that = this;
  return new Promise(function (resolve) {
    that.get(key + '_lock').then(function (data) {
      resolve(Boolean(data));
    });
  });
};

LocalStorage.prototype.unlock = function (key) {
  key = Utils.key(this.namespace, key) + '_lock';
  localStorage.removeItem(key);

  return Promise.cast();
};
