import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function readSource(path) {
  return readFile(resolve(root, path), 'utf8');
}

describe('frontend accessibility contract', () => {
  it('keeps login controls explicitly named', async () => {
    const source = await readSource('src/pages/Login.vue');

    assert.match(source, /aria-label="用户名"/);
    assert.match(source, /aria-label="密码"/);
    assert.match(source, /<button\s+type="button"\s+@click="submit">登录<\/button>/);
  });

  it('keeps form modal exposed as a named dialog', async () => {
    const source = await readSource('src/components/FormModal.vue');

    assert.match(source, /role="dialog"/);
    assert.match(source, /aria-modal="true"/);
    assert.match(source, /:aria-label="modalTitle"/);
    assert.match(source, /aria-label="关闭表单弹窗"/);
  });
});
