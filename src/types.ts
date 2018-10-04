export interface IBatchLoader<Key, Value> {
  load(key: Key): Promise<Value>;
  loadMany(keys: Key[]): Promise<Value[]>;
}
