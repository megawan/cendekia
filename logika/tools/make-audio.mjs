// Records audio/<slug>.mp3 for every phrase and word in the content block of index.html, using the
// macOS Indonesian voice (Damayanti), and writes audio/index.json for the service worker.
//
//   node tools/make-audio.mjs            records only the missing files
//   node tools/make-audio.mjs --force    records every file again
//
// Needs macOS `say` and `ffmpeg`. Replace any file with your own recording of the same name.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const C = JSON.parse(html.match(/<script type="application\/json" id="content">([\s\S]*?)<\/script>/)[1]);

// Same rule as slug() in index.html.
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const phrases = new Set([...Object.values(C.phrases), ...C.words]);
const force = process.argv.includes('--force');
const outDir = join(root, 'audio');
const tmp = mkdtempSync(join(tmpdir(), 'logika-'));
const files = new Map();
for (const p of phrases) files.set(slug(p) + '.mp3', p);

let made = 0;
for (const [file, text] of files) {
  const out = join(outDir, file);
  if (!force && existsSync(out)) continue;
  const aiff = join(tmp, 'say.aiff');
  // Single words are read a little slower than sentences.
  execFileSync('say', ['-v', 'Damayanti', '-r', text.includes(' ') ? '150' : '125', '-o', aiff, text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08',
    '-ac', '1', '-ar', '22050', '-b:a', '48k', out]);
  made++;
}
rmSync(tmp, { recursive: true, force: true });

const stale = readdirSync(outDir).filter((f) => f.endsWith('.mp3') && !files.has(f));
writeFileSync(join(outDir, 'index.json'), JSON.stringify([...files.keys()].sort(), null, 0) + '\n');
console.log(`${files.size} phrases, ${made} recorded.` + (stale.length ? ` Unused files: ${stale.join(', ')}` : ''));
