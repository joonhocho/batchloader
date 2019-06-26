import { BatchLoader } from './batchloader';
import { MappedBatchLoader } from './mappedbatchloader';

describe('MappedBatchLoader', () => {
  test('sync mapper', async () => {
    const idss = [] as number[][];
    const loader1 = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise((resolve): void => {
          idss.push(ids);
          setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
        }),
      String
    );
    const loader = new MappedBatchLoader(loader1, String);

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

    // test one round trip
    expect(await Promise.all([loader1.load(1), loader.load(1)])).toEqual([
      2,
      '2',
    ]);

    expect(idss).toEqual([[3], [4], [5], [1, 2, 3], [1, 2, 3], [1, 2, 3], [1]]);
  });

  test('async mapper', async () => {
    const idss = [] as number[][];
    const loader = new MappedBatchLoader(
      new BatchLoader(
        (ids: number[]): Promise<number[]> =>
          new Promise((resolve): void => {
            idss.push(ids);
            setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
          }),
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

  test('mapLoader()', async () => {
    const idss = [] as number[][];
    const loader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise((resolve): void => {
          idss.push(ids);
          setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
        }),
      String
    )
      .mapLoader((x): Promise<string> => Promise.resolve(String(x)))
      .mapLoader((x) => `${x}${x}`);

    expect(await loader.load(3)).toBe('66');
    expect(await loader.load(4)).toBe('88');
    expect(await loader.load(5)).toBe('1010');

    expect(await loader.loadMany([])).toEqual([]);
    expect(await loader.loadMany([1, 2, 3])).toEqual(['22', '44', '66']);
    expect(await loader.loadMany([1, 2, 3, 2, 3, 2, 1])).toEqual(
      [2, 4, 6, 4, 6, 4, 2].map((x) => `${x}${x}`)
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
    ).toEqual([2, 4, 6, 4, 2, 4, 6].map((x) => `${x}${x}`));

    expect(idss).toEqual([[3], [4], [5], [1, 2, 3], [1, 2, 3], [1, 2, 3]]);
  });
});
