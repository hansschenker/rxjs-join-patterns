import { Subscription, from, type ObservableInput } from 'rxjs';
import { materialize } from 'rxjs';
import type { QueuedNotification } from './types.js';
import type { ActivePlan } from './active-plan.js';

/**
 * Per-source queue for the join calculus.
 * One observer is shared by every plan that mentions the same source object.
 */
export class JoinObserver {
  readonly queue: QueuedNotification[] = [];
  readonly activePlans: ActivePlan[] = [];
  isDisposed = false;
  private readonly subscription = new Subscription();

  constructor(
    readonly source: ObservableInput<unknown>,
    private readonly onError: (error: unknown) => void,
  ) {}

  handle(notification: { kind: string; value?: unknown; error?: unknown }): void {
    if (this.isDisposed) {
      return;
    }
    if (notification.kind === 'E') {
      this.onError(notification.error);
      return;
    }
    if (notification.kind !== 'N' && notification.kind !== 'C') {
      return;
    }
    this.queue.push(
      notification.kind === 'N'
        ? { kind: 'N', value: notification.value }
        : { kind: 'C' },
    );
    const plans = this.activePlans.slice();
    for (const plan of plans) {
      if (this.isDisposed) {
        return;
      }
      plan.match();
    }
  }

  addActivePlan(plan: ActivePlan): void {
    this.activePlans.push(plan);
  }

  subscribe(): void {
    this.subscription.add(
      from(this.source)
        .pipe(materialize())
        .subscribe({
          next: (notification) => this.handle(notification),
          error: (error) => this.onError(error),
        }),
    );
  }

  removeActivePlan(plan: ActivePlan): void {
    const index = this.activePlans.indexOf(plan);
    if (index >= 0) {
      this.activePlans.splice(index, 1);
    }
    if (this.activePlans.length === 0) {
      this.dispose();
    }
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    this.subscription.unsubscribe();
  }
}
