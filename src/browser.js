var Stash = require('./stash_base');
Stash.Drivers = {
  Utils: require('./stash/drivers/utils'),
  Ephemeral: require('./stash/drivers/ephemeral'),
  LocalStorage: require('./stash/drivers/local_storage'),
  IndexedDB: require('./stash/drivers/indexed_db')
};

module.exports = Stash;
