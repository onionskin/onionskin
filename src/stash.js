(function (global) {
  var Stash = global.Stash || {};
  var isNode = typeof require !== 'undefined';
  var Promise = global.Promise;

  if (isNode) {
    Promise = require('bluebird');
  }

  Stash.Item = (function () {
    function Item(key, pool) {
      this.key = key;
      this.pool = pool;
      this.save = this.save.bind(this);

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
      var that = this;

      return new Promise(function (resolve, reject) {
        that.pool.drivers.forEach(function (d) {
          d.get(that.key).then(resolve);
        });
      });
    };

    Item.prototype._write_ = function (callback) {
      var that = this;

      return new Promise(function (resolve, reject) {
        that.pool.drivers.reverse().forEach(function (d) {
          d.put(that.key, that.value, that.expiration).then(resolve);
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
      var that = this;
      this.cachePolicy = cachePolicy || Stash.Item.SP_NONE;
      this.policyData = policyData;

      function load(resolve) {
        that._load_().then(function (data) {
          if (data) {
            that.value = data.value;
            that.expiration = data.expiration;
            data = typeof data.value === 'undefined' ? null : data.value;
          }

          resolve(data);
        });
      }

      return new Promise(function (resolve, reject) {
        if (that.cachePolicy & Stash.Item.SP_VALUE) {
          that.isLocked().then(function (locked) {
            if (locked) {
              resolve(that.policyData);
            } else {
              load(resolve);
            }
          });
        } else {
          load(resolve);
        }
      });
    };

    // alias for better syntax on Pool#get
    Item.prototype.save = function (value) {
      this.set(value);
      return value;
    };

    Item.prototype.set = function (value, expiration) {
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
      var that = this;

      var isMissed = function (locked, resolve) {
        var miss;

        if (locked && (that.cachePolicy & Stash.Item.SP_OLD)) {
          miss = false;
        } else if (!locked &&
                   (that.cachePolicy & Stash.Item.SP_PRECOMPUTE) &&
                   that.policyData * 1000 >= that.expiration - Date.now()) {
          miss =  true;
        } else {
          miss = that.value === null ||
            typeof(that.expiration) === 'number' &&
            that.expiration < Date.now();
        }

        resolve(miss);
      }

      return new Promise(function (resolve, reject) {
        if (that.locked !== undefined) {
          isMissed(that.locked, resolve);
        } else {
          that.isLocked().then(function (locked) {
           isMissed(locked, resolve);
          });
        }
      });
    };

    Item.prototype.clear = function () {
      var that = this;
      this._unload_();

      return new Promise(function (resolve, reject) {
        that.pool.drivers.forEach(function (driver) {
          driver.delete(that.key).then(resolve);
        });
      });
    };

    Item.prototype.lock = function () {
      if (this.locked === true) {
        return Promise.cast(this.locked);
      }

      this.locked = true;
      var that = this;

      return new Promise(function (resolve, reject) {
        that.pool.drivers.forEach(function (d) {
          d.lock(that.key).then(resolve);
        });
      });
    };

    Item.prototype.isLocked = function () {
      if (this.locked !== undefined) {
        return Promise.cast(this.locked);
      }

      var that = this;
      return new Promise(function (resolve, reject) {
        that.pool.drivers.forEach(function (d) {
          d.isLocked(that.key).then(function (locked) {
            that.locked = locked;
            resolve(locked);
          });
        });
      });
    };

    Item.prototype.unlock = function () {
      if (this.locked === false) {
        return Promise.cast();
      }

      this.locked = false;
      var that = this;

      return new Promise(function (resolve, reject) {
        that.pool.drivers.forEach(function (d) {
          d.unlock(that.key).then(resolve);
        });
      });
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

      return new Promise(function (resolve, reject) {
        item.get().then(function (data) {
          item.isMiss().then(function (missed) {
            if (missed) {
              item.lock();
              reject('Cache is missing');
            } else {
              resolve(data);
            }
          });
        });
      }).bind(item);
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
      var data = typeof cache[key] === 'undefined' ? null : cache[key];

      if (data) {
        data = JSON.parse(data);
      }

      return Promise.cast(data);
    };

    Ephemeral.prototype.put = function (key, value, expiration) {
      key = Stash.Drivers.Utils.key('', key);
      var data = Stash.Drivers.Utils.assemble(value, expiration);
      cache[key] = data;
      return Promise.cast();
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
      return Promise.cast();
    };

    Ephemeral.prototype.flush = function () {
      cache = {};
      return Promise.cast();
    };

    Ephemeral.prototype.lock = function (key) {
      var key = Stash.Drivers.Utils.key('', key) + '_lock';
      cache[key] = 1;
      return Promise.cast();
    };

    Ephemeral.prototype.isLocked = function (key) {
      key = Stash.Drivers.Utils.key('', key) + '_lock';
      return Promise.cast(Boolean(cache[key]));
    }

    Ephemeral.prototype.unlock = function (key) {
      key = Stash.Drivers.Utils.key('', key) + '_lock';
      cache[key] = null;
      return Promise.cast();
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

      return Promise.cast(data);
    }

    LocalStorage.prototype.put = function (key, value, expiration) {
      key = Stash.Drivers.Utils.key(this.namespace, key);
      var data = Stash.Drivers.Utils.assemble(value, expiration);

      return this.putRaw(key, data);
    };

    LocalStorage.prototype.putRaw = function (key, value) {
      localStorage.setItem(key, value);
      return Promise.cast();
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
      return Promise.cast();
    };

    LocalStorage.prototype.flush = function () {
      return this.delete('');
    };

    LocalStorage.prototype.lock = function (key) {
      key = Stash.Drivers.Utils.key(this.namespace, key) + '_lock';
      return this.putRaw(key, 1);
    };

    LocalStorage.prototype.isLocked = function (key) {
      var that = this;
      return new Promise(function (resolve, reject) {
        that.get(key + '_lock').then(function (data) {
          resolve(Boolean(data));
        });
      });
    };

    LocalStorage.prototype.unlock = function (key) {
      key = Stash.Drivers.Utils.key(this.namespace, key) + '_lock';
      localStorage.removeItem(key);

      return Promise.cast();
    }

    return LocalStorage;
  })();

  if (isNode) {
    module.exports = Stash;
  } else {
    global.Stash = Stash;
  }
})(this);
