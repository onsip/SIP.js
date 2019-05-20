
export async function soon(timeout = 1): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(), timeout);
    jasmine.clock().tick(timeout);
  });
}
