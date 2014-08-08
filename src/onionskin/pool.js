var Promise = require('bluebird');
var Ephemeral = require('./drivers/ephemeral');
var Item = require('./item');

function Pool(drivers) {
  if (!drivers) {
    drivers = [new Ephemeral()];
  } else if (Object.prototype.toString.call(drivers) !== '[object Array]') {
    drivers = [drivers];
  }

  this.drivers = drivers.filter(function (d) {
    return d.constructor.available;
  });
}

Pool.prototype.getItem = function (key) {
  var item = new Item(key, this);

  return item;
};

Pool.prototype.flush = function () {
  this.drivers.forEach(function (driver) {
    driver.flush();
  });
};

Pool.prototype.get = function (key, cachePolicy, policyData, generator) {
  var item = this.getItem(key);

  if (typeof cachePolicy === 'function') {
    generator = cachePolicy;
    cachePolicy = void 0;
  } else if (typeof policyData === 'function') {
    generator = policyData;
    policyData = void 0;
  }

  return Promise.props({
    data: item.get(cachePolicy, policyData),
    missed: item.isMiss()
  }).then(function (result) {
    if (result.missed) {
      item.lock();

      if (!generator) {
        throw 'Cache is missing';
      }

      return Promise.try(generator)
        .then(function (val) {
          return item.save(val);
        }).catch(function () {
          return item.unlock();
        });
    } else {
      return result.data;
    }
  }).bind(item);
};

module.exports = Pool;
