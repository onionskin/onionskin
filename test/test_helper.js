var chai = require('chai'),
    Stash = require('../src/stash').Stash;

global.Stash = Stash;
global.chai = chai;
global.expect = chai.expect;

chai.should();
