# rxjs-join-patterns

RxJS 4 **join patterns** for **RxJS 7.8.2**.

`and` / `thenDo` / `when` were removed after RxJS 4. This package brings that join calculus back: several plans can share sources, and each source value is consumed by at most one matching plan.

This is **not** the time-window [`join`](https://rxjs.dev/api/operators/join) / `groupJoin` operator. RxJS 7 still includes those.

The behavior follows the RxJS 4 tests in [Reactive-Extensions/RxJS `tests/observable/when.js`](https://github.com/Reactive-Extensions/RxJS/blob/master/tests/observable/when.js).

## Install

```bash
npm install rxjs@7.8.2 github:hansschenker/rxjs-join-patterns
```

## Use

```ts
import { Subject } from 'rxjs';
import { and, when } from 'rxjs-join-patterns';

const temperature = new Subject<number>();
const humidity = new Subject<number>();

const comfort = when(
  and(temperature, humidity).thenDo((degrees, percent) =>
    degrees >= 30 && percent >= 70
      ? `muggy ${degrees}C / ${percent}%`
      : `ok ${degrees}C / ${percent}%`,
  ),
);

comfort.subscribe(console.log);

temperature.next(32);
humidity.next(80); // muggy 32C / 80%
temperature.next(21);
humidity.next(40); // ok 21C / 40%
```

A single plan pairs values the way `zip` does: one value from each source, in order. The interesting case is **several plans over the same sources**.

```ts
import { Subject } from 'rxjs';
import { and, when } from 'rxjs-join-patterns';

const xs = new Subject<number>();
const ys = new Subject<number>();
const zs = new Subject<number>();

const joined = when(
  and(xs, ys).thenDo((x, y) => `${x} + ${y} = ${x + y}`),
  and(xs, zs).thenDo((x, z) => `${x} * ${z} = ${x * z}`),
  and(ys, zs).thenDo((y, z) => `${y} - ${z} = ${y - z}`),
);

joined.subscribe(console.log);

xs.next(1);
xs.next(2);
zs.next(7); // 1 * 7 = 7
zs.next(8); // 2 * 8 = 16
xs.next(3);
ys.next(4); // 3 + 4 = 7
zs.next(9);
ys.next(5); // 5 - 9 = -4
xs.complete();
ys.complete();
zs.complete(); // complete
```

`1` is consumed by the multiply plan, so the add plan never sees it. That competition is the whole point of the calculus.

Chain form, equivalent to the old `xs.and(ys).and(zs)`:

```ts
import { pattern, when } from 'rxjs-join-patterns';

when(pattern(xs).and(ys).and(zs).thenDo((x, y, z) => x + y + z));
```

One source, the old `xs.thenDo(...)`:

```ts
import { thenDo, when } from 'rxjs-join-patterns';

when(thenDo(xs, (value) => value * 2));
```

`when` also accepts an array of plans: `when([planA, planB])`.

## RxJS 4 shape

Porting an old sample verbatim:

```ts
import { Observable, timer } from 'rxjs';
import 'rxjs-join-patterns/augment';

Observable.when(
  timer(100).and(timer(500)).thenDo(() => 'first'),
  timer(400).and(timer(300)).thenDo(() => 'second'),
).subscribe(console.log);
// second
// first
```

Importing `rxjs-join-patterns/augment` patches `Observable` for the process. Prefer `and` / `when` in new code.

## Dining philosophers

From the RxJS 4 `when` docs. A philosopher eats only when they are hungry **and** both chopsticks are available, taken in one match:

```ts
import { Subject } from 'rxjs';
import { and, when } from 'rxjs-join-patterns';

const chopsticks = [0, 1, 2].map(() => new Subject<object>());
const hungry = [0, 1, 2].map(() => new Subject<object>());

const eat = (index: number) => () => {
  setTimeout(() => {
    chopsticks[index].next({});
    chopsticks[(index + 1) % 3].next({});
  }, 1000);
  return `philosopher ${index} eating`;
};

const dining = when(
  and(hungry[0], chopsticks[0], chopsticks[1]).thenDo(eat(0)),
  and(hungry[1], chopsticks[1], chopsticks[2]).thenDo(eat(1)),
  and(hungry[2], chopsticks[2], chopsticks[0]).thenDo(eat(2)),
);

dining.subscribe(console.log);
chopsticks.forEach((stick) => stick.next({}));
hungry.forEach((philosopher) => philosopher.next({}));
```

## Rules

- A plan matches when **every** source in it has a queued notification.
- A match takes the oldest notification from each of those sources and runs the selector.
- If several plans could match, the one registered first on the source that just emitted wins.
- The same observable **object** is shared. `xs.pipe(...)` is a different object and is not shared.
- A completion is queued behind any values still left. A plan retires when it matches and one head is a completion. Leftover values on the other sources stay available to other plans.
- The result completes when every plan has retired. It errors as soon as any source errors, or if a selector throws.
- An empty `when()` never emits and never completes.

## Samples in this repo

| File | What it shows |
| --- | --- |
| [examples/basic.ts](examples/basic.ts) | One plan, pair temperature with humidity |
| [examples/multiple-plans.ts](examples/multiple-plans.ts) | Three competing plans |
| [examples/timers.ts](examples/timers.ts) | The RxJS 4 timer / `when` sample |
| [examples/dining-philosophers.ts](examples/dining-philosophers.ts) | Chopsticks, with virtual time |
| [examples/classic-api.ts](examples/classic-api.ts) | `Observable.prototype.and` / `thenDo` |

```bash
npm install
npm test
npm run examples
npm run build
```

## API

- `and(...sources)` — pattern over those observables (up to a typed tuple).
- `pattern(source).and(other)` — the same pattern, built by chaining.
- `pattern.thenDo(selector)` / `thenDo(source, selector)` — turn a pattern into a plan.
- `when(...plans)` / `when(plans)` — observable of selector results.
- `installJoinPatterns()` — add `.and`, `.thenDo`, and `Observable.when`.

## Credit

Algorithm and the original samples come from RxJS 4 join patterns (`src/core/joins`, `Observable.when`, `Observable.prototype.and`, `Pattern.prototype.thenDo`), licensed Apache-2.0. See [NOTICE](NOTICE).
