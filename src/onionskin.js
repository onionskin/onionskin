var OnionSkin = require('./onionskin_base');
OnionSkin.Drivers = {
  get Utils() {
    return require('./onionskin/drivers/utils');
  },
  get Ephemeral() {
    return require('./onionskin/drivers/ephemeral');
  },
  get LocalStorage() {
    return require('./onionskin/drivers/local_storage');
  },
  get Memcached() {
    return require('./onionskin/drivers/memcached');
  },
  get Redis() {
    return require('./onionskin/drivers/redis');
  }
};

module.exports = OnionSkin;
