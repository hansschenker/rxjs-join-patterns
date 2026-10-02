import type { JoinObserver } from './join-observer.js';

/**
 * A live pattern. It matches when every participating source has a queued
 * notification, then either projects those values or retires the plan if any
 * of them is a completion.
 */
export class ActivePlan {
  constructor(
    private readonly joinObservers: readonly JoinObserver[],
    private readonly onNext: (values: unknown[]) => void,
    private readonly onCompleted: () => void,
  ) {}

  match(): void {
    for (const observer of this.joinObservers) {
      if (observer.isDisposed || observer.queue.length === 0) {
        return;
      }
    }

    let completed = false;
    const heads = this.joinObservers.map((observer) => {
      const head = observer.queue[0];
      if (!head) {
        return { kind: 'C' as const };
      }
      if (head.kind === 'C') {
        completed = true;
      }
      return head;
    });

    if (completed) {
      this.onCompleted();
      return;
    }

    for (const observer of this.joinObservers) {
      observer.queue.shift();
    }
    this.onNext(heads.map((head) => head.value));
  }
}
