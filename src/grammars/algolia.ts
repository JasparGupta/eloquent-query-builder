import type { Operator, Where, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from '../types';
import type Builder from '../builder';
import Grammar from '../grammar';

type Compiled<T> = T & { compiled: string };

export default class AlgoliaGrammar extends Grammar {
  protected readonly operators: Operator[] = ['=', '!=', '<', '>', '<=', '>='];

  public compile(query: Builder): string {
    const wheres: Compiled<Where>[] = super.compile(query);
    const first = wheres.shift();

    return wheres.reduce((result, where) => {
      const { boolean, compiled } = where;

      return `${result} ${boolean.toUpperCase()} ${compiled}`;
    }, first.compiled);
  }

  protected whereBasic(query: Builder, where: WhereBasic) {
    const { boolean, field, operator, type, value } = where;

    return {
      ...where,
      boolean: operator === '!=' ? (boolean === 'and' ? 'and not' : 'or not') : boolean,
      compiled: operator === '=' ? `${field}:${value}` : `${field} ${operator} ${value}`,
    };
  }

  protected whereBetween(query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const { field, value: [from, to] } = where;

    return { ...where, compiled: `${field}: ${from} TO ${to}` };
  }

  protected whereIn(query: Builder, where: WhereIn): WhereIn | Compiled<WhereIn> {
    const { boolean, field, value: values } = where;

    if (!values.length) return where;

    return { ...where, compiled: `(${values.map(value => `${field}:${value}`).join(` ${boolean.toUpperCase()} `)})` };
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
