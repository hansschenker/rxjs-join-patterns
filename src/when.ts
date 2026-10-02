import { Observable, Subscription } from 'rxjs';
import type { ActivePlan } from './active-plan.js';
import { JoinObserver } from './join-observer.js';
import { PlanImpl } from './plan.js';
import type { JoinSource, Plan } from './types.js';

function normalizePlans<R>(args: ReadonlyArray<Plan<R> | readonly Plan<R>[]>): PlanImpl<R>[] {
  if (args.length === 1 && Array.isArray(args[0])) {
    return asPlans(args[0]);
  }
  return asPlans(args as readonly Plan<R>[]);
}

function asPlans<R>(plans: readonly Plan<R>[]): PlanImpl<R>[] {
  return plans.map((plan, index) => {
    if (!(plan instanceof PlanImpl)) {
      throw new TypeError(
        `when() expected a plan from thenDo() at index ${index}. ` +
          'Build one with and(sourceA, sourceB).thenDo(selector) or pattern(source).thenDo(selector).',
      );
    }
    return plan;
  });
}

/**
 * Join the results of one or more plans.
 *
 * Each plan consumes one queued value from every source in its pattern.
 * When several plans can match, the plan that was registered first on the
 * source which just emitted wins. A plan retires when one of its sources has
 * completed and that source has no unused value left. The result completes
 * when every plan has retired.
 *
 * Plans may be passed as arguments or as a single array, matching RxJS 4
 * `Observable.when`.
 */
export function when<R>(...plans: Array<Plan<R>>): Observable<R>;
export function when<R>(plans: readonly Plan<R>[]): Observable<R>;
export function when<R>(first?: Plan<R> | readonly Plan<R>[], ...rest: Array<Plan<R>>): Observable<R> {
  const plans = normalizePlans(first === undefined ? [] : [first, ...rest]);

  return new Observable<R>((subscriber) => {
    const activePlans: ActivePlan[] = [];
    const externalSubscriptions = new Map<JoinSource, JoinObserver>();
    let stopped = false;

    const fail = (error: unknown): void => {
      if (stopped) {
        return;
      }
      stopped = true;
      for (const observer of externalSubscriptions.values()) {
        observer.dispose();
      }
      subscriber.error(error);
    };

    const emit = (value: R): void => {
      if (!stopped && !subscriber.closed) {
        subscriber.next(value);
      }
    };

    const deactivate = (activePlan: ActivePlan): void => {
      const index = activePlans.indexOf(activePlan);
      if (index >= 0) {
        activePlans.splice(index, 1);
      }
      if (!stopped && activePlans.length === 0 && !subscriber.closed) {
        stopped = true;
        subscriber.complete();
      }
    };

    try {
      for (const plan of plans) {
        activePlans.push(plan.activate(externalSubscriptions, emit, fail, deactivate));
      }
    } catch (error) {
      fail(error);
      return;
    }

    const group = new Subscription();
    for (const observer of externalSubscriptions.values()) {
      if (stopped) {
        break;
      }
      observer.subscribe();
      group.add(new Subscription(() => observer.dispose()));
    }

    if (stopped) {
      group.unsubscribe();
      return;
    }
    return group;
  });
}
