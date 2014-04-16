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
      it('should return null if no data is saved', function () {
        expect(foo.get()).to.be.null;
      });

      it('should use SP_NONE as default cache policy', function () {
        foo.get();
        expect(foo.cachePolicy).to.be.equal(Stash.Item.SP_NONE);
      });
    });

    context('#set', function () {
      it('should set a value to an item', function () {
        foo.set('bar');
        expect(foo.get()).to.be.equal('bar');
      });

      it('should unlock cache', function () {
        foo.lock();
        foo.set('baz');
        expect(driver.get(foo.key).locked).to.be.false;
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
      });
    });

    context('#clear', function () {
      it('should immediately invalidate a key', function () {
        foo.set('bar', 1000);
        foo.clear();
        expect(foo.isMiss()).to.be.true;
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

  context('::Drivers', function () {
    it('should expose namespace Drivers', function () {
      expect(Stash.Drivers).to.be.a('object');
    });

    context('::Utils', function () {
      it('should be an object', function () {
        expect(Stash.Drivers.Utils).to.be.an.object;
      });

      context('#validateValue', function () {
        it('should not raise an exception for objects', function () {
          expect(function () {
            Stash.Drivers.Utils.validateValue({});
          }).not.to.throw;
        });

        it('should throw for functions', function () {
          expect(function () {
            Stash.Drivers.Utils.validateValue(function () {});
          }).to.throw;
        });
      });

      context('#assemble', function () {
        it('should return an object with value and expiration', function () {
          expect(Stash.Drivers.Utils.assemble('foo', 0))
            .to.be.deep.equal({
              value: 'foo',
              expiration: 0,
              locked: false
            });
        });
      });
    });
    
    for (var driverName in Stash.Drivers) {
      if (driverName === 'Utils') {
        continue;
      }

      (function (driverName) {
        context('::' + driverName, function () {
          it('should contain an ' + driverName + ' driver', function () {
            expect(Stash.Drivers[driverName]).to.be.an('function');
          });

          var driver = new Stash.Drivers[driverName]();
          driver.flush();

          it('should be a constructor', function () {
            expect(new Stash.Drivers[driverName]()).to.be.an.instanceof(Stash.Drivers[driverName]);
          });

          context('#get', function () {
            it('should return null for nonexisting keys', function () {
              expect(driver.get('foo')).to.be.null;
            });
          });

          context('#put', function () {
            it('should store a value', function () {
              driver.put('foo', 'bar');


              expect(driver.get('foo')).to.be.deep.equal({
                value: 'bar',
                expiration: undefined,
                locked: false
              });
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
      })(driverName);
    }

    context('::LocalStorage Exclusive', function () {
      var namespace = 'test';
      var cacheManager = new Stash.Drivers.LocalStorage(namespace);
      var pool = new Stash.Pool(cacheManager);
      var item = pool.getItem('foo');

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
  });
});
