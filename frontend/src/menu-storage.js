export const MENU_STORAGE_KEY = 'menus';

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStoredMenu(value) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    isNonEmptyString(value.path) &&
    isNonEmptyString(value.title) &&
    isNonEmptyString(value.icon)
  );
}

function clearStoredMenus(storage) {
  try {
    storage?.removeItem?.(MENU_STORAGE_KEY);
  } catch {
    // Ignore blocked storage APIs; callers still get a safe empty menu list.
  }
}

export function loadStoredMenus(storage = globalThis.localStorage) {
  try {
    const raw = storage?.getItem?.(MENU_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(isStoredMenu)) {
      clearStoredMenus(storage);
      return [];
    }

    return parsed;
  } catch {
    clearStoredMenus(storage);
    return [];
  }
}
