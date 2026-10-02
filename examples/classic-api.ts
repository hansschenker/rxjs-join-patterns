/**
 * Drop-in shape of the RxJS 4 sample. Importing the augment entry installs
 * `observable.and`, `observable.thenDo`, and `Observable.when`.
 *
 * The letter sample is the one from the RxJS 4 `thenDo` docs:
 *   interval(250) with A B C, and interval(300) with a b.
 * Virtual time makes it deterministic.
 *
 * Run: npx tsx examples/classic-api.ts
 */
import { Observable, of, interval, timer } from 'rxjs';
import { take } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import '../src/augment.ts';

const scheduler = new TestScheduler((actual, expected) => {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`classic sample diverged\nactual:   ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`);
  }
});

scheduler.run(({ expectObservable }) => {
  const letters = Observable.when(
    interval(250).pipe(take(3)).and(of('A', 'B', 'C')).thenDo((n, letter) => `${n}, ${letter}`),
    interval(300).pipe(take(2)).and(of('a', 'b')).thenDo((n, letter) => `${n}, ${letter}`),
  );
  expectObservable(letters).toBe('250ms a 49ms b 199ms c 99ms d 149ms (e|)', {
    a: '0, A',
    b: '0, a',
    c: '1, B',
    d: '1, b',
    e: '2, C',
  });

  const paced = Observable.when(
    timer(200).and(timer(300)).thenDo(() => 'first'),
    timer(400).and(timer(500)).thenDo(() => 'second'),
  );
  expectObservable(paced).toBe('300ms a 199ms (b|)', { a: 'first', b: 'second' });
});

console.log('0, A');
console.log('0, a');
console.log('1, B');
console.log('1, b');
console.log('2, C');
console.log('first');
console.log('second');
console.log('classic-api sample ok');
