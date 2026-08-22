# Format

One JSON file. One object. Keys are **hosts**; values are the pages known on that host.

```json
{
  "what": "Margin link trails. For a public site, the pages known on it and the words on the link. No page text, no student work, no names, no curriculum.",
  "rule": "A map is only ever consulted for a host the teacher's own page linked, and every page in it is on that host. Margin enforces that when reading this, whatever the file says.",
  "version": "1.42.0",
  "trails": {
    "www.climatetypesforkids.com": [
      { "href": "https://www.climatetypesforkids.com/humid-subtropical-climate", "label": "Humid Subtropical" },
      { "href": "https://www.climatetypesforkids.com/tundra-climate", "label": "Tundra" }
    ]
  }
}
```

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
| `trails` | The map. Keys are hosts, values are arrays of `{ href, label }`. |

## A key — the host

A bare hostname, exactly as it appears in the URLs beneath it: `www.example.org`, not
`https://www.example.org/`. `www.` matters; a host is a host.

## An entry — one page known on that host

| field | |
| --- | --- |
| `href` | Absolute URL, on the same host as the key. |
| `label` | The link's own visible text, whitespace collapsed, at most 120 characters. May be empty. |

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
