import type { Operator, Where, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from '../types';
import type { Builder } from '../builder';
import { Grammar } from '../grammar';

export type Compiled<T> = T & { compiled: string; };

export class AlgoliaGrammar extends Grammar {
  protected readonly operators: Operator[] = ['=', '!=', '<', '>', '<=', '>='];

  public compile(query: Builder): string {
    const wheres = (super.compile(query) as Compiled<Where>[]).filter(where => where.compiled);
    const first = wheres.shift();

    return wheres.reduce((result, where) => {
      const { boolean, compiled } = where;

      return `${result} ${boolean.toUpperCase()} ${compiled}`;
    }, first.compiled);
  }

  protected whereBasic(query: Builder, where: WhereBasic) {
    const { boolean, field, operator, type, value } = where;

    if (typeof value === 'number' || (typeof value === 'string' && /^\d+$/.test(value))) {
      return {
        ...where,
        compiled: `${field} ${operator} ${value}`,
      };
    }

    return {
      ...where,
      boolean: operator === '!=' ? (boolean === 'and' ? 'and not' : 'or not') : boolean,
      compiled: `${field}:${typeof value === 'string' && /\s/.test(value) ? `"${value}"` : value}`,
    };
  }

  protected whereBetween(query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const { field, value: [from, to] } = where;

    return { ...where, compiled: `${field}: ${from} TO ${to}` };
  }

  protected whereIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { boolean, field, value: values } = where;
    const join = boolean.includes('not') ? 'OR NOT' : 'OR';

    return {
      ...where,
      boolean: boolean.includes('or') ? 'or' : 'and',
      compiled: values.length
        ? `(${values.map(value => `${field}:${value}`).join(` ${join} `)})`
        : null
    };
  }

  protected whereNested(query: Builder, where: WhereNested): Compiled<WhereNested> {
    const { boolean, value } = where;

    if (['and not', 'or not'].includes(boolean)) {
      throw new Error('Cannot negate filter groups');
    }

    return { ...where, compiled: `(${this.compile(value)})` };
  }

  protected whereRaw(query: Builder, where: WhereRaw): Compiled<WhereRaw> {
    const { value } = where;

    return { ...where, compiled: value };
  }
}
