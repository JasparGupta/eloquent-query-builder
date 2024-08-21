import type { Bool } from '../types';
import { Builder } from '../builder';
import { LuceneGrammar } from './lucene';

describe('LuceneGrammar', () => {
  describe('compile', () => {
    test('compiles Lucene query', () => {
      const builder = new Builder(new LuceneGrammar());

      builder
        .where('foo', 'bar')
        .whereNot('foo', 'baz')
        .whereIn('bar', ['a', 'b', 'c'])
        .whereBetween('baz', [1, 10]);

      expect(builder.toQuery()).toBe('foo:bar AND -foo:baz AND (bar:a OR bar:b OR bar:c) AND baz:[1 TO 10]');
    });
  });

  describe('whereBasic', () => {
    test.each([
      ['=', 'foo:bar'],
      ['!=', '-foo:bar']
    ])('%# compiles "Basic" where', (operator, expected) => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.where('foo', operator, 'bar');

      const [where] = builder.wheres;

      // @ts-ignore
      const { compiled } = grammar.whereBasic(builder, where);

      expect(compiled).toBe(expected);
    });

    test('sanatises the value', () => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.where('foo', 'Hello world!');

      const [where] = builder.wheres;

      // @ts-ignore
      const { compiled } = grammar.whereBasic(builder, where);

      expect(compiled).toBe('foo:"Hello world!"');
    });

    test('throws an error when the value starts with "*"', () => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.where('foo', '*bar');

      const [where] = builder.wheres;

      // @ts-ignore
      expect(() => grammar.whereBasic(builder, where)).toThrow();
    });
  });

  describe('whereBetween', () => {
    test('compiles "Between" where', () => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.whereBetween('foo', [1, 10]);

      const [where] = builder.wheres;

      // @ts-ignore
      const { compiled } = grammar.whereBetween(builder, where);

      expect(compiled).toBe('foo:[1 TO 10]');
    });
  });

  describe('whereIn', () => {
    test.each<[Bool, string]>([
      ['and', '(foo:bar OR foo:baz)'],
      ['and not', '(-foo:bar OR -foo:baz)']
    ])('%# compiles "In" where', (boolean, expected) => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.whereIn('foo', ['bar', 'baz'], boolean);

      const [where] = builder.wheres;

      // @ts-ignore
      const { compiled } = grammar.whereIn(builder, where);

      expect(compiled).toBe(expected);
    });
  });

  describe('whereNested', () => {
    test('compiles "Nested" where', () => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.whereNested(query => {
        query
          .where('foo', 'bar')
          .orWhere('foo', 'baz');
      });

      const [where] = builder.wheres;

      // @ts-ignore
      const { compiled } = grammar.whereNested(builder, where);

      expect(compiled).toBe('(foo:bar OR foo:baz)');
    });
  });

  describe('whereRaw', () => {
    test('compiles "Raw" where', () => {
      const builder = new Builder();
      const grammar = new LuceneGrammar();

      builder.whereRaw('foo:bar AND (bar:foo OR bar:baz)');

      const [where] = builder.wheres;

      // @ts-ignore
      const { compiled } = grammar.whereRaw(builder, where);

      expect(compiled).toBe('foo:bar AND (bar:foo OR bar:baz)');
    });
  });
});
