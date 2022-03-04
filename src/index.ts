/**
 *
 * @description readme.md
 * @author Jaenster
 * @license MIT
 *
 */

function getPromise<T>(): { promise: Promise<T>, resolve: (v: T) => void, reject: (e: any) => void } {
    let resolve, reject;
    const promise = new Promise<T>((res, rej) => (resolve = res, reject = rej));
    return {promise, resolve, reject}
}

export function Synchronized(): MethodDecorator {
    return function (target: object, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor {

        // override the original method
        ((method: Function) => descriptor.value = function (...args) {

            // upsert symbol on this object
            this[Synchronized.symbol] ??= {};

            // upsert queued array on first time its used
            const queue = this[Synchronized.symbol][propertyKey] ??= [];

            // function to invoke the next promise
            const next = () => {
                const [next] = queue;
                if (next) return next[Synchronized.runQueue]();

                // clear array queue once queue is empty
                delete this[Synchronized.symbol][propertyKey];
            }

            const {promise, resolve, reject} = getPromise();

            promise[Synchronized.runQueue] = () =>
                method.apply(this, args)
                    .then(resolve)
                    .catch(reject)
                    .finally(() => {
                        queue.shift();
                        next();
                    })

            // start queue if this is the first that got added
            if (queue.push(promise) === 1) {
                next();
            }

            return promise;
        })(descriptor.value);

        return descriptor;
    }
}

Synchronized.symbol = Symbol('Synchronized');
Synchronized.runQueue = Symbol('synchronized-run-queue');
