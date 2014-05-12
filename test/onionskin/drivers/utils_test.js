describe('OnionSkin::Drivers::Utils', function () {
  var utils = OnionSkin.Drivers.Utils;

  it('should be an object', function () {
    expect(OnionSkin.Drivers.Utils).to.be.an.object;
  });

  context('#assemble', function () {
    it('should not raise an exception for objects', function () {
      expect(function () {
        OnionSkin.Drivers.Utils.assemble({}, 0);
      }).not.to.throw;
    });

    it('should throw for functions', function () {
      expect(function () {
        OnionSkin.Drivers.Utils.assemble(function () {}, 0);
      }).to.throw;
    });

    it('should return an object with value and expiration', function () {
      expect(OnionSkin.Drivers.Utils.assemble('foo', 0))
        .to.be.equal(JSON.stringify({
          value: 'foo',
          expiration: 0
        }));
    });
  });

  context('#key', function () {
    it('should assemble an array', function () {
      expect(utils.key('foo', ['a', 'b', 'c'])).to.be.equal('foo/a/b/c');
    });

    it('should trim spaces', function () {
      expect(utils.key('foo', '  bar  ')).to.be.equal('foo/bar');
    });

    it('should trim slashes', function () {
      expect(utils.key('foo', '//a/b/c///')).to.be.equal('foo/a/b/c');
      expect(utils.key('foo', '/a')).to.be.equal('foo/a');
    });
  });
});
