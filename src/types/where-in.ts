import Where from './base-where';

export default interface WhereIn extends Where {
  field: string,
  type: 'In' | 'NotIn',
  value: any[],
}
