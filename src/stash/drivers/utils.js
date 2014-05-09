module.exports = {
  assemble: function (value, expiration, key) {
    if (typeof value === 'function') {
      throw new TypeError('Only serializables values can be cached');
    }

    var obj = { value: value, expiration: expiration };
    
    if (key) {
      obj.key = key;
    }

    return JSON.stringify(obj);
  },
  key: function (namespace, key) {
    if (!namespace) {
      namespace = key;
      key = [];
    }
    if (key instanceof Array) {
      key = [namespace].concat(key);
    } else {
      key = (namespace + '/' + key).split('/');
    }

    return key.filter(String).join('/').replace(/\s/g,'');
  }
};
