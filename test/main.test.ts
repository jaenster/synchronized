import {Synchronized} from "../src";


const delay = (ms = 0) => new Promise<void>(resolve => setTimeout(resolve, ms));
let waitMs = 200;

const callstack = [];
beforeEach(() => callstack.splice(0, callstack.length));

describe('modern syntax test', function () {

    class Foo {
        @Synchronized()
        async bar(i: number) {
            callstack.push('bar start #' + (i));
            await delay(waitMs);
            callstack.push('bar done #' + i);
        }

        // Not synchronized
        async baz(i: number) {
            callstack.push('baz start #' + (i));
            await delay(waitMs);
            callstack.push('baz done #' + i);
        }
    }


    const foo = new Foo();
    test('Synchronized takes 4 times the delay time', async () => {

        let startTimeQue = (new Date).getTime();

        // call bar 4 times
        let last: Promise<void>
        for (let i = 0; i < 5; i++) last = foo.bar(i);

        // test if queue has 5 calls on queue
        expect(foo[Synchronized.symbol]).toHaveProperty('bar');
        expect(foo[Synchronized.symbol].bar).toHaveLength(5);

        // wait for the last queued item to resolve
        await last;

        // its synchronized, expect it to take atleast 4x the delay
        expect((new Date).getTime() - startTimeQue).toBeGreaterThanOrEqual(waitMs * 5);
        expect((new Date).getTime() - startTimeQue).toBeLessThan(waitMs * 6);
        expect(callstack).toEqual([
            'bar start #0',
            'bar done #0',
            'bar start #1',
            'bar done #1',
            'bar start #2',
            'bar done #2',
            'bar start #3',
            'bar done #3',
            'bar start #4',
            'bar done #4',
        ]);

        // the resolve happens with the last, but it's not cleared from the array at that point
        // as this happens in the finally, so length is still 1
        expect(foo[Synchronized.symbol].bar).toHaveLength(1);

        // If we wait for a tick, it does get cleared as the finally gets called
        await delay();

        // The bar property has been removed
        expect(foo[Synchronized.symbol].bar).toBeUndefined();

        // the Synchronized.symbol object however sticks to the object
        expect(foo[Synchronized.symbol]).toBeDefined();
    });

    test('async takes 1 times the delay time', async () => {
        let startTimeQue = (new Date).getTime();
        // call baz 4 times
        let last: Promise<void>
        for (let i = 0; i < 5; i++) last = foo.baz(i);
        await last;

        // it is NOT synchronized, expect it to take once the delay but not much more
        expect((new Date).getTime() - startTimeQue).toBeGreaterThanOrEqual(waitMs);
        expect((new Date).getTime() - startTimeQue).toBeLessThan(waitMs * 2);
        expect(callstack).toEqual([
            'baz start #0',
            'baz start #1',
            'baz start #2',
            'baz start #3',
            'baz start #4',
            'baz done #0',
            'baz done #1',
            'baz done #2',
            'baz done #3',
            'baz done #4',
        ])
    });

});

describe('old syntax test', function () {
    class Foo {
        @Synchronized()
        bar(i: number): Promise<any> {
            callstack.push('bar start #' + i);
            return new Promise<void>(resolve => {
                setTimeout(() => {
                    resolve()
                }, waitMs)
            }).then(() => callstack.push('bar done #' + i))
        }

        baz(i: number): Promise<any> {
            callstack.push('baz start #' + i);
            return new Promise<void>(resolve => {
                setTimeout(() => {
                    resolve()
                }, waitMs)
            }).then(() => callstack.push('baz done #' + i))
        }
    }

    const foo = new Foo();

    test('Synchronized takes 4 times the delay time', () =>
        new Promise<void>(resolve => {
            const startTimeQue = (new Date).getTime();
            [0, 1, 2, 3, 4].map((i) => foo.bar(i)).pop().then(() => {

                // its synchronized, expect it to take atleast 4x the delay
                const time = (new Date).getTime() - startTimeQue;
                expect(time).toBeGreaterThanOrEqual(waitMs * 5);
                expect(time).toBeLessThan(waitMs * 6);
                expect(callstack).toEqual([
                    'bar start #0',
                    'bar done #0',
                    'bar start #1',
                    'bar done #1',
                    'bar start #2',
                    'bar done #2',
                    'bar start #3',
                    'bar done #3',
                    'bar start #4',
                    'bar done #4',
                ])

                resolve();
            })
        })
    );

    test('async takes 1 times the delay time', () =>
        new Promise<void>(resolve => {
            const startTimeQue = (new Date).getTime();
            [0, 1, 2, 3, 4].map((i) => foo.baz(i))[4].then(() => {

                // it is NOT synchronized, expect it to take once the delay but not much more
                expect((new Date).getTime() - startTimeQue).toBeGreaterThanOrEqual(waitMs);
                expect((new Date).getTime() - startTimeQue).toBeLessThan(waitMs * 2);
                expect(callstack).toEqual([
                    'baz start #0',
                    'baz start #1',
                    'baz start #2',
                    'baz start #3',
                    'baz start #4',
                    'baz done #0',
                    'baz done #1',
                    'baz done #2',
                    'baz done #3',
                    'baz done #4',
                ])
                resolve();
            })
        })
    )
});

