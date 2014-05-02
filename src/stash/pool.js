module.exports = Pool;
var Promise = require('bluebird');

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

Pool.prototype.get = function (key, cachePolicy, policyData) {
  var item = this.getItem(key);

  return new Promise(function (resolve, reject) {
    item.get(cachePolicy, policyData).then(function (data) {
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
