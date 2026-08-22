# Format

One JSON file. One object. Keys are page URLs; values are lists of links found on that page.

```json
{
  "what": "Margin link trails. For a public page, the same-host pages it links and the words on the link. No page text, no student work, no names, no curriculum.",
  "rule": "A trail may only add same-host subpages of a url the teacher already linked. Margin enforces that when reading this, whatever the file says.",
  "version": "1.40.0",
  "trails": {
    "https://www.climatetypesforkids.com": [
      { "href": "https://www.climatetypesforkids.com/humid-subtropical-climate", "label": "Humid Subtropical" },
      { "href": "https://www.climatetypesforkids.com/tundra", "label": "Tundra" }
    ]
  }
}
```

## Fields

| field | |
| --- | --- |
| `what` | A sentence saying what the file holds. Present so a file found on its own explains itself. |
| `rule` | The same-host invariant, restated in the file. Informational — the reader enforces it. |
| `version` | The Margin version that wrote the file. Not a schema version; the schema is this document. |
| `trails` | The map. Keys are page URLs, values are arrays of `{ href, label }`. |

## A key — the page a trail belongs to

- `http` or `https` only.
- No query string, no fragment, no credentials.
- No trailing slash. `https://example.org/page/` is written `https://example.org/page`, so one
  page cannot become two entries.
- A hostname with at least one dot. A name without one is a machine on a private network.
- Not a learning platform. Not `localhost` or a loopback address.
- Not a file — no `.pdf`, `.png`, `.zip`, `.docx`, and so on. Those are downloads, not pages.

## An entry — one link found on that page

| field | |
| --- | --- |
| `href` | Absolute URL. Every rule above applies to it as well. |
| `label` | The link's own visible text, whitespace collapsed, at most 120 characters. May be empty. |

**`href` must be on the same host as the key.** This is the invariant the whole design rests on.

`label` is not decoration. A consumer with a limited budget for fetching should fetch the pages
whose label appears in the text it is checking, first. That is what turns fourteen candidate
subpages into one obvious one.

## Merging

Merge by key. For a key present in both, union the entries by `href` and prefer the longer
`label` when they differ. Order within a list carries no meaning.

## What a reader must do

Re-check everything. Specifically:

1. Discard any entry whose `href` host differs from the key's host.
2. Discard any key or `href` that breaks any rule above.
3. Never follow a trail for a page the user has not themselves linked to.

Rule 3 is the one that matters most. A trail is a shortcut for *"I am already reading this page,
what else is on this site"* — never a suggestion about what to read.

## Size

Keep it to what a browser extension can hold. A trail is a few hundred bytes; a few thousand
pages is a few megabytes. If this file grows past roughly five megabytes it should be split by
host, and this document should say how.
