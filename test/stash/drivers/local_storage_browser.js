describe('Stash::Drivers::LocalStorage', function () {
  var namespace = 'test';
  var cacheManager = new Stash.Drivers.LocalStorage(namespace);
  var pool = new Stash.Pool(cacheManager);
  var item = pool.getItem('foo');
  pool.flush();

  it('should commit to localStorage', function () {
    item.set('bar');
    
    expect(localStorage.getItem(namespace))
      .to.contain('bar');
  });

  it('should share cache between instances', function () {
    var content = 'foo bar baz';
    item.set(content);

    expect(new Stash.Drivers.LocalStorage(namespace).get(item.key).value)
      .to.be.equal(content);
  });
});
