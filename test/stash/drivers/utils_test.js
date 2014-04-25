describe('Stash::Drivers::Utils', function () {
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
