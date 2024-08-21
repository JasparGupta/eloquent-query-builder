import { BaseWhere } from './base-where';

export interface WhereRaw extends BaseWhere {
  type: 'Raw',
  value: any,
}
