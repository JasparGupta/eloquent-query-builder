// @ts-nocheck
import Builder from '../builder';
import MongoDB from './mongodb';
import { Bool, Operator, WhereBasic, WhereIn } from '../types';

describe('MongoDB grammar', () => {
  describe('compile', () => {
    test('returns empty object if there are no wheres', () => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      const actual = grammar.compile(builder);

      expect(actual).toEqual({});
    });

    test('returns the where clause if only 1 where clause', () => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      builder.where('foo', 'bar');

      const actual = grammar.compile(builder);

      expect(actual).toEqual({
        boolean: 'and',
        compiled: { foo: 'bar' },
        field: 'foo',
        operator: '=',
        type: 'Basic',
        value: 'bar',
      });
    });

    test('compiles the query builder', () => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      builder
        .where('name', 'John')
        .where('age', '>', 18)
        .whereIn('interestIds', [1, 2, 3])
        .whereNested(query => {
          query
            .where('foo', 'bar')
            .whereNested(query => {
              query
                .where('nested1', true)
                .orWhere('nested2', false);
            });
        });

      const actual = grammar.compile(builder);
      const expected = {
        $and: [
          {
            name: 'John',
            age: { $gt: 18 },
            interestIds: { $in: [1, 2, 3] },
          },
          {
            $and: [
              { foo: 'bar' },
              { $or: [{ nested1: true }, { nested2: false }] }
            ]
          }
        ]
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('whereBasic', () => {
    test.each<[Operator, string]>([
      ['=', '$eq'],
      ['!=', '$ne'],
      ['<', '$lt'],
      ['<=', '$lte'],
      ['>', '$gt'],
      ['>=', '$gte'],
    ])('compiles "Basic" where', (operator, compiledOperator) => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      builder.where('foo', operator, 'bar');

      const [where] = builder.wheres;

      const result = grammar.whereBasic(builder, where as WhereBasic);

      expect(result).toEqual({
        boolean: 'and',
        compiled: operator === '=' ? { foo: 'bar' } : { foo: { [compiledOperator]: 'bar' } },
        field: 'foo',
        operator,
        type: 'Basic',
        value: 'bar',
      });
    });
  });

  describe('whereBetween', () => {
    test('', () => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      builder.whereBetween('me', ['rock', 'hard place']);
      const [where] = builder.wheres;

      const result = grammar.whereBetween(builder, where);

      expect(result).toEqual({
        boolean: 'and',
        compiled: { me: { $gte: 'rock', $lte: 'hard place' } },
        field: 'me',
        type: 'Between',
        value: ['rock', 'hard place'],
      });
    });
  });

  describe.each<[string, WhereIn['type'], string]>([
    ['whereIn', 'In', '$in'],
    ['whereNotIn', 'NotIn', '$nin']
  ])('%s', (method, type, operator) => {
    test(`compiles "${type}" where`, () => {
      const builder = Builder.make();
      const grammar = new MongoDB();
      const values = [1, 2, 3];

      builder[method]('foo', values);

      const [where] = builder.wheres;

      const result = grammar[method](builder, where);

      expect(result).toEqual({
        boolean: 'and',
        compiled: { foo: { [operator]: values } },
        field: 'foo',
        type,
        value: where.value,
      });
    });
  });

  describe('whereNested', () => {
    test.each<[Operator, string]>([
      ['and', '$and'],
      ['and not', '$not'],
      ['or', '$or'],
      ['or not', '$nor'],
    ])('compiles "Nested" where', (boolean, operator) => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      builder.whereNested((query) => {
        query.where('name', 'John');
        query.where('age', '>', 18);
      }, boolean);

      const [where] = builder.wheres;

      const result = grammar.whereNested(builder, where);

      expect(result).toEqual({
        boolean,
        compiled: { $and: [{ name: 'John', age: { $gt: 18 } }] },
        type: 'Nested',
        value: where.value,
      });
    });
  });

  describe('whereRaw', () => {
    test.each<Bool>(['and', 'and not', 'or', 'or not'])('compiles "Raw" where', (boolean) => {
      const builder = Builder.make();
      const grammar = new MongoDB();

      builder.whereRaw({ foo: 'bar', bar: { $ne: 'baz' } }, boolean);

      const [where] = builder.wheres;

      const result = grammar.whereRaw(builder, where);

      expect(result).toEqual({
        boolean,
        compiled: where.value,
        type: 'Raw',
        value: where.value
      });
    });
  });
});
