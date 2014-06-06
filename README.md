# [![OnionSkin](logo/onionskin.png)](http://onionskin.io) [OnionSkin](http://onionskin.io)  #
[![NPM version](https://badge.fury.io/js/onionskin.svg)](http://badge.fury.io/js/onionskin) [![Dependency Status](https://david-dm.org/onionskin/onionskin.svg)](https://david-dm.org/onionskin/onionskin) [![Build Status](https://travis-ci.org/onionskin/onionskin.svg?branch=master)](https://travis-ci.org/onionskin/onionskin) [![Code Climate](https://codeclimate.com/github/onionskin/onionskin.png)](https://codeclimate.com/github/onionskin/onionskin) [![Code Climate](https://codeclimate.com/github/onionskin/onionskin/coverage.png)](https://codeclimate.com/github/onionskin/onionskin)

OnionSkin is multi-layer cache manager library that works with Node.js and vanilla javascript

## Installation ##

You can either install via [npm](https://www.npmjs.org)

```javascript
$ npm install onionskin
```

Or via [bower](http://bower.io/)

```
$ bower install onionskin
```

Or you can just grab a copy of it [here](https://raw.githubusercontent.com/onionskin/onionskin/master/dist/onionskin.js)

### Basic Usage ###

```javascript
// Library is exposed on the browser with browserify for API consistency with node.js
var OnionSkin = require('onionskin');

// Initialize a pool
var pool = new OnionSkin();

pool.get('my/key/path', function (err) {
  // Data is either inexistent or expired
  return slowFuncThatReturnsPromise();
}).then(function (value) {
  // The value that was either on cache or was just generated
  console.log(value);
});
```

## Documentation ##

You can find more usage examples at the website's [Getting Started](http://onionskin.io/#getting-started) section
Also there is the [API Documentation](http://onionskin.io/api)

## Need help? ##

You can:

* Talk to me at [@onionskinjs](http://twitter.com/onionskinjs)
* Ask a question at [StackOverflow](http://stackoverflow.com)
* Send me an email at [contact@onionskin.io](mailto:contact@onionskin.io)

## Want to help? ##

So you decided you want to help... This is awesome!!!
Follow this steps and I will be really glad to merge your work and add you to the contributors!

* [Fork](https://help.github.com/articles/fork-a-repo) the project
* Clone it and create a branch with the name of the feature you intend to add

    ```
    $ git clone git@github.com:username/onionskin.git
    $ git checkout -b new-feature-name
    ```

* Install the dependencies

    ```
    $ bower install # for browser tests
    $ npm install # for node.js tests
    ```

* Please add tests to your features. 
  1. Tests run with [Mocha](http://visionmedia.github.io/mocha/) and use [Chai](http://chaijs.com) for expectations.
  1. Expect is preferred to should due to browser compatibility
  1. The test folder respect the same structure as the source, you can run the tests through npm:
    ```
    $ npm test
    ```

    or run specific tests with mocha:


    ```
    mocha test/stash/drivers/*.js
    ```

    you also can run the tests on browser


    ```
    open test/index.html
    ```
* Send me a [pull request](https://help.github.com/articles/using-pull-requests)

## What is coming next ##

* WebSQL, Cassandra, MongoDB [, ... ] drivers
* Benchmarks
* More examples

## Contributors ##

This project was created by [@tadeuzagallo](http://twitter.com/tadeuzagallo) inspired by a PHP library
named [Stash](http://stash.tedivm.com) and was originally Stash.js.
If you want to join just follow the [instructions](#want-to-help), any help will be very welcome.

## Changelog

### 1.0.1
* The function to generate missing cache should be passed as the last parameter to `pool.get`, although generating cache `Promise.catch` is still supported the cache will never be unlocked if `item.save` or `item.set` are not called.
* Also when the cache generator function is passed as parameter, there is no need to call either `item.save` or `item.set`, just return the value you want to be cached and it will automatically saved and passed along to the promise chain.
