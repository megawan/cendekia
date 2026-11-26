// Records the sounds of the second stage (tanwin, long vowels, sukun, tasydid) with the macOS Arabic voice (Majed):
// audio/NN-<kind>-<a|i|u>.mp3, the prayers: audio/doa-<id>.mp3, and the words of Mufradat: audio/mufradat-<art>.mp3.
// The text comes from ../more.js, ../prayers.js and ../mufradat.js, the same files the page uses.
//
//   node tools/make-audio.mjs            records only the missing files
//   node tools/make-audio.mjs --force    records every file again
//
// Needs macOS `say` and `ffmpeg`. The recordings of the letters and the three short vowels were made the same way.
// A machine voice is not a teacher: replace any file with your own recording of the same name to improve it.
import { createRequire } from 'node:module';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const M = createRequire(import.meta.url)(join(root, 'more.js'));
const P = createRequire(import.meta.url)(join(root, 'prayers.js'));
const W = createRequire(import.meta.url)(join(root, 'mufradat.js'));
const force = process.argv.includes('--force');
const tmp = mkdtempSync(join(tmpdir(), 'iqra-'));
let made = 0, kept = 0;
function record(item) {
  const out = join(root, 'audio', item.file);
  if (!force && existsSync(out)) { kept++; return; }
  const aiff = join(tmp, 'x.aiff');
  execFileSync('say', ['-v', 'Majed', '-o', aiff, item.say]);
  // Cut the silence at both ends, then the same encoding as the other recordings.
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08',
    '-ac', '1', '-ar', '22050', '-b:a', '48k', out]);
  made++;
}
for (const kind of M.KINDS) {
  for (let i = 0; i < M.LETTER_COUNT; i++) {
    if (kind.skipAlif && i === 0) continue;
    for (let v = 0; v < 3; v++) record(M.form(kind.key, i, v));
  }
}
P.LIST.forEach(record);
W.LIST.forEach(record);
rmSync(tmp, { recursive: true, force: true });
console.log(`recorded ${made}, kept ${kept}`);
