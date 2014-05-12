module.exports = {
  assemble: function (value, expiration, key, parse) {
    if (typeof value === 'function') {
      throw new TypeError('Only serializables values can be cached');
    }

    var obj = { value: value, expiration: expiration };
    
    if (key) {
      obj.key = key;
    }

    if (parse !== false) {
      obj = JSON.stringify(obj);
    }

    return obj;
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
