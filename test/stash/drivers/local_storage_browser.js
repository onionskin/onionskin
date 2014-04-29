describe('Stash::Drivers::LocalStorage', function () {
  var namespace = 'test';
  var cacheManager = new Stash.Drivers.LocalStorage(namespace);
  var pool = new Stash.Pool(cacheManager);
  var item = pool.getItem('foo');
  pool.flush();

  it('should commit to localStorage', function () {
    item.set('bar').then(function (done) {
      catching(done, function () {
        expect(localStorage.getItem(namespace))
          .to.contain('bar');
      });
    })
    
  });

  it('should share cache between instances', function (done) {
    var content = 'foo bar baz';
    item.set(content).then(function () {
      return new Stash.Drivers.LocalStorage(namespace).get(item.key);
    }).then(function (data) {
      catching(done, function () {
        expect(data.value).to.be.equal(content);
      });
    });
  });
});
