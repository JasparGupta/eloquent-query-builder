import type { estypes } from '@elastic/elasticsearch';
import type { Bool } from '../types';
import { Builder } from '../builder';
import { ElasticsearchGrammar } from './elasticsearch';

describe('ElasticsearchGrammar', () => {
  let builder: Builder;
  let grammar: ElasticsearchGrammar;

  beforeEach(() => {
    builder = new Builder();
    grammar = new ElasticsearchGrammar();
  });

  describe('compile', () => {
    test('returns the where clause if only 1 where clause', () => {
      builder.where('foo', 'bar');

      const query = grammar.compile(builder);

      expect(query).toEqual<estypes.QueryDslQueryContainer>({ bool: { must: { term: { foo: 'bar' } } } });
    });

    test('compiles the query builder', () => {
      builder
        .where('foo', 'bar')
        .orWhere('foo', 'baz')
        .orWhereNot('bar', 'baz')
        .where('number', '<=', 100)
        .whereBetween('range', [1, 10])
        .whereNested(builder => {
          builder
            .whereNot('negate', 'foo')
            .whereIn('multiple', [1, 2, 3]);
        });

      const query = grammar.compile(builder);

      expect(query).toEqual<estypes.QueryDslQueryContainer>({
        bool: {
          must: [
            {
              bool: {
                should: [
                  { term: { foo: 'bar' } },
                  { term: { foo: 'baz' } },
                  { bool: { must_not: { term: { bar: 'baz' } } } }
                ]
              }
            },
            { range: { number: { lte: 100 } } },
            { range: { range: { gte: 1, lte: 10 } } },
            {
              bool: {
                must: [
                  { bool: { must_not: { term: { negate: 'foo' } } } },
                  { terms: { multiple: [1, 2, 3] } }
                ]
              }
            }
          ]
        }
      });
    });
  });

  describe('whereBasic', () => {
    test.each<[operator: string, expected: estypes.QueryDslQueryContainer, value?: string | number]>([
      ['=', { term: { foo: 'bar' } }],
      ['!=', { term: { foo: 'bar' } }],
      ['<', { range: { foo: { lt: 10 } } }, 10],
      ['>', { range: { foo: { gt: 10 } } }, 10],
      ['<=', { range: { foo: { lte: 10 } } }, 10],
      ['>=', { range: { foo: { gte: 10 } } }, 10],
    ])('compiles "Basic" where using opertator "%s"', (operator, expected, value = 'bar') => {
      builder.where('foo', operator, value);

      const [where] = builder.wheres;
      // @ts-expect-error protected method.
      const { compiled } = grammar.whereBasic(builder, where);

      expect(compiled).toEqual(expected);
    });
  });

  describe('whereBetween', () => {
    test('compiles "Between" where', () => {
      builder.whereBetween('foo', [10, 20]);

      const [where] = builder.wheres;
      // @ts-expect-error protected method.
      const { compiled } = grammar.whereBetween(builder, where);

      expect(compiled).toEqual({ range: { foo: { gte: 10, lte: 20 } } });
    });
  });

  describe('whereIn', () => {
    test('compiles "In" where', () => {
      builder.whereIn('foo', [1, 2, 3]);

      const [where] = builder.wheres;
      // @ts-expect-error protected method.
      const { compiled } = grammar.whereIn(builder, where);

      expect(compiled).toEqual({ terms: { foo: [1, 2, 3] } });
    });
  });

  describe('whereNested', () => {
    test('compiles "Nested" where', () => {
      builder.whereNested((builder) => {
        builder.where('foo', 'bar');
      });

      const [where] = builder.wheres;
      // @ts-expect-error protected method.
      const { compiled } = grammar.whereNested(builder, where);

      expect(compiled).toEqual({
        bool: {
          must: { term: { foo: 'bar' } }
        }
      });
    });
  });

  describe('whereRaw', () => {
    test('compiles "Raw" where', () => {
      const expected: estypes.QueryDslQueryContainer = { match_all: {} };

      builder.whereRaw<estypes.QueryDslQueryContainer>(expected);

      const [where] = builder.wheres;
      // @ts-expect-error protected method.
      const { compiled } = grammar.whereRaw(builder, where);

      expect(compiled).toEqual(expected);
    });
  });
});
