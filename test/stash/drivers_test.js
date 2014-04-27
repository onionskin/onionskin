describe('Stash::Drivers', function () {
  it('should expose namespace Drivers', function () {
    expect(Stash.Drivers).to.be.a('object');
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
        before(function (done) {
          driver.flush(done);
        });

        context('#get', function () {
          it('should return null for nonexisting keys', function (done) {
            driver.get('foo', function (data) {
              expect(data).to.be.null;
              done();
            });
          });

          it('should accept path like cache', function (done) {
            driver.put('a/b/c', 'foo', 0, function () {
              driver.get('a/b/c', function (data) {
                expect(data.value).to.be.equal('foo');
                done();
              });
            });
          });
        });

        context('#put', function () {
          it('should store a value', function (done) {
            driver.put('foo', 'bar', 0, function () {
              driver.get('foo', function (data) {
                expect(data).to.be.deep.equal({ value: 'bar', expiration: 0 });
                done();
              });
            });
          });

          it('should throw if value is not serializable', function () {
            expect(function () {
              driver.put('foo', function () {}, function () {});
            }).to.throw(TypeError);
          });
        });

        context('#delete', function () {

          it('should delete a key', function (done) {
            driver.put('foo', 'bar', 0, function () {
              driver.delete('foo', function () {
                driver.get('foo', function (data) {
                  expect(data).to.be.null;
                  done();
                })
              });
            });
          });

          it('should delete all subkeys', function (done) {
            driver.put('foo/bar/baz', 'bar', 0, function () {
              driver.delete('foo/bar', function () {
                driver.get('foo/bar/baz', function (data) {
                  expect(data).to.be.null;
                  done();
                })
              });
            });
          });

        });
      });
    })(driverName);
  }
});
