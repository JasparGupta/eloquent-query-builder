import Builder from '../builder';
import Where from './base-where';

export default interface WhereNested extends Where {
  boolean: 'and' | 'or',
  type: 'Nested',
  value: Builder,
}
