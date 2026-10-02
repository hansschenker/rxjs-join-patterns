import type { ObservableInput } from 'rxjs';
import { PlanImpl } from './plan.js';
import type { JoinSource } from './types.js';

/**
 * A join pattern: an ordered list of observables that must each have a
 * value available before `thenDo` runs.
 *
 * Chain more sources with `and`, or build the whole list with the `and(...)`
 * function. This is the RxJS 4 `Pattern` type, without patching `Observable`.
 */
export interface Pattern<T extends readonly unknown[]> {
  readonly sources: { [K in keyof T]: ObservableInput<T[K]> };
  /**
   * Add another observable to this pattern.
   * The pattern matches when every source has an available value.
   */
  and<U>(other: ObservableInput<U>): Pattern<[...T, U]>;
  /**
   * Project one available value from each source, in pattern order.
   * The result is a plan for `when`.
   */
  thenDo<R>(selector: (...values: [...T]) => R): PlanImpl<R>;
}

class PatternImpl {
  readonly sources: ObservableInput<unknown>[];

  constructor(sources: readonly ObservableInput<unknown>[]) {
    this.sources = [...sources];
  }

  and(other: ObservableInput<unknown>): PatternImpl {
    return new PatternImpl([...this.sources, other]);
  }

  thenDo<R>(selector: (...values: unknown[]) => R): PlanImpl<R> {
    return new PlanImpl([...(this.sources as readonly JoinSource[])], selector as (...values: never[]) => R);
  }
}

/** Start a pattern from a single observable. */
export function pattern<T>(source: ObservableInput<T>): Pattern<[T]> {
  return new PatternImpl([source]) as unknown as Pattern<[T]>;
}

/** Start a plan from a single observable. Equivalent to RxJS 4 `obs.thenDo(selector)`. */
export function thenDo<T, R>(source: ObservableInput<T>, selector: (value: T) => R): PlanImpl<R> {
  return pattern(source).thenDo(selector);
}

/**
 * Build a pattern from one or more observables.
 * `and(a, b, c).thenDo((x, y, z) => ...)` is the RxJS 7 shape of
 * `a.and(b).and(c).thenDo(...)`.
 */
export function and<T extends readonly unknown[]>(
  ...sources: { [K in keyof T]: ObservableInput<T[K]> }
): Pattern<T> {
  if (sources.length === 0) {
    throw new TypeError('and() expects at least one observable');
  }
  return new PatternImpl(sources as readonly ObservableInput<unknown>[]) as unknown as Pattern<T>;
}
