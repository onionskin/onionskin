(function (exports) {
  var Stash = exports.Stash || {};

  Stash.Item = (function () {
    function Item(key, pool) {
      this.key = key;
      this.pool = pool;
    }

    Item.prototype._load_ = function () {
      if (!this._loaded_) {
        this._loaded_ = true;

        for (var key in this.pool.drivers) {
          var driver = this.pool.drivers[key];
          var value = driver.get(this.key);

          if (value) {
            this.value = value.value;
            this.expiration = value.expiration;
            return this;
          }
        }

        this.value = null;
        this.expiration = false;
      }

      return this;
    };

    Item.prototype.get = function () {
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

      console.log(this.expiration);
      return typeof(this.expiration) === 'number' && this.expiration < Date.now();
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
  Stash.Drivers.Ephemeral = (function () {
    function Ephemeral () {
      this._cache_ = {};
    }

    Ephemeral.prototype.get = function (key) {
      return this._cache_[key] || null;
    };

    Ephemeral.prototype.put = function (key, value, expiration) {
      if (!JSON.stringify(value)) {
        throw new TypeError('Only serializables values can be cached');
      }

      if (typeof(expiration) === 'number') {
        expiration *= 1000;
        expiration += Date.now();
      }

      this._cache_[key] = { value: value, expiration: expiration };
    };

    Ephemeral.prototype.delete = function (key) {
      this._cache_[key] = null;
    };

    return Ephemeral;
  })();

  exports.Stash = Stash;
})(window);
