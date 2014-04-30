describe('Stash::Pool', function () {
  var pool = new Stash.Pool();

  it('should create a new Pool', function () {
    expect(pool).to.be.an.instanceof(Stash.Pool);
  });

  it('should use contain a set of Drivers', function () {
    expect(pool.drivers).to.be.an('array');
  });

  context('#drivers', function () {
    it('should have a default driver', function () {
      expect(pool.drivers.length).to.be.equal(1);
    });
  });

  context('#getItem', function() {
    it('should return instance of Stash.Item', function () {
      expect(pool.getItem('products/1')).to.be.an.instanceof(Stash.Item);
    });
  });

  context('#get', function () {
    it ('should return the key value', function (done) {
      var key = Math.random().toString();
      var value = Math.random().toString();
      var item = pool.getItem(key);

      item.set(value).then(function () {
        return pool.get(key);
      }).then(function (data) {
        catching(done, function () {
          expect(data).to.be.equal(value);
        });
      });
    });

    it('should fail if the item isn\'t present', function (done) {
      pool.get('non_existing_key').then(function (data) {
        done(new Error('It should have failed', data));
      }).fail(function () {
        done();
      });
    });

    it('should expose set on fail', function (done) {
      pool.get('non_existing_key2').fail(function (set) {
        set('bar').then(function () {
          return pool.get('non_existing_key2');
        }).then(function (data) {
          catching(done, function () {
            expect(data).to.be.equal('bar');
          });
        });
      });
    });

    it('should automatically lock', function (done) {
      var key = 'pool_get_3';
      pool.get(key).fail(function (set) {
        pool.getItem(key).isLocked().then(function (locked) {
          catching(done, function () {
            expect(locked).to.be.true;
          });
        });
      });
    });

  });
});
