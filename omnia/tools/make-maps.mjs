// Builds omnia/maps.js, the country shapes of the two maps, from Natural Earth data (public domain) in the
// world-atlas package. The page has no build step: run this only to change the maps, then commit maps.js.
//
//   npm i --no-save world-atlas@2.0.2 topojson-client@3.1.0 topojson-simplify@3.0.3 d3-geo@3.1.1
//   node omnia/tools/make-maps.mjs
//
// Each map stores its projection (scale k and translate tx, ty) so the page can place cities from latitude and
// longitude with the same formula (see project() in index.html).
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import { presimplify, simplify } from 'topojson-simplify';
import { geoNaturalEarth1, geoMercator, geoPath } from 'd3-geo';

const require = createRequire(import.meta.url);
// Simplification, in square degrees: corners that make a smaller triangle are removed.
const WORLD_W = +(process.env.WW || 0.03), INDO_W = +(process.env.IW || 0.0005);

function shapes(topoFile, minWeight, projection, keep, minArea) {
  const topo = presimplify(structuredClone(require(topoFile)));
  const fc = feature(simplify(topo, minWeight), topo.objects.countries);
  const path = geoPath(projection).digits(1);
  const out = [];
  for (const f of fc.features) {
    if (!keep(f)) continue;
    // Drop islands too small to see, but always keep the biggest part of a country.
    const polys = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates];
    const sized = polys.map((c) => ({ c, a: path.area({ type: 'Polygon', coordinates: c }) }));
    const biggest = Math.max(...sized.map((p) => p.a));
    const kept = sized.filter((p) => p.a >= minArea || p.a === biggest).map((p) => p.c);
    const d = path({ type: 'MultiPolygon', coordinates: kept });
    if (d) out.push([f.id ? String(f.id) : '', d]);
  }
  return out;
}

const fitted = (projection, w, h, object) => projection.fitExtent([[6, 6], [w - 6, h - 6]], object);

// World: every country but Antarctica, Natural Earth projection.
const W = 1000, WH = 500;
const worldTopo = require('world-atlas/countries-50m.json');
const notAntarctica = (f) => f.id !== '010';
const worldFc = feature(worldTopo, worldTopo.objects.countries);
const world = fitted(geoNaturalEarth1(), W, WH, { type: 'FeatureCollection', features: worldFc.features.filter(notAntarctica) });
const worldShapes = shapes('world-atlas/countries-50m.json', WORLD_W, world, notAntarctica, 0.25);

// Indonesia and its neighbours, Mercator, cut a little outside the frame.
const I = 1000, IH = 420;
const box = { type: 'MultiPoint', coordinates: [[94.5, -11.5], [141.5, 6.8]] };
const indo = fitted(geoMercator(), I, IH, box);
indo.clipExtent([[-100, -60], [I + 100, IH + 60]]); // some room around the frame to drag into
const near = new Set(['360', '458', '096', '702', '626', '598', '608', '036', '764', '104']);
const indoShapes = shapes('world-atlas/countries-10m.json', INDO_W, indo, (f) => near.has(f.id), 0.6);

const meta = (p, w, h, kind) => ({ w, h, proj: kind, k: +p.scale().toFixed(4), tx: +p.translate()[0].toFixed(3), ty: +p.translate()[1].toFixed(3) });
const maps = {
  world: { ...meta(world, W, WH, 'naturalEarth1'), shapes: worldShapes },
  indonesia: { ...meta(indo, I, IH, 'mercator'), shapes: indoShapes }
};
const js = '// Country shapes for Omnia, made by tools/make-maps.mjs from Natural Earth (public domain). Do not edit by hand.\n'
  + 'window.OMNIA_MAPS = ' + JSON.stringify(maps) + ';\n';
writeFileSync(process.argv[2] || new URL('../maps.js', import.meta.url), js);
console.log('maps.js', (js.length / 1024).toFixed(0) + ' KB', 'world', worldShapes.length, 'indonesia', indoShapes.length);
