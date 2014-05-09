# ![Stash.js](logo/logo.png) Stash.js  #

[![Build Status](https://travis-ci.org/tadeuzagallo/stash.js.svg?branch=master)](https://travis-ci.org/tadeuzagallo/stash.js) [![Code Climate](https://codeclimate.com/github/tadeuzagallo/stash.js.png?v1.1.0)](https://codeclimate.com/github/tadeuzagallo/stash.js) [![Code Climate Coverage](https://codeclimate.com/github/tadeuzagallo/stash.js/coverage.png?v1.1.0)](https://codeclimate.com/github/tadeuzagallo/stash.js)

Inspired by the [php library](https://github.com/tedivm/Stash), Stash makes it easier to save your data on multiple layers of cache

[Click here](http://rawgit.com/tadeuzagallo/stash.js/master/examples/facebook.html) to see the [Facebook example](https://github.com/tadeuzagallo/stash.js/blob/master/examples/facebook.html) running on [RawGit](http://rawgit.com/)

## Installation ##

You can either install via [npm](https://www.npmjs.org)

```javascript
$ npm install stash.js
```

Or via [bower](http://bower.io/)

```
$ bower install stash.js
```

Or you can just grab a copy of the [stash.js](https://raw.githubusercontent.com/tadeuzagallo/stash.js/master/src/stash.js) file

### Basic Usage ###

*Syntax Updated:* in order to add new drivers, I had to replace the old sync syntax, the new one is based on promises, and it now depends on [bluebird](https://github.com/petkaantonov/bluebird)

```javascript
// By version 1.2 you should require('stash.js');
// It is still available on window, but is deprecated and will be removed on version 2.0
var Stash = require('stash.js');

// Initialize a stash pool
var stash = new Stash.Pool();

// Short version  -- with Promise

stash.get('my/key/path').catch(function (err) {
  // Data is either inexistent or expired
  return slowFuncThatReturnsPromise().then(this.save);
});

// Long Version (stash.get does all of it internally)
var item = stash.getItem('my/key/path');

item.get().then(function (data) {
  item.isMiss().then(function (missed) {
    if (missed) {
      item.lock(); // Async lock
      actuallyFetchData(function (data) {
        item.set(data);
        callback(data);
      });
    } else {
      callback(data);
    }
  });
});
```

You can run the node.js samples on the `examples` folder to see a really basic demo

### Managing drivers ###

```javascript
var ephemeral = new Stash.Drivers.Ephemeral();
var localStorage = new Stash.Drivers.LocalStorage('my-custom-namespace');
var indexedDB = new Stash.Drivers.IndexedDB('my-custom-dbname');

// Config info available below
var redis = new Stash.Drivers.Redis(); 
var memcached = new Stash.Drivers.Memcached();

var clientPool = new Stash.Pool([ephemeral, localStorage]); // It reads on this order, and writes in reverse order
var serverPool = new Stash.Pool([ephemeral, memcached, redis]);
```

### Drivers ###

Right now there are five drivers

* Ephemeral - runtime only
* LocalStorage([string namespace]) - saves on browser localStorage - accepts a namespace as optional parameter
* IndexedDB([string db_name]) - saves on browser indexed database - accepts a database name as optional parameter
* Memcached - uses [node-memcached](https://github.com/3rd-Eden/node-memcached), the constructor accpets `serverLocations` and `options`, that are passed to the `node-memcached` constructor, info about configuration available [here](https://github.com/3rd-Eden/node-memcached#server-locations)
* Redis - uses [node-redis](https://github.com/mranney/node_redis/) to store cache on redis, All parameters passed to the constructor will be passed to `redis.createClient()`

I should create some extra drivers in a really near future... If you want to contribute with some driver, just fork e send me a pull request, will be happy to merge! =)

### Invalidation ###

There are 4 cache policies right now:

* `Stash.Item.SP_NONE` (default): Ignores the `lock`, if an item is expired, `isMiss` will just return `true` anyway
* `Stash.Item.SP_OLD`: will return the old value and the subsequent `item.isMiss()` calls will return `false` while another instance has the context `lock()`ed
* `Stash.Item.SP_PRECOMPUTE`: you should call `item.get(Stash.Item.SP_PRECOMPUTE, time)`, where `item.isMiss()` will eventually return `true` for one instance `time` seconds before the cache is expired
* `Stash.Item.SP_VALUE`: a default `value` should be passed along the `get()` call, this value will be returned if the cache is expired and `lock()`ed

## TODO ##

* IndexedDB and WebSQL drivers
* maybe MongoDB driver
* add Benchmarks
* more examples

## Contact ##

Feel free to share any doubts, thoughts or even complaints, either on the [issues](https://github.com/tadeuzagallo/stash.js/issues), via [email](mailto:tadeuzagallo@gmail.com) or [send me a tweet](https://twitter.com/tadeuzagallo)!

