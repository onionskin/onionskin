describe('Stash', function () {
  it('should be available on window', function () {
    expect(window.Stash).not.to.be.undefined;
  });

  context('::Pool', function () {
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

  context('::Item', function () {
    var pool = new Stash.Pool();
    var foo = pool.getItem('foo');

    context('#get', function () {
      it('should return null if no data is saved', function () {
        expect(foo.get()).to.be.null;
      });
    });

    context('#set', function () {
      it('should set a value to an item', function () {
        foo.set('bar');
        expect(foo.get()).to.be.equal('bar');
      });
    });

    context('#isMiss', function () {
      it('should return true if cache is expired', function () {
        foo.set('bar', 0);
        setTimeout(function () {
          expect(foo.isMiss()).to.be.true;
        }, 1)
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
    });

    context('#clear', function () {
      it('should immediately invalidate a key', function () {
        foo.set('bar', 1000);
        foo.clear();
        expect(foo.isMiss()).to.be.true;
      });
    });
  });

  context('::Drivers', function () {
    it('should expose namespace Drivers', function () {
      expect(Stash.Drivers).to.be.a('object');
    });

    context('::Ephemeral', function () {
      it('should contain an Ephemeral driver', function () {
        expect(Stash.Drivers.Ephemeral).to.be.an('function');
      });

      it('should be a constructor', function () {
        expect(new Stash.Drivers.Ephemeral()).to.be.an.instanceof(Stash.Drivers.Ephemeral);
      });


      var driver = new Stash.Drivers.Ephemeral();

      context('#get', function () {
        it('should return null for nonexisting keys', function () {
          expect(driver.get('foo')).to.be.null;
        });
      });

      context('#put', function () {
        it('should store a value', function () {
          driver.put('foo', 'bar');
          expect(driver.get('foo')).to.be.deep.equal({value: 'bar', expiration: undefined });
        });

        it('should throw if value is not serializable', function () {
          expect(function () {
            driver.put('foo', function () {});
          }).to.throw(TypeError);
        });
      });

      context('#delete', function () {
        it('should delete a key', function () {
          driver.put('foo', 'bar');
          driver.delete('foo');

          expect(driver.get('foo')).to.be.null;
        });
      });
    });
  });
});
