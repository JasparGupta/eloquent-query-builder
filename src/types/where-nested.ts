import type { Builder } from '../builder';
import type { BaseWhere } from './base-where';

export interface WhereNested extends BaseWhere {
  boolean: 'and' | 'or',
  type: 'Nested',
  value: Builder,
}
