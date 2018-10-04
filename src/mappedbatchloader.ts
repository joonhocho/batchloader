import { IBatchLoader } from 'src/types';

// tslint:disable-next-line max-classes-per-file
export class MappedBatchLoader<Key, Value, MappedValue>
  implements IBatchLoader<Key, MappedValue> {
  constructor(
    protected loader: IBatchLoader<Key, Value>,
    protected mapFn: (v: Value) => MappedValue | Promise<MappedValue>
  ) {}

  public load(key: Key): Promise<MappedValue> {
    return this.loader.load(key).then(this.mapFn);
  }

  public loadMany(keys: Key[]): Promise<MappedValue[]> {
    return this.loader.loadMany(keys).then(this.mapItems);
  }

  private mapItems = (vs: Value[]): MappedValue[] | Promise<MappedValue[]> => {
    const mapped = vs.map(this.mapFn);
    const len = mapped.length;
    for (let i = 0; i < len; i += 1) {
      const item = mapped[i];
      if (item != null && typeof (item as any).then === 'function') {
        // has at least one promise
        return Promise.all(mapped);
      }
    }
    return mapped as MappedValue[];
  };
}
