import type { Observable } from 'rxjs';
import { PlanImpl } from './plan.js';
import type { JoinSource, Plan } from './types.js';

/**
 * Join patterns shaped like the DefinitelyTyped RxJS-Join definitions
 * (Igor Oleinikov): `Pattern1` … `Pattern9`, `and`, and `then`.
 * `Pattern9` is the end of the chain and has no further `and`.
 */

export interface Pattern1<T1> {
  and<T2>(other: Observable<T2>): Pattern2<T1, T2>;
  then<TR>(selector: (item1: T1) => TR): Plan<TR>;
}

export interface Pattern2<T1, T2> {
  and<T3>(other: Observable<T3>): Pattern3<T1, T2, T3>;
  then<TR>(selector: (item1: T1, item2: T2) => TR): Plan<TR>;
}

export interface Pattern3<T1, T2, T3> {
  and<T4>(other: Observable<T4>): Pattern4<T1, T2, T3, T4>;
  then<TR>(selector: (item1: T1, item2: T2, item3: T3) => TR): Plan<TR>;
}

export interface Pattern4<T1, T2, T3, T4> {
  and<T5>(other: Observable<T5>): Pattern5<T1, T2, T3, T4, T5>;
  then<TR>(selector: (item1: T1, item2: T2, item3: T3, item4: T4) => TR): Plan<TR>;
}

export interface Pattern5<T1, T2, T3, T4, T5> {
  and<T6>(other: Observable<T6>): Pattern6<T1, T2, T3, T4, T5, T6>;
  then<TR>(selector: (item1: T1, item2: T2, item3: T3, item4: T4, item5: T5) => TR): Plan<TR>;
}

export interface Pattern6<T1, T2, T3, T4, T5, T6> {
  and<T7>(other: Observable<T7>): Pattern7<T1, T2, T3, T4, T5, T6, T7>;
  then<TR>(selector: (item1: T1, item2: T2, item3: T3, item4: T4, item5: T5, item6: T6) => TR): Plan<TR>;
}

export interface Pattern7<T1, T2, T3, T4, T5, T6, T7> {
  and<T8>(other: Observable<T8>): Pattern8<T1, T2, T3, T4, T5, T6, T7, T8>;
  then<TR>(selector: (item1: T1, item2: T2, item3: T3, item4: T4, item5: T5, item6: T6, item7: T7) => TR): Plan<TR>;
}

export interface Pattern8<T1, T2, T3, T4, T5, T6, T7, T8> {
  and<T9>(other: Observable<T9>): Pattern9<T1, T2, T3, T4, T5, T6, T7, T8, T9>;
  then<TR>(
    selector: (item1: T1, item2: T2, item3: T3, item4: T4, item5: T5, item6: T6, item7: T7, item8: T8) => TR,
  ): Plan<TR>;
}

export interface Pattern9<T1, T2, T3, T4, T5, T6, T7, T8, T9> {
  then<TR>(
    selector: (
      item1: T1,
      item2: T2,
      item3: T3,
      item4: T4,
      item5: T5,
      item6: T6,
      item7: T7,
      item8: T8,
      item9: T9,
    ) => TR,
  ): Plan<TR>;
}

class PatternImpl {
  readonly sources: Observable<unknown>[];

  constructor(sources: readonly Observable<unknown>[]) {
    this.sources = [...sources];
  }

  and(other: Observable<unknown>): PatternImpl {
    return new PatternImpl([...this.sources, other]);
  }

  then<TR>(selector: (...items: unknown[]) => TR): PlanImpl<TR> {
    return new PlanImpl(
      [...(this.sources as readonly JoinSource[])],
      selector as (...values: never[]) => TR,
    );
  }
}

/** A pattern over one observable. Same as `Observable.then` / `Observable.and` after install. */
export function pattern<T1>(source: Observable<T1>): Pattern1<T1> {
  return new PatternImpl([source]) as unknown as Pattern1<T1>;
}

/** `source.then(selector)` without patching `Observable.prototype`. */
export function then<T1, TR>(source: Observable<T1>, selector: (item1: T1) => TR): Plan<TR> {
  return new PatternImpl([source]).then(selector as (...items: unknown[]) => TR);
}

export function and<T1>(source: Observable<T1>): Pattern1<T1>;
export function and<T1, T2>(source1: Observable<T1>, source2: Observable<T2>): Pattern2<T1, T2>;
export function and<T1, T2, T3>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
): Pattern3<T1, T2, T3>;
export function and<T1, T2, T3, T4>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
  source4: Observable<T4>,
): Pattern4<T1, T2, T3, T4>;
export function and<T1, T2, T3, T4, T5>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
  source4: Observable<T4>,
  source5: Observable<T5>,
): Pattern5<T1, T2, T3, T4, T5>;
export function and<T1, T2, T3, T4, T5, T6>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
  source4: Observable<T4>,
  source5: Observable<T5>,
  source6: Observable<T6>,
): Pattern6<T1, T2, T3, T4, T5, T6>;
export function and<T1, T2, T3, T4, T5, T6, T7>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
  source4: Observable<T4>,
  source5: Observable<T5>,
  source6: Observable<T6>,
  source7: Observable<T7>,
): Pattern7<T1, T2, T3, T4, T5, T6, T7>;
export function and<T1, T2, T3, T4, T5, T6, T7, T8>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
  source4: Observable<T4>,
  source5: Observable<T5>,
  source6: Observable<T6>,
  source7: Observable<T7>,
  source8: Observable<T8>,
): Pattern8<T1, T2, T3, T4, T5, T6, T7, T8>;
export function and<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
  source1: Observable<T1>,
  source2: Observable<T2>,
  source3: Observable<T3>,
  source4: Observable<T4>,
  source5: Observable<T5>,
  source6: Observable<T6>,
  source7: Observable<T7>,
  source8: Observable<T8>,
  source9: Observable<T9>,
): Pattern9<T1, T2, T3, T4, T5, T6, T7, T8, T9>;
/** Untyped-length form used when the sources are already in an array (still capped at 9). */
export function and(...sources: Array<Observable<unknown>>): {
  and(other: Observable<unknown>): unknown;
  then<TR>(selector: (...items: any[]) => TR): Plan<TR>;
};
export function and(...sources: Array<Observable<unknown>>): any {
  if (sources.length < 1 || sources.length > 9) {
    throw new TypeError('and() expects from 1 to 9 observables');
  }
  return new PatternImpl(sources);
}
