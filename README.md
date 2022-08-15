# eloquent-query-builder

This is a query builder based off of Laravel's Eloquent query builder.

**What this is not**: This does not contain any database connectivity features.

**What this is**: Purely for writing and generating database queries.

**Motivation**: I came into an existing project that already had models with database connections. What it didn't have
was a friendly way to write database queries.

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
