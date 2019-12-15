# Cancellable (this package in development, do not use it)

> Wrapper to create cancellable promises.

A `Promise` cannot be canceled since once it is created and fulfillment or a rejection handler is registered to it, there is no external mechanism to stop its progression.
A `Cancellable` wraps the ES6 standard `Promise`, and it is compatible with whatever promise-consuming tool.

## Status

[![Travis](https://img.shields.io/travis/joaogranado/pcancellable.svg)](https://travis-ci.org/joaogranado/pcancellable)
[![Greenkeeper badge](https://badges.greenkeeper.io/joaogranado/pcancellable.svg)](https://greenkeeper.io/)

## Installation

```sh
npm install --save pcancellable
```

or

```
yarn add pcancellable
```

## What is a Cancellable

A `Cancellable` implements the same methods of a standard ES6 `Promise`, however:

- It can be canceled. Once the `.cancel()` method is called it notifies all registered resolution handlers.
- The `constructor` executor parameter receives an additional `onCancel` argument is executed once the `.cancel()` is called.

## API

### `Cancellable`

The constructor has a single parameter - the `Cancellable` resolver, which is a function that is passed with the arguments `resolve`, `reject` and `onCancel`. The `onCancel` is a function that receives an handler which that is called once the `Cancellable` is canceled.

```js
const delay = delta => {
  return new Cancellable((resolve, reject, onCancel) => {
    const id = setTimeout(() => {
      resolve(id);
    }, delta);

    // Called when canceled.
    onCancel(() => {
      clearTimeout(id);

      console.log(`Cancelled! ${id}`);
    });
  });
};

// Without cancelation.
delay(100)
  .then(console.log); // > '1'

// With cancelation.
delay(100)
  .then(console.log) // Not called.
  .cancel(); // > 'Cancelled 1'
```

### Static methods

#### `Cancellable.all(iterable: Iterable<T>): Cancellable<Array<T>>`
Has the same behaviour as the `Promise.all` method, except when it is canceled it cancels all `Cancellable`s included on the iterable argument.

Returns a cancellable that either fulfills when all of the values in the iterable argument have fulfilled or rejects as soon as one of the cancellables in the iterable argument rejects. This method wraps the `Promise.all` method and creates a list of cancellables that are canceled when `.cancel()` is called.

```js
// Without cancelation.
Cancellable
  .all(['foo', delay(1), delay(2)])
  .then(console.log); // > ['foo', 1, 2]

// With cancelation.
Cancellable
  .all([delay(1), delay(2)])
  .then(console.log); // Not called.
  .cancel()
  // > Cancelled 1
  // > Cancelled 2
```

#### `Cancellable.race(iterable: Iterable<T>): Cancellable<T>`
Has the same behaviour as the `Promise.race` method, except when it is canceled it cancels all `Cancellable`s included on the iterable argument.
Returns a cancellable that fulfills or rejects as soon as one of the cancellables in the iterable fulfills or rejects, with the value or reason from that cancellable. This method wraps the `Promise.all` method and creates a list of cancellables that are canceled when `.cancel()` is called.

```js
// Without cancelation.
Cancellable
  .race([delay(1), delay(2)])
  .then(console.log); // > 1

// With cancelation.
Cancellable
  .all([delay(1), delay(2)])
  .then(console.log); // Not called.
  .cancel()
  // > Cancelled 1
  // > Cancelled 2
```

#### `Cancellable.resolve(value: any)`
Has the same behavior as the `Promise.resolve` method.
Returns a `Cancellable` object that is resolved with the given value. If the value is a thenable (i.e. has a then method), the returned cancellable will unwrap that thenable, adopting its eventual state. Otherwise the returned cancellable will be fulfilled with the value.

#### `Cancellable.reject(value: any)`
Has the same behavior as the `Promise.reject` method.
Returns a `Cancellable` object that is rejected with the given reason.

#### `Cancellable.isCancellable(value: any): boolean`
Determines whether the passed value is a `Cancellable`.

### Instance methods

#### `Cancellable.prototype.isCanceled(): boolean`
Determines whether the created `Cancellable` is canceled.

#### `Cancellable.prototype.cancel(callback?: Function)`
Cancels the `Cancellable`. It iterates upwards the chain canceling all the registered cancellables including its children.
Unlike other implementations that rejects the promise when it is canceled, the `cancel` method receives an optional callback that is passed to the `onCancel` function. This way it is possible to cancel a cancellable without unhandled rejections.

```js
const delay = delta => new Cancellable((resolve, reject, onCancel) => {
  const id = setTimeout(() => {
    resolve();
  });

  onCancel(cb => {
    clearTimeout(id);
    cb(id);
  });
});

delta(1000).cancel(() => {
  console.log(`Timeout "${id}" was canceled!`)
}); // > Timeout "1" was canceled!
```

#### `Cancellable.prototype.catch(onRejected: Function): Cancellable`
Has the same behavior of `Promise.catch` method.
Appends a rejection handler callback to the cancellable, and returns a new `Cancellable` resolving to the return value of the callback if it is called, or to its original fulfillment value if the cancellable is instead fulfilled.

#### `Cancellable.prototype.then(onFullfilled: Function, onRejected: Function): Cancellable`
Has the same behavior of `Promise.then` method.
Appends fulfillment and rejection handlers to the cancellable, and returns a new `Cancellable` resolving to the return value of the called handler, or to its original settled value if the promise was not handled.

## Licence

MIT © [João Granado](https://github.com/joaogranado)
