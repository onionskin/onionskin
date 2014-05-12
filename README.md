# [![OnionSkin](logo/onionskin.png)](http://onionskin.io) [OnionSkin](http://onionskin.io)  #

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

pool.get('my/key/path').catch(function (err) {
  // Data is either inexistent or expired
  return slowFuncThatReturnsPromise().then(this.save);
});
```

## Documentation ##

You can find more usage examples at the website's [Getting Started](http://onionskin.io/getting-started) section
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
