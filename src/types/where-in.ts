import type { BaseWhere } from './base-where';

export interface WhereIn extends BaseWhere {
  field: string,
  type: 'In',
  value: unknown[],
}
