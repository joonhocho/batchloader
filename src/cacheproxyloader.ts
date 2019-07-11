import { BatchLoader, KeyToUniqueId } from '_src/batchloader';
import { IBatchLoader, MaybePromise } from '_src/types';

export interface IBatchCache<Key, Value> {
  mget: (keys: Key[]) => MaybePromise<Array<Value | undefined>>;
  mset: (keyValues: Array<[Key, Value]>) => MaybePromise<void>;
}

export const proxyLoaderWithCache = <Key, Value>(
  cache: IBatchCache<Key, Value>,
  loader: IBatchLoader<Key, Value>,
  keyToUniqueId: KeyToUniqueId<Key> | null,
  batchDelay?: number,
  batchSize?: number
): BatchLoader<Key, Value> =>
  new BatchLoader<Key, Value>(
    async (keys): Promise<Value[]> => {
      const values = await cache.mget(keys);

      const len = values.length;
      const missingKeys: Key[] = [];
      const missingIndexes: number[] = [];
      for (let i = 0; i < len; i += 1) {
        if (values[i] === undefined) {
          missingKeys.push(keys[i]);
          missingIndexes.push(i);
        }
      }

      if (missingKeys.length) {
        const missingValues = await loader.loadMany(missingKeys);
        const mlen = missingValues.length;
        const missingKeyValues: Array<[Key, Value]> = [];
        for (let i = 0; i < mlen; i += 1) {
          const value = missingValues[i];
          values[missingIndexes[i]] = value;
          missingKeyValues.push([missingKeys[i], value]);
        }

        // do not await
        cache.mset(missingKeyValues);
      }

      return values as Value[];
    },
    keyToUniqueId,
    batchDelay,
    batchSize
  );
