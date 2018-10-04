import { MappedBatchLoader } from 'src/mappedbatchloader';
import { IBatchLoader } from 'src/types';

export type BatchLoadFn<Key, Value> = (
  keys: Key[]
) => Value[] | Promise<Value[]>;

export type KeyToUniqueId<Key> = (key: Key) => string;

export class BatchLoader<Key, Value> implements IBatchLoader<Key, Value> {
  protected queuedKeys: Key[] = [];
  protected batchPromise: Promise<Value[]> | null = null;

  constructor(
    protected batchFn: BatchLoadFn<Key, Value>,
    protected keyToUniqueId: KeyToUniqueId<Key> | null,
    protected batchDelay = 0
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

      return this.triggerBatch().then((values) => values.slice(index, length));
    }
    return Promise.resolve([]);
  }

  public mapLoader<MappedValue>(
    mapFn: (value: Value) => MappedValue
  ): MappedBatchLoader<Key, Value, MappedValue> {
    return new MappedBatchLoader(this, mapFn);
  }

  protected triggerBatch(): Promise<Value[]> {
    return (
      this.batchPromise ||
      (this.batchPromise = new Promise(
        (resolve, reject): void => {
          setTimeout(() => {
            this.batchPromise = null;
            this.runBatchNow().then(resolve, reject);
          }, this.batchDelay);
        }
      ))
    );
  }

  protected async runBatchNow(): Promise<Value[]> {
    const { queuedKeys, keyToUniqueId } = this;
    if (!queuedKeys.length) {
      return [];
    }

    this.queuedKeys = [];

    if (keyToUniqueId) {
      const idMap = {} as { [key: string]: true };
      const indexToId = [] as string[];
      const idToNewIndex = {} as { [key: string]: number };

      let newIndex = 0;

      const uniqueKeys = queuedKeys.filter((key, i) => {
        const id = keyToUniqueId(key);
        indexToId[i] = id;
        if (idMap[id] === true) {
          return false;
        }
        idMap[id] = true;
        idToNewIndex[id] = newIndex;
        newIndex += 1;
        return true;
      });

      const values = await this.batchFn(uniqueKeys);

      return queuedKeys.map((_key, i) => values[idToNewIndex[indexToId[i]]]);
    }

    return this.batchFn(queuedKeys);
  }
}