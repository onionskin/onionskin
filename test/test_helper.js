var chai = require('chai'),
    Stash = require('../src/stash').Stash;

global.Stash = Stash;
global.chai = chai;
global.expect = chai.expect;
global.catching = function (done, fn) {
  try {
    fn();
    done();
  } catch (err) {
    done(err);
  }
};

chai.should();
