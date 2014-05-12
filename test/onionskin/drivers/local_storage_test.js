describe('OnionSkin::Drivers::LocalStorage', function () {
  var namespace = 'test';
  var cacheManager = new OnionSkin.Drivers.LocalStorage(namespace);
  var pool = new OnionSkin.Pool(cacheManager);
  var item = pool.getItem('foo');
  pool.flush();

  it('should commit to localStorage', function (done) {
    item.set('bar').then(function () {
      catching(done, function () {
        expect(localStorage.getItem(OnionSkin.Drivers.Utils.key(namespace, item.key)))
          .to.contain('bar');
      });
    })
    
  });

  it('should share cache between instances', function (done) {
    var content = 'foo bar baz';
    item.set(content).then(function () {
      return new OnionSkin.Drivers.LocalStorage(namespace).get(item.key);
    }).then(function (data) {
      catching(done, function () {
        expect(data.value).to.be.equal(content);
      });
    });
  });
});
