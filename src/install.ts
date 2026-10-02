import { Observable } from 'rxjs';
import { pattern } from './pattern.js';
import { when } from './when.js';

let installed = false;

/**
 * Install the RxJS-Join instance/static API:
 *
 * - `observable.and(other)` → `Pattern2`
 * - `observable.then(selector)` → `Plan`
 * - `Observable.when(plan, ...)`
 *
 * Calling this patches `Observable` for the whole process. `then` is the
 * DefinitelyTyped name; it also makes observables look thenable.
 */
export function installJoinPatterns(): void {
  if (installed) {
    return;
  }
  installed = true;

  const proto = Observable.prototype as unknown as {
    and(this: Observable<unknown>, other: Observable<unknown>): unknown;
    then(this: Observable<unknown>, selector: (item1: unknown) => unknown): unknown;
  };

  proto.and = function andMethod(other: Observable<unknown>) {
    return pattern(this as Observable<unknown>).and(other);
  };

  proto.then = function thenMethod(selector: (item1: unknown) => unknown) {
    return pattern(this as Observable<unknown>).then(selector);
  };

  (Observable as unknown as { when: typeof when }).when = when;
}

/** Test helper. Not part of the supported runtime API. */
export function resetJoinPatternsForTests(): void {
  const proto = Observable.prototype as unknown as { and?: unknown; then?: unknown };
  delete proto.and;
  delete proto.then;
  delete (Observable as unknown as { when?: unknown }).when;
  installed = false;
}
