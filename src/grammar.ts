import type { Builder } from './builder';
import type { WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from './types';

export abstract class Grammar {
  public compile(query: Builder): any {
    return query.wheres.map(where => {
      const method = `where${where.type}`;

      return this[method](query, where);
    });
  }

  protected abstract whereBasic(query: Builder, where: WhereBasic);

  protected abstract whereBetween(query: Builder, where: WhereBetween);

  protected abstract whereIn(query: Builder, where: WhereIn);

  protected abstract whereNested(query: Builder, where: WhereNested);

  protected abstract whereRaw(query: Builder, where: WhereRaw);
}
