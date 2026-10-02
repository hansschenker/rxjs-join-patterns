import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Observable, Subject, of } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { and, pattern, thenDo, when } from '../src/index.ts';
import { installJoinPatterns, resetJoinPatternsForTests } from '../src/install.ts';
import '../src/augment.ts';

interface MarbleEvent {
  frame: number;
  value?: unknown;
  complete?: boolean;
  error?: unknown;
}

function toMarble(events: MarbleEvent[]): {
  marbles: string;
  values: Record<string, unknown>;
  error?: unknown;
} {
  if (events.length === 0) {
    return { marbles: '------', values: {} };
  }
  const max = events.reduce((highest, event) => Math.max(highest, event.frame), 0);
  const slots = Array.from({ length: max + 1 }, () => '-');
  const values: Record<string, unknown> = {};
  let error: unknown;
  let code = 97;
  for (const event of [...events].sort((left, right) => left.frame - right.frame)) {
    if (event.complete) {
      slots[event.frame] = '|';
    } else if ('error' in event) {
      slots[event.frame] = '#';
      error = event.error;
    } else {
      const char = String.fromCharCode(code);
      code += 1;
      slots[event.frame] = char;
      values[char] = event.value;
    }
  }
  return { marbles: slots.join(''), values, ...(error === undefined ? {} : { error }) };
}

function withScheduler(
  run: (helpers: {
    hot: (events: MarbleEvent[]) => Observable<number>;
    expectJoin: (source: Observable<unknown>, events: MarbleEvent[]) => void;
  }) => void,
): void {
  const scheduler = new TestScheduler((actual, expected) => {
    assert.deepEqual(actual, expected);
  });
  scheduler.run(({ hot, expectObservable }) => {
    run({
      hot: (events) => {
        const marble = toMarble(events);
        return hot(marble.marbles, marble.values, marble.error) as Observable<number>;
      },
      expectJoin: (source, events) => {
        const marble = toMarble(events);
        expectObservable(source).toBe(marble.marbles, marble.values, marble.error);
      },
    });
  });
}

const add = (...values: number[]) => values.reduce((sum, value) => sum + value, 0);

test('thenDo on one source emits its value and completes', () => {
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([
      { frame: 10, value: 1 },
      { frame: 20, complete: true },
    ]);
    expectJoin(
      when(thenDo(xs, (value) => value)),
      [
        { frame: 10, value: 1 },
        { frame: 20, complete: true },
      ],
    );
  });
});

test('a source error is forwarded immediately', () => {
  const error = new Error('boom');
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([{ frame: 10, error }]);
    expectJoin(when(thenDo(xs, (value) => value)), [{ frame: 10, error }]);
  });
});

test('a throwing selector becomes an error notification', () => {
  const error = new Error('selector');
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([
      { frame: 10, value: 1 },
      { frame: 20, complete: true },
    ]);
    expectJoin(
      when(
        thenDo(xs, () => {
          throw error;
        }),
      ),
      [{ frame: 10, error }],
    );
  });
});

test('and joins 2 to 9 sources, including an error on any one of them', () => {
  for (let width = 2; width <= 9; width += 1) {
    withScheduler(({ hot, expectJoin }) => {
      const sources = Array.from({ length: width }, () =>
        hot([
          { frame: 10, value: 1 },
          { frame: 20, complete: true },
        ]),
      );
      expectJoin(when(and(...sources).thenDo((...values: number[]) => add(...values))), [
        { frame: 10, value: width },
        { frame: 20, complete: true },
      ]);
    });

    for (let errorAt = 0; errorAt < width; errorAt += 1) {
      const error = new Error(`width ${width} slot ${errorAt}`);
      withScheduler(({ hot, expectJoin }) => {
        const sources = Array.from({ length: width }, (_, index) =>
          index === errorAt
            ? hot([{ frame: 10, error }])
            : hot([
                { frame: 10, value: 1 },
                { frame: 20, complete: true },
              ]),
        );
        expectJoin(when(and(...sources).thenDo((...values: number[]) => add(...values))), [
          { frame: 10, error },
        ]);
      });
    }

    const thrown = new Error(`throw ${width}`);
    withScheduler(({ hot, expectJoin }) => {
      const sources = Array.from({ length: width }, () =>
        hot([
          { frame: 10, value: 1 },
          { frame: 20, complete: true },
        ]),
      );
      expectJoin(
        when(
          and(...sources).thenDo(() => {
            throw thrown;
          }),
        ),
        [{ frame: 10, error: thrown }],
      );
    });
  }
});

test('symmetric queues zip in arrival order', () => {
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([
      { frame: 10, value: 1 },
      { frame: 20, value: 2 },
      { frame: 30, value: 3 },
      { frame: 40, complete: true },
    ]);
    const ys = hot([
      { frame: 40, value: 4 },
      { frame: 50, value: 5 },
      { frame: 60, value: 6 },
      { frame: 70, complete: true },
    ]);
    expectJoin(when(and(xs, ys).thenDo((x: number, y: number) => x + y)), [
      { frame: 40, value: 5 },
      { frame: 50, value: 7 },
      { frame: 60, value: 9 },
      { frame: 70, complete: true },
    ]);
  });
});

test('asymmetric queues drop the leftover value when the other side completes', () => {
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([
      { frame: 10, value: 1 },
      { frame: 20, value: 2 },
      { frame: 30, value: 3 },
      { frame: 40, complete: true },
    ]);
    const ys = hot([
      { frame: 40, value: 4 },
      { frame: 50, value: 5 },
      { frame: 70, complete: true },
    ]);
    expectJoin(when(pattern(xs).and(ys).thenDo((x: number, y: number) => x + y)), [
      { frame: 40, value: 5 },
      { frame: 50, value: 7 },
      { frame: 70, complete: true },
    ]);
  });
});

test('two empty sources complete at the later completion', () => {
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([{ frame: 40, complete: true }]);
    const ys = hot([{ frame: 70, complete: true }]);
    expectJoin(when(and(xs, ys).thenDo((x: number, y: number) => x + y)), [{ frame: 70, complete: true }]);
  });
});

test('sources that never emit do not complete the join', () => {
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([]);
    const ys = hot([]);
    expectJoin(when(and(xs, ys).thenDo((x: number, y: number) => x + y)), []);
  });
});

test('an error wins over a later completion', () => {
  const error = new Error('left');
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([{ frame: 40, error }]);
    const ys = hot([{ frame: 70, complete: true }]);
    expectJoin(when(and(xs, ys).thenDo((x: number, y: number) => x + y)), [{ frame: 40, error }]);
  });
});

test('competing plans consume each value at most once', () => {
  withScheduler(({ hot, expectJoin }) => {
    const xs = hot([
      { frame: 10, value: 1 },
      { frame: 20, value: 2 },
      { frame: 30, value: 3 },
      { frame: 40, complete: true },
    ]);
    const ys = hot([
      { frame: 40, value: 4 },
      { frame: 50, value: 5 },
      { frame: 60, value: 6 },
      { frame: 70, complete: true },
    ]);
    const zs = hot([
      { frame: 20, value: 7 },
      { frame: 30, value: 8 },
      { frame: 40, value: 9 },
      { frame: 100, complete: true },
    ]);
    const joined = when(
      and(xs, ys).thenDo((x: number, y: number) => x + y),
      and(xs, zs).thenDo((x: number, z: number) => x * z),
      and(ys, zs).thenDo((y: number, z: number) => y - z),
    );
    expectJoin(joined, [
      { frame: 20, value: 1 * 7 },
      { frame: 30, value: 2 * 8 },
      { frame: 40, value: 3 + 4 },
      { frame: 50, value: 5 - 9 },
      { frame: 100, complete: true },
    ]);
  });
});

test('when accepts an array of plans', () => {
  const values: string[] = [];
  when([and(of('A'), of(1)).thenDo((letter, n) => `${letter}${n}`)]).subscribe({
    next: (value) => values.push(value),
    complete: () => values.push('done'),
  });
  assert.deepEqual(values, ['A1', 'done']);
});

test('the same source object is subscribed once and shared by every plan', () => {
  let subscriptions = 0;
  const shared = new Observable<number>((subscriber) => {
    subscriptions += 1;
    subscriber.next(2);
    subscriber.next(3);
    subscriber.complete();
  });
  const values: number[] = [];
  when(
    and(shared, of(10)).thenDo((left, right) => left + right),
    and(shared, of(4)).thenDo((left, right) => left * right),
  ).subscribe((value) => values.push(value));
  assert.equal(subscriptions, 1);
  // 2 is taken by the first plan (2 + 10). That plan then retires because of(10)
  // completes, so the second plan receives the remaining 3 (3 * 4).
  assert.deepEqual(values, [12, 12]);
});

test('unsubscribe stops later matches', () => {
  const left = new Subject<number>();
  const right = new Subject<number>();
  const values: number[] = [];
  const subscription = when(and(left, right).thenDo((a, b) => a + b)).subscribe((value) => values.push(value));
  left.next(1);
  right.next(2);
  subscription.unsubscribe();
  left.next(3);
  right.next(4);
  assert.deepEqual(values, [3]);
  assert.equal(left.observed, false);
  assert.equal(right.observed, false);
});

test('installJoinPatterns restores the RxJS 4 Observable.when / and / thenDo shape', () => {
  installJoinPatterns();
  try {
    const values: string[] = [];
    Observable.when(of(1).and(of('a')).thenDo((n, letter) => `${n}${letter}`), of(2).thenDo((n) => `only ${n}`)).subscribe(
      (value) => values.push(value),
    );
    assert.deepEqual(values.sort(), ['1a', 'only 2']);
  } finally {
    resetJoinPatternsForTests();
  }
});
