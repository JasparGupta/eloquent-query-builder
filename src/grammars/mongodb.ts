import mergeWith from 'lodash.mergewith';
import isPlainObject from 'lodash.isplainobject';
import type { Filter } from 'mongodb';
import { Grammar } from '../grammar';
import type { BaseWhere, Bool, Operator, Where, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from '../types';
import type { Builder } from '../builder';

type Compiled<T> = T & { compiled: Filter<any>, };

export class MongoDBGrammar extends Grammar {
  protected readonly comparisons: Record<Operator, string> = {
    '=': '$eq',
    '!=': '$ne',
    '<': '$lt',
    '<=': '$lte',
    '>': '$gt',
    '>=': '$gte',
  };

  protected readonly logicals: Record<Exclude<Bool, 'and not'>, string> = {
    'and': '$and',
    'or': '$or',
    'or not': '$nor',
  };

  public compile(query: Builder): Filter<any> {
    if (!query.wheres.length) return {};

    if (query.wheres.length === 1) {
      const [filter] = super.compile(query) as Compiled<Where>[];

      return filter.compiled;
    }

    const [first, second] = query.wheres;

    first.boolean = second.boolean.includes('or') ? second.boolean : first.boolean;

    const wheres: Compiled<Where>[] = super.compile(query);

    return wheres.reduce<Filter<any>>((filters, { compiled, type, ...where }) => {
      const filter = { [this.logicalOperator(where)]: [compiled] };

      return mergeWith(filters, filter, (value, source) => {
        if ((type === 'Nested' || where.boolean !== 'and') && Array.isArray(value)) {
          return value.concat(source);
        }
      });
    }, {});
  }

  protected logicalOperator({ boolean }: Pick<BaseWhere, 'boolean'>): string {
    return this.logicals[boolean] ?? '$and';
  }

  protected whereBasic(query: Builder, where: WhereBasic): Compiled<WhereBasic> {
    const { boolean, field, value } = where;
    const operator = this.comparisons[where.operator] ?? where.operator;

    const compiled = operator === '$eq'
      ? { [field]: value }
      : { [field]: { [operator]: value } };

    return {
      ...where,
      compiled: boolean === 'and not' && (isPlainObject(compiled[field]) || compiled[field] instanceof RegExp)
        ? { [field]: { $not: compiled[field] } }
        : compiled,
    };
  }

  protected whereBetween(query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const { field, value: [from, to] } = where;

    return { ...where, compiled: { [field]: { $gte: from, $lte: to } } };
  }

  protected whereIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { boolean, field, value } = where;

    const operator = boolean.includes('not') ? '$nin' : '$in';

    return {
      ...where,
      boolean: boolean.includes('or') ? 'or' : 'and',
      compiled: { [field]: { [operator]: value } }
    };
  }

  protected whereNested(query: Builder, where: WhereNested): Compiled<WhereNested> {
    return { ...where, compiled: this.compile(where.value) };
  }

  protected whereRaw(query: Builder, where: WhereRaw): Compiled<WhereRaw> {
    return { ...where, compiled: where.value };
  }
}
