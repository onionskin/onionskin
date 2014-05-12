var OnionSkin = function (drivers) {
  'use strict';
  return new OnionSkin.Pool(drivers);
};

OnionSkin.Item = require('./onionskin/item');
OnionSkin.Pool = require('./onionskin/pool');

module.exports = OnionSkin;
