describe('Stash::Item', function () {
  var pool = new Stash.Pool();
  var driver = pool.drivers[0];
  var foo = pool.getItem('foo');

  context('#_calculateExpiration_', function () {
    it('should return false for false expiration', function () {
      expect(Stash.Item._calculateExpiration_(false)).to.be.false;
    });

    it('should return the time for Date values', function () {
      var date = new Date();

      expect(Stash.Item._calculateExpiration_(date))
        .to.be.equal(date.getTime());
    });

    it('should increase Date.now by seconds', function () {
      var date = Date.now() + 100 * 1000;

      expect(Stash.Item._calculateExpiration_(100) - date)
        .to.be.lt(100);
    });
  });

  context('#get', function () {
    it('should return null if no data is saved', function (done) {
      foo.get(function (data) {
        expect(data).to.be.null;
        done();
      })
    });

    it('should use SP_NONE as default cache policy', function () {
      foo.get();
      expect(foo.cachePolicy).to.be.equal(Stash.Item.SP_NONE);
    });

    it('should call callback with data', function (done) {
      foo.set('bar');
      foo.get(function (data) {
        expect(data).to.be.equal('bar');
        done();
      });
    });
  });

  context('#set', function () {
    it('should set a value to an item', function () {
      foo.set('bar');
      expect(foo.get()).to.be.equal('bar');
    });

    it('should unlock cache', function (done) {
      foo.lock();
      foo.set('baz');
      expect(driver.get(foo.key).locked).to.be.false;
    });

    it('should call the callback', function (done) {
      foo.set('baz', function (err) {
        done();
      });
    });
  });

  context('#isMiss', function () {
    it('should return true if cache is expired', function () {
      foo.set('bar', -1);
      expect(foo.isMiss()).to.be.true;
    });

    it('should return false when it is still valid', function () {
      foo.set('bar', 100);
      expect(foo.isMiss()).to.be.false;
    });

    it('should accept an expiration Date', function () {
      foo.set('bar', new Date(Date.now() + 1000));
      expect(foo.isMiss()).to.be.false;

      foo.set('bar', new Date(Date.now() - 100));
      expect(foo.isMiss()).to.be.true;
    });

    context('Expired & Locked', function () {
      context('SP_NONE', function () {
        it('should be the default cache policy', function () {
          foo.get();
          expect(foo.cachePolicy).to.be.equal(Stash.Item.SP_NONE);
        });

        it('should return true', function () {
          foo.set('bar', -1);
          foo.lock();
          foo.get(Stash.Item.SP_NONE);
          expect(foo.isMiss()).to.be.true;
        });
      });

      context('SP_OLD', function () {
        it('should return the false if cache is locked', function () {
          foo.lock();
          foo.get(Stash.Item.SP_OLD);
          expect(foo.isMiss()).to.be.false;
        });
      });

      context('SP_PRECOMPUTE', function () {
        it('should return true before expiration for a single instance', function () {
          foo.set('bar', 100);
          foo.get(Stash.Item.SP_PRECOMPUTE, 101);

          expect(foo.isMiss()).to.be.true;
          foo.lock();

          var bar = pool.getItem(foo.key);
          bar.get(Stash.Item.SP_PRECOMPUTE, 101);
          expect(bar.isMiss()).to.be.false;
        });
      });

      context('SP_VALUE', function () {
        it('should return the specified value when locked', function () {
          foo.set('bar');
          foo.lock();
          expect(foo.get(Stash.Item.SP_VALUE, 'baz')).to.be.equal('baz');
        });
      });
    });
  });

  context('#clear', function () {
    it('should immediately invalidate a key', function () {
      foo.set('bar', 1000);
      foo.clear();
      expect(foo.get()).to.be.null;
    });
  });

  context('#lock', function () {
    it('should set cache as locked', function () {
      foo.lock();
      expect(foo.pool.drivers[0].get(foo.key).locked)
        .to.be.true;
    });
  });
});
