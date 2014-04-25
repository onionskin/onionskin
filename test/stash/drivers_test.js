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
        driver.flush();

        it('should be an instance of Ephemeral', function() {
          expect(driver).to.be.an.instanceof(Stash.Drivers.Ephemeral);
        });

        context('#get', function () {
          it('should return null for nonexisting keys', function () {
            expect(driver.get('foo')).to.be.null;
          });

          it('should accept path like cache', function () {
            driver.put('a/b/c', 'foo');
            expect(driver.get('a/b/c').value).to.be.equal('foo');
          });

          it('should accept callback', function (done) {
            driver.put('foo', 'bar');
            driver.get('foo', function (data) {
              expect(data.value).to.be.equal('bar');
              done();
            });
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

          it('should call callback', function (done) {
            driver.put('foo', 'bar', function (err) {
              done();
            });
          });
        });

        context('#delete', function () {
          it('should delete a key', function () {
            driver.put('foo', 'bar');
            driver.delete('foo');
            expect(driver.get('foo')).to.be.null;
          });

          it('should delete all subkeys', function () {
            driver.put('foo/bar/baz', 'baz');
            driver.delete('foo/bar');
            expect(driver.get('foo/bar/baz')).to.be.null;
          });
        });
      });
    })(driverName);
  }
});
