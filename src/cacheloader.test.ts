import { BatchLoader } from './batchloader';

describe('CacheLoader', () => {
  test('with keyToUniqueId', async () => {
    const idss = [] as number[][];
    const bloader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise((resolve): void => {
          idss.push(ids);
          setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
        }),
      String
    );
    const loader = bloader.cacheLoader();

    expect(await loader.load(3)).toBe(6);
    expect(await loader.load(4)).toBe(8);
    expect(await loader.load(5)).toBe(10);

    expect(await loader.loadMany([])).toEqual([]);
    expect(await loader.loadMany([1, 2, 3])).toEqual([2, 4, 6]);
    expect(await loader.loadMany([1, 2, 3, 2, 3, 2, 1])).toEqual([
      2,
      4,
      6,
      4,
      6,
      4,
      2,
    ]);

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
    ).toEqual([2, 4, 6, 4, 2, 4, 6]);

    expect(idss).toEqual([[3], [4], [5], [1, 2]]);

    // rerun
    idss.length = 0;
    expect(await loader.load(3)).toBe(6);
    expect(await loader.load(4)).toBe(8);
    expect(await loader.load(5)).toBe(10);

    expect(await loader.loadMany([])).toEqual([]);
    expect(await loader.loadMany([1, 2, 3])).toEqual([2, 4, 6]);
    expect(await loader.loadMany([1, 2, 3, 2, 3, 2, 1])).toEqual([
      2,
      4,
      6,
      4,
      6,
      4,
      2,
    ]);

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
    ).toEqual([2, 4, 6, 4, 2, 4, 6]);

    expect(idss).toEqual([]);

    // rerun
    idss.length = 0;
    loader.clear();

    expect(await loader.load(3)).toBe(6);
    expect(await loader.load(4)).toBe(8);
    expect(await loader.load(5)).toBe(10);

    expect(await loader.loadMany([])).toEqual([]);
    expect(await loader.loadMany([1, 2, 3])).toEqual([2, 4, 6]);
    expect(await loader.loadMany([1, 2, 3, 2, 3, 2, 1])).toEqual([
      2,
      4,
      6,
      4,
      6,
      4,
      2,
    ]);

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
    ).toEqual([2, 4, 6, 4, 2, 4, 6]);

    expect(idss).toEqual([[3], [4], [5], [1, 2]]);

    const mappedLoader = loader.mapLoader(String);

    expect(await mappedLoader.load(3)).toBe('6');
    expect(await mappedLoader.load(4)).toBe('8');
    expect(await mappedLoader.load(5)).toBe('10');

    expect(loader.get(8)).toBe(undefined);
    expect(loader.get(8)).toBe(undefined);
    loader.set(8, 12);
    expect(await loader.get(8)).toBe(12);
    expect(await loader.get(8)).toBe(12);
    loader.delete(8);
    expect(loader.get(8)).toBe(undefined);
    expect(loader.get(8)).toBe(undefined);
  });
});
