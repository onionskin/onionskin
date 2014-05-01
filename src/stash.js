(function (global) {
  var Stash = global.Stash || {};
  var isNode = typeof require !== 'undefined';

  Stash.Item = require('./stash/item');
  Stash.Pool = require('./stash/pool');


  Stash.Drivers = {
    get Utils() {
      return require('./stash/drivers/utils');
    },
    get Ephemeral() {
      return require('./stash/drivers/ephemeral');
    },
    get LocalStorage() {
      return require('./stash/drivers/local_storage');
    },
    get Memcached() {
      return require('./stash/drivers/Memcached');
    },
    get Redis() {
      return require('./stash/drivers/Redis')
    }
  };

  if (isNode) {
    module.exports = Stash;
  } else {
    global.Stash = Stash;
  }
})(this);
