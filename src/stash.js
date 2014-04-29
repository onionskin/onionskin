(function (exports) {
  var Stash = exports.Stash || {};
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
    };

    Item.prototype._load_ = function (callback) {
      var that = this;

      var value = this.pool.drivers.reduce(function (a, b) {
        return a || b.get(that.key, function (data) {
          if (that && data) {
            that.value = data.value;
            that.expiration = data.expiration;
            that.locked = data.locked;
            callback && callback(that);
            that = false;
          }
        });
      }, false);

      return this;
    };

    Item.prototype._write_ = function (callback) {
      var that = this;

      this.pool.drivers.reverse().forEach(function (driver) {
        driver.put(that.key, that.value, that.expiration, function (err) {
          callback && callback(err);
          callback = null;
        });
      });
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
      this.cachePolicy = cachePolicy || Stash.Item.SP_NONE;
      this.policyData = policyData;

      if ((cachePolicy & Stash.Item.SP_VALUE) && this.locked) {
        return policyData;
      }

      return this._load_(function (item) {
        callback && callback(item.value);
      }).value;
    };

    Item.prototype.set = function (value, expiration, callback) {
      if (typeof expiration === 'function') {
        callback = expiration;
        expiration = null;
      }

      this._unload_();

      this.expiration = Item._calculateExpiration_(expiration);
      this.value = value;

      this._write_(callback);
    };

    Item.prototype.isMiss = function (callback) {
      this.isLocked(function (locked) {
        if (locked && (this.cachePolicy & Stash.Item.SP_OLD)) {
          return false;
        } else if (!locked &&
                   (this.cachePolicy & Stash.Item.SP_PRECOMPUTE) &&
                   this.policyData * 1000 >= this.expiration - Date.now()) {
          return true;
        }

        var miss = typeof(this.expiration) === 'number' && this.expiration < Date.now();
        callback(miss);
      }.bind(this));
    };

    Item.prototype.clear = function () {
      var that = this;

      this._unload_();

      this.pool.drivers.forEach(function (driver) {
        driver.delete(that.key);
      });
    };

    Item.prototype.lock = function () {
      this.pool.drivers.forEach(function (driver) {
        driver.lock(this.key)
      }.bind(this));
    };

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

    return LocalStorage;
  })();

  exports.Stash = Stash;
})(typeof(window) === 'undefined' ? module.exports : window);
