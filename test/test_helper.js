global.localStorage = (function () {
  var cache = {};

  return {
    setItem: function (key, value) {
      cache[key] = value;
    },
    getItem: function (key) {
      return cache[key] || null;
    },
    removeItem: function (key) {
      delete cache[key];
    },
    get length() {
      return Object.keys(cache).length;
    },
    key: function (index) {
      return Object.keys(cache)[index];
    }
  }
})();

var chai = require('chai');
var OnionSkin = require('../src/onionskin');

global.Promise = require('bluebird');
global.OnionSkin = OnionSkin;
global.chai = chai;
global.expect = chai.expect;
global.catching = function (done, fn) {
  try {
    fn();
    done();
  } catch (err) {
    done(err);
  }
};

chai.should();
