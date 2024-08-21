import type { estypes } from '@elastic/elasticsearch';
import type { Bool, Operator, Where, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from '../types';
import type { Builder } from '../builder';
import { Grammar } from '../grammar';

type Compiled<T> = T & { compiled: estypes.QueryDslQueryContainer, };

export class ElasticsearchGrammar extends Grammar {
  protected readonly comparisons: Partial<Record<Operator, keyof estypes.QueryDslRangeQueryBase>> = {
    '<': 'lt',
    '<=': 'lte',
    '>': 'gt',
    '>=': 'gte',
  };

  protected readonly logicals: Record<Bool, string> = {
    and: 'must',
    'and not': 'must_not',
    or: 'should',
    'or not': '',
  };

  public compile(query: Builder): estypes.QueryDslQueryContainer {
    if (!query.wheres.length) return {};

    const [first, second] = query.wheres;

    if (!second) {
      const [filter] = super.compile(query) as Compiled<Where>[];

      return { bool: { must: filter.compiled } };
    }

    first.boolean = second.boolean.includes('or') ? second.boolean : first.boolean;

    const wheres: Compiled<Where>[] = super.compile(query);

    return {
      bool: {
        must: wheres.reduce<estypes.QueryDslQueryContainer[]>((clauses, { compiled, type, ...where }) => {
          const [previous] = clauses.slice(-1);

          if (Array.isArray(previous?.bool?.should) && where.boolean.includes('or')) {
            previous.bool.should.push(compiled);

            return clauses;
          }

          if (where.boolean.includes('or')) {
            return [...clauses, { bool: { should: [compiled] } }];
          }

          return [...clauses, compiled];
        }, []),
      }
    };
  }

  protected whereBasic(query: Builder, where: WhereBasic): Compiled<WhereBasic> {
    const { boolean, field, operator, value } = where;

    if (['<', '<=', '>=', '>'].includes(operator) && typeof value === 'number') {
      return {
        ...where,
        compiled: {
          range: {
            [field]: { [this.comparisons[operator]]: value },
          }
        }
      };
    }

    const term: estypes.QueryDslQueryContainer['term'] = { [field]: value };

    // if (boolean === 'or') {
    //   return {
    //     ...where,
    //     compiled: { bool: { should: { term } } }
    //   };
    // }

    return {
      ...where,
      compiled: boolean === 'and not' || operator === '!='
        ? { bool: { must_not: { term } } }
        : { term }
    };
  }

  protected whereBetween(query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const { boolean, field, value: [from, to] } = where;

    const range: estypes.QueryDslQueryContainer['range'] = { [field]: { gte: from, lte: to } };

    return {
      ...where,
      compiled: boolean === 'and not'
        ? { bool: { must_not: { range } } }
        : { range }
    };
  }

  protected whereIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { boolean, field, value } = where;

    const terms: estypes.QueryDslQueryContainer['terms'] = { [field]: value };

    return {
      ...where,
      compiled: boolean === 'and not'
        ? { bool: { must_not: { terms } } }
        : { terms }
    };
  }

  protected whereNested(query: Builder, where: WhereNested): Compiled<WhereNested> {
    return { ...where, compiled: this.compile(where.value) };
  }

  protected whereRaw(query: Builder, where: WhereRaw): Compiled<WhereRaw> {
    return { ...where, compiled: where.value };
  }
}
