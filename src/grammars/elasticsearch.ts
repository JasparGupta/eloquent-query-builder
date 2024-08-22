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

          compiled = where.boolean.includes('not') ? { bool: { must_not: compiled } } : compiled;

          if (Array.isArray(previous?.bool?.should) && where.boolean.includes('or')) {
            previous.bool.should.push(compiled);

            return clauses;
          }

          return [
            ...clauses,
            where.boolean.includes('or') ? { bool: { should: [compiled] } } : compiled,
          ];
        }, []),
      }
    };
  }

  protected whereBasic(query: Builder, where: WhereBasic): Compiled<WhereBasic> {
    const { boolean, field, operator, value } = where;

    if (['<', '<=', '>=', '>'].includes(operator) && typeof value === 'number') {
      return { ...where, compiled: { range: { [field]: { [this.comparisons[operator]]: value } } } };
    }

    return {
      ...where,
      boolean: operator === '!=' ? (boolean === 'and' ? 'and not' : 'or not') : boolean,
      compiled: { term: { [field]: value } }
    };
  }

  protected whereBetween(query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const { field, value: [from, to] } = where;

    return {
      ...where,
      compiled: { range: { [field]: { gte: from, lte: to } } },
    };
  }

  protected whereIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { field, value } = where;

    return {
      ...where,
      compiled: { terms: { [field]: value } }
    };
  }

  protected whereNested(query: Builder, where: WhereNested): Compiled<WhereNested> {
    return { ...where, compiled: this.compile(where.value) };
  }

  protected whereRaw(query: Builder, where: WhereRaw): Compiled<WhereRaw> {
    return { ...where, compiled: where.value };
  }
}
