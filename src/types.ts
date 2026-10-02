import type { ObservableInput } from 'rxjs';

/**
 * A notification queued by a join observer.
 * Mirrors RxJS `Notification` kinds: next (`N`) and complete (`C`).
 * Errors are never queued — they terminate the join immediately.
 */
export interface QueuedNotification {
  kind: 'N' | 'C';
  value?: unknown;
}

/** Observable input used inside a pattern. Identity is the join key. */
export type JoinSource = ObservableInput<unknown>;

/**
 * Plan produced by `thenDo`. Pass one or more plans to `when`.
 * Several plans may share the same source observable; each source value
 * is consumed by at most one matching plan.
 */
export interface Plan<R> {
  /** Sources in selector argument order. Same object identity is shared across plans. */
  readonly sources: readonly JoinSource[];
  /** Projects one value from each source when the pattern matches. */
  readonly selector: (...values: never[]) => R;
}
