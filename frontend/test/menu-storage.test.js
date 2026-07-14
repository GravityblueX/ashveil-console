import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadStoredMenus, MENU_STORAGE_KEY } from '../src/menu-storage.js';

function memoryStorage(initialValue) {
  const values = new Map();
  if (initialValue !== undefined) values.set(MENU_STORAGE_KEY, initialValue);

  return {
    removed: false,
    getItem(key) {
      return values.get(key) ?? null;
    },
    removeItem(key) {
      this.removed = true;
      values.delete(key);
    }
  };
}

describe('menu storage contract', () => {
  it('loads valid stored menu records', () => {
    const storedMenus = [
      { path: '/dashboard', title: '星图总览', icon: '◐' },
      { path: '/audit/logs', title: '审计轨迹', icon: '◎' }
    ];
    const storage = memoryStorage(JSON.stringify(storedMenus));

    assert.deepEqual(loadStoredMenus(storage), storedMenus);
    assert.equal(storage.removed, false);
  });

  it('falls back to an empty list when no menu record exists', () => {
    assert.deepEqual(loadStoredMenus(memoryStorage()), []);
  });

  it('clears malformed menu JSON before returning an empty list', () => {
    const storage = memoryStorage('{not-json');

    assert.deepEqual(loadStoredMenus(storage), []);
    assert.equal(storage.removed, true);
    assert.equal(storage.getItem(MENU_STORAGE_KEY), null);
  });

  it('clears menu records that are not valid route items', () => {
    const storage = memoryStorage(
      JSON.stringify([
        { path: '/dashboard', title: '星图总览', icon: '◐' },
        { path: '', title: 'Broken' }
      ])
    );

    assert.deepEqual(loadStoredMenus(storage), []);
    assert.equal(storage.removed, true);
  });

  it('survives blocked browser storage APIs', () => {
    const storage = {
      getItem() {
        throw new Error('storage blocked');
      },
      removeItem() {
        throw new Error('remove blocked');
      }
    };

    assert.deepEqual(loadStoredMenus(storage), []);
  });
});
