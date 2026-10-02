import type { ObservableInput } from 'rxjs';
import type { PlanImpl } from './plan.js';
import type { Pattern } from './pattern.js';
import type { Plan } from './types.js';
import { installJoinPatterns } from './install.js';

declare module 'rxjs' {
  interface Observable<T> {
    /**
     * RxJS 4 join pattern. Matches when both sequences have an available value.
     * Requires `installJoinPatterns()` (the augment entry calls it on import).
     */
    and<U>(other: ObservableInput<U>): Pattern<[T, U]>;
    /**
     * RxJS 4 join pattern. Matches when this sequence has an available value.
     * Requires `installJoinPatterns()`.
     */
    thenDo<R>(selector: (value: T) => R): PlanImpl<R>;
  }

  namespace Observable {
    /**
     * RxJS 4 join pattern. Join plans created with `and` / `thenDo`.
     * Requires `installJoinPatterns()`.
     */
    function when<R>(...plans: Array<Plan<R>>): Observable<R>;
    function when<R>(plans: readonly Plan<R>[]): Observable<R>;
  }
}

installJoinPatterns();

export { installJoinPatterns };
