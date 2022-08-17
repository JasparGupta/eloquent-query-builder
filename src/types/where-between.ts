import BaseWhere from './base-where';

export default interface WhereBetween extends BaseWhere {
  field: string,
  type: 'Between',
  value: [any, any],
}
