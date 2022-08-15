import Builder from '../builder';
import Where from './base-where';

export default interface WhereNested extends Where {
  type: 'Nested',
  value: Builder,
}
