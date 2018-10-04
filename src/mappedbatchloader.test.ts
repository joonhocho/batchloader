import { BatchLoader } from './batchloader';
import { MappedBatchLoader } from './mappedbatchloader';

describe('MappedBatchLoader', () => {
  test('sync mapper', async () => {
    const idss = [] as number[][];
    const loader = new MappedBatchLoader(
      new BatchLoader(
        (ids: number[]): Promise<number[]> =>
          new Promise(
            (resolve): void => {
              idss.push(ids);
              setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
            }
          ),
        String
      ),
      String
    );

    expect(await loader.load(3)).toBe('6');
    expect(await loader.load(4)).toBe('8');
    expect(await loader.load(5)).toBe('10');

    expect(await loader.loadMany([])).toEqual([]);
    expect(await loader.loadMany([1, 2, 3])).toEqual([2, 4, 6].map(String));
    expect(await loader.loadMany([1, 2, 3, 2, 3, 2, 1])).toEqual(
      [2, 4, 6, 4, 6, 4, 2].map(String)
    );

    expect(
      await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.load(3),
        loader.load(2),
        loader.load(1),
        loader.load(2),
        loader.load(3),
      ])
    ).toEqual([2, 4, 6, 4, 2, 4, 6].map(String));

    expect(idss).toEqual([[3], [4], [5], [1, 2, 3], [1, 2, 3], [1, 2, 3]]);
  });

  test('async mapper', async () => {
    const idss = [] as number[][];
    const loader = new MappedBatchLoader(
      new BatchLoader(
        (ids: number[]): Promise<number[]> =>
          new Promise(
            (resolve): void => {
              idss.push(ids);
              setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
            }
          ),
        String
      ),
      (x): Promise<string> => Promise.resolve(String(x))
    );

    expect(await loader.load(3)).toBe('6');
    expect(await loader.load(4)).toBe('8');
    expect(await loader.load(5)).toBe('10');

    expect(await loader.loadMany([])).toEqual([]);
    expect(await loader.loadMany([1, 2, 3])).toEqual([2, 4, 6].map(String));
    expect(await loader.loadMany([1, 2, 3, 2, 3, 2, 1])).toEqual(
      [2, 4, 6, 4, 6, 4, 2].map(String)
    );

    expect(
      await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.load(3),
        loader.load(2),
        loader.load(1),
        loader.load(2),
        loader.load(3),
      ])
    ).toEqual([2, 4, 6, 4, 2, 4, 6].map(String));

    expect(idss).toEqual([[3], [4], [5], [1, 2, 3], [1, 2, 3], [1, 2, 3]]);
  });
});
