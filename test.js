'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Cancelable identifier.
 */

var CANCELABLE_IDENTIFIER = '@@Cancelable';

var CancelationError = exports.CancelationError = function (_Error) {
	_inherits(CancelationError, _Error);

	function CancelationError() {
		_classCallCheck(this, CancelationError);

		var _this = _possibleConstructorReturn(this, (CancelationError.__proto__ || Object.getPrototypeOf(CancelationError)).call(this, 'Cancelable was canceled'));

		_this.name = 'CancelationError';
		return _this;
	}

	return CancelationError;
}(Error);

/**
 * Export `Cancelable`.
 */

var Cancelable = function () {
	function Cancelable(executor) {
		var _this2 = this;

		_classCallCheck(this, Cancelable);

		this.canceled = false;
		this.children = null;
		this.onCancel = null;
		this.parent = null;

		if (typeof executor !== 'function') {
			throw new TypeError('Cancelable resolver undefined is not a function');
		}

		Object.defineProperty(this, CANCELABLE_IDENTIFIER, {
			value: true,
			writable: false,
			readable: true
		});

		this.promise = new Promise(function (resolve, reject) {
			_this2._reject = reject;

			// Wraps the executor into a promise and passes `resolve`, `reject` and `onCancel` methods.
			new Promise(function (resolve, reject) {
				executor(function (value) {
					_this2.resolveValue = value;
					resolve(value);
				}, function (reason) {
					reject(reason);
				}, function (callback) {
					_this2.onCancel = callback;
				});
			}).then(function (value) {
				resolve(value);
			}).catch(function (reason) {
				reject(reason);
			});
		});
	}

	/**
	 * Returns a cancelable that either fulfills when all of the values in the
	 * iterable argument have fulfilled or rejects as soon as one of the
	 * cancelables in the iterable argument rejects.
	 *
	 * This method wraps the `Promise.all` method and creates a list of
	 * cancelables that are canceled when `.cancel()` is called.
	 */

	_createClass(Cancelable, [{
		key: 'cancel',


		/**
		 * Cancels the `Cancelable`. It iterates upwards the chain canceling all the
		 * registered cancelables including its children.
		 */

		value: function cancel() {
			var cb = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : function () {};

			var current = this;

			if (current.isCanceled()) {
				return;
			}

			while (current) {
				var prev = current;

				if (current.children) {
					var _iteratorNormalCompletion = true;
					var _didIteratorError = false;
					var _iteratorError = undefined;

					try {
						for (var _iterator = current.children[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
							var child = _step.value;

							if (Cancelable.isCancelable(child)) {
								child.cancel();
								child = null;
							}
						}
					} catch (err) {
						_didIteratorError = true;
						_iteratorError = err;
					} finally {
						try {
							if (!_iteratorNormalCompletion && _iterator.return) {
								_iterator.return();
							}
						} finally {
							if (_didIteratorError) {
								throw _iteratorError;
							}
						}
					}

					current.children = null;
				}

				if (current.resolveValue) {
					console.log('current.resolveValue');
					console.log(current.resolveValue);
					if (Cancelable.isCancelable(current.resolveValue)) {
						current.resolveValue.cancel();
					}
				}

				current.setCanceled();

				if (current.onCancel && typeof current.onCancel === 'function') {
					current.onCancel(cb);
				}

				if (!current.parent) {
					current._reject(new CancelationError());
				}

				current = prev.parent;
				prev = null;
			}
		}

		/**
		 * Has the same behavior of `Promise.catch` method.
		 * Appends a rejection handler callback to the cancelable, and returns a new
		 * `Cancelable` resolving to the return value of the callback if it is called,
		 * or to its original fulfillment value if the cancelable is instead fulfilled.
		 */

	}, {
		key: 'catch',
		value: function _catch() {
			var _promise;

			var cancelable = Cancelable.resolve((_promise = this.promise).catch.apply(_promise, arguments));

			cancelable.parent = this;

			return cancelable;
		}

		/**
		 * Determines whether the created `Cancelable` is canceled.
		 */

	}, {
		key: 'isCanceled',
		value: function isCanceled() {
			return this.canceled;
		}
	}, {
		key: 'setCanceled',
		value: function setCanceled() {
			this.canceled = true;
		}

		/**
		 * Has the same behavior of `Promise.then` method.
		 * Appends fulfillment and rejection handlers to the cancelable, and returns
		 * a new `Cancelable` resolving to the return value of the called handler,
		 * or to its original settled value if the promise was not handled.
		 */

	}, {
		key: 'then',
		value: function then() {
			var _promise2;

			var cancelable = Cancelable.resolve((_promise2 = this.promise).then.apply(_promise2, arguments));

			cancelable.parent = this;

			return cancelable;
		}
	}], [{
		key: 'all',
		value: function all(iterable) {
			var cancelable = Cancelable.resolve(Promise.all(iterable));

			var _iteratorNormalCompletion2 = true;
			var _didIteratorError2 = false;
			var _iteratorError2 = undefined;

			try {
				for (var _iterator2 = iterable[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
					var value = _step2.value;

					if (!Cancelable.isCancelable(value)) {
						continue;
					}

					if (cancelable.children) {
						cancelable.children.push(value);
					} else {
						cancelable.children = [value];
					}
				}
			} catch (err) {
				_didIteratorError2 = true;
				_iteratorError2 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion2 && _iterator2.return) {
						_iterator2.return();
					}
				} finally {
					if (_didIteratorError2) {
						throw _iteratorError2;
					}
				}
			}

			return cancelable;
		}

		/**
		 * Determines whether the passed value is a `Cancelable`.
		 */

	}, {
		key: 'isCancelable',
		value: function isCancelable(value) {
			return !!(value && value[CANCELABLE_IDENTIFIER]);
		}

		/**
		 * Returns a cancelable that fulfills or rejects as soon as one of the
		 * cancelables in the iterable fulfills or rejects, with the value or reason
		 * from that cancelable.
		 *
		 * This method wraps the `Promise.all` method and creates a list of
		 * cancelables that are canceled when `.cancel()` is called.
		 */

	}, {
		key: 'race',
		value: function race(promises) {
			var cancelable = Cancelable.resolve(Promise.race(promises));

			var _iteratorNormalCompletion3 = true;
			var _didIteratorError3 = false;
			var _iteratorError3 = undefined;

			try {
				for (var _iterator3 = promises[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
					var promise = _step3.value;

					if (!Cancelable.isCancelable(promise)) {
						continue;
					}

					if (cancelable.children) {
						cancelable.children.push(promise);
					} else {
						cancelable.children = [promise];
					}
				}
			} catch (err) {
				_didIteratorError3 = true;
				_iteratorError3 = err;
			} finally {
				try {
					if (!_iteratorNormalCompletion3 && _iterator3.return) {
						_iterator3.return();
					}
				} finally {
					if (_didIteratorError3) {
						throw _iteratorError3;
					}
				}
			}

			return cancelable;
		}

		/**
		 * Returns a `Cancelable` object that is resolved with the given value. If the
		 * value is a thenable (i.e. has a then method), the returned promise will
		 * unwrap that thenable, adopting its eventual state. Otherwise the returned
		 * promise will be fulfilled with the value.
		 */

	}, {
		key: 'resolve',
		value: function resolve(value) {
			if (Cancelable.isCancelable(value)) {
				return value;
			}

			return new Cancelable(function (resolve) {
				resolve(value);
			});
		}

		/**
		 * Returns a `Cancelable` object that is rejected with the given reason.
		 */

	}, {
		key: 'reject',
		value: function reject(reason) {
			return Cancelable.resolve(Promise.reject(reason));
		}
	}]);

	return Cancelable;
}();

exports.default = Cancelable;
