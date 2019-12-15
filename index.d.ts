declare class CancelErrorClass extends Error {
	readonly name: 'CancellationError';

	constructor(reason?: string);
}

declare namespace Cancellable {
	/**
	Accepts a function that is called when the promise is canceled.

	You're not required to call this function. You can call this function multiple times to add multiple cancel handlers.
	 */
	interface OnCancelFunction {
		(cancelHandler: any | (() => void)): void;
	}

	type CancelError = CancelErrorClass;
}

declare class Cancellable<ValueType> extends Promise<ValueType> {
	/**
	Create a promise that can be canceled.

	Can be constructed in the same was as a [`Promise` constructor](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise), but with an appended `onCancel` parameter in `executor`. `Cancellable` is a subclass of `Promise`.

	@example
	```
	import Cancellable = require('pcancellable');

	const cancelablePromise = new Cancellable((resolve, reject, onCancel) => {
		const job = new Job();

		onCancel(() => {
			job.stop();
		});

		job.on('finish', resolve);
	});

	cancelablePromise.cancel(); // Doesn't throw an error
	```
	 */
	constructor(
		executor: (
			resolve: (value?: ValueType | PromiseLike<ValueType>) => void,
			reject: (reason?: unknown) => void,
			onCancel: Cancellable.OnCancelFunction
		) => void
	);

	isCanceled(): boolean;

	throwOnCancel(): this;

	cancel(reason?: any | (() => void)): void;

	static CancelError: typeof CancelErrorClass;
}

export default Cancellable;
