module.exports = Ephemeral;

var cache = {};
function Ephemeral () {}

Ephemeral.available = true;

Ephemeral.prototype.get = function (key) {
  key = Stash.Drivers.Utils.key('', key);
  var data = typeof cache[key] === 'undefined' ? null : cache[key];

  if (data) {
    data = JSON.parse(data);
  }

  return Promise.cast(data);
};

Ephemeral.prototype.put = function (key, value, expiration) {
  key = Stash.Drivers.Utils.key('', key);
  var data = Stash.Drivers.Utils.assemble(value, expiration);
  cache[key] = data;
  return Promise.cast();
};

Ephemeral.prototype.delete = function (key) {
  key = Stash.Drivers.Utils.key('', key);
  var length = key.length;

  Object.keys(cache).forEach(function (_key) {
    if (_key.substr(0, length) === key) {
      cache[_key] = null;
    }
  });

  cache[key] = null;
  return Promise.cast();
};

Ephemeral.prototype.flush = function () {
  cache = {};
  return Promise.cast();
};

Ephemeral.prototype.lock = function (key) {
  return this._updateLock(key, 1);
};

Ephemeral.prototype.unlock = function (key) {
  return this._updateLock(key, null);
};

Ephemeral.prototype.isLocked = function (key) {
  key = Stash.Drivers.Utils.key('', key) + '_lock';
  return Promise.cast(Boolean(cache[key]));
};

Ephemeral.prototype._updateLock = function (key, value) {
  key = Stash.Drivers.Utils.key('', key) + '_lock';
  cache[key] = value;
  return Promise.cast();
};
