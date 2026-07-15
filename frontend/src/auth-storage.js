export function readStoredToken(storage = globalThis.localStorage) {
  try {
    const value = storage?.getItem?.('token');
    return typeof value === 'string' ? value.trim() : '';
  } catch {
    return '';
  }
}

export function hasStoredToken(storage = globalThis.localStorage) {
  return readStoredToken(storage).length > 0;
}
