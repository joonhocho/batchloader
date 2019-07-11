import { MappedBatchLoader } from '_src/mappedbatchloader';
import { IBatchLoader, MaybePromise } from '_src/types';

export interface ICache<Key, Value> {
  clear(): void;
  delete(key: Key): boolean;
  get(key: Key): Value | undefined;
  set(key: Key, value: Value): void;
}

export class CacheLoader<Key, Value>
  implements IBatchLoader<Key, Value>, ICache<Key, MaybePromise<Value>> {
  public promiseCache: Map<Key, Promise<Value>>;

  constructor(
    protected loader: IBatchLoader<Key, Value>,
    public cache: ICache<Key, Value> = new Map<Key, Value>()
  ) {
    this.promiseCache = new Map<Key, Promise<Value>>();
  }

  public load(key: Key): Promise<Value> {
    const { promiseCache } = this;
    let pv = promiseCache.get(key);
    if (pv) {
      return pv;
    }
    const value = this.cache.get(key);
    pv =
      value === undefined
        ? this.loader.load(key).then((val) => {
            this.set(key, val);
            return val;
          })
        : Promise.resolve(value);
    promiseCache.set(key, pv);
    return pv;
  }

  public loadMany(keys: Key[]): Promise<Value[]> {
    return Promise.all(keys.map((key) => this.load(key)));
  }

  public mapLoader<MappedValue>(
    mapFn: (value: Value, key: Key) => MappedValue
  ): MappedBatchLoader<Key, Value, MappedValue> {
    return new MappedBatchLoader(this, mapFn);
  }

  public get(key: Key): Promise<Value> | undefined {
    let pv = this.promiseCache.get(key);
    if (pv) {
      return pv;
    }
    const v = this.cache.get(key);
    if (v === undefined) {
      return undefined;
    }
    pv = Promise.resolve(v);
    this.promiseCache.set(key, pv);
    return pv;
  }

  public set(key: Key, value: Value): void {
    this.promiseCache.delete(key);
    this.cache.set(key, value);
  }

  public delete(key: Key): boolean {
    const pDeleted = this.promiseCache.delete(key);
    const deleted = this.cache.delete(key);
    return pDeleted || deleted;
  }

  public clear(): void {
    this.promiseCache.clear();
    this.cache.clear();
  }
}
