var Stash = require('./stash_base');
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

module.exports = Stash;
