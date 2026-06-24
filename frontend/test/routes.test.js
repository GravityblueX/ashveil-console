import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { menus } from '../../backend/src/store.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function readSource(path) {
  return readFile(resolve(root, path), 'utf8');
}

function extractQuotedValues(source, regex) {
  return [...source.matchAll(regex)].map((match) => match[1]);
}

describe('frontend route contract', () => {
  it('keeps every backend menu path routable in the Vue app', async () => {
    const main = await readSource('src/main.js');
    const routePaths = new Set(extractQuotedValues(main, /path:\s*'([^']+)'/g));

    for (const menu of menus) {
      assert.ok(routePaths.has(menu.path), `missing route for menu path: ${menu.path}`);
    }
  });

  it('keeps lazy-loaded page modules present on disk', async () => {
    const main = await readSource('src/main.js');
    const pageModules = extractQuotedValues(main, /import\('\.\/pages\/([^']+\.vue)'\)/g);

    assert.ok(pageModules.length > 0, 'expected at least one lazy page import');

    for (const page of pageModules) {
      const source = await readSource(`src/pages/${page}`);
      assert.match(source, /<template>|<script/, `page module looks empty: ${page}`);
    }
  });
});
