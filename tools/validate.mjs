#!/usr/bin/env node
/* Check a trails file against every rule in SCHEMA.md.
 *
 *   node tools/validate.mjs trails/earthhow.com.json
 *   node tools/validate.mjs            (checks every .json under trails/)
 *
 * THE FILENAME IS THE HOST CLAIM. `trails/<host>.json` may describe that host and nothing else,
 * and this checks the contents against the name. That is what makes a contribution mergeable
 * without a person reading it: the path bounds what the change can affect before anybody looks
 * inside, so review is a rule rather than an act of care. `index.json` is the generated
 * aggregate, for readers that predate the split; `example.json` is the documented example.
 * Neither is a host file, because neither `index` nor `example` is a host.
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

import { readFileSync, readdirSync } from 'node:fs';
import { refuse, hostOfFile, badChecked, MAX_LABEL, MAX_BYTES, MAX_PER_HOST } from './rules.mjs';

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

  /* A HOST FILE MAY ONLY DESCRIBE ITS OWN HOST, AND IT HAS TO SAY WHEN IT WAS CHECKED.
     The aggregate carries neither rule: it is a union of many hosts, and a union of lists
     crawled on different days cannot honestly carry one date. */
  /* THE SAME RULE AS ON AN ENTRY, ONE LEVEL UP. Entries have been held to an allowlist since the
     beginning, for the reason CONTRIBUTING gives: it is how a stray note about a child would be
     caught. The top level was never held to one, so the identical mistake made one line higher
     would have passed. */
  const TOP = ['what', 'rule', 'version', 'checked', 'trails'];
  for (const field of Object.keys(body)) {
    if (!TOP.includes(field)) say('carries a top-level "' + field + '" — only ' + TOP.join(', ') + ' belong here');
  }

  const claimed = hostOfFile(path);
  if (claimed) {
    const keys = body.trails && typeof body.trails === 'object' ? Object.keys(body.trails) : [];
    if (keys.length !== 1) {
      say('is named for ' + claimed + ', so it must hold exactly that one host, not ' + keys.length);
    } else if (keys[0] !== claimed) {
      say('is named for ' + claimed + ' but describes ' + keys[0]);
    }
    const why = badChecked(body.checked, new Date().toISOString().slice(0, 10));
    if (why) say('checked ' + why + ' — a host file records the day its list came off the site');
  } else if (body.checked !== undefined) {
    say('carries a checked date, but only a per-host file may: this one covers several hosts');
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
/* Every .json under trails/, so a host file added by hand cannot be missed by forgetting to
   name it here. Sorted, so CI output reads the same on every run. */
const targets = files.length
  ? files
  : readdirSync('trails')
      .filter(n => n.toLowerCase().endsWith('.json'))
      .sort()
      .map(n => 'trails/' + n);
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
