import type { Where, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from '../types';
import type Builder from '../builder';
import Grammar from '../grammar';

type Compiled<T> = T & { compiled: string | null };

export default class LuceneGrammar extends Grammar {
  public compile(builder: Builder): string {
    const wheres: Compiled<Where>[] = super.compile(builder);
    const first = wheres.shift();

    return wheres
      .filter(({ compiled }) => Boolean(compiled))
      .reduce(
        (query, where) => `${query} ${where.boolean.toUpperCase()} ${where.compiled}`,
        first.compiled
      );
  }

  protected whereBasic(_query: Builder, where: WhereBasic): Compiled<WhereBasic> {
    const { field, operator, value } = where;

    if (/^\*/.test(value)) {
      throw new Error('Lucene doesn\'t support using a "*" symbol as the first character of a search');
    }

    const compiled = (() => {
      const sanatisedValue = /\s/.test(value) ? `"${value}"` : value;

      switch (operator) {
        case '=':
          return `${field}:${sanatisedValue}`;

        case '!=':
          return `-${field}:${sanatisedValue}`;

        default:
          throw new Error(`Unsupported operator [${operator}]`);
      }
    })();

    return { ...where, compiled };
  }

  protected whereBetween(_query: Builder, where: WhereBetween): Compiled<WhereBetween> {
    const [from, to] = where.value;

    return { ...where, compiled: `${where.field}:[${from} TO ${to}]` };
  }

  protected whereIn(query: Builder, where: WhereIn): Compiled<WhereIn> {
    const { boolean, field, value: values } = where;
    const operator = boolean === 'and not' ? '!=' : '=';

    const compiled = values
      .map(value => {
        const { compiled } = this.whereBasic(query, { ...where, operator, type: 'Basic', value });

        return compiled;
      })
      .join(' OR ');

    return { ...where, compiled: `(${compiled})` };
  }

  protected whereNested(_query: Builder, where: WhereNested): Compiled<WhereNested> {
    return { ...where, compiled: `(${this.compile(where.value as Builder)})` };
  }

  protected whereRaw(_query: Builder, where: WhereRaw): Compiled<WhereRaw> {
    return { ...where, compiled: where.value };
  }
}
