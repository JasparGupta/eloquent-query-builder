import mergeWith from 'lodash.mergewith';
import { Filter } from 'mongodb';
import Grammar from '../grammar';
import { BaseWhere, Bool, Operator, Where, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from '../types';
import Builder from '../builder';

type Compiled<T> = T & { compiled: Filter<any> }

export default class MongoDB extends Grammar {
  protected readonly comparisons: Record<Operator, string> = {
    '=': '$eq',
    '!=': '$ne',
    '<': '$lt',
    '<=': '$lte',
    '>': '$gt',
    '>=': '$gte',
  };

  protected readonly logicals: Record<Bool, string> = {
    'and': '$and',
    'and not': '$not',
    'or': '$or',
    'or not': '$nor',
  };

  public compile(query: Builder): Filter<any> {
    if (!query.wheres.length) return {};

    if (query.wheres.length === 1) {
      const [filter] = super.compile(query);

      return filter.compiled;
    }

    const [first, second] = query.wheres;

    // Second where dictates the first where boolean.
    first.boolean = second.boolean;

    const wheres: Array<Compiled<Where>> = super.compile(query);

    return wheres.reduce<Filter<any>>((filters, { compiled, type, ...where }) => {
      const filter = { [this.logicalOperator(where)]: [compiled] };

      return mergeWith(filters, filter, (value, source) => {
        if ((type === 'Nested' || type === 'Basic' && where.boolean !== 'and') && Array.isArray(value)) {
          return value.concat(source);
        }
      });
    }, {});
  }

  protected logicalOperator({ boolean }: Pick<BaseWhere, 'boolean'>): string {
    return this.logicals[boolean];
  }

  protected whereBasic(query: Builder, where: WhereBasic): Compiled<WhereBasic> {
    const { field, value } = where;
    const operator = this.comparisons[where.operator] ?? where.operator;

    const compiled = operator === '$eq'
      ? { [field]: value }
      : { [field]: { [operator]: value } };

    return { ...where, compiled };
  }

  protected whereBetween(query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const { field, value: [from, to] } = where;

    return { ...where, compiled: { [field]: { $gte: from, $lte: to } } };
  }

  protected whereIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { field, value } = where;

    return { ...where, compiled: { [field]: { $in: value } } };
  }

  protected whereNested(query: Builder, where: WhereNested): Compiled<WhereNested> {
    return { ...where, compiled: this.compile(where.value) };
  }

  protected whereNotIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { field, value } = where;

    return { ...where, compiled: { [field]: { $nin: value } } };
  }

  protected whereRaw(query: Builder, where: WhereRaw): Compiled<WhereRaw> {
    return { ...where, compiled: where.value };
  }
}
