export interface IBatchLoader<Key, Value> {
  load(key: Key): Promise<Value>;
  loadMany(keys: Key[]): Promise<Value[]>;
  mapLoader<MappedValue>(
    mapFn: (value: Value) => MappedValue
  ): IBatchLoader<Key, MappedValue>;
}

export type MaybePromise<T> = T | Promise<T>;
