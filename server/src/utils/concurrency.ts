/**
 * Runs `fn` over all items with at most `limit` in flight at once.
 * Rejections must be handled inside `fn`; this helper does not short-circuit.
 */
export async function forEachWithConcurrency<T>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<void>,
): Promise<void> {
  const queue = [...items];
  const workerCount = Math.min(limit, queue.length);

  const workers = Array.from({ length: workerCount }, async () => {
    for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
      await fn(item);
    }
  });

  await Promise.all(workers);
}
