/**
 * RxJS 4 documentation sample, rewritten for RxJS 7.8.2.
 *
 * The second plan becomes ready at 400ms (timer 400 and timer 300).
 * The first plan becomes ready at 500ms (timer 100 and timer 500).
 * Both plans then retire, so the join completes.
 *
 * Run: npx tsx examples/timers.ts
 */
import { timer } from 'rxjs';
import { TestScheduler } from 'rxjs/testing';
import { and, when } from '../src/index.ts';

const scheduler = new TestScheduler((actual, expected) => {
  const same = JSON.stringify(actual) === JSON.stringify(expected);
  if (!same) {
    throw new Error(`timers diverged\nactual:   ${JSON.stringify(actual)}\nexpected: ${JSON.stringify(expected)}`);
  }
});

scheduler.run(({ expectObservable }) => {
  const source = when(
    and(timer(100), timer(500)).then(() => 'first'),
    and(timer(400), timer(300)).then(() => 'second'),
  );

  // 400ms: 'second'. 100ms later (frame 500): 'first' and complete.
  expectObservable(source).toBe('400ms b 99ms (a|)', { a: 'first', b: 'second' });
  console.log('timer sample: second @400ms, first @500ms, then complete');
});

console.log('timers sample ok');
