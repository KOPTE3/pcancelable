/**
 * Cancellable identifier.
 */

const CANCELLABLE_IDENTIFIER = '@@Cancellable';

export class CancellationError extends Error {
  constructor() {
    super('Cancellable was canceled');

    this.name = 'CancellationError';
  }
}

/**
 * Export `Cancellable`.
 */

export default class Cancellable {
  canceled = false;
  children = null;
  onCancel = null;
  parent = null;
  _throwOnCancel = false;

  constructor(executor) {
    if (typeof executor !== 'function') {
      throw new TypeError('Cancellable resolver undefined is not a function');
    }

    Object.defineProperty(this, CANCELLABLE_IDENTIFIER, {
      value: true,
      writable: false,
      readable: true
    });

    this.promise = new Promise((resolve, reject) => {
      this._reject = reject;

      // Wraps the executor into a promise and passes `resolve`, `reject` and `onCancel` methods.
      new Promise((resolve, reject) => {
        executor(
          value => {
            this._resolveValue = value;
            resolve(value);
          },
          reason => {
            reject(reason);
          },
          callback => {
            this.onCancel = callback;
          }
        );
      })
        .then(value => {
          resolve(value);
        })
        .catch(reason => {
          reject(reason);
        });
    });
  }

  /**
   * Returns a cancellable that either fulfills when all of the values in the
   * iterable argument have fulfilled or rejects as soon as one of the
   * cancellables in the iterable argument rejects.
   *
   * This method wraps the `Promise.all` method and creates a list of
   * cancellables that are canceled when `.cancel()` is called.
   */

  static all(iterable) {
    const cancellable = Cancellable.resolve(Promise.all(iterable));

    for (const value of iterable) {
      if (!Cancellable.isCancellable(value)) {
        continue;
      }

      if (cancellable.children) {
        cancellable.children.push(value);
      } else {
        cancellable.children = [value];
      }
    }

    return cancellable;
  }

  /**
   * Determines whether the passed value is a `Cancellable`.
   */

  static isCancellable(value) {
    return !!(value && value[CANCELLABLE_IDENTIFIER]);
  }

  /**
   * Returns a cancellable that fulfills or rejects as soon as one of the
   * cancellables in the iterable fulfills or rejects, with the value or reason
   * from that cancellable.
   *
   * This method wraps the `Promise.all` method and creates a list of
   * cancellables that are canceled when `.cancel()` is called.
   */

  static race(promises) {
    const cancellable = Cancellable.resolve(Promise.race(promises));

    for (const promise of promises) {
      if (!Cancellable.isCancellable(promise)) {
        continue;
      }

      if (cancellable.children) {
        cancellable.children.push(promise);
      } else {
        cancellable.children = [promise];
      }
    }

    return cancellable;
  }

  /**
   * Returns a `Cancellable` object that is resolved with the given value. If the
   * value is a thenable (i.e. has a then method), the returned promise will
   * unwrap that thenable, adopting its eventual state. Otherwise the returned
   * promise will be fulfilled with the value.
   */

  static resolve(value) {
    if (Cancellable.isCancellable(value)) {
      return value;
    }

    return new Cancellable(resolve => {
      resolve(value);
    });
  }

  /**
   * Returns a `Cancellable` object that is rejected with the given reason.
   */

  static reject(reason) {
    return Cancellable.resolve(Promise.reject(reason));
  }

  /**
   * Cancels the `Cancellable`. It iterates upwards the chain canceling all the
   * registered cancellables including its children.
   */

  cancel(cb = () => {}) {
    let current = this;

    if (current.isCanceled()) {
      return;
    }

    while (current) {
      let prev = current;

      if (current.children) {
        for (let child of current.children) {
          if (Cancellable.isCancellable(child)) {
            child.cancel();
            child = null;
          }
        }

        current.children = null;
      }

      if (Cancellable.isCancellable(current._resolveValue)) {
        current._resolveValue.cancel();
      }

      current.setCanceled();

      if (current.onCancel && typeof current.onCancel === 'function') {
        current.onCancel(cb);
      }

      if (!current.parent && current._throwOnCancel) {
        current._reject(new CancellationError());
      }

      current = prev.parent;
      prev = null;
    }
  }

  throwOnCancel() {
    this._throwOnCancel = true;

    return this;
  }

  /**
   * Has the same behavior of `Promise.catch` method.
   * Appends a rejection handler callback to the cancellable, and returns a new
   * `Cancellable` resolving to the return value of the callback if it is called,
   * or to its original fulfillment value if the cancellable is instead fulfilled.
   */

  catch(...args) {
    const cancellable = Cancellable.resolve(this.promise.catch(...args));

    cancellable.parent = this;

    return cancellable;
  }

  /**
   * Determines whether the created `Cancellable` is canceled.
   */

  isCanceled() {
    return this.canceled;
  }

  setCanceled() {
    this.canceled = true;
  }

  /**
   * Has the same behavior of `Promise.then` method.
   * Appends fulfillment and rejection handlers to the cancellable, and returns
   * a new `Cancellable` resolving to the return value of the called handler,
   * or to its original settled value if the promise was not handled.
   */

  then(...args) {
    const cancellable = Cancellable.resolve(this.promise.then(...args));

    cancellable.parent = this;

    return cancellable;
  }
}
