var OnionSkin = require('../src/onionskin');
var pool = new OnionSkin();
var Promise = require('bluebird');
var http = require('http');

function _getFacebookData(username) {
  return new Promise(function (resolve, reject) {
    http.get({
      host: 'graph.facebook.com',
      port: 80,
      path: '/' + username
    }, function (res) {
      res.on('data', function (chunk) {
        resolve(chunk.toString());
      });
    }).on('error', function (err) {
      reject(err);
    });
  });
}

// Short version 
function getFacebookData(username) {
  return pool.get('facebook/user/' + username).catch(function (err){
    console.log(err);
    return _getFacebookData(username).then(this.save);
  });
}

(function loop(counter) {
  if (++counter > 3) {
    return;
  }
  var start = Date.now();
  getFacebookData('tadeuzagallo').then(function (data) {
    console.log("%s found in %dms", data, Date.now() - start);
    loop(counter);
  }).done();
})(0);
