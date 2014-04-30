(function (global) {
  var Stash = global.Stash || {};
  var isNode = typeof require !== 'undefined';

  if (isNode) {
    Q = require('q');
  }

  Stash.Item = (function () {
    function Item(key, pool) {
      this.key = key;
      this.pool = pool;

      this._unload_();
    }

    Item.SP_NONE = 1;
    Item.SP_OLD = 2;
    Item.SP_PRECOMPUTE = 4;
    Item.SP_VALUE = 8;

    Item.prototype._unload_ = function () {
      this.value = null;
      this.expiration = false;
      this.locked = undefined;
    };

    Item.prototype._load_ = function (callback) {
      var deferred = Q.defer();

      this.pool.drivers.forEach(function (d) {
        return d.get(this.key).then(deferred.resolve);
      }.bind(this));


      return deferred.promise;
    };

    Item.prototype._write_ = function (callback) {
      var deferred = Q.defer();
      this.pool.drivers.reverse().forEach(function (d) {
        return d.put(this.key, this.value, this.expiration).then(deferred.resolve);
      }.bind(this));

      return deferred.promise;
    };

    Item._calculateExpiration_ = function (expiration) {
      if (typeof(expiration) === 'number') {
        expiration *= 1000;
        expiration += Date.now();
      } else if (expiration instanceof Date) {
        expiration = expiration.getTime();
      }

      return expiration;
    };

    Item.prototype.get = function (cachePolicy, policyData) {
      var deferred = Q.defer();
      this.cachePolicy = cachePolicy || Stash.Item.SP_NONE;
      this.policyData = policyData;

      if ((cachePolicy & Stash.Item.SP_VALUE) && this.locked) {
        deferred.resolve(policyData);
      }

      this._load_().then(function (data) {
        if (data) {
          this.value = data.value;
          this.expiration = data.expiration;
          data = data.value || null;
        }
        deferred.resolve(data);
      }.bind(this));

      return deferred.promise;
    };

    Item.prototype.set = function (value, expiration, callback) {
      if (typeof expiration === 'function') {
        callback = expiration;
        expiration = null;
      }

      this._unload_();

      this.expiration = Item._calculateExpiration_(expiration);
      this.value = value;

      this.unlock();
      return this._write_();
    };

    Item.prototype.isMiss = function (callback) {
      var deferred = Q.defer();

      var  resolve = function (locked) {
        var miss;

        if (locked && (this.cachePolicy & Stash.Item.SP_OLD)) {
          miss = false;
        } else if (!locked &&
                   (this.cachePolicy & Stash.Item.SP_PRECOMPUTE) &&
                   this.policyData * 1000 >= this.expiration - Date.now()) {
          miss =  true;
        } else {
          miss = this.value === null ||
            typeof(this.expiration) === 'number' &&
            this.expiration < Date.now();
        }

        deferred.resolve(miss);
      }.bind(this);

      if (this.locked !== undefined) {
        resolve(this.locked);
      } else {
        this.isLocked().then(resolve);
      }

      return deferred.promise;
    };

    Item.prototype.clear = function () {
      var deferred = Q.defer();
      this._unload_();

      this.pool.drivers.forEach(function (driver) {
        driver.delete(this.key).then(deferred.resolve);
      }.bind(this));

      return deferred.promise;
    };

    Item.prototype.lock = function () {
      if (this.locked === true) {
        return Q(this.locked);
      }

      this.locked = true;
      var deferred = Q.defer();

      this.pool.drivers.forEach(function (d) {
        d.lock(this.key).then(deferred.resolve);
      }.bind(this));

      return deferred.promise;
    };

    Item.prototype.isLocked = function () {
      var deferred = Q.defer();

      if (this.locked !== undefined) {
        deferred.resolve(this.locked);
      } else {
        this.pool.drivers.forEach(function (d) {
          d.isLocked(this.key).then(function (locked) {
            this.locked = locked;
            deferred.resolve(locked);
          }.bind(this));
        }.bind(this));
      }

      return deferred.promise;
    };

    Item.prototype.unlock = function () {
      if (this.locked === false) {
        return Q();
      }

      this.locked = false;
      var deferred = Q.defer();

      this.pool.drivers.forEach(function (d) {
        d.unlock(this.key).then(deferred.resolve);
      }.bind(this));

      return deferred.promise;
    }

    return Item;
  })();

  Stash.Pool = (function () {
    function Pool(drivers) {
      if (!drivers) {
        this.drivers = [new Stash.Drivers.Ephemeral()];
      } else if (Object.prototype.toString.call(drivers) !== '[object Array]') {
        this.drivers = [drivers];
      } else {
        this.drivers = drivers;
      }
    }

    Pool.prototype.getItem = function (key) {
      var item = new Stash.Item(key, this);

      return item;
    };

    Pool.prototype.flush = function () {
      this.drivers.forEach(function (driver) {
        driver.flush();
      });
    };

    Pool.prototype.get = function (key) {
      var item = this.getItem(key);
      var deferred = Q.defer();

      item.get().then(function (data) {
        item.isMiss().then(function (missed) {
          if (missed) {
            item.lock();
            deferred.reject(item.set.bind(item));
          } else {
            deferred.resolve(data);
          }
        });
      });

      return deferred.promise;
    };

    return Pool;
  })();

  Stash.Drivers = {};
  Stash.Drivers.Utils = {
    assemble: function (value, expiration) {
      if (typeof value === 'function') {
        throw new TypeError('Only serializables values can be cached');
      }

      return JSON.stringify({ value: value, expiration: expiration });
    },
    key: function (namespace, key) {
      if (key instanceof Array) {
        key.unshift(namespace);
        return key.filter(String).join('/');
      } else {
       key = key.toString()
        .trim()
        .replace(/^\/+/g, '')
        .replace(/\/+$/g, '');
       return namespace + '/' + key;
      }
    }
  };

  Stash.Drivers.Ephemeral = (function () {
    var cache = {};
    function Ephemeral () {}

    Ephemeral.prototype.get = function (key) {
      key = Stash.Drivers.Utils.key('', key);
      var data = cache[key] || null;

      if (data) {
        data = JSON.parse(data);
      }

      return Q(data);
    };

    Ephemeral.prototype.put = function (key, value, expiration) {
      key = Stash.Drivers.Utils.key('', key);
      var data = Stash.Drivers.Utils.assemble(value, expiration);
      cache[key] = data;
      return Q();
    };

    Ephemeral.prototype.delete = function (key) {
      key = Stash.Drivers.Utils.key('', key);
      var length = key.length;

      Object.keys(cache).forEach(function (_key) {
        if (_key.substr(0, length) === key) {
          cache[_key] = null;
        }
      });

      cache[key] = null;
      return Q();
    };

    Ephemeral.prototype.flush = function () {
      cache = {};
      return Q();
    };

    Ephemeral.prototype.lock = function (key) {
      var key = Stash.Drivers.Utils.key('', key) + '_lock';
      cache[key] = 1;
      return Q();
    };

    Ephemeral.prototype.isLocked = function (key) {
      key = Stash.Drivers.Utils.key('', key) + '_lock';
      return Q(Boolean(cache[key]));
    }

    Ephemeral.prototype.unlock = function (key) {
      key = Stash.Drivers.Utils.key('', key) + '_lock';
      cache[key] = null;
      return Q();
    };

    return Ephemeral;
  })();

  Stash.Drivers.LocalStorage = (function () {
    function LocalStorage (namespace) {
      this.namespace = namespace || 'stash';
    }

    LocalStorage.prototype.get = function (key) {
      key = Stash.Drivers.Utils.key(this.namespace, key);
      var data = localStorage.getItem(key);
      
      if (data) {
        data = JSON.parse(data);
      }

      return Q(data);
    }

    LocalStorage.prototype.put = function (key, value, expiration) {
      key = Stash.Drivers.Utils.key(this.namespace, key);
      var data = Stash.Drivers.Utils.assemble(value, expiration);

      return this.putRaw(key, data);
    };

    LocalStorage.prototype.putRaw = function (key, value) {
      localStorage.setItem(key, value);
      return Q();
    }

    LocalStorage.prototype.delete = function (key) {
      key = Stash.Drivers.Utils.key(this.namespace, key);
      var length = key.length;

      for (var i = 0, l = localStorage.length; i < l; i++) {
        var _key = localStorage.key(i);
        if (_key && _key.substr(0, length) === key) {
          localStorage.removeItem(_key);
        }
      }

      localStorage.removeItem(key);
      return Q();
    };

    LocalStorage.prototype.flush = function () {
      return this.delete('');
    };

    LocalStorage.prototype.lock = function (key) {
      key = Stash.Drivers.Utils.key(this.namespace, key) + '_lock';
      return this.putRaw(key, 1);
    };

    LocalStorage.prototype.isLocked = function (key) {
      var deferred = Q.defer();
      this.get(key + '_lock').then(function (data) {
        deferred.resolve(Boolean(data));
      });

      return deferred.promise;
    };

    LocalStorage.prototype.unlock = function (key) {
      key = Stash.Drivers.Utils.key(this.namespace, key) + '_lock';
      localStorage.removeItem(key);

      return Q();
    }

    return LocalStorage;
  })();

  if (isNode) {
    module.exports = Stash;
  } else {
    global.Stash = Stash;
  }
})(this);
