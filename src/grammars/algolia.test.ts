// @ts-nocheck
import Builder from '../builder';
import AlgoliaGrammar from './algolia';
import { Bool, WhereBetween } from '../types';

describe('AlgoliaGrammar', () => {
  describe('compile', () => {
    test('compiles algolia query', () => {
      const builder = new Builder();
      const grammar = new AlgoliaGrammar();

      builder.setGrammar(grammar);

      builder
        .where('foo', 'bar')
        .whereBetween('between', [1, 10])
        .whereIn('in', [1, 2, 3])
        .whereNested(query => {
          query
            .where('nest1', 'foo')
            .orWhere('nest1', 'bar');
        });

      expect(builder.toQuery()).toBe('foo:bar AND between: 1 TO 10 AND (in:1 AND in:2 AND in:3) AND (nest1:foo OR nest1:bar)');
    });
  });

  describe('whereBasic', () => {
    test.each<[Parameters<typeof Builder.prototype.where>, string]>([
      [['foo', 'bar'], 'foo:bar'],
      [['foo', '=', 'bar'], 'foo:bar'],
      [['foo', '!=', 'bar'], 'foo != bar'],
      [['foo', '<=', 10], 'foo <= 10'],
    ])('%# compiles "Basic" where', (args, expected) => {
      const builder = new Builder();
      const grammar = new AlgoliaGrammar();

      builder.where(...args);

      const [where] = builder.wheres;

      const { compiled } = grammar.whereBasic(builder, where);

      expect(compiled).toBe(expected);
    });
  });

  describe('whereBetween', () => {
    test('compiles "Between" where', () => {
      const builder = new Builder();
      const grammar = new AlgoliaGrammar();

      builder.whereBetween('foo', [1, 10]);

      const [where] = builder.wheres;

      const { compiled } = grammar.whereBetween(builder, where);

      expect(compiled).toBe('foo: 1 TO 10');
    });
  });

  describe('whereIn', () => {
    test.each<Bool>(['and', 'and not'])('%# compiles "In" where', (boolean) => {
      const builder = new Builder();
      const grammar = new AlgoliaGrammar();

      builder.whereIn('foo', [1, 5, 10], boolean);

      const [where] = builder.wheres;

      const { compiled } = grammar.whereIn(builder, where);

      const bool = boolean.toUpperCase();

      expect(compiled).toBe(`(foo:1 ${bool} foo:5 ${bool} foo:10)`);
    });
  });

  describe('whereNested', () => {
    test('compiles "Nested" where', () => {
      const builder = new Builder();
      const grammar = new AlgoliaGrammar();

      builder.whereNested(builder => {
        builder
          .where('foo', 'bar')
          .orWhere('foo', 'baz');
      });

      const [where] = builder.wheres;

      const { compiled } = grammar.whereNested(builder, where);

      expect(compiled).toBe('(foo:bar OR foo:baz)');
    });
  });

  describe('whereRaw', () => {
    test('compiles "Raw" where', () => {
      const builder = new Builder();
      const grammar = new AlgoliaGrammar();

      builder.whereRaw('foo:bar AND NOT baz:foo');

      const [where] = builder.wheres;

      const { compiled } = grammar.whereRaw(builder, where);

      expect(compiled).toBe('foo:bar AND NOT baz:foo');
    });
  });
});
