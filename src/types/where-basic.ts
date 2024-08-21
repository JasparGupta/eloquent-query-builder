import type { BaseWhere } from './base-where';

export interface WhereBasic extends BaseWhere {
  field: string,
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=' | (string & {}),
  type: 'Basic',
  value: unknown,
}
