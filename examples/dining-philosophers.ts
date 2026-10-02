/**
 * Dining philosophers, the RxJS 4 `when` sample.
 *
 * A philosopher eats only when that philosopher is hungry AND both adjacent
 * chopsticks are available. The pattern takes both chopsticks in one match,
 * so two neighbors can never hold the same chopstick.
 *
 * Time is simulated: putting the chopsticks back takes 1000 virtual ms.
 * Run: npx tsx examples/dining-philosophers.ts
 */
import { Subject } from 'rxjs';
import { and, when } from '../src/index.ts';

interface Task {
  time: number;
  run: () => void;
}

const tasks: Task[] = [];
let clock = 0;

function delay(ms: number, run: () => void): void {
  tasks.push({ time: clock + ms, run });
}

function flush(limit = 100): void {
  let steps = 0;
  while (tasks.length > 0 && steps < limit) {
    tasks.sort((left, right) => left.time - right.time);
    const task = tasks.shift();
    if (!task) {
      return;
    }
    clock = task.time;
    steps += 1;
    task.run();
  }
}

const count = 3;
const chopsticks = Array.from({ length: count }, () => new Subject<object>());
const hungry = Array.from({ length: count }, () => new Subject<object>());
const eaten: string[] = [];

const eat = (index: number) => () => {
  delay(1000, () => {
    chopsticks[index]?.next({});
    chopsticks[(index + 1) % count]?.next({});
  });
  return `philosopher ${index} eating @${clock}`;
};

const dining = when(
  and(hungry[0]!, chopsticks[0]!, chopsticks[1]!).thenDo(eat(0)),
  and(hungry[1]!, chopsticks[1]!, chopsticks[2]!).thenDo(eat(1)),
  and(hungry[2]!, chopsticks[2]!, chopsticks[0]!).thenDo(eat(2)),
);

dining.subscribe((event) => {
  eaten.push(event);
  console.log(event);
});

for (const stick of chopsticks) {
  stick.next({});
}
for (let round = 0; round < 3; round += 1) {
  for (const philosopher of hungry) {
    philosopher.next({});
  }
}
flush();

const philosophers = new Set(eaten.map((line) => line.slice(0, 'philosopher 0'.length)));
if (philosophers.size !== 3 || eaten.length < 3) {
  throw new Error(`expected every philosopher to eat, got:\n${eaten.join('\n')}`);
}
console.log('dining-philosophers sample ok');
