import type { Bool, Operator } from '../types';
import { Builder } from '../builder';
import { MongoDBGrammar } from './mongodb';

describe('MongoDB grammar', () => {
  describe('compile', () => {
    test('returns empty object if there are no wheres', () => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      const actual = grammar.compile(builder);

      expect(actual).toEqual({});
    });

    test('returns the where clause if only 1 where clause', () => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      builder.where('foo', 'bar');

      const actual = grammar.compile(builder);

      expect(actual).toEqual({ foo: 'bar' });
    });

    test('compiles the query builder', () => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      builder
        .where('name', 'John')
        .where('age', '>', 18)
        .whereIn('interestIds', [1, 2, 3])
        .where(query => {
          query
            .where('foo', 'bar')
            .where(query => {
              query
                .where('nested1', true)
                .orWhere('nested2', false);
            })
            .where(query => {
              query
                .where('nested3', '$exists', false)
                .when(true, query => {
                  query.orWhereIn('nested3', [1, 2, 3]);
                });
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
              { $or: [{ nested1: true }, { nested2: false }] },
              {
                $or: [
                  { nested3: { $exists: false } },
                  { nested3: { $in: [1, 2, 3] } }
                ]
              }
            ]
          },
        ]
      };

      expect(actual).toEqual(expected);
    });
  });

  describe('whereBasic', () => {
    test.each<[Operator | string, string]>([
      ['=', '$eq'],
      ['!=', '$ne'],
      ['<', '$lt'],
      ['<=', '$lte'],
      ['>', '$gt'],
      ['>=', '$gte'],
      ['$exists', '$exists'],
      ['$elemMatch', '$elemMatch'],
    ])('compiles "Basic" where', (operator, compiledOperator) => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      builder.where('foo', operator, 'bar');

      const [where] = builder.wheres;

      // @ts-ignore
      const result = grammar.whereBasic(builder, where);

      expect(result).toEqual({
        boolean: 'and',
        compiled: operator === '=' ? { foo: 'bar' } : { foo: { [compiledOperator]: 'bar' } },
        field: 'foo',
        operator,
        type: 'Basic',
        value: 'bar',
      });
    });

    test.each<[Parameters<typeof Builder.prototype.where>, object]>([
      [['foo', 'bar'], { foo: 'bar' }],
      [['foo', '>=', 100], { foo: { $not: { $gte: 100 } } }],
      [['foo', /bar/], { foo: { $not: /bar/ } }],
      [['foo', '$regex', 'bar'], { foo: { $not: { $regex: 'bar' } } }],
    ])('%# compiles "and not" boolean', ([field, operator, value], expected) => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      builder.where(field, operator, value, 'and not');

      const [where] = builder.wheres;

      // @ts-ignore
      const result = grammar.whereBasic(builder, where);

      expect(result).toEqual(
        expect.objectContaining({
          boolean: 'and not',
          compiled: expected,
        })
      );
    });
  });

  describe('whereBetween', () => {
    test('compiles "Between" where', () => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      builder.whereBetween('me', ['rock', 'hard place']);
      const [where] = builder.wheres;

      // @ts-ignore
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

  describe('whereIn', () => {
    test.each<Bool>(['and', 'and not', 'or', 'or not'])('%# compiles "In" where', (boolean) => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();
      const values = [1, 2, 3];

      builder.whereIn('foo', values, boolean);

      const [where] = builder.wheres;

      // @ts-ignore
      const result = grammar.whereIn(builder, where);

      const operator = boolean.includes('not') ? '$nin' : '$in';

      expect(result).toEqual({
        boolean: boolean.includes('or') ? 'or' : 'and',
        compiled: { foo: { [operator]: values } },
        field: 'foo',
        type: 'In',
        value: where.value,
      });
    });
  });

  describe('whereNested', () => {
    test.each<Extract<Bool, 'and' | 'or'>>(['and', 'or'])('%# compiles "Nested" where', (boolean) => {
      const builder = Builder.make();
      const grammar = new MongoDBGrammar();

      builder.whereNested((query) => {
        query.where('name', 'John');
        query.where('age', '>', 18);
      }, boolean);

      const [where] = builder.wheres;

      // @ts-ignore
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
      const grammar = new MongoDBGrammar();

      builder.whereRaw({ foo: 'bar', bar: { $ne: 'baz' } }, boolean);

      const [where] = builder.wheres;

      // @ts-ignore
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
