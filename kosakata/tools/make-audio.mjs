// Records audio/<lang>-<slug>.mp3 for every word and phrase in the content block of index.html and writes
// audio/index.json for the service worker. Indonesian uses the macOS voice Damayanti, English uses Samantha.
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

const VOICES = { id: 'Damayanti', en: 'Samantha' };
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const C = JSON.parse(html.match(/<script type="application\/json" id="content">([\s\S]*?)<\/script>/)[1]);

// Same rule as slug() in index.html.
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const files = new Map(); // file name -> { lang, text, rate }
const add = (lang, text, rate) => { const f = lang + '-' + slug(text) + '.mp3'; if (!files.has(f)) files.set(f, { lang, text, rate }); };
C.cats.forEach((c) => c.words.forEach(([id, en]) => { add('id', id, 115); add('en', en, 120); }));
Object.values(C.phrases).flat().forEach((p) => add('id', p, 140));

const force = process.argv.includes('--force');
const outDir = join(root, 'audio');
const tmp = mkdtempSync(join(tmpdir(), 'kosakata-'));
const aiff = join(tmp, 'say.aiff');

let made = 0;
for (const [file, { lang, text, rate }] of files) {
  const out = join(outDir, file);
  if (!force && existsSync(out)) continue;
  execFileSync('say', ['-v', VOICES[lang], '-r', String(rate), '-o', aiff, text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08',
    '-ac', '1', '-ar', '22050', '-b:a', '48k', out]);
  made++;
}
rmSync(tmp, { recursive: true, force: true });

const stale = readdirSync(outDir).filter((f) => f.endsWith('.mp3') && !files.has(f));
writeFileSync(join(outDir, 'index.json'), JSON.stringify([...files.keys()].sort()) + '\n');
console.log(`${files.size} files, ${made} recorded.` + (stale.length ? ` Unused files: ${stale.join(', ')}` : ''));
