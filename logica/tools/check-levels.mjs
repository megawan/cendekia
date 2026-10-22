// Checks every robot and fixing level in the content block of index.html, for every difficulty:
//   - the map has one start, one flag and only known tiles, and all rows are the same width
//   - the solution `sol` brings Gbot to the flag with every gem, within `max` blocks
//   - the solution only uses the blocks the level offers (`tools`)
//   - for levels without loops, ifs or functions, no shorter path exists than the solution
//   - a block limit is too small to reach the flag with arrows alone
//
//   node tools/check-levels.mjs            check
//   node tools/check-levels.mjs --solve    also print a shortest arrow path for each map
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const C = JSON.parse(html.match(/<script type="application\/json" id="content">([\s\S]*?)<\/script>/)[1]);

// Same rules as parseMap(), parseProg(), blocks() and execute() in index.html.
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
function parseList(s) {
  const out = [];
  for (let i = 0; i < s.length;) {
    const ch = s[i];
    if (/\d/.test(ch)) {
      const end = s.indexOf(')', i);
      out.push({ t: 'loop', n: +ch, body: parseList(s.slice(i + 2, end)) });
      i = end + 1;
    } else if (ch === '?') { out.push({ t: 'if', a: s[i + 1], b: s[i + 2] }); i += 3; }
    else { out.push({ t: ch }); i++; }
  }
  return out;
}
const parseProg = (s) => { const [main, fn] = s.split('|'); return { prog: parseList(main), fn: parseList(fn || '') }; };
const count = (list) => list.reduce((n, b) => n + (b.t === 'loop' ? 1 + count(b.body) : 1), 0);
const blocks = (p) => count(p.prog) + count(p.fn);
const uses = (list, t) => list.some((b) => b.t === t || (b.t === 'loop' && t === 'loop') || (b.t === 'loop' && uses(b.body, t)));
const blocked = (lv, x, y) => x < 0 || y < 0 || x >= lv.w || y >= lv.h || lv.cells[y][x] === '#' || lv.cells[y][x] === '~';
function wins(lv, p) {
  let x = lv.start.x, y = lv.start.y, steps = 0;
  const got = new Set();
  let end = null;
  const move = (d) => {
    if (!d || d === '_') return false;
    const nx = x + DIR[d][0], ny = y + DIR[d][1];
    if (blocked(lv, nx, ny) || ++steps > 300) { end = 'bump'; return true; }
    x = nx; y = ny;
    if (lv.gems.includes(x + ',' + y)) got.add(x + ',' + y);
    if (x === lv.goal.x && y === lv.goal.y && got.size === lv.gems.length) { end = 'win'; return true; }
    return false;
  };
  const run = (list) => {
    for (const b of list) {
      if (b.t === 'loop') { for (let r = 0; r < b.n; r++) if (run(b.body)) return true; }
      else if (b.t === 'F') { if (run(p.fn)) return true; }
      else if (b.t === 'if') { if (move(lv.cells[y][x] === 'y' ? b.a : b.b)) return true; }
      else if (move(b.t)) return true;
    }
    return false;
  };
  run(p.prog);
  return end === 'win';
}
// Fewest moves to collect every gem and reach the flag (breadth-first search over position and gems).
function shortest(lv) {
  const all = (1 << lv.gems.length) - 1;
  const start = [lv.start.x, lv.start.y, 0, ''];
  const seen = new Set([start.slice(0, 3).join()]);
  let frontier = [start];
  while (frontier.length) {
    const next = [];
    for (const [x, y, m, path] of frontier) {
      if (x === lv.goal.x && y === lv.goal.y && m === all) return path;
      for (const [d, [dx, dy]] of Object.entries(DIR)) {
        const nx = x + dx, ny = y + dy;
        if (blocked(lv, nx, ny)) continue;
        const g = lv.gems.indexOf(nx + ',' + ny), nm = g < 0 ? m : m | (1 << g);
        const k = [nx, ny, nm].join();
        if (!seen.has(k)) { seen.add(k); next.push([nx, ny, nm, path + d]); }
      }
    }
    frontier = next;
  }
  return null;
}

const solve = process.argv.includes('--solve');
let bad = 0, n = 0;
const fail = (where, msg) => { bad++; console.log(`✗ ${where}: ${msg}`); };
for (const set of ['robot', 'debug']) {
  for (const diff of ['easy', 'medium', 'hard']) {
    (C[set][diff] || []).forEach((l, i) => {
      n++;
      const where = `${set} ${diff} ${i + 1} (${l.name})`;
      if (l.map.some((r) => r.length !== l.map[0].length)) return fail(where, 'rows have different widths');
      const marks = l.map.join('').replace(/[.#~*y]/g, '');
      if (marks.length !== 2 || !marks.includes('R') || !marks.includes('F')) return fail(where, 'needs one R, one F and only . # ~ * y');
      const lv = parseMap(l.map), p = parseProg(l.sol), tools = l.tools || '';
      const path = shortest(lv);
      if (path === null) return fail(where, 'the flag cannot be reached');
      if (solve) console.log(`  ${where}: shortest ${path}`);
      if (!wins(lv, p)) return fail(where, `solution ${l.sol} does not win`);
      for (const [t, tool] of [['loop', 'loop'], ['if', 'if'], ['F', 'fn']]) {
        if ((uses(p.prog, t) || uses(p.fn, t)) && !tools.includes(tool)) return fail(where, `solution uses ${tool} but tools are "${tools}"`);
      }
      if (l.max && blocks(p) > l.max) return fail(where, `solution uses ${blocks(p)} blocks, max is ${l.max}`);
      const plain = !/[\d?F]/.test(l.sol);
      if (plain && path.length < l.sol.length) return fail(where, `a path of ${path.length} moves exists, solution has ${l.sol.length}`);
      if (l.max && path.length <= l.max) return fail(where, `max ${l.max} allows a path with arrows only (${path.length} moves)`);
      console.log(`✓ ${where}: ${l.sol} (${blocks(p)} blocks, shortest path ${path.length} moves)`);
    });
  }
}
console.log(`${n} levels, ${bad} problems`);
process.exit(bad ? 1 : 0);
