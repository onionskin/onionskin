var Item = require('./onionskin/item');
var Pool = require('./onionskin/pool');
var OnionSkin = function (drivers) {
  'use strict';
  return new Pool(drivers);
};

OnionSkin.Item = Item;
OnionSkin.Pool = Pool;

OnionSkin.CP_NONE = Item.CP_NONE;
OnionSkin.CP_OLD = Item.CP_OLD;
OnionSkin.CP_PRECOMPUTE = Item.CP_PRECOMPUTE;
OnionSkin.CP_VALUE = Item.CP_VALUE;

module.exports = OnionSkin;
