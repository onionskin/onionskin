(function (exports) {
  var Stash = exports.Stash || {};

  Stash.Item = (function () {
    function Item(key, pool) {
      this.key = key;
      this.pool = pool;
      this.value = null;
      this.expiration = false;
    }

    Item.SP_NONE = 1;
    Item.SP_OLD = 2;
    Item.SP_PRECOMPUTE = 4;
    Item.SP_VALUE = 8;

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
        }
      }

      return this;
    };

    Item.prototype.get = function (cachePolicy) {
      this.cachePolicy = cachePolicy || Stash.Item.SP_NONE;
      return this._load_().value;
    };

    Item.prototype.set = function (value, expiration) {
      var that = this;

      this._loaded_ = false;

      this.pool.drivers.reverse().forEach(function (driver) {
        driver.put(that.key, value, expiration);
      });
    };

    Item.prototype.isMiss = function () {
      this._load_();

      return typeof(this.expiration) === 'number' && this.expiration < Date.now();
    };

    Item.prototype.clear = function () {
      this._load_();

      this.set(this.value, -1);
    };

    Item.prototype.lock = function () {
      this._load_();
      this.locked = true;
      this.set(this.value, this.expiration, true);
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
      item = new Stash.Item(key, this);

      return item;
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
    calculateExpiration: function (expiration) {
      if (typeof(expiration) === 'number') {
        expiration *= 1000;
        expiration += Date.now();
      } else if (expiration instanceof Date) {
        expiration = expiration.getTime();
      }

      return expiration;
    },
    assemble: function (value, expiration, locked) {
      Stash.Drivers.Utils.validateValue(value);
      expiration = Stash.Drivers.Utils.calculateExpiration(expiration);

      return { value: value, expiration: expiration, locked: locked || false };
    }
  };

  Stash.Drivers.Ephemeral = (function () {
    function Ephemeral () {
      this._cache_ = {};
    }

    Ephemeral.prototype.get = function (key) {
      return this._cache_[key] || null;
    };

    Ephemeral.prototype.put = function (key, value, expiration, locked) {
      this._cache_[key] = Stash.Drivers.Utils.assemble(value, expiration, locked);
    };

    Ephemeral.prototype.delete = function (key) {
      this._cache_[key] = null;
    };

    Ephemeral.prototype.flush = function () {
      this._cache_ = {};
    }

    return Ephemeral;
  })();

  Stash.Drivers.LocalStorage = (function () {
    function LocalStorage (namespace) {
      this.namespace = namespace || 'stash';
      this._loadCache_();
    }

    LocalStorage.prototype._loadCache_ = function () {
      var saved = localStorage.getItem(this.namespace);

      this._cache_ = !!saved ? JSON.parse(saved) : {};
    };

    LocalStorage.prototype._commit_ = function () {
      localStorage.setItem(this.namespace, JSON.stringify(this._cache_));
    };

    LocalStorage.prototype.get = function (key) {
      return this._cache_[key] || null;
    };

    LocalStorage.prototype.put = function (key, value, expiration) {
      this._cache_[key] = Stash.Drivers.Utils.assemble(value, expiration);
      this._commit_();
    };

    LocalStorage.prototype.delete = function (key) {
      this._cache_[key] = null;
    };

    LocalStorage.prototype.flush = function () {
      this._cache_ = {};
      this._commit_();
    };

    return LocalStorage;
  })();

  exports.Stash = Stash;
})(window);
