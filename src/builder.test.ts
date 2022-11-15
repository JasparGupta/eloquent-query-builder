import Builder from './builder';
import Grammar from './grammar';
import { Bool, Operator, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from './types';

describe('Builder', () => {
  describe('clone', () => {
    test('returns a copy of the query', () => {
      const builder = Builder.make();

      builder
        .where('foo', 'bar') // 0
        .whereIn('baz', [1, 2, 3]) // 1
        .whereNested(query => { // 2
          query.where('test', true);
        });

      const clone = builder.clone();

      clone.where('clone', true); // 3

      expect(clone).not.toBe(builder);

      expect(builder.wheres[3]).toBeUndefined();
      expect(clone.wheres[3]).not.toBeUndefined();

      expect(clone.wheres[0]).toEqual(builder.wheres[0]);
      expect(clone.wheres[0]).not.toBe(builder.wheres[0]);

      expect(clone.wheres[2].value).toBeInstanceOf(Builder);
      expect(clone.wheres[2]).not.toBe(builder.wheres[2]);
    });
  });

  describe('orWhere', () => {
    test('adds a "Basic" clause as an "or" boolean', () => {
      const builder = Builder.make();

      const result = builder.orWhere('foo', 'bar');
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBasic>({
        boolean: 'or',
        field: 'foo',
        operator: '=',
        type: 'Basic',
        value: 'bar',
      });
    });
  });

  describe('orWhereBetween', () => {
    test('adds a "Between" clause with an "or" boolean', () => {
      const builder = Builder.make();

      const result = builder.orWhereBetween('foo', ['bar', 'baz']);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBetween>({
        boolean: 'or',
        field: 'foo',
        type: 'Between',
        value: ['bar', 'baz'],
      });
    });
  });

  describe('orWhereIn', () => {
    test('adds an In clause with an "or" boolean', () => {
      const builder = Builder.make();

      const result = builder.orWhereIn('foo', ['bar', 'baz']);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereIn>({
        boolean: 'or',
        field: 'foo',
        type: 'In',
        value: ['bar', 'baz']
      });
    });
  });

  describe('orWhereNot', () => {
    test('adds a "Basic" "!=" clause', () => {
      const builder = Builder.make();

      const result = builder.orWhereNot('foo', 'bar');
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBasic>({
        boolean: 'or not',
        field: 'foo',
        operator: '!=',
        type: 'Basic',
        value: 'bar',
      });
    });
  });

  describe('orWhereNotIn', () => {
    test('adds an NotIn clause with an "or not" boolean', () => {
      const builder = Builder.make();

      const result = builder.orWhereNotIn('foo', ['bar', 'baz']);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereIn>({
        boolean: 'or not',
        field: 'foo',
        type: 'NotIn',
        value: ['bar', 'baz']
      });
    });
  });

  describe('setGrammar', () => {
    test('sets the grammar property on the builder instance', () => {
      // @ts-ignore
      class TestGrammar extends Grammar {
        //
      }

      const grammar = new TestGrammar();

      const builder = Builder.make();

      // @ts-ignore
      expect(builder.grammar).toBeUndefined();

      builder.setGrammar(grammar);

      // @ts-ignore
      expect(builder.grammar).toBe(grammar);
    });
  });

  describe('when', () => {
    test('calls the given callback if the condition is truthy', () => {
      const builder = Builder.make();
      const callback = jest.fn();
      const fallback = jest.fn();

      expect(builder.when(true, callback, fallback)).toBe(builder);
      expect(callback).toHaveBeenCalledWith(builder);
      expect(fallback).not.toHaveBeenCalled();
    });

    test('calls the given fallback callback if the condition is falsy', () => {
      const builder = Builder.make();
      const callback = jest.fn();
      const fallback = jest.fn();

      expect(builder.when(false, callback, fallback)).toBe(builder);
      expect(callback).not.toHaveBeenCalled();
      expect(fallback).toHaveBeenCalledWith(builder);
    });
  });

  describe('where', () => {
    test('calls "whereNested" if the given value is a function', () => {
      const builder = Builder.make();

      const spyWhereNested = jest.spyOn(builder, 'whereNested');
      const callback = jest.fn();

      expect(builder.where(callback)).toBe(builder);
      expect(spyWhereNested).toHaveBeenCalledWith(callback);
    });

    test('adds a "Basic" where clause when no operator', () => {
      const builder = Builder.make();

      const result = builder.where('foo', 'bar');
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBasic>({
        boolean: 'and',
        field: 'foo',
        operator: '=',
        type: 'Basic',
        value: 'bar',
      });
    });

    test.each<Operator>(['=', '!=', '<', '<=', '>=', '>'])('adds a basic where clause', (operator) => {
      const builder = Builder.make();

      const result = builder.where('foo', operator, 'bar');
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBasic>({
        boolean: 'and',
        field: 'foo',
        operator,
        type: 'Basic',
        value: 'bar',
      });
    });
  });

  describe('whereBetween', () => {
    test('adds a "Between" clause', () => {
      const builder = Builder.make();

      const result = builder.whereBetween('foo', ['bar', 'baz']);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBetween>({
        boolean: 'and',
        field: 'foo',
        type: 'Between',
        value: ['bar', 'baz'],
      });
    });
  });

  describe.each<[string, WhereIn['type']]>([
    ['whereIn', 'In'],
    ['whereNotIn', 'NotIn'],
  ])('%s', (method, type) => {
    test(`adds an "${type}" clause`, () => {
      const builder = Builder.make();

      const values = [1, 2, 3];
      const result = builder[method]('foo', values);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereIn>({
        boolean: 'and',
        field: 'foo',
        type,
        value: values,
      });
    });
  });

  describe('whereNested', () => {
    test('adds a "Nested" clause', () => {
      const builder = Builder.make();
      const callback = jest.fn();

      const result = builder.whereNested(callback);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(callback).toHaveBeenCalled();
      expect(where).toEqual<WhereNested>({
        boolean: 'and',
        type: 'Nested',
        value: expect.any(Builder),
      });
    });
  });

  describe('whereNot', () => {
    test.each<Bool>(['and', 'and not', 'or', 'or not'])('[%s] adds a "Basic" "!=" clause', (boolean) => {
      const builder = Builder.make();

      const result = builder.whereNot('foo', 'bar', boolean);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereBasic>({
        boolean,
        field: 'foo',
        operator: '!=',
        type: 'Basic',
        value: 'bar',
      });
    });
  });

  describe('whereRaw', () => {
    test('add a "Raw" clause', () => {
      const builder = Builder.make();
      const query = { foo: 'bar', $and: [{ a: 1 }, { b: 2 }] };

      const result = builder.whereRaw(query);
      const [where] = builder.wheres;

      expect(result).toBe(builder);
      expect(where).toEqual<WhereRaw>({
        boolean: 'and',
        type: 'Raw',
        value: query,
      });
    });
  });
});
