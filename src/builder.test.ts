import Builder from './builder';
import Grammar from './grammar';
import { Bool, Operator, WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from './types';

describe('Builder', () => {
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
