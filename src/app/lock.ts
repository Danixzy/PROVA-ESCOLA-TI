let cauda: Promise<unknown> = Promise.resolve();

export function comLock<T>(fn: () => Promise<T>): Promise<T> {
  const resultado = cauda.then(fn);
  cauda = resultado.catch(() => undefined);
  return resultado;
}
