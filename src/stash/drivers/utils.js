module.exports = {
  assemble: function (value, expiration) {
    if (typeof value === 'function') {
      throw new TypeError('Only serializables values can be cached');
    }

    return JSON.stringify({ value: value, expiration: expiration });
  },
  key: function (namespace, key) {
    if (!namespace) {
      namespace = key;
      key = [];
    }
    if (key instanceof Array) {
      key.unshift(namespace);
    } else {
      key = (namespace + '/' + key).split('/');
    }

    return key.filter(String).join('/').replace(/\s/g,'');
  }
};
