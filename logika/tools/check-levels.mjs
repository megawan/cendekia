// Checks every robot level in the content block of index.html:
//   - the map has one start, one flag and only known tiles, and all rows are the same width
//   - the solution `sol` brings Robi to the flag with every gem, within `max` blocks
//   - for levels without loops, no shorter path exists than the solution
//
//   node tools/check-levels.mjs
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const C = JSON.parse(html.match(/<script type="application\/json" id="content">([\s\S]*?)<\/script>/)[1]);

// Same rules as parseMap(), parseProg() and simulate() in index.html.
const DIR = { U: [0, -1], D: [0, 1], L: [-1, 0], R: [1, 0] };
function parseMap(rows) {
  const lv = { w: rows[0].length, h: rows.length, cells: rows.map((r) => [...r]), gems: [] };
  rows.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === 'R') lv.start = { x, y };
    if (ch === 'F') lv.goal = { x, y };
    if (ch === '*') lv.gems.push(x + ',' + y);
  }));
  return lv;
}
function parseProg(s) {
  const out = [];
  for (let i = 0; i < s.length;) {
    const m = /^(\d)\(([UDLR]+)\)/.exec(s.slice(i));
    if (m) { out.push({ t: 'loop', n: +m[1], body: [...m[2]].map((t) => ({ t })) }); i += m[0].length; }
    else { out.push({ t: s[i] }); i++; }
  }
  return out;
}
const blocks = (prog) => prog.reduce((n, b) => n + (b.t === 'loop' ? 1 + b.body.length : 1), 0);
const blocked = (lv, x, y) => x < 0 || y < 0 || x >= lv.w || y >= lv.h || lv.cells[y][x] === '#' || lv.cells[y][x] === '~';
function wins(lv, prog) {
  let x = lv.start.x, y = lv.start.y;
  const got = new Set();
  const steps = prog.flatMap((b) => (b.t === 'loop' ? Array.from({ length: b.n }, () => b.body.map((c) => c.t)).flat() : [b.t]));
  for (const d of steps) {
    const nx = x + DIR[d][0], ny = y + DIR[d][1];
    if (blocked(lv, nx, ny)) return false;
    x = nx; y = ny;
    if (lv.gems.includes(x + ',' + y)) got.add(x + ',' + y);
    if (x === lv.goal.x && y === lv.goal.y && got.size === lv.gems.length) return true;
  }
  return false;
}
// Fewest moves to collect every gem and reach the flag (breadth-first search over position and gems).
function shortest(lv) {
  const all = (1 << lv.gems.length) - 1;
  const start = [lv.start.x, lv.start.y, 0];
  const seen = new Set([start.join()]);
  let frontier = [start];
  for (let d = 0; frontier.length; d++) {
    const next = [];
    for (const [x, y, m] of frontier) {
      if (x === lv.goal.x && y === lv.goal.y && m === all) return d;
      for (const [dx, dy] of Object.values(DIR)) {
        const nx = x + dx, ny = y + dy;
        if (blocked(lv, nx, ny)) continue;
        const g = lv.gems.indexOf(nx + ',' + ny), nm = g < 0 ? m : m | (1 << g);
        const k = [nx, ny, nm].join();
        if (!seen.has(k)) { seen.add(k); next.push([nx, ny, nm]); }
      }
    }
    frontier = next;
  }
  return Infinity;
}

let bad = 0;
const fail = (where, msg) => { bad++; console.log(`✗ ${where}: ${msg}`); };
for (const [set, list] of [['robot', C.robot], ['debug', C.debug]]) {
  list.forEach((l, i) => {
    const where = `${set} ${i + 1} (${l.name})`;
    if (l.map.some((r) => r.length !== l.map[0].length)) return fail(where, 'rows have different widths');
    if (l.map.join('').replace(/[.#~*]/g, '') !== 'RF' && l.map.join('').replace(/[.#~*]/g, '') !== 'FR') return fail(where, 'needs one R, one F and only . # ~ *');
    const lv = parseMap(l.map), prog = parseProg(l.sol);
    if (!wins(lv, prog)) return fail(where, `solution ${l.sol} does not win`);
    if (l.max && blocks(prog) > l.max) return fail(where, `solution uses ${blocks(prog)} blocks, max is ${l.max}`);
    const best = shortest(lv);
    const loops = prog.some((b) => b.t === 'loop');
    if (!loops && best < l.sol.length) return fail(where, `a path of ${best} moves exists, solution has ${l.sol.length}`);
    if (l.max && best <= l.max) return fail(where, `max ${l.max} allows a path without loops (${best} moves)`);
    console.log(`✓ ${where}: ${l.sol} (${blocks(prog)} blocks, shortest path ${best} moves)`);
  });
}
process.exit(bad ? 1 : 0);
