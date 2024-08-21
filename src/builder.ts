import { tap } from './support/tap';
import type { Grammar } from './grammar';
import type { Bool, NestedCallback, Operator, Where, WhereBasic, WhereBetween, WhereIn, WhereNested } from './types';
import { operators } from './constants';

export interface Filter<T = unknown, Q extends Record<string, any> = Record<string, any>> {
  (builder: Builder, value: T, query: Q): void,
}

export type Filters<T extends Record<string, any>> = {
  [K in keyof T]?: Filter<T[K], T>;
} & Record<string, Filter<any, T>>;

export class Builder {
  public wheres: Where[] = [];

  protected grammar: Grammar;

  protected readonly operators = operators;

  constructor(grammar?: Grammar) {
    this.grammar = grammar;
  }

  public apply<T extends Record<string, any> = Record<string, any>>(filters: Filters<T>, params: T): this {
    Object.entries(filters).forEach(([key, filter]) => {
      filter(this, params[key], params);
    });

    return this;
  }

  public clone(): this {
    // @ts-ignore
    return tap(new this.constructor(this.grammar), builder => {
      builder.wheres = this.wheres.map(where => {
        return where.type === 'Nested'
          ? { ...where, value: where.value.clone() }
          : { ...where };
      });
    });
  }

  public orWhere(field: NestedCallback | string, operator: Operator | any, value?: any): this {
    return this.where(field, operator, value, 'or');
  }

  public orWhereBetween(field: string, range: WhereBetween['value']): this {
    return this.whereBetween(field, range, 'or');
  }

  public orWhereIn(field: string, values: any[]): this {
    return this.whereIn(field, values, 'or');
  }

  public orWhereNot(field: string, value: any): this {
    return this.whereNot(field, value, 'or not');
  }

  public orWhereNotIn(field: string, values: any[]): this {
    return this.whereNotIn(field, values, 'or not');
  }

  public setGrammar(grammar: Grammar): this {
    this.grammar = grammar;

    return this;
  }

  public toQuery(): any {
    if (!this.grammar) {
      throw new ReferenceError('No grammar has been set');
    }

    return this.grammar.compile(this);
  }

  public when(condition: any, callback: (builder: this) => void, fallback?: (builder: this) => void): this {
    condition ? callback(this) : fallback?.(this);

    return this;
  }

  public where(field: NestedCallback | string, operator?: Operator | any, value?: any, boolean: Bool = 'and'): this {
    if (typeof field === 'function') {
      return this.whereNested(field);
    }

    value ??= operator;
    operator = operator === value ? '=' : operator;

    const where: WhereBasic = { boolean, field, operator, type: 'Basic', value };

    this.wheres = [...this.wheres, where];

    return this;
  }

  public whereBetween(field: string, range: WhereBetween['value'], boolean: Bool = 'and'): this {
    const where: WhereBetween = { boolean, field, type: 'Between', value: range };

    this.wheres = [...this.wheres, where];

    return this;
  }

  public whereIn(field: string, values: any[], boolean: Bool = 'and'): this {
    const where: WhereIn = { boolean, field, type: 'In', value: values };

    this.wheres = [...this.wheres, where];

    return this;
  }

  public whereNested(callback: NestedCallback, boolean: Extract<Bool, 'and' | 'or'> = 'and'): this {
    const where: WhereNested = { boolean, type: 'Nested', value: tap(Builder.make(), callback) };

    this.wheres = [...this.wheres, where];

    return this;
  }

  public whereNot(field: string, value: any, boolean: Bool = 'and'): this {
    return this.where(field, '!=', value, boolean);
  }

  public whereNotIn(field: string, values: any[], boolean: Extract<Bool, 'and not' | 'or not'> = 'and not'): this {
    return this.whereIn(field, values, boolean);
  }

  public whereRaw<T = any>(value: T, boolean: Bool = 'and'): this {
    this.wheres = [...this.wheres, { boolean, type: 'Raw', value }];

    return this;
  }

  public static make(grammar?: Grammar): Builder {
    return new this(grammar);
  }
}
