describe('Stash::Pool', function () {
  it('should create a new Pool', function () {
    expect(new Stash.Pool()).to.be.an.instanceof(Stash.Pool);
  });

  it('should use contain a set of Drivers', function () {
    var pool = new Stash.Pool();
    expect(pool.drivers).to.be.an('array');
  });

  context('#drivers', function () {
    var pool = new Stash.Pool();

    it('should have a default driver', function () {
      expect(pool.drivers.length).to.be.equal(1);
    });
  });

  context('#getItem', function() {
    var pool = new Stash.Pool();

    it('should return instance of Stash.Item', function () {
      expect(pool.getItem('products/1')).to.be.an.instanceof(Stash.Item);
    });
  });
});
