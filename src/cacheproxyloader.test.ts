import { BatchLoader } from './batchloader';
import { proxyLoaderWithCache } from './cacheproxyloader';

test('proxyLoaderWithCache', async () => {
  let cached: { [key: string]: number | null } = {
    a: 1,
    c: 3,
    e: null,
  };
  const data: { [key: string]: number } = {
    a: 1,
    b: 2,
    c: 3,
    d: 4,
  };

  const mgetArgs: string[][] = [];
  const msetArgs: Array<Array<[string, number | null]>> = [];

  const cache = {
    mget: (ks: string[]): Array<number | null | undefined> => {
      mgetArgs.push(ks);
      return ks.map((k) => cached[k]);
    },
    mset: (keyValues: Array<[string, number | null]>): void => {
      msetArgs.push(keyValues);
      keyValues.forEach(([k, v]) => {
        cached[k] = v;
      });
    },
  };

  const loadArgs: string[][] = [];

  const loader = new BatchLoader((ks: string[]): Array<number | null> => {
    loadArgs.push(ks);
    return ks.map((k) => data[k] || null);
  }, String);

  const proxyloader = proxyLoaderWithCache<string, number | null>(
    cache,
    loader,
    String
  );

  expect(await proxyloader.load('a')).toBe(1);
  expect(await proxyloader.load('b')).toBe(2);

  expect(await proxyloader.loadMany(['c', 'd'])).toEqual([3, 4]);

  expect(
    await Promise.all([
      proxyloader.load('a'),
      proxyloader.load('b'),
      proxyloader.load('c'),
      proxyloader.loadMany(['a', 'b', 'c', 'd', 'e', 'f']),
      proxyloader.load('d'),
      proxyloader.load('e'),
      proxyloader.load('f'),
    ])
  ).toEqual([1, 2, 3, [1, 2, 3, 4, null, null], 4, null, null]);

  cached = {};

  expect(await proxyloader.loadMany(['a', 'b', 'c', 'd', 'e', 'f'])).toEqual([
    1,
    2,
    3,
    4,
    null,
    null,
  ]);

  expect(mgetArgs).toEqual([
    ['a'],
    ['b'],
    ['c', 'd'],
    ['a', 'b', 'c', 'd', 'e', 'f'],
    ['a', 'b', 'c', 'd', 'e', 'f'],
  ]);

  expect(msetArgs).toEqual([
    [['b', 2]],
    [['d', 4]],
    [['f', null]],
    [['a', 1], ['b', 2], ['c', 3], ['d', 4], ['e', null], ['f', null]],
  ]);

  expect(loadArgs).toEqual([
    ['b'],
    ['d'],
    ['f'],
    ['a', 'b', 'c', 'd', 'e', 'f'],
  ]);
});
