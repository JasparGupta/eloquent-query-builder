import Where from './base-where';

export default interface WhereBasic extends Where {
  field: string,
  operator: string,
  type: 'Basic',
  value: any,
}
