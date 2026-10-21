// Records audio/<slug>.mp3 for every phrase in the content block of index.html, using the
// macOS Indonesian voice (Damayanti), and writes audio/index.json for the service worker.
//
//   node tools/make-audio.mjs            records only the missing files
//   node tools/make-audio.mjs --force    records every file again
//
// Needs macOS `say` and `ffmpeg`. Replace any file with your own recording of the same name.
//
// The voice reads some written syllables with the wrong vowel: "be", "me", "he", "ze" and "we" all come out as "bi",
// "mi" ... (the e of the syllable has the formants of an i), and "nye" starts with an a. They were found by measuring the
// vowel of every Ce syllable. Two fixes are used so every Ce syllable has the same mid e, as in "ba bi bu be bo":
//   SAY_AS  another spelling that the voice reads as a clean e ("bé")
//   SPLICE  no spelling works (m and h), so the consonant is cut from "ma" / "ha" and joined to the vowel of "te".
//           The cut points are in milliseconds, found from the loudness and zero-crossing profile of those recordings
//           (m is a hum of about 70 ms before the vowel starts, h a breath of about 85 ms).
const SAY_AS = { be: 'bé', de: 'dé', we: 'wé', ze: 'ze-', nye: 'nyé' };
const SPLICE = { me: { cons: 'ma', consMs: [5, 70] }, he: { cons: 'ha', consMs: [0, 90] } };
const VOWEL = { from: 'te', ms: [55, 250] }; // the steady e of "te", after the t has been released
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const json = html.match(/<script type="application\/json" id="content">([\s\S]*?)<\/script>/)[1];
const C = JSON.parse(json);

// Same rule as slug() in index.html.
const slug = (t) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const phrases = new Set();
C.letters.forEach((l) => { phrases.add(l.say); phrases.add(l.word); });
C.vowels.forEach((v) => phrases.add(v));
C.consonants.forEach((c) => C.vowels.forEach((v) => phrases.add(c + v)));
C.words.forEach((w) => { phrases.add(w.text); w.syl.forEach((s) => phrases.add(s)); });
C.sentences.forEach((s) => { phrases.add(s.text); s.text.split(' ').forEach((w) => phrases.add(w)); });
// Advanced content: letter pairs, longer words and sentences, and the stories with their questions.
const bare = (w) => w.replace(/[.,!?]/g, '');
C.digraphs.forEach((d) => C.vowels.forEach((v) => phrases.add(d + v)));
C.words2.forEach((w) => { phrases.add(w.text); w.syl.forEach((s) => phrases.add(s)); });
C.sentences2.forEach((s) => { phrases.add(s.text); s.text.split(' ').forEach((w) => phrases.add(w)); });
C.sentences3.forEach((s) => { phrases.add(s.text); s.text.split(' ').forEach((w) => phrases.add(w)); });
C.stories.forEach((st) => {
  st.pages.forEach((pg) => { phrases.add(pg.text); pg.text.split(' ').forEach((w) => phrases.add(bare(w))); });
  st.questions.forEach((q) => { phrases.add(q.q); q.opts.forEach((o) => phrases.add(o)); });
});
Object.entries(C.phrases).filter(([k]) => k !== 'retry').flatMap(([, v]) => v).forEach((p) => phrases.add(p));

const force = process.argv.includes('--force');
const outDir = join(root, 'audio');
const tmp = mkdtempSync(join(tmpdir(), 'baca-'));
const files = new Map();
for (const p of phrases) files.set(slug(p) + '.mp3', p);

let made = 0;
for (const [file, text] of files) {
  const out = join(outDir, file);
  if (!force && existsSync(out)) continue;
  const aiff = join(tmp, 'say.aiff');
  // Letters and syllables are read slowest, single words a bit faster, phrases at a calm pace.
  const rate = text.length <= 3 ? '90' : !text.includes(' ') ? '115' : '140';
  if (SPLICE[text]) continue; // made below, once the recordings it is cut from exist
  execFileSync('say', ['-v', 'Damayanti', '-r', rate, '-o', aiff, SAY_AS[text] || text]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', aiff,
    '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.08',
    '-ac', '1', '-ar', '22050', '-b:a', '48k', out]);
  made++;
}

// ---- Spliced syllables ----
const SR = 22050;
function pcm(name) {
  const b = execFileSync('ffmpeg', ['-loglevel', 'error', '-i', join(outDir, name + '.mp3'), '-ac', '1', '-ar', String(SR), '-f', 's16le', '-'], { maxBuffer: 1 << 26 });
  return Float32Array.from(new Int16Array(b.buffer, b.byteOffset, b.length / 2));
}
const cut = (x, [a, b]) => x.slice(Math.round(a * SR / 1000), Math.round(b * SR / 1000));
function splice(name, { cons, consMs }) {
  const out = join(outDir, name + '.mp3');
  if (!force && existsSync(out)) return false;
  const c = cut(pcm(cons), consMs), v = cut(pcm(VOWEL.from), VOWEL.ms);
  const fadeIn = Math.round(0.006 * SR), xf = Math.round(0.015 * SR), fadeOut = Math.round(0.04 * SR);
  for (let i = 0; i < fadeIn; i++) c[i] *= i / fadeIn;
  // The consonant fades out while the vowel fades in over 15 ms.
  for (let i = 0; i < xf; i++) { c[c.length - xf + i] *= 1 - i / xf; v[i] *= i / xf; }
  const y = new Float32Array(c.length + v.length - xf);
  y.set(c); v.forEach((s, i) => { y[c.length - xf + i] += s; });
  for (let i = 0; i < fadeOut; i++) y[y.length - 1 - i] *= i / fadeOut;
  const peak = y.reduce((m, s) => Math.max(m, Math.abs(s)), 1), gain = 0.85 * 32767 / peak;
  const buf = Buffer.from(Int16Array.from(y, (s) => Math.round(s * gain)).buffer);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 's16le', '-ar', String(SR), '-ac', '1', '-i', '-',
    '-af', 'apad=pad_dur=0.08', '-b:a', '48k', out], { input: buf });
  return true;
}
for (const [name, job] of Object.entries(SPLICE)) if (files.has(name + '.mp3') && splice(name, job)) made++;
rmSync(tmp, { recursive: true, force: true });

const stale = readdirSync(outDir).filter((f) => f.endsWith('.mp3') && !files.has(f));
writeFileSync(join(outDir, 'index.json'), JSON.stringify([...files.keys()].sort(), null, 0) + '\n');
console.log(`${files.size} phrases, ${made} recorded.` + (stale.length ? ` Unused files: ${stale.join(', ')}` : ''));
