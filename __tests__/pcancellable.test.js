/**
 * Module dependencies.
 */

import Cancellable from '../src';

/**
 * Test `Cancellable`.
 */

describe('Cancellable', () => {
  describe('constructor', () => {
    it('throws an error if the given executor is not a function', () => {
      expect(() => new Cancellable()).toThrow(
        'Cancellable resolver undefined is not a function'
      );
    });

    it('creates an object with default properties', () => {
      const cancellable = new Cancellable(() => {});

      expect(cancellable).toHaveProperty('@@Cancellable', true);
      expect(cancellable).toHaveProperty('canceled', false);
      expect(cancellable).toHaveProperty('children', null);
      expect(cancellable).toHaveProperty('onCancel', null);
      expect(cancellable).toHaveProperty('parent', null);
      expect(cancellable).toHaveProperty('promise');
      expect(typeof cancellable.then === 'function').toBe(true);
    });

    it('creates a cancellable that resolves the given executor', async () => {
      const cancellable = new Cancellable(resolve => {
        resolve('foo');
      });

      expect(await cancellable).toBe('foo');
    });

    it('passes a cancelation handler to the executor which is called when it is canceled', () => {
      expect.assertions(2);

      const cb = jest.fn();
      const cancellable = new Cancellable((resolve, reject, onCancel) => {
        onCancel(cb);
      });

      cancellable.catch(error => {
        expect(error.name).toBe('CancellationError');
      });

      cancellable.cancel();

      expect(cb).toHaveBeenCalledTimes(1);
    });
  });

  describe('isCancellable', () => {
    it('returns false if a value is not provided', () => {
      expect(Cancellable.isCancellable()).toBe(false);
    });

    it('returns false if the given value is not a cancellable', () => {
      expect(Cancellable.isCancellable('foo')).toBe(false);
    });

    it('returns true if the given value is a cancellable', () => {
      const cancellable = Cancellable.resolve();

      expect(Cancellable.isCancellable(cancellable)).toBe(true);
    });
  });

  describe('reject', () => {
    it('rejects the promise', () => {
      return Cancellable.reject('foo').catch(value => {
        expect(value).toBe('foo');
      });
    });
  });

  describe('then', () => {
    it('returns a new Cancellable', () => {
      expect(Cancellable.isCancellable(Cancellable.resolve().then()));
    });

    it('can be chained', () => {
      return Cancellable.resolve(1).then(value => value).then(value => {
        expect(value).toBe(1);
      });
    });
  });

  describe('isCanceled', () => {
    it('returns false by default', () => {
      expect(Cancellable.resolve().isCanceled()).toBe(false);
    });

    it('returns true if the cancellable was canceled', () => {
      const cancellable = Cancellable.resolve();

      expect.assertions(2);

      cancellable.catch(error => {
        expect(error.name).toBe('CancellationError');
      });

      cancellable.cancel();

      expect(cancellable.isCanceled()).toBe(true);
    });
  });

  describe('resolve', () => {
    it('returns a Cancellable', () => {
      expect(Cancellable.isCancellable(Cancellable.resolve())).toBe(true);
    });

    it('returns the given cancellable', () => {
      const cancellable = Cancellable.resolve();

      expect(Cancellable.resolve(cancellable) === cancellable).toBe(true);
    });
  });

  describe('all', () => {
    it('resolves the given values', async () => {
      const cancellable = Cancellable.resolve('foo');
      const promise = Promise.resolve('bar');

      expect(await Cancellable.all([cancellable, promise])).toEqual([
        'foo',
        'bar'
      ]);
    });

    it('stores the cancellables', () => {
      const cancellable1 = Cancellable.resolve();
      const cancellable2 = Cancellable.resolve();
      const all = Cancellable.all([cancellable1, 1, cancellable2, 2, 3]);

      expect(all.children.length).toBe(2);
      expect(all.children).toEqual([cancellable1, cancellable2]);
    });

    it('cancels all the given cancellables', () => {
      const cancellable1 = Cancellable.resolve();
      const cancellable2 = Cancellable.resolve();
      const all = Cancellable.all([cancellable1, cancellable2]);

      expect.assertions(10);

      all.catch(error => {
        expect(error.message).toBe('Cancellable was canceled');
      });

      expect(all.children.length).toBe(2);
      expect(all.children).toEqual([cancellable1, cancellable2]);
      expect(all.isCanceled()).toBe(false);
      expect(cancellable1.isCanceled()).toBe(false);
      expect(cancellable2.isCanceled()).toBe(false);

      all.cancel();

      expect(all.children).toBeNull();
      expect(all.isCanceled()).toBe(true);
      expect(cancellable1.isCanceled()).toBe(true);
      expect(cancellable2.isCanceled()).toBe(true);
    });
  });

  describe('cancel', () => {
    it('calls the given callback', () => {
      const callback = jest.fn();

      expect.assertions(2);

      const cancellable = new Cancellable((resolve, reject, onCancel) => {
        resolve();

        onCancel(cb => {
          cb();
        });
      }).catch(error => {
        expect(error.name).toBe('CancellationError');
      });

      cancellable.cancel(callback);

      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('rejects the promise', () => {
      const cancellable = new Cancellable(resolve => {
        resolve();
      });

      expect.assertions(1);

      cancellable.catch(error => {
        expect(error.name).toBe('CancellationError');
      });

      cancellable.cancel();
    });
  });

  describe('race', () => {
    it('resolves the given values', async () => {
      return Cancellable.race([1, 2]).then(value => {
        expect(value).toBe(1);
      });
    });

    it('stores the cancellables', () => {
      const cancellable1 = Cancellable.resolve();
      const cancellable2 = Cancellable.resolve();
      const race = Cancellable.race([cancellable1, 1, cancellable2, 2, 3]);

      expect(race.children.length).toBe(2);
      expect(race.children).toEqual([cancellable1, cancellable2]);
    });

    it('cancels all the given cancellables', () => {
      expect.assertions(10);

      const cancellable1 = Cancellable.resolve();
      const cancellable2 = Cancellable.resolve();
      const race = Cancellable.race([cancellable1, cancellable2]);

      race.catch(error => {
        expect(error.name).toBe('CancellationError');
      });

      expect(race.children.length).toBe(2);
      expect(race.children).toEqual([cancellable1, cancellable2]);
      expect(race.isCanceled()).toBe(false);
      expect(cancellable1.isCanceled()).toBe(false);
      expect(cancellable2.isCanceled()).toBe(false);

      race.cancel();

      expect(race.children).toBeNull();
      expect(race.isCanceled()).toBe(true);
      expect(cancellable1.isCanceled()).toBe(true);
      expect(cancellable2.isCanceled()).toBe(true);
    });
  });
});
