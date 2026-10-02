/**
 * Pair values from two sources. One value is consumed from each side per match,
 * which is the same result shape as `zip` when there is only one plan.
 *
 * Run: npx tsx examples/basic.ts
 */
import { Subject } from 'rxjs';
import { and, when } from '../src/index.ts';

const temperature = new Subject<number>();
const humidity = new Subject<number>();

const comfort = when(
  and(temperature, humidity).thenDo((degrees, percent) =>
    degrees >= 30 && percent >= 70 ? `muggy ${degrees}C / ${percent}%` : `ok ${degrees}C / ${percent}%`,
  ),
);

const seen: string[] = [];
comfort.subscribe((reading) => {
  seen.push(reading);
  console.log(reading);
});

temperature.next(32);
humidity.next(80);
temperature.next(21);
humidity.next(40);
temperature.next(31);
humidity.next(71);

const expected = ['muggy 32C / 80%', 'ok 21C / 40%', 'muggy 31C / 71%'];
if (seen.join('\n') !== expected.join('\n')) {
  throw new Error(`unexpected output:\n${seen.join('\n')}`);
}
console.log('basic sample ok');
