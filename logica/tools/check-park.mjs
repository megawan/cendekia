// Checks every lot in PARK_BANK (Poka's Parking Lot on Very hard and Extreme) in app.js:
//   - the cars fit on the 6×6 lot without overlapping, and the police car (the first) goes up and down
//   - the police car can be driven out, and the fewest moves is in the band of its level
//   - no lot is in the bank twice, also not as the mirror of another
//
//   node tools/check-park.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const js = readFileSync(join(root, 'app.js'), 'utf8');
const BANK = Function('return ' + js.match(/const PARK_BANK = (\{[\s\S]*?\n {2}\});/)[1])();
// The fewest moves of each level: every level a little further from the exit than the one before.
const BANDS = {
  veryhard: [[13, 15], [15, 17], [17, 19], [19, 21], [21, 23], [23, 25]],
  extreme: [[20, 22], [22, 24], [24, 26], [26, 28], [28, 31], [31, 99]]
};
const n = 6;

// Same rules as parkSlides() and parkSolve() in app.js: a car slides any number of free cells along its lane.
const cell = (c, p, k) => (c.v ? [c.f, p + k] : [p + k, c.f]);
function solve(cars, start) {
  const key = (s) => s.join(','), seen = new Map([[key(start), 0]]);
  let frontier = [start];
  for (let d = 0; frontier.length; d++) {
    if (frontier.some((s) => s[0] === n - cars[0].len)) return d;
    const next = [];
    for (const s of frontier) {
      const occ = new Set();
      cars.forEach((c, i) => { for (let k = 0; k < c.len; k++) occ.add(cell(c, s[i], k).join(',')); });
      cars.forEach((c, i) => {
        const free = (p, k) => !occ.has(cell(c, p, k).join(','));
        const go = (p) => { const t = s.slice(); t[i] = p; if (!seen.has(key(t))) { seen.set(key(t), d + 1); next.push(t); } };
        for (let p = s[i] - 1; p >= 0 && free(p, 0); p--) go(p);
        for (let p = s[i] + 1; p + c.len <= n && free(p, c.len - 1); p++) go(p);
      });
    }
    frontier = next;
  }
  return -1;
}

const errors = [], ids = new Set();
for (const [diff, levels] of Object.entries(BANK)) {
  levels.forEach((lots, li) => {
    const [lo, hi] = BANDS[diff][li], pars = [];
    lots.forEach((lot, k) => {
      const where = diff + ' level ' + (li + 1) + ' lot ' + (k + 1);
      if (!/^(\d{4})+$/.test(lot)) { errors.push(where + ': not groups of four digits'); return; }
      const raw = lot.match(/.{4}/g).map((t) => [...t].map(Number)), cars = raw.map(([v, f, len]) => ({ v: !!v, f, len })), start = raw.map((c) => c[3]);
      const mirror = raw.map(([v, f, len, at]) => '' + v + (v ? n - 1 - f : f) + len + (v ? at : n - len - at)).join('');
      if (ids.has(lot) || ids.has(mirror)) errors.push(where + ': already in the bank');
      ids.add(lot);
      if (!cars[0].v || cars[0].len !== 2) errors.push(where + ': the police car must go up and down and be two long');
      const cells = cars.flatMap((c, i) => Array.from({ length: c.len }, (_, j) => cell(c, start[i], j)));
      if (cells.some(([x, y]) => x < 0 || y < 0 || x >= n || y >= n)) errors.push(where + ': a car is off the lot');
      if (new Set(cells.map((p) => p.join(','))).size !== cells.length) errors.push(where + ': cars overlap');
      const par = solve(cars, start);
      if (par < lo || par > hi) errors.push(where + ': fewest moves ' + par + ', not ' + lo + ' to ' + hi);
      pars.push(par);
    });
    console.log(diff + ' level ' + (li + 1) + ': ' + lots.length + ' lots, fewest moves ' + Math.min(...pars) + ' to ' + Math.max(...pars));
  });
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('All parking lots are fine.');
