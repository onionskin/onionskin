(function (exports) {
  var Stash = exports.Stash || {};

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
      this._loaded_ = false;
      this.value = null;
      this.expiration = false;
      this.locked = false;
    };

    Item.prototype._load_ = function () {
      if (!this._loaded_) {
        this._loaded_ = true;
        var that = this;

        var value = this.pool.drivers.reduce(function (a, b) {
          return a || b.get(that.key);
        }, false);

        if (value) {
          this.value = value.value;
          this.expiration = value.expiration;
          this.locked = value.locked;
        }
      }

      return this;
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

    Item.prototype._write_ = function () {
      var that = this;

      this.pool.drivers.reverse().forEach(function (driver) {
        driver.put(that.key, that.value, that.expiration, that.locked);
      });
    };

    Item.prototype.get = function (cachePolicy, policyData) {
      this.cachePolicy = cachePolicy || Stash.Item.SP_NONE;
      this.policyData = policyData;

      if ((cachePolicy & Stash.Item.SP_VALUE) && this.locked) {
        return policyData;
      }

      return this._load_().value;
    };

    Item.prototype.set = function (value, expiration) {
      this._unload_();

      this.expiration = Item._calculateExpiration_(expiration);
      this.locked = false;
      this.value = value;

      this._write_();
    };

    Item.prototype.isMiss = function () {
      this._load_();

      if (this.locked && (this.cachePolicy & Stash.Item.SP_OLD)) {
        return false;
      } else if (!this.locked &&
                 (this.cachePolicy & Stash.Item.SP_PRECOMPUTE) &&
                 this.policyData * 1000 >= this.expiration - Date.now()) {
        return true;
      }

      return typeof(this.expiration) === 'number' && this.expiration < Date.now();
    };

    Item.prototype.clear = function () {
      var that = this;

      this._unload_();

      this.pool.drivers.forEach(function (driver) {
        driver.delete(that.key);
      });
    };

    Item.prototype.lock = function () {
      this._load_();
      this.locked = true;
      this._write_();
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
    validateValue: function (value) {
      if (!JSON.stringify(value)) {
        throw new TypeError('Only serializables values can be cached');
      }
    },
    assemble: function (value, expiration, locked) {
      Stash.Drivers.Utils.validateValue(value);

      return { value: value, expiration: expiration, locked: locked || false };
    },
    cd: function (cache, key) {
      if (!key) {
        return cache;
      }

      return key.split('/').reduce(function (cache, folder) {
        if (!cache[folder]) {
          cache[folder] = { __stash_value__: null };
        }

        cache = cache[folder];
        return cache;
      }, cache);
    }
  };

  Stash.Drivers.Ephemeral = (function () {
    function Ephemeral () {
      this._cache_ = {};
    }

    Ephemeral.prototype.get = function (key) {
      var cache = Stash.Drivers.Utils.cd(this._cache_, key);

      return cache.__stash_value__ || null;
    };

    Ephemeral.prototype.put = function (key, value, expiration, locked) {

      var cache = Stash.Drivers.Utils.cd(this._cache_, key);

      cache.__stash_value__ = Stash.Drivers.Utils.assemble(value, expiration, locked);
    };

    Ephemeral.prototype.delete = function (key) {
      key = key.split('/');
      var last = key.pop();
      var cache = Stash.Drivers.Utils.cd(this._cache_, key.join('/'));

      cache[last] = null;
    };

    Ephemeral.prototype.flush = function () {
      this._cache_ = {};
    };

    Ephemeral.prototype.parent = Ephemeral.prototype;

    return Ephemeral;
  })();

  Stash.Drivers.LocalStorage = (function () {
    function LocalStorage (namespace) {
      this.namespace = namespace || 'stash';
      this._loadCache_();
    }

    LocalStorage.prototype = new Stash.Drivers.Ephemeral();

    LocalStorage.prototype._loadCache_ = function () {
      this._cache_ = {};

      if (typeof(localStorage) !== 'undefined') {
        var saved = localStorage.getItem(this.namespace);

        if (saved) {
          this._cache_ = JSON.parse(saved);
        }
      }
    };

    LocalStorage.prototype._commit_ = function () {
      if (typeof(localStorage) !== 'undefined') {
        localStorage.setItem(this.namespace, JSON.stringify(this._cache_));
      }
    };

    LocalStorage.prototype.put = function () {
      this.parent.put.apply(this, arguments);
      this._commit_();
    };

    LocalStorage.prototype.delete = function () {
      this.parent.delete.apply(this, arguments);
      this._commit_();
    };

    LocalStorage.prototype.flush = function () {
      this.parent.flush.apply(this, arguments);
      this._commit_();
    };

    return LocalStorage;
  })();

  exports.Stash = Stash;
})(typeof(window) === 'undefined' ? module.exports : window);
