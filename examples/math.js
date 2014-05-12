var OnionSkin = require('../src/onionskin');
var pool = new OnionSkin();
var Promise = require('bluebird');

function _isPrime(number) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      if (number % 2 === 0 || number % 3 === 0) {
        return resolve(false);
      }

      for(var i = 5, m = 4, max = Math.sqrt(number); i <= max; i += m) {
        if (number % i === 0) {
          return resolve(false);
        }
        m = 6 - m;
      }

      resolve(true);
    }, 5);
  });
}

function isPrime(number) {
  return pool.get('log2').catch(function (err) {
    console.log(err);
    return _isPrime(number).then(function (data) {
      this.set(data);
      return data;
    }.bind(this));
  });
}

(function loop(counter) {
  if (++counter > 3) {
    return;
  }
  var start = Date.now();
  isPrime(2147483647).then(function (data) {
    console.log("%s found in %dms", data, Date.now() - start);
    loop(counter);
  });
})(0);
