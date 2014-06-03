'use strict';

var Promise = require('bluebird');

function Item(key, pool) {
  this.key = key;
  this.pool = pool;
  this.save = (function (that) {
    var _save = that.save;
    return function () {
      return _save.apply(that, arguments);
    };
  })(this);

  this._unload_();
}

Item.CP_NONE = 1;
Item.CP_OLD = 2;
Item.CP_PRECOMPUTE = 4;
Item.CP_VALUE = 8;

Item.prototype._unload_ = function () {
  this.value = null;
  this.expiration = false;
  this.locked = undefined;
};

Item.prototype._load_ = function () {
  var that = this;

  return new Promise(function (resolve) {
    var promises = that.pool.drivers.map(function (d) {
      return d.get(that.key).then(function (data) {
        if (data !== null) {
          resolve(data);
        }
      });
    });

    Promise.all(promises).then(function () {
      resolve(null);
    });
  });
};

Item.prototype._write_ = function () {
  var that = this;

  return new Promise(function (resolve) {
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
  this.cachePolicy = cachePolicy || Item.CP_NONE;
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

  return new Promise(function (resolve) {
    if (that.cachePolicy & Item.CP_VALUE) {
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
Item.prototype.save = function (value, expiration) {
  return this.set(value, expiration).then(function () {
    return value;
  });
};

Item.prototype.set = function (value, expiration) {
  this._unload_();

  this.expiration = Item._calculateExpiration_(expiration);
  this.value = value;

  this.unlock();
  return this._write_();
};

Item.prototype.isMiss = function () {
  var that = this;

  var isMissed = function (locked, resolve) {
    var miss;

    if (locked && (that.cachePolicy & Item.CP_OLD)) {
      miss = false;
    } else if (!locked &&
               (that.cachePolicy & Item.CP_PRECOMPUTE) &&
               that.policyData * 1000 >= that.expiration - Date.now()) {
      miss =  true;
    } else {
      miss = that.value === null ||
        typeof(that.expiration) === 'number' &&
        that.expiration < Date.now();
    }

    resolve(miss);
  };

  return new Promise(function (resolve) {
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

  return new Promise(function (resolve) {
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

  return new Promise(function (resolve) {
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
  return new Promise(function (resolve) {
    var promises = that.pool.drivers.map(function (d) {
      return d.isLocked(that.key).then(function (locked) {
        if (locked) {
          that.locked = locked;
          resolve(locked);
        }
      });
    });

    Promise.all(promises).then(function () {
      that.locked = that.locked || false;
      resolve(that.locked);
    });
  });
};

Item.prototype.unlock = function () {
  if (this.locked === false) {
    return Promise.cast();
  }

  this.locked = false;
  var that = this;

  return new Promise(function (resolve) {
    that.pool.drivers.forEach(function (d) {
      d.unlock(that.key).then(resolve);
    });
  });
};

module.exports = Item;
