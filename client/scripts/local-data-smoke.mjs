#!/usr/bin/env node
/**
 * Local-data smoke test — the static build's replacement for hitting the API.
 *
 * It serves `public/` over HTTP, points the data store at it, then drives the same
 * functions the UI calls (catalog, a body, a search, the guide) and asserts they return
 * real records. This is the check that used to be "does the server answer" — now that
 * there is no server, it proves the bundled JSON is complete and the browser logic works.
 *
 * Run with `npm run test:local`.
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('../public/', import.meta.url).pathname;
const TYPES = { '.json': 'application/json', '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' };

const server = createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(req.url.split('?')[0]);
    const file = join(root, path.replace(/^\/+/, ''));
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' });
    res.end(body);
  } catch (err) {
    res.writeHead(404).end('not found');
  }
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
globalThis.__SPACE_RELICS_DATA_BASE__ = `http://127.0.0.1:${port}/data/`;
// Keep the test hermetic: no Wikipedia lookup and no model call.
globalThis.__SPACE_RELICS_CONFIG__ = { webKnowledge: false, freeModel: false };

let failures = 0;
const check = (label, condition, detail = '') => {
  if (condition) {
    console.log(`PASS  ${label}`);
  } else {
    failures += 1;
    console.log(`FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

try {
  const { api } = await import('../src/services/api.js');

  const catalog = await api.catalog();
  const bodies = catalog.data.bodies;
  check('catalog returns every body', bodies.length === 19, `got ${bodies.length}`);
  check('catalog carries dataset counts', catalog.data.counts && catalog.data.counts.missions === 211, JSON.stringify(catalog.data.counts));
  check('catalog includes facets', Array.isArray(catalog.data.facets.kinds) && catalog.data.facets.kinds.length > 0);

  const mars = await api.body('mars');
  check('mars hardware is non-empty', mars.data.hardware.length > 20, `got ${mars.data.hardware.length}`);
  check('mars hardware carries photographs', mars.data.hardware.every((h) => typeof h.imageUrl === 'string' || h.imageUrl === null));

  const withPicture = mars.data.hardware.filter((h) => h.imageUrl).length;
  check('every mars object has a picture', withPicture === mars.data.hardware.length, `${withPicture}/${mars.data.hardware.length}`);

  const search = await api.search('curiosity');
  check('search finds Curiosity', search.data.some((hit) => /curiosity/i.test(hit.name)), JSON.stringify(search.data.slice(0, 3)));

  const one = await api.mission('voyager-1');
  check('single mission loads with position', Boolean(one.data.mission) && typeof one.data.mission.id === 'string');

  const answer = await api.chat({ message: 'Is Voyager 1 still working?', useWeb: false });
  check('guide answers from the dataset', typeof answer.answer === 'string' && answer.answer.length > 40, answer.answer);
  check('guide reports the dataset source', (answer.sources || []).some((s) => s.id === 'dataset'));

  const engines = await api.engines();
  check('engines reports dataset availability', engines.data.dataset.available === true);
} catch (err) {
  failures += 1;
  console.log(`FAIL  threw: ${err.stack || err.message}`);
} finally {
  server.close();
}

console.log(`\n${failures === 0 ? 'LOCAL DATA SMOKE PASSED' : `${failures} CHECK(S) FAILED`}`);
process.exit(failures ? 1 : 0);
