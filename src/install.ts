import { Observable, type ObservableInput } from 'rxjs';
import { pattern } from './pattern.js';
import { when } from './when.js';

let installed = false;

/**
 * Install the RxJS 4 instance/static API:
 *
 * - `observable.and(other)`
 * - `observable.thenDo(selector)`
 * - `Observable.when(...plans)`
 *
 * Prefer the functional `and` / `pattern` / `thenDo` / `when` exports unless
 * you are porting an RxJS 4 sample verbatim. Calling this patches
 * `Observable` for the whole process.
 */
export function installJoinPatterns(): void {
  if (installed) {
    return;
  }
  installed = true;

  const proto = Observable.prototype as unknown as {
    and(this: Observable<unknown>, other: ObservableInput<unknown>): unknown;
    thenDo(this: Observable<unknown>, selector: (value: unknown) => unknown): unknown;
  };

  proto.and = function andMethod(other: ObservableInput<unknown>) {
    return pattern(this as Observable<unknown>).and(other);
  };

  proto.thenDo = function thenDoMethod(selector: (value: unknown) => unknown) {
    return pattern(this as Observable<unknown>).thenDo(selector);
  };

  (Observable as unknown as { when: typeof when }).when = when;
}

/** Test helper. Not part of the supported runtime API. */
export function resetJoinPatternsForTests(): void {
  const proto = Observable.prototype as unknown as { and?: unknown; thenDo?: unknown };
  delete proto.and;
  delete proto.thenDo;
  delete (Observable as unknown as { when?: unknown }).when;
  installed = false;
}
