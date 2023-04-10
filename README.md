# eloquent-query-builder

This is a query builder inspired by Laravel's Eloquent query builder.

**What this is not**: This does not contain any database connectivity features.

**What this is**: Purely for writing and generating queries.

**Motivation**: I came into an existing project that already had models with database connections. What it didn't have
was a friendly way to write queries.

## Usage

```typescript
import Builder from '@jaspargupta/eloquent-query-builder';
import MongoDBGrammar from '@jaspargupta/eloquent-query-builder/dist/grammars/mongodb';

const builder = Builder.make(new MongoDBGrammar()); // new Builder() works fine too.

builder.setGrammar(new MongoDBGrammar()); // Or set it later.

builder
  .where('foo', 'bar')
  .where('number', '>=', 10)
  .whereIn('tag', ['a', 'b', 'c']);

const query = builder.toQuery();

/**
 * Hopefully you'll get something like this. :P
 * { 
 *    $and: [
 *      { 
 *        foo: 'bar', 
 *        number: { '$gte': 10 }, 
 *        tag: { $in: ['a', 'b', 'c'] } 
 *      }
 *    ] 
 * }
 */
```

## Grammars

Currently this package ships with the following grammars:

- [Lucene](./src/grammars/lucene.ts) [[reference](https://www.lucenetutorial.com/lucene-query-syntax.html)]
- [MongoDB](./src/grammars/mongodb.ts)
- [Algolia](./src/grammars/algolia.ts) [[reference](https://www.algolia.com/doc/api-reference/api-parameters/filters/#parameter-overview)]

## API

### Builder

#### Constructor

##### `new Builder(grammar?: Grammar): Builder`

Optionally takes a `Grammar` instance as an argument.

```ts
const builder = new Builder();
// or
const builder = new Builder(new MongoDBGrammar());
```

#### Static methods

##### `Builder.make(grammar?: Grammar): Builder`

Returns a new `Builder` instance.

```ts
const builder = Builder.make();
// or
const builder = Builder.make(new MongoDBGrammar());
```

#### Instance methods

##### `builder.apply(filters: Record<string, Function>, values: Record<string, any>)`

Bulk applies filters.

```ts
// filters.ts
export const foo = (builder, value) => builder.where('foo', value);

export const baz = (builder, value, params) => {
  builder
    .where('baz', '>=', value)
    .when(params.isAdmin, builder => builder.where('admin', true));
};

// Will still be called even if `params` has no `deleted` property.
export const deleted = (builder) => builder.whereNot('deleted', true);

// other-file.ts
import * as filters from './filters';

const params = {
  baz: 10,
  foo: 'bar',
  isAdmin: true,
};

const builder = Builder.make().apply(filters, params);
```

##### `builder.orWhere(field: string, value: any): Builder`

Adds a simple `field` equals `value` filter or the previous filter.

##### `builder.orWhere(field: string, operator: string, value: any): Builder`

Adds a filter where `field` is compared to `value` with the given operator or the previous filter.

##### `builder.setGrammar(grammar: Grammar): Builder`

Sets a Grammar instance against the builder for when `toQuery()` is called.

##### `builder.toQuery(): any`

Calls the Grammar `compile()` method to generate a query.

##### `builder.when(condition: any, callback: (builder: Builder) => void, fallback?: (builder: Builder) => void)`

Calls the given callback when the condition is truthy. Optionally accepts default callback if condition is falsy.

##### `builder.where(field: string, value: any): Builder`

Adds a simple `field` equals `value` filter.

##### `builder.where(field: string, operator: string, value: any): Builder`

Adds a filter where `field` is compared to `value` with the given operator.

`operator` can be one of `=`, `!=`, `<`, `<=`, `>=`, `>`.

##### `builder.where(callback: (builder: Builder) => void): Builder`

This syntax calls `whereNested()` under the hood when a callback is provided.

##### `builder.whereBetween(field: string, range: [any, any]): Builder`

Adds a filter where the `field` must be between the `range` values.

##### `builder.whereIn(field: string, values: any[]): Builder`

Adds a filter where the `field` must be one of the given `values`.

##### `builder.whereNested(callback: (builder: Builder) => void): Builder`

Adds a filter with further filters nested inside.

##### `builder.whereNot(field: string, value: any): Builder`

Adds a filter where the `field` must not be equal to `value`.

##### `builder.whereNotIn(): Builder`

Adds a filter where the `field` must not be one of the given `values`.

##### `builder.whereRaw(value: any): Builder`

Adds a filter as the exact `value` given.
