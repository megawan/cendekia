// Backup and restore of every child's progress, for the parent page. Needs shared/profile.js.
//
//   CendekiaBackup.build()              the backup, as a plain object ready for JSON.stringify
//   CendekiaBackup.parse(text)          checks a backup file and returns { children, data }; throws an Error with a message for the parent
//   CendekiaBackup.summary(backup)      [{ name, avatar, rounds }] for the preview before restoring
//   CendekiaBackup.restore(backup, mode)  'merge' (default) or 'replace'; the page must reload afterwards
//
// Only keys that belong to a child in the file are restored (Cendekia.isDataKey), so a file cannot touch the
// language, accessibility or any other setting of the device.
(function () {
  'use strict';
  var C = window.Cendekia;
  var t = C.t;
  var PROFILES = 'cendekia.profiles.v1';
  var FORMAT = 'cendekia-backup';
  var VERSION = 1;
  var LOG_PREFIX = 'cendekia.log.v1.';
  var LOG_MAX = 600; // the same cap as shared/profile.js
  var ID = /^[A-Za-z0-9_-]{1,40}$/;

  function fail(en, id) { return new Error(t(en, id)); }
  function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function has(o, k) { return Object.prototype.hasOwnProperty.call(o, k); }
  function isObject(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }
  function isNumber(v) { return typeof v === 'number'; }

  function build() {
    var kids = C.profiles(), data = {};
    kids.forEach(function (p) {
      C.dataKeys(p.id).forEach(function (k) { var v = read(k); if (v !== null) data[k] = v; });
    });
    return {
      app: FORMAT,
      version: VERSION,
      exportedAt: new Date().toISOString(),
      children: kids.map(function (p) { return { id: p.id, name: p.name, avatar: p.avatar, limit: p.limit || 0 }; }),
      data: data
    };
  }

  function parse(text) {
    var file;
    try { file = JSON.parse(text); } catch (e) { file = null; }
    var notBackup = fail('This is not a Cendekia backup file.', 'Ini bukan file cadangan Cendekia.');
    if (!isObject(file) || file.app !== FORMAT || !isNumber(file.version) || !Array.isArray(file.children) || !isObject(file.data)) throw notBackup;
    if (file.version > VERSION) throw fail('This backup comes from a newer version of Cendekia. Update the app and try again.', 'Cadangan ini dari versi Cendekia yang lebih baru. Perbarui aplikasinya lalu coba lagi.');
    var seen = {}, children = [];
    file.children.forEach(function (p) {
      if (!isObject(p) || typeof p.id !== 'string' || !ID.test(p.id) || has(seen, p.id)) return;
      seen[p.id] = true;
      children.push({
        id: p.id,
        name: typeof p.name === 'string' && p.name.trim() ? p.name.trim().slice(0, 16) : 'Child',
        avatar: typeof p.avatar === 'string' && p.avatar ? p.avatar.slice(0, 8) : C.AVATARS[0],
        limit: Math.min(Math.max(Number(p.limit) || 0, 0), 600)
      });
    });
    if (!children.length) throw notBackup;
    var data = {};
    Object.keys(file.data).forEach(function (k) {
      if (file.data[k] !== null && children.some(function (p) { return C.isDataKey(k, p.id); })) data[k] = file.data[k];
    });
    return { children: children, data: data };
  }

  function summary(backup) {
    return backup.children.map(function (p) {
      var log = backup.data[LOG_PREFIX + p.id];
      return { name: p.name, avatar: p.avatar, rounds: Array.isArray(log) ? log.length : 0 };
    });
  }

  // Keeps the better of two saves of the same child: the highest number, the union of lists, and what the
  // device already has for anything else. Stars per level are lists of numbers, so those go level by level.
  function merge(a, b) {
    if (isNumber(a) && isNumber(b)) return Math.max(a, b);
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.every(isNumber) && b.every(isNumber)) {
        var n = Math.max(a.length, b.length), best = [];
        for (var i = 0; i < n; i++) best.push(Math.max(a[i] || 0, b[i] || 0));
        return best;
      }
      var seen = {}, all = [];
      a.concat(b).forEach(function (x) { var s = JSON.stringify(x); if (!has(seen, s)) { seen[s] = true; all.push(x); } });
      return all;
    }
    if (isObject(a) && isObject(b)) {
      var out = {};
      Object.keys(a).concat(Object.keys(b)).forEach(function (k) {
        if (k === '__proto__' || has(out, k)) return;
        out[k] = has(a, k) && has(b, k) ? merge(a[k], b[k]) : has(a, k) ? a[k] : b[k];
      });
      // Days in a row belong to the day they were counted on, so the newer pair wins together.
      if (typeof a.day === 'string' && typeof b.day === 'string') {
        var newer = b.day > a.day ? b : a;
        out.day = newer.day;
        if (has(newer, 'streak')) out.streak = newer.streak;
      }
      return out;
    }
    return a;
  }

  function mergeKey(k, local, incoming) {
    var v = merge(local, incoming);
    if (k.indexOf(LOG_PREFIX) === 0 && Array.isArray(v)) {
      v.sort(function (x, y) { return (x.t || 0) - (y.t || 0); });
      if (v.length > LOG_MAX) v = v.slice(v.length - LOG_MAX);
    }
    return v;
  }

  function restore(backup, mode) {
    var replace = mode === 'replace';
    var local = C.profiles(), cur = C.profile().id;
    var writes = {}, list;

    if (replace) {
      list = backup.children;
      Object.keys(backup.data).forEach(function (k) { writes[k] = backup.data[k]; });
    } else {
      var inBackup = {};
      backup.children.forEach(function (p) { inBackup[p.id] = true; });
      // A device that has only the blank child it made on its first visit does not keep it beside the restored ones.
      var blankOnly = local.length === 1 && !inBackup[local[0].id] && !C.dataKeys(local[0].id).length;
      list = blankOnly ? [] : local.slice();
      backup.children.forEach(function (p) {
        if (!list.some(function (x) { return x.id === p.id; })) list.push(p);
      });
      Object.keys(backup.data).forEach(function (k) {
        var mine = read(k);
        writes[k] = mine === null ? backup.data[k] : mergeKey(k, mine, backup.data[k]);
      });
    }

    var profiles = { list: list, cur: list.some(function (p) { return p.id === cur; }) ? cur : list[0].id };
    try {
      if (replace) local.forEach(function (p) { C.dataKeys(p.id).forEach(function (k) { localStorage.removeItem(k); }); });
      Object.keys(writes).forEach(function (k) { localStorage.setItem(k, JSON.stringify(writes[k])); });
      localStorage.setItem(PROFILES, JSON.stringify(profiles));
    } catch (e) {
      throw fail('Could not save to this device. Free some space and try again.', 'Tidak bisa menyimpan di perangkat ini. Kosongkan ruang lalu coba lagi.');
    }
  }

  window.CendekiaBackup = { build: build, parse: parse, summary: summary, restore: restore };
})();
