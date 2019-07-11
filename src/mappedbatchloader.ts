import { IBatchLoader } from '_src/types';

export class MappedBatchLoader<Key, Value, MappedValue>
  implements IBatchLoader<Key, MappedValue> {
  constructor(
    protected loader: IBatchLoader<Key, Value>,
    protected mapFn: (
      value: Value,
      key: Key
    ) => MappedValue | Promise<MappedValue>
  ) {}

  public load(key: Key): Promise<MappedValue> {
    return this.loader.load(key).then((value) => this.mapFn(value, key));
  }

  public loadMany(keys: Key[]): Promise<MappedValue[]> {
    return this.loader.loadMany(keys).then((values) => {
      let hasPromise = false;
      const results: Array<MappedValue | Promise<MappedValue>> = [];
      const len = values.length;
      for (let i = 0; i < len; i += 1) {
        const res = this.mapFn(values[i], keys[i]);
        results.push(res);
        hasPromise =
          hasPromise ||
          (res != null && typeof (res as any).then === 'function');
      }
      return hasPromise ? Promise.all(results) : (results as MappedValue[]);
    });
  }

  public mapLoader<RemappedValue>(
    mapFn: (value: MappedValue, key: Key) => RemappedValue
  ): MappedBatchLoader<Key, MappedValue, RemappedValue> {
    return new MappedBatchLoader(this, mapFn);
  }
}
