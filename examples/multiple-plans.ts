/**
 * Several plans share sources and compete for each value.
 * This is the part of the join calculus that `zip` cannot express:
 * a value is consumed by the first plan that can match, and only that plan.
 *
 *   xs: 1, 2, 3|
 *   ys:       4, 5, 6|
 *   zs:    7, 8, 9        |
 *
 *   xs & ys -> x + y
 *   xs & zs -> x * z
 *   ys & zs -> y - z
 *
 * Run: npx tsx examples/multiple-plans.ts
 */
import { Subject } from 'rxjs';
import { and, when } from '../src/index.ts';

const xs = new Subject<number>();
const ys = new Subject<number>();
const zs = new Subject<number>();

const joined = when(
  and(xs, ys).then((x, y) => `${x} + ${y} = ${x + y}`),
  and(xs, zs).then((x, z) => `${x} * ${z} = ${x * z}`),
  and(ys, zs).then((y, z) => `${y} - ${z} = ${y - z}`),
);

const seen: string[] = [];
joined.subscribe({
  next: (value) => {
    seen.push(value);
    console.log(value);
  },
  complete: () => {
    seen.push('complete');
    console.log('complete');
  },
});

xs.next(1);
xs.next(2);
zs.next(7);
zs.next(8);
xs.next(3);
ys.next(4);
zs.next(9);
ys.next(5);
ys.next(6);
xs.complete();
ys.complete();
zs.complete();

const expected = ['1 * 7 = 7', '2 * 8 = 16', '3 + 4 = 7', '5 - 9 = -4', 'complete'];
if (seen.join('\n') !== expected.join('\n')) {
  throw new Error(`unexpected output:\n${seen.join('\n')}`);
}
console.log('multiple-plans sample ok');
