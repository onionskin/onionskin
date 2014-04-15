(function (exports) {
  var Stash = exports.Stash || {};

  Stash.Item = (function () {
    function Item(key, pool) {
      this.key = key;
      this.pool = pool;
    }

    Item.prototype.get = function () {
      for (var key in this.pool.drivers) {
        var driver = this.pool.drivers[key];
        var value = driver.get(this.key);

        if (value) {
          return value.value;
        }
      }

      return null;
    };

    Item.prototype.set = function (value, expiration) {
      var that = this;

      this.pool.drivers.reverse().forEach(function (driver) {
        driver.put(that.key, value, expiration);
      });
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
        throw new TypeError('Invalid value! Only serializables values can be cached');
      }

      this._cache_[key] = { value: value, expiration: expiration };
    }

    return Ephemeral;
  })();

  exports.Stash = Stash;
})(window);
