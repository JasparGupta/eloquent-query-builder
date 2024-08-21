import { BaseWhere } from './base-where';

export interface WhereBetween extends BaseWhere {
  field: string,
  type: 'Between',
  value: [any, any],
}
