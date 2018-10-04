# BatchLoader
BatchLoader is a batching utility for data fetching layer to reduce requests round trips, inspired by [Facebook's DataLoader](https://github.com/facebook/dataloader), written in [TypeScript](https://www.typescriptlang.org/index.html).

BatchLoader is a simplified version of Facebook's DataLoader and can be used with any database such as MongoDB or with GraphQL.

[![Build Status](https://travis-ci.org/joonhocho/batchloader.svg?branch=master)](https://travis-ci.org/joonhocho/batchloader)
[![Coverage Status](https://coveralls.io/repos/github/joonhocho/batchloader/badge.svg?branch=master)](https://coveralls.io/github/joonhocho/batchloader?branch=master)
[![npm version](https://badge.fury.io/js/batchloader.svg)](https://badge.fury.io/js/batchloader)
[![Dependency Status](https://david-dm.org/joonhocho/batchloader.svg)](https://david-dm.org/joonhocho/batchloader)
[![License](http://img.shields.io/:license-mit-blue.svg)](http://doge.mit-license.org)

## Comparison to DataLoader
\+ written in TypeScript

\+ Further reduces data fetching requests by filtering out duplicate keys

\+ Similar api as DataLoader

\+ Smaller in size

\+ MappedBatchLoader can be used to compose a new loader using existing loaders.

\- Removed caching functionalities. Leave caching to better cache libraries.

It is a very simple batcher that only does batching, and it does it very well.

## Getting Started

First, install BatchLoader using npm.

```sh
npm install --save batchloader
```
or with Yarn,
```sh
yarn add batchloader
```

> Note: BatchLoader assumes a JavaScript environment with global ES6 `Promise`, available in all supported versions of Node.js.


## Batching

Create loaders by providing a batch loading function and key transformation function (used for finding duplicate keys).

```typescript
import { BatchLoader } from 'batchloader';

const userLoader = new BatchLoader(
  (_ids: ObjectId[]) => User.getByIds(_ids), // [required] batch function.
  (_id: ObjectId) => _id.toString(), // [optional] key to unique id function. must return string. used for finding duplicate keys.
  100 // [optional = 0] batch delay in ms. default 0 ms.
);

const user1 = await userLoader.load(id1);

const [user1, user2] = await userLoader.loadMany([id1, id2]);

const [user1, user1, user1] = await userLoader.loadMany([id1, id1, id1]); // batch function receives only one id1 since duplicate ids. Still returs three items just as requested.

const [user1, user2, user3, user2, user1] = await Promise.all([
  userLoader.load(id1),
  userLoader.load(id2),
  userLoader.load(id3),
  userLoader.load(id2),
  userLoader.load(id1),
]); // batch function receives [id1, id2, id3] only without duplicate ids.
```

#### Batch Function

A batch loading function must be of the following type:
```typescript
(keys: Key[]) => Value[] | Promise<Value[]> // keys.length === values.length
```
Constraints
 - keys.length === values.length
 - keys[i] => values[i]
 - keys.length > 0

#### KeyToUniqueId Function

A function must return string value given a key:
```typescript
(key: Key) => string
```

If key is not uniquely identifiable, simply pass `null` instead. This will disable filtering out duplicate keys, and still work the same way.
```typescript
const loader = new BatchLoader(
  (keys: Key[]) => loadValues(keys),
  null // keys cannot be transformed into string. no duplicates filtering.
);
const v1 = await loader.load(k1);
const [v1, v2, v1] = await loader.loadMany([k1, k2, k1]); // batch function receives [k1, k2, k1] as keys
```

## MappedBatchLoader

You can map a loader to create another loader.
```typescript
import { MappedBatchLoader } from 'batchloader';

const usernameLoader = new MappedBatchLoader(
  userLoader, // previously defined loader
  (user) => user && user.username // mapping function
);

// same APIs as BatchLoader
const username = await usernameLoader.load(userId);
const [username1, username2] = await usernameLoader.loadMany([userId1, userId2]);
const [user1, username1] = await Promise.all([
  userLoader.load(id1),
  usernameLoader.load(id1),
]) // one round-trip request with keys being [id1], since usernameLoader is using userLoader internally and id1 is duplicate.

const anotherMappedLoader = new MappedBatchLoader(
  usernameLoader, // MappedBatchLoader can be mapped, too.
  ...
);
```

## Caching
Unlike DataLoader, BatchLoader does not do any caching.
This is intentional, because you may want to use your favorite cache library that is best suited for your own use case.
You can add caching ability easily like so:

```typescript
let userCache = {};

const cachedUserLoader = new BatchLoader(
  async (ids) => {
    const uncachedIds = ids.filter(id => !userCache[id]);
    const users = await getUsersByIds(uncachedIds);
    uncachedIds.forEach((id, i) => { userCache[id] = users[i]; });
    return ids.map(id => userCache[id]);
  },
  ...
);

delete userCache[id1]; // delete cache by key
userCache[id2] = user2; // add cache by key
userCache = {}; // empty cache
```
Choose whatever caching library you like and simply add it like above.
