import type { Pattern2 } from './pattern.js';
import type { Plan } from './types.js';
import { installJoinPatterns } from './install.js';

declare module 'rxjs' {
  interface Observable<T> {
    /**
     * Matches when both sequences have an available value.
     * Requires `installJoinPatterns()` (this module calls it on import).
     */
    and<T2>(other: Observable<T2>): Pattern2<T, T2>;
    /**
     * Matches when this sequence has an available value and projects it.
     * Requires `installJoinPatterns()`.
     */
    then<TR>(selector: (item1: T) => TR): Plan<TR>;
  }

  namespace Observable {
    /**
     * Join plans created with `and` / `then`.
     * One plan matches the DefinitelyTyped signature. Further plans are the
     * RxJS runtime: each value is consumed by at most one matching plan.
     */
    function when<TR>(plan: Plan<TR>): Observable<TR>;
    function when<TR>(plan1: Plan<TR>, plan2: Plan<TR>, ...rest: Array<Plan<TR>>): Observable<TR>;
    function when<TR>(plans: readonly Plan<TR>[]): Observable<TR>;
  }
}

installJoinPatterns();

export { installJoinPatterns };
