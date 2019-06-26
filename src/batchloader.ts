import { CacheLoader, ICache } from 'src/cacheloader';
import { MappedBatchLoader } from 'src/mappedbatchloader';
import { IBatchLoader, MaybePromise } from 'src/types';

export type BatchLoadFn<Key, Value> = (
  keys: Key[]
) => Value[] | Promise<Value[]>;

export type KeyToUniqueId<Key> = (key: Key) => string;

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve): void => {
    setTimeout(resolve, ms);
  });

export class BatchLoader<Key, Value> implements IBatchLoader<Key, Value> {
  protected queuedKeys: Key[] = [];
  protected batchPromise: Promise<Value[]> | null = null;

  constructor(
    protected batchFn: BatchLoadFn<Key, Value>,
    protected keyToUniqueId: KeyToUniqueId<Key> | null,
    protected batchDelay = 0,
    protected batchSize = Number.MAX_SAFE_INTEGER
  ) {}

  public load(key: Key): Promise<Value> {
    const { queuedKeys } = this;
    const index = queuedKeys.length;
    queuedKeys.push(key);

    return this.triggerBatch().then((values) => values[index]);
  }

  public loadMany(keys: Key[]): Promise<Value[]> {
    if (keys.length) {
      const { queuedKeys } = this;
      const index = queuedKeys.length;
      queuedKeys.push(...keys);
      const { length } = keys;

      return this.triggerBatch().then((values) =>
        values.slice(index, index + length)
      );
    }
    return Promise.resolve([]);
  }

  public mapLoader<MappedValue>(
    mapFn: (value: Value, key: Key) => MappedValue
  ): MappedBatchLoader<Key, Value, MappedValue> {
    return new MappedBatchLoader(this, mapFn);
  }

  public cacheLoader(cache?: ICache<Key, Value>): CacheLoader<Key, Value> {
    return new CacheLoader(this, cache);
  }

  protected triggerBatch(): Promise<Value[]> {
    return (
      this.batchPromise ||
      (this.batchPromise = new Promise((resolve, reject): void => {
        setTimeout(() => {
          this.batchPromise = null;
          this.runBatchNow().then(resolve, reject);
        }, this.batchDelay);
      }))
    );
  }

  protected runBatchNow(): Promise<Value[]> {
    const { queuedKeys, keyToUniqueId } = this;
    this.queuedKeys = [];

    if (keyToUniqueId) {
      const idMap: { [key: string]: true } = {};
      const indexToId: string[] = [];
      const idToNewIndex: { [key: string]: number } = {};

      let newIndex = 0;

      const uniqueKeys = [];
      const len = queuedKeys.length;
      for (let i = 0; i < len; i += 1) {
        const key = queuedKeys[i];
        const id = keyToUniqueId(key);
        indexToId[i] = id;
        if (idMap[id] !== true) {
          idMap[id] = true;
          idToNewIndex[id] = newIndex;
          newIndex += 1;
          uniqueKeys.push(key);
        }
      }

      return this.maybeBatchInChunks(uniqueKeys).then((values) =>
        queuedKeys.map((_key, i) => values[idToNewIndex[indexToId[i]]])
      );
    }

    return this.maybeBatchInChunks(queuedKeys);
  }

  private maybeBatchInChunks(keys: Key[]): Promise<Value[]> {
    if (keys.length <= this.batchSize) {
      return Promise.resolve(this.batchFn(keys));
    }
    return this.batchInChunks(keys);
  }

  private async batchInChunks(keys: Key[]): Promise<Value[]> {
    const { batchSize, batchDelay } = this;

    const promises: Array<MaybePromise<Value[]>> = [];
    const kLen = keys.length;
    for (let i = 0; i < kLen; i += batchSize) {
      promises.push(this.batchFn(keys.slice(i, i + batchSize)));
      if (batchDelay) {
        await sleep(batchDelay);
      }
    }

    const results = await Promise.all(promises);
    const rLen = results.length;
    let values: Value[] = [];
    for (let i = 0; i < rLen; i += 1) {
      values = values.concat(results[i]);
    }

    return values;
  }
}
