import Where from './base-where';

export default interface WhereRaw extends Where {
  type: 'Raw',
  value: any,
}
