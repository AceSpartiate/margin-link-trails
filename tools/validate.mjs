#!/usr/bin/env node
/* Check a trails file against every rule in SCHEMA.md.
 *
 *   node tools/validate.mjs trails/index.json
 *   node tools/validate.mjs            (checks trails/index.json and trails/example.json)
 *
 * No dependencies. Exits non-zero if anything fails, so CI can use it.
 *
 * WHY THIS EXISTS. The contribution checklist in CONTRIBUTING.md is mechanical on purpose, and a
 * mechanical check should not be done by a person. A reviewer reading a hundred URLs will miss a
 * capability URL — I know, because the first filter written to catch them let seven through, and it
 * took writing them down as a list and attacking it to find that out.
 *
 * ON DRIFT, HONESTLY. These rules are also implemented in Margin, and two copies of one rule set is
 * usually how they come apart. Here it is safe by construction, because the checks are LAYERED
 * rather than shared: this file guards what enters the repository, and Margin re-checks every claim
 * again on the way in. If this file is looser, Margin still refuses. If it is stricter, nothing is
 * lost but a contribution that would have been refused later anyway. Drift degrades in the safe
 * direction, which is the only kind of duplication worth having.
 */

import { readFileSync } from 'node:fs';

/* ---------- the rules ---------- */

/* Hosts where a path is somebody's own space, or where the address is the password.
   Kept in step with NEVER_SHARE in Margin's config.js. */
const NEVER_HOSTS = [
  'google.com', 'googleusercontent.com', 'gle', 'goo.gl',
  'dropbox.com', 'box.com', 'onedrive.live.com', '1drv.ms', 'sharepoint.com',
  'icloud.com', 'wetransfer.com', 'mega.nz',
  'instructure.com', 'schoology.com', 'canvas.net', 'blackboard.com', 'moodlecloud.com',
  'seesaw.me', 'classdojo.com', 'padlet.com', 'wakelet.com', 'flip.com', 'flipgrid.com',
  'nearpod.com', 'peardeck.com', 'quizizz.com', 'blooket.com', 'kahoot.it', 'gimkit.com',
  'exploros.com',
  'bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'rebrand.ly'
];

/* An opaque id in the path: long, mixed letters and digits, and no separator. Real page slugs use
   hyphens (`humid-subtropical-climate`); ids do not. Narrow on purpose — a rule that also refused
   ordinary slugs would get switched off. */
const IDISH = /(^|\/)(?=[^/]{16,})(?=[^/]*[A-Za-z])(?=[^/]*\d)[A-Za-z0-9]+(\/|$)/;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const FILE = /\.(png|jpe?g|gif|svg|webp|ico|pdf|zip|docx?|pptx?|xlsx?|mp[34]|mov|avi|css|js)$/i;
const LOOPBACK = /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/i;

const MAX_LABEL = 120;
const MAX_BYTES = 4 * 1024 * 1024;
const MAX_PER_HOST = 400;

/* Returns the reason a url may not appear, or '' if it may. */
function refuse(raw) {
  let u = null;
  try { u = new URL(String(raw || '')); } catch (e) { return 'not a url'; }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return 'not http(s)';
  if (u.search) return 'has a query string, which is where tokens live';
  if (u.hash) return 'has a fragment';
  if (u.username || u.password) return 'carries credentials';
  if (LOOPBACK.test(u.hostname)) return 'is a loopback address';
  if (!u.hostname.includes('.')) return 'hostname has no dot, so it is a private network name';
  for (const bad of NEVER_HOSTS) {
    if (u.hostname === bad || u.hostname.endsWith('.' + bad)) return 'is on ' + bad;
  }
  if (UUID.test(u.pathname)) return 'has a uuid in the path';
  if (IDISH.test(u.pathname)) return 'has an opaque id in the path — the address may be the password';
  if (FILE.test(u.pathname)) return 'is a file, not a page';
  if (u.pathname !== '/' && u.pathname.endsWith('/')) return 'has a trailing slash';
  return '';
}

/* ---------- the check ---------- */

function validate(path) {
  const problems = [];
  const say = (what) => problems.push(what);

  let raw = '';
  try { raw = readFileSync(path, 'utf8'); }
  catch (e) { return { problems: ['cannot be read: ' + e.message], hosts: 0, pages: 0 }; }

  if (raw.length > MAX_BYTES) say('is larger than ' + Math.round(MAX_BYTES / 1024) + 'KB');

  let body = null;
  try { body = JSON.parse(raw); }
  catch (e) { return { problems: ['is not valid JSON: ' + e.message], hosts: 0, pages: 0 }; }

  for (const field of ['what', 'rule', 'version']) {
    if (typeof body[field] !== 'string' || !body[field].trim()) say('has no ' + field);
  }
  if (!body.trails || typeof body.trails !== 'object' || Array.isArray(body.trails)) {
    say('has no trails object');
    return { problems, hosts: 0, pages: 0 };
  }

  let hosts = 0, pages = 0;
  for (const [host, list] of Object.entries(body.trails)) {
    hosts++;
    const where = 'trails["' + host + '"]';

    /* The key must be a bare host, and one a url on it would be allowed to have. */
    if (/[/:?#]/.test(host)) { say(where + ': key is not a bare host'); continue; }
    const keyWhy = refuse('https://' + host + '/');
    if (keyWhy) { say(where + ': key ' + keyWhy); continue; }

    if (!Array.isArray(list)) { say(where + ': is not an array'); continue; }
    if (!list.length) say(where + ': is empty');
    if (list.length > MAX_PER_HOST) say(where + ': has ' + list.length + ' pages, over the ' + MAX_PER_HOST + ' cap');

    const seen = new Set();
    for (const entry of list) {
      pages++;
      if (!entry || typeof entry !== 'object') { say(where + ': an entry is not an object'); continue; }
      const href = entry.href;
      if (typeof href !== 'string') { say(where + ': an entry has no href'); continue; }

      const why = refuse(href);
      if (why) { say(href + ' ' + why); continue; }

      /* THE INVARIANT. Everything else is hygiene; this is the rule the design rests on. */
      let h = '';
      try { h = new URL(href).host; } catch (e) { h = ''; }
      if (h !== host) { say(href + ' is not on ' + host + ' — it is on ' + h); continue; }

      if (seen.has(href)) say(href + ' is listed twice');
      seen.add(href);

      if (entry.label !== undefined && typeof entry.label !== 'string') {
        say(href + ' has a label that is not a string');
      } else if (typeof entry.label === 'string' && entry.label.length > MAX_LABEL) {
        say(href + ' has a label of ' + entry.label.length + ' characters, over ' + MAX_LABEL);
      }

      const extra = Object.keys(entry).filter(k => k !== 'href' && k !== 'label');
      if (extra.length) say(href + ' carries ' + extra.join(', ') + ' — only href and label belong here');
    }
  }
  return { problems, hosts, pages };
}

/* ---------- run it ---------- */

const files = process.argv.slice(2);
const targets = files.length ? files : ['trails/index.json', 'trails/example.json'];
let bad = 0;

for (const path of targets) {
  const { problems, hosts, pages } = validate(path);
  if (problems.length) {
    bad++;
    console.log('FAIL ' + path);
    for (const p of problems) console.log('       ' + p);
  } else {
    console.log('ok   ' + path + ' — ' + hosts + ' site(s), ' + pages + ' page(s)');
  }
}

if (bad) {
  console.log('');
  console.log(bad + ' file(s) with problems. Every line above is a rule in SCHEMA.md; nothing here');
  console.log('needs a judgement about anyone\'s classroom.');
  process.exit(1);
}
