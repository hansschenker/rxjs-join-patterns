/**
 * Join patterns for RxJS 7.8.2.
 *
 * `Pattern1` … `Pattern9`, `and`, `then`, and `when`, following the
 * DefinitelyTyped RxJS-Join definitions. This is not the time-window
 * `join` / `groupJoin` operator, which RxJS 7 still ships.
 */

export { and, pattern, then } from './pattern.js';
export type {
  Pattern1,
  Pattern2,
  Pattern3,
  Pattern4,
  Pattern5,
  Pattern6,
  Pattern7,
  Pattern8,
  Pattern9,
} from './pattern.js';
export { when } from './when.js';
export { installJoinPatterns } from './install.js';
export type { Plan } from './types.js';
export type { PlanImpl } from './plan.js';
