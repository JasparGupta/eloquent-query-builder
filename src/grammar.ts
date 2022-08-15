import type Builder from './builder';
import { WhereBasic, WhereIn, WhereNested, WhereRaw } from './types';

export default abstract class Grammar {
  public compile(query: Builder): any {
    return query.wheres.map(where => {
      const method = `where${where.type}`;

      return this[method](query, where);
    });
  }

  protected abstract whereBasic(query: Builder, where: WhereBasic);

  protected abstract whereIn(query: Builder, where: WhereIn);

  protected abstract whereNested(query: Builder, where: WhereNested);

  protected abstract whereNotIn(query: Builder, where: WhereIn);

  protected abstract whereRaw(query: Builder, where: WhereRaw);
}
