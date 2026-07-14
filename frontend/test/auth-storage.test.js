import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hasStoredToken, readStoredToken } from '../src/auth-storage.js';

describe('frontend auth storage helpers', () => {
  it('reads the stored auth token when storage is available', () => {
    const storage = {
      getItem(key) {
        return key === 'token' ? 'test-token' : null;
      }
    };

    assert.equal(readStoredToken(storage), 'test-token');
    assert.equal(hasStoredToken(storage), true);
  });

  it('treats missing tokens as signed out', () => {
    const storage = {
      getItem() {
        return null;
      }
    };

    assert.equal(readStoredToken(storage), '');
    assert.equal(hasStoredToken(storage), false);
  });

  it('treats unavailable storage as signed out instead of throwing', () => {
    const storage = {
      getItem() {
        throw new Error('storage unavailable');
      }
    };

    assert.equal(readStoredToken(storage), '');
    assert.equal(hasStoredToken(storage), false);
  });
});
