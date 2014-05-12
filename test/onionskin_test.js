describe('OnionSkin', function () {
  it('should be available on window', function () {
    expect(OnionSkin).not.to.be.undefined;
  });

  it('should return an instance of pool', function () {
    expect(new OnionSkin()).to.be.an.instanceof(OnionSkin.Pool);
  });
});
