/**
 * Join patterns for RxJS 7.8.2.
 *
 * Port of the RxJS 4 join calculus (`and`, `thenDo`, `when`) from
 * Reactive-Extensions/RxJS. This is not the time-window `join` / `groupJoin`
 * operator, which RxJS 7 still ships.
 */

export { and, pattern, thenDo } from './pattern.js';
export type { Pattern } from './pattern.js';
export { when } from './when.js';
export { installJoinPatterns } from './install.js';
export type { Plan } from './types.js';
export type { PlanImpl } from './plan.js';
