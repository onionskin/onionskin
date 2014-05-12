var OnionSkin = require('./onionskin_base');
OnionSkin.Drivers = {
  Utils: require('./onionskin/drivers/utils'),
  Ephemeral: require('./onionskin/drivers/ephemeral'),
  LocalStorage: require('./onionskin/drivers/local_storage'),
  IndexedDB: require('./onionskin/drivers/indexed_db')
};

module.exports = OnionSkin;
