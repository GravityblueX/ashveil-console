export function readStoredToken(storage = globalThis.localStorage) {
  try {
    return storage?.getItem?.('token') || '';
  } catch {
    return '';
  }
}

export function hasStoredToken(storage = globalThis.localStorage) {
  return readStoredToken(storage).length > 0;
}
