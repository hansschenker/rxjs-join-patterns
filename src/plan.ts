import { ActivePlan } from './active-plan.js';
import { JoinObserver } from './join-observer.js';
import type { JoinSource, Plan } from './types.js';

export class PlanImpl<R> implements Plan<R> {
  constructor(
    readonly sources: readonly JoinSource[],
    readonly selector: (...values: never[]) => R,
  ) {}

  activate(
    externalSubscriptions: Map<JoinSource, JoinObserver>,
    emit: (value: R) => void,
    fail: (error: unknown) => void,
    deactivate: (plan: ActivePlan) => void,
  ): ActivePlan {
    const joinObservers = this.sources.map((source) =>
      planCreateObserver(externalSubscriptions, source, fail),
    );

    const activePlan = new ActivePlan(
      joinObservers,
      (values) => {
        let result: R;
        try {
          result = this.selector(...(values as never[]));
        } catch (error) {
          fail(error);
          return;
        }
        emit(result);
      },
      () => {
        for (const observer of joinObservers) {
          observer.removeActivePlan(activePlan);
        }
        deactivate(activePlan);
      },
    );

    for (const observer of joinObservers) {
      observer.addActivePlan(activePlan);
    }
    return activePlan;
  }
}

function planCreateObserver(
  externalSubscriptions: Map<JoinSource, JoinObserver>,
  source: JoinSource,
  onError: (error: unknown) => void,
): JoinObserver {
  const existing = externalSubscriptions.get(source);
  if (existing) {
    return existing;
  }
  const observer = new JoinObserver(source, onError);
  externalSubscriptions.set(source, observer);
  return observer;
}
