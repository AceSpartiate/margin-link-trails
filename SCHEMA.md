# Format

One JSON file per site: `trails/<host>.json`. Inside it, one object whose `trails` key holds
exactly that one host, and whose value is the pages known on it.

```json
{
  "what": "Margin link trails. For a public site, the pages known on it and the words on the link. No page text, no student work, no names, no curriculum.",
  "rule": "A map is only ever consulted for a host the teacher's own page linked, and every page in it is on that host. Margin enforces that when reading this, whatever the file says.",
  "version": "1.42.0",
  "checked": "2026-08-22",
  "trails": {
    "www.climatetypesforkids.com": [
      { "href": "https://www.climatetypesforkids.com/humid-subtropical-climate", "label": "Humid Subtropical" },
      { "href": "https://www.climatetypesforkids.com/tundra-climate", "label": "Tundra" }
    ]
  }
}
```

## One file per site, and the filename is the claim

`trails/www.climatetypesforkids.com.json` describes that host and nothing else. The name is not a
convenience; it is the security property, and it buys two things nothing else does.

**A contribution can be judged by its path.** A change touching one host file can only affect that
host — CI checks the contents against the filename — so "may this be merged" stops being a question
about a hundred URLs somebody has to read carefully and becomes a rule a machine applies. That
matters because reading URLs carefully is exactly what does not work: the first filter written to
catch capability URLs let seven through.

**A reader fetches only what it is already looking at.** A consumer wants the pages on one site it
has in front of it. Keyed per file, that is one small request; in one combined file it is the whole
index, growing with every site anybody ever adds, downloaded to answer a question about one of them.

There is no list of exceptions, which is the point: `index.json` and `example.json` are not host
files because `index` and `example` are not hosts — they have no dot. A file added later called
`sample.json` is not one either, and nobody has to remember to say so.

### `trails/index.json` is generated

Every host file, merged, for readers written before the split — including a copy of Margin on a
laptop that does not get updated often. Deleting it would break a working button to save a fetch
nobody has to make.

It is rebuilt by `node tools/build-index.mjs`, and CI fails if it has drifted, so a page added to it
by hand is caught rather than quietly accepted. **Add pages to the host file, never to the
aggregate.** It carries no `checked` date: its sites were crawled on different days, and one date
over all of them would be a claim about the oldest that is only true of the newest.

## Why the unit is a host and not a page

An earlier version of this format keyed on the page a link was found on, and a consumer looked one
level down from whatever the teacher had linked. Two things were wrong with that.

**One level is an arbitrary distance.** A page three clicks in is exactly as copyable as a page one
click in. What decides whether a page is worth reading is not how far away it is — it is whether a
student's answer names it.

**Per-page maps starve each other.** A consumer with a budget spends it on whichever page it looked
at first. A real run spent twelve page-fetches on one site's navigation — About, Careers, Home — and
never reached the site the copied paragraph actually came from.

Keyed by host, a map gets **more complete** every time anybody reads anything on that site, and the
name match does the choosing. That is also why it is worth sharing: the map for a site converges,
and nobody has to rediscover it.

## Fields

| field | |
| --- | --- |
| `what` | A sentence saying what the file holds, so a file found on its own explains itself. |
| `rule` | The same-host invariant, restated. Informational — the reader enforces it. |
| `version` | The Margin version that wrote the file. Not a schema version; the schema is this document. |
| `checked` | The day this host's list was last derived **from the site itself**, `YYYY-MM-DD`. Required on a host file, forbidden on the aggregate. See below. |
| `trails` | The map. Keys are hosts, values are arrays of `{ href, label }`. A host file has exactly one key, equal to its filename. |

## `checked` — and what may move it

A wall-clock day, because that is all the precision a crawl deserves and it carries no time zone to
argue about. It is refused if it is not a real date or if it is in the future.

**Only fetching the pages may move it.** Copying a file, reformatting it, or merging somebody else's
map into yours are none of them evidence that the site still looks like this — and a clock that any
of those could reset is a clock that never expires, because two consumers handing each other the
same stale list would keep it fresh for ever. Re-derive the list from the site, then set the date.

A consumer decides for itself how old is too old, and should treat a missing or stale date as "I do
not know", never as "this is wrong": the entries are still worth trying, and a page that has gone
costs one failed fetch to find out.

**Merging never removes.** A re-crawl that finds pages gone has no way to say so — the format unions
by `href` — and that is deliberate: a dead entry costs one failed request, while letting a
contribution delete entries would let a bad one remove the page that mattered. So "checked" honestly
means *re-derived, and anything new was added*, not *pruned*.

## A key — the host

A bare hostname, exactly as it appears in the URLs beneath it: `www.example.org`, not
`https://www.example.org/`. `www.` matters; a host is a host.

## An entry — one page known on that host

| field | |
| --- | --- |
| `href` | Absolute URL, on the same host as the key. |
| `label` | The link's own visible text, whitespace collapsed, at most 120 characters. May be empty. |
| `words` | Optional. How many words the page held when somebody last read it — a whole number, 0 to 1,000,000. Absent means nobody has. |

### Why `words` is worth carrying, and why it is a number

A consumer fetches the pages whose label matches what it is checking, and then throws away anything
too short to be a source — navigation, a gallery, a stub. The discard is right; spending the fetch
to reach it is what is wasteful, and it is wasted again on every machine that reads that site.

**Absent is not zero.** A page nobody has read is fetched exactly as before. Only a recorded count
below a consumer's own floor lets it be skipped, and the floor is the consumer's to choose.

**It is an integer because the entry allowlist is a safety property.** Only `href`, `label` and
`words` may appear, and that is what stops a stray note about a student travelling inside an entry.
A bounded number cannot be a note; a third free-text field would have given that away. If a future
field is wanted, the same test applies — can it carry prose? If yes, it does not belong here.

Every `href` must satisfy all of:

- `http` or `https` only.
- No query string, no fragment, no credentials.
- No trailing slash, so one page cannot become two entries.
- A hostname with at least one dot, and **the same host as the key**.
- Not a file — no `.pdf`, `.png`, `.zip`, `.docx`.
- Not a capability URL. See below; this one is the important one.

## Capability URLs, which must never appear

A capability URL is one that anybody holding it can open — the address *is* the access control.
Publishing a list of them is not publishing addresses, it is handing out keys.

These all look like perfectly ordinary `https` URLs with no query string, and every one of them got
through the first version of the filter that was supposed to catch them:

```
docs.google.com/document/d/1A2b3C.../pub
drive.google.com/file/d/1A2b3C.../view
dropbox.com/s/abc123xyz/handout
forms.gle/aBcDeFgHiJkL
sites.google.com/somedistrict.net/someteacher
padlet.com/someteacher/abc123
somedistrict.instructure.com/courses/1234
```

Two rules, because neither is enough alone. A **host list** catches the services people actually
paste from. A **shape rule** catches an opaque id on a host nobody thought of: long, mixed letters
and digits, and no separator — real page slugs use hyphens (`humid-subtropical-climate`) and ids do
not. A shape rule alone misses `dropbox.com/s/abc123xyz`, where the id is short. A host list alone
misses every service not yet invented.

Also excluded: any learning platform, `localhost`, loopback addresses, and any hostname without a
dot, which is a machine on somebody's private network.

## `label` is not decoration

It is what decides whether a page gets read at all. A consumer should fetch the pages whose label
appears in the text it is checking — a student who copied the Humid Subtropical page has written
"Humid Subtropical" whether they meant to or not — and fetch **nothing** when no label matches.
That is the difference between one page-fetch and twelve.

Labels that are a site's own furniture — Home, About, Careers, Privacy, Search — carry no meaning
and should be skipped. Match the **whole** label, never inside it: `About` goes, `About the Dust
Bowl` stays.

## Merging

Merge by host. Union the entries by `href`, and prefer the longer `label` when they differ. Order
within a list carries no meaning.

## What a reader must do

Re-check everything:

1. Discard any entry whose host differs from its key.
2. Discard any `href` that breaks any rule above, including the capability rules.
3. **Never consult a map for a host the user has not themselves linked to.**

Rule 3 is the one that matters most. A map answers *"I am already reading this site, what else is on
it"* — never *"here is a site you should read."*

## Size

A page entry is a couple of hundred bytes. Bound each host — four hundred pages is plenty — so one
enormous site cannot crowd out everything else. If the whole file passes roughly five megabytes it
should be split by host, and this document should say how.
