# Stash.js #

Inspired by the [php library](https://github.com/tedivm/Stash), Stash makes it easier to save your data on multiple layers of cache.

## Usage ##

You can install it via [bower](http://bower.io/)

```
$ bower install stash
```

Or you can just grab a copy of the [stash.js](https://raw.githubusercontent.com/tadeuzagallo/stash.js/master/src/stash.js) file

### Basic Usage ###

```javascript
var stash = new Stash.Pool();
var item = stash.getItem('my/key/path');
var data = item.get();

if (item.isMiss()) {
  item.lock(); // Check invalidation options to see how it affects lock behavior

  data = ...

  item.set(data, cacheDuration);
}
```

### Managing drivers ###

```javascript
var ephemeral = new Stash.Drivers.Ephemeral();
var localStorage = new Stash.Drivers.LocalStorage('my-custom-namespace');
var pool = new Stash.Pool([ephemeral, localStorage]); // It read on this order, and writes in reverse order
```

### Drivers ###

Right now there are just this two drivers

* Ephemeral - runtime only
* LocalStorage - saves on browser localStorage

I should create some extra drivers in a really near future... If you want to contribute with some driver, just fork e send me a pull request, will be happy to merge! =)

### Invalidation ###

There are 4 cache policies right now:

* `Stash.Item.SP_NONE` (default): Ignores the `lock`, if an item is expired, `isMiss` will just return `true` anyway
* `Stash.Item.SP_OLD`: will return the old value and the subsequent `item.isMiss()` calls will return `false` while another instance has the context `lock()`ed
* `Stash.Item.SP_PRECOMPUTE`: you should call `item.get(Stash.Item.SP_PRECOMPUTE, time)`, where `item.isMiss()` will eventually return `true` for one instance `time` seconds before the cache is expired
* `Stash.Item.SP_VALUE`: a default `value` should be passed along the `get()` call, this value will be returned if the cache is expired and `lock()`ed

## TODO ##

* Add more drivers
* Suporte Node.js as well
* Maybe a jQuery plugin to integrate with ajax calls

## Contact ##

Feel free to share any doubts, thoughts or even complaints, either on the [issues](https://github.com/tadeuzagallo/stash.js/issues), via [email](mailto:tadeuzagallo@gmail.com) or [send me a tweet](https://twitter.com/tadeuzagallo)!
