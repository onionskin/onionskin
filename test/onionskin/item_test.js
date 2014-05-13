describe('OnionSkin::Item', function () {
  var pool = new OnionSkin.Pool();
  var driver = pool.drivers[0];
  var foo = pool.getItem('foo');

  context('#_calculateExpiration_', function () {
    it('should return false for false expiration', function () {
      expect(OnionSkin.Item._calculateExpiration_(false)).to.be.false;
    });

    it('should return the time for Date values', function () {
      var date = new Date();

      expect(OnionSkin.Item._calculateExpiration_(date))
        .to.be.equal(date.getTime());
    });

    it('should increase Date.now by seconds', function () {
      var date = Date.now() + 100 * 1000;

      expect(OnionSkin.Item._calculateExpiration_(100) - date)
        .to.be.lt(100);
    });
  });

  context('#get', function () {
    it('should return null if no data is saved', function (done) {
      foo.get().then(function (data) {
        catching(done, function () {
          expect(data).to.be.null;
        });
      });
    });

    it('should use CP_NONE as default cache policy', function (done) {
      foo.get().then(function () {
        catching(done, function () {
          expect(foo.cachePolicy).to.be.equal(OnionSkin.Item.CP_NONE);
        });
      });
    });

    it('should call callback with data', function (done) {
      foo.set('bar')
      .then(function () {
        return foo.get();
      })
      .then(function (data) {
        catching(done, function () {
          expect(data).to.be.equal('bar');
        });
      });
    });
  });

  context('#set', function () {
    it('should set a value to an item', function (done) {
      foo.set('bar').then(function () {
        return foo.get();
      })
      .then(function (data) {
          expect(data).to.be.equal('bar');
          done();
      });
    });

    it('should unlock cache', function (done) {
      foo.lock().then(function () {
        return foo.set('baz');
      }).then(function () {
        return foo.isLocked(foo.key);
      }).then(function (locked) {
        catching(done, function () {
          expect(locked).to.be.false;
        });
      });
    });

    it('should call the callback', function (done) {
      foo.set('baz')
      .then(function (err) {
        catching(done, function () {});
      });
    });
  });

  context('#isMiss', function () {
    it('should return true for non-existing key', function (done) {
      pool.getItem('baz_foo/bar').isMiss().then(function (missed) {
        catching(done, function () {
          expect(missed).to.be.true;
        });
      });
    });
    it('should return true if cache is expired', function (done) {
      foo.set('bar', -1)
      .then(function () {
        return foo.isMiss();
      })
      .then(function (missed) {
        catching(done, function () {
          expect(missed).to.be.true;
        });
      });
    });

    it('should return false when it is still valid', function (done) {
      foo.set('bar', 100)
      .then(function () {
        return foo.isMiss();
      })
      .then(function (missed) {
        catching(done, function () {
          expect(missed).to.be.false;
        });
      })
    });

    it('should accept an expiration Date', function (done) {
      foo.set('bar', new Date(Date.now() + 1000)).then(function () {
        return foo.isMiss();
      }).then(function (missed) {
        try {
          expect(missed).to.be.false;
        } catch(err) { done(err); }
      }).then(function () {
        return foo.set('bar', new Date(Date.now() - 100));
      }).then(function () {
        return foo.isMiss();
      }).then(function (missed) {
        catching(done, function () {
          expect(missed).to.be.true;
        });
      });
    });

    context('Expired & Locked', function () {
      context('CP_NONE', function () {
        it('should be the default cache policy', function (done) {
          foo.get()
          .then(function () {
            catching(done, function () {
              expect(foo.cachePolicy).to.be.equal(OnionSkin.Item.CP_NONE);
            });
          });
        });

        it('should return true', function (done) {
          foo.set('bar', -1).then(function () {
            return foo.lock();
          }).then(function () {
            return foo.get(OnionSkin.Item.CP_NONE);
          }).then(function () {
            return foo.isMiss();
          }).then(function (missed) {
            catching(done, function () {
              expect(missed).to.be.true;
            });
          });
        });
      });

      context('CP_OLD', function (done) {
        it('should return false if cache is locked', function (done) {
          foo.lock().then(function () {
            return foo.get(OnionSkin.Item.CP_OLD);
          }).then(function () {
            return foo.isMiss();
          }).then(function (missed) {
            catching(done, function () {
              expect(missed).to.be.false;
            });
          });
        });
      });

      context('CP_PRECOMPUTE', function () {
        it('should return true before expiration for a single instance', function (done) {
          var bar;

          foo.set('bar', 100).then(function () {
            return foo.get(OnionSkin.Item.CP_PRECOMPUTE, 110);
          }).then(function () {
            return foo.isMiss();
          }).then(function (missed) {
            try {
              expect(missed).to.be.true;
            } catch (err) {
              done(err);
            }
          }).then(function () {
            return foo.lock();
          }).then(function () {
            bar = pool.getItem(foo.key);
            return bar.get(OnionSkin.Item.CP_PRECOMPUTE, 110);
          }).then(function () {
            return bar.isMiss();
          }).then(function (missed) {
            catching(done, function () {
              expect(missed).to.be.false;
            });
          });
        });
      });

      context('CP_VALUE', function () {
        it('should return the specified value when locked', function (done) {
          foo.set('bar').then(function () {
            return foo.lock();
          }).then(function () {
            return foo.get(OnionSkin.Item.CP_VALUE, 'baz');
          }).then(function (value) {
            catching(done, function () {
              expect(value).to.be.equal('baz');
            });
          });
        });
      });

    });
  });

  context('#clear', function () {
    it('should immediately invalidate a key', function (done) {
      foo.set('bar', 1000).then(function () {
        return foo.clear();
      }).then(function () {
        return foo.get();
      }).then(function (data) {
        catching(done, function () {
          expect(data).to.be.null;
        });
      });
    });
  });

  context('#lock', function () {
    it('should set cache as locked', function (done) {
      foo.clear().then(function () {
        return foo.lock();
      }).then(function () {
        return foo.pool.drivers[0].isLocked(foo.key);
      }).then(function (locked) {
        catching(done, function () {
          expect(locked).to.be.true;
        });
      })
    });
  });
});
