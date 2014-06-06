describe('OnionSkin::Pool', function () {
  var pool = new OnionSkin.Pool();

  it('should create a new Pool', function () {
    expect(pool).to.be.an.instanceof(OnionSkin.Pool);
  });

  it('should use contain a set of Drivers', function () {
    expect(pool.drivers).to.be.an('array');
  });

  it('should filter out unavailable drivers', function () {
    function A(){}
    function B(){}
    A.available = false;
    B.available = true;
    var d1 = new A();
    var d2 = new B();
    var pool = new OnionSkin.Pool([d1, d2]);
    expect(pool.drivers).to.be.deep.equal([d2]);
  });

  context('#drivers', function () {
    it('should have a default driver', function () {
      expect(pool.drivers.length).to.be.equal(1);
    });
  });

  context('#getItem', function() {
    it('should return instance of OnionSkin.Item', function () {
      expect(pool.getItem('products/1')).to.be.an.instanceof(OnionSkin.Item);
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
      }).done();
    });

    it('should fail if the item isn\'t present', function (done) {
      pool.get('non_existing_key').catch(function () {
        return 10;
      }).then(function (data) {
        catching(done, function () {
          expect(data).to.be.equal(10);
        });
      });
    });

    it('should allow save on fail', function (done) {
      pool.get('non_existing_key2', function (err) {
        return 'bar';
      }).then(function () {
          return pool.get('non_existing_key2');
      }).then(function (data) {
        catching(done, function () {
          expect(data).to.be.equal('bar');
        });
      }).done();
    });

    it('should automatically lock', function (done) {
      var key = 'pool_get_3';
      pool.get(key, function (err) {
        pool.getItem(key).isLocked().then(function (locked) {
          catching(done, function () {
            expect(locked).to.be.true;
          });
        });
      });
    });

    it('should automatically unlock the cache after save', function (done) {
      pool.get('non_existing_key3', function () {
        return 1;
      }).then(function (value) {
        expect(value).to.be.equal(1);

        this.isLocked().then(function (locked) {
          catching(done, function () {
            expect(locked).to.be.false;
          });
        });
      }).done();
    });

    it('should automatically unlock the cache if generation fails', function (done) {
      pool.get('non_existing_key3', function () {
        throw 'Some error!';
      }).finally(function () {
        this.isLocked().then(function (locked) {
          catching(done, function () {
            expect(locked).to.be.false;
          });
        });
      }).done();
    });
  });
});
