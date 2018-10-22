import { BatchLoader } from './batchloader';

describe('BatchLoader', () => {
  test('with keyToUniqueId', async () => {
    const idss = [] as number[][];
    const loader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise(
          (resolve): void => {
            idss.push(ids);
            setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
          }
        ),
      String
    );

    expect(await loader.load(3)).toBe(6);
    expect(await loader.load(4)).toBe(8);
    expect(await loader.load(5)).toBe(10);

    expect(await loader.loadMany([])).toEqual([]);
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
    expect(await loader.loadMany([])).toEqual([]);

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

    expect(idss).toEqual([[3], [4], [5], [1, 2, 3], [1, 2, 3], [1, 2, 3]]);
  });

  test('without keyToUniqueId', async () => {
    const idss = [] as number[][];
    const loader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise(
          (resolve): void => {
            idss.push(ids);
            setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
          }
        ),
      null
    );

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

    expect(idss).toEqual([
      [3],
      [4],
      [5],
      [1, 2, 3],
      [1, 2, 3, 2, 3, 2, 1],
      [1, 2, 3, 2, 1, 2, 3],
    ]);
  });

  test('batchSize', async () => {
    const idss = [] as number[][];
    const loader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise(
          (resolve): void => {
            idss.push(ids);
            setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
          }
        ),
      String,
      10,
      2
    );

    expect(
      await Promise.all([
        loader.load(1),
        loader.load(2),
        loader.loadMany([3, 4, 5]),
        loader.load(6),
        loader.loadMany([7, 8]),
      ])
    ).toEqual([2, 4, [6, 8, 10], 12, [14, 16]]);
  });

  test('sync mapLoader', async () => {
    const idss = [] as number[][];
    const loader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise(
          (resolve): void => {
            idss.push(ids);
            setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
          }
        ),
      String
    ).mapLoader(String);

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

  test('async mapLoader', async () => {
    const idss = [] as number[][];
    const loader = new BatchLoader(
      (ids: number[]): Promise<number[]> =>
        new Promise(
          (resolve): void => {
            idss.push(ids);
            setTimeout(() => resolve(ids.map((i) => i * 2)), 10);
          }
        ),
      String
    ).mapLoader((x): Promise<string> => Promise.resolve(String(x)));

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
