import { BaseWhere } from './base-where';

type Range = [any, any];

export interface WhereBetween extends BaseWhere {
  field: string,
  type: 'Between',
  value: Range | Readonly<Range>,
}
