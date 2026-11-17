// Builds omnia/borders.js, which countries share a land border, from the same Natural Earth data (public domain) in the
// world-atlas package that the maps are made from. The page has no build step: run this only to change the borders,
// then commit borders.js.
//
//   npm i --no-save world-atlas@2.0.2 topojson-client@3.1.0
//   node omnia/tools/make-borders.mjs
//
// A country is listed by its ISO number, the id of its shape on the map. A neighbour with no id in the data (Kosovo,
// Northern Cyprus, Somaliland) is written as "-", so the page can tell that a list is not the whole truth.
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { neighbors } from 'topojson-client';

const require = createRequire(import.meta.url);
const topo = require('world-atlas/countries-50m.json');
const geoms = topo.objects.countries.geometries;
const near = neighbors(geoms);
// Borders that exist only because a country owns land far from home: French Guiana touches Brazil and Suriname.
const OVERSEAS = [['250', '076'], ['250', '740']];
const overseas = (a, b) => OVERSEAS.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
const borders = {};
geoms.forEach((g, i) => {
  if (!g.id) return;
  borders[g.id] = near[i].map((j) => geoms[j].id || '-').filter((id) => !overseas(g.id, id)).sort();
});
const js = '// Land borders for Omnia, made by tools/make-borders.mjs from Natural Earth (public domain). Do not edit by hand.\n'
  + 'window.OMNIA_BORDERS = ' + JSON.stringify(borders) + ';\n';
writeFileSync(process.argv[2] || new URL('../borders.js', import.meta.url), js);
console.log('borders.js', (js.length / 1024).toFixed(1) + ' KB', Object.keys(borders).length, 'countries');
