import Grammar from './grammar';
import Builder from './builder';
import { WhereBasic, WhereBetween, WhereIn, WhereNested, WhereRaw } from './types';

describe('Grammar', () => {
  describe('compile', () => {
    test('compiles where clauses', () => {
      const whereBasic = jest.fn();
      const whereBetween = jest.fn();
      const whereIn = jest.fn();
      const whereNested = jest.fn();
      const whereNotIn = jest.fn();
      const whereRaw = jest.fn();

      const TestGrammar = class extends Grammar {
        protected whereBasic(query: Builder, where: WhereBasic) {
          return whereBasic();
        }

        protected whereBetween(query: Builder, where: WhereBetween) {
          return whereBetween();
        }

        protected whereIn(query: Builder, where: WhereIn) {
          return whereIn();
        }

        protected whereNested(query: Builder, where: WhereNested) {
          return whereNested();
        }

        protected whereNotIn(query: Builder, where: WhereIn) {
          return whereNotIn();
        }

        protected whereRaw(query: Builder, where: WhereRaw) {
          return whereRaw();
        }
      };

      const builder = Builder.make();

      builder
        // Should trigger whereBasic.
        .where('basic', true)
        // Should trigger whereBetween.
        .whereBetween('between', [1, 10])
        // Should trigger whereIn.
        .whereIn('in', [1, 2, 3])
        // Should trigger whereNested.
        .whereNested(() => void (0))
        // Should trigger whereNotIn.
        .whereNotIn('notin', [4, 5, 6])
        // Should trigger whereRaw.
        .whereRaw({ raw: 1 });

      const grammar = new TestGrammar();

      grammar.compile(builder);

      expect(whereBasic).toHaveBeenCalled();
      expect(whereBetween).toHaveBeenCalled();
      expect(whereIn).toHaveBeenCalled();
      expect(whereNested).toHaveBeenCalled();
      expect(whereNotIn).toHaveBeenCalled();
      expect(whereRaw).toHaveBeenCalled();
    });
  });
});