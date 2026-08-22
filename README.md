# Margin link trails

A shared map of **which pages a public teaching page links to**, so a reading-comprehension
tool does not have to work that out again on every teacher's machine.

That is all this is. It holds web addresses and the words on the link. It holds no page text,
no student work, no names, and nothing from any learning platform.

## Why it exists

A lesson links a website. The website's actual content is often one click further in.

A real example, which is why this repo exists. A scene linked
`https://www.climatetypesforkids.com/` — the site's front page. A student clicked through to
`/humid-subtropical-climate` and pasted a paragraph from it into their answer. Software checking
that answer against "the reading" found **nothing**, because the reading it had been given was
the front page. It then congratulated the student on original work.

Measured afterwards, on the same answer:

| compared against | overlap |
| --- | --- |
| the front page, which was linked | 0.00 |
| `/humid-subtropical-climate`, one click in | **1.00 — the whole answer, verbatim** |

The checker was never wrong. It had the wrong haystack.

Working out that the site has fourteen climate subpages costs one page fetch. Doing it once and
sharing the result is the entire idea.

## What a trail is

For one public page, the same-host pages it links, and the text of each link:

```json
{
  "https://www.climatetypesforkids.com": [
    { "href": "https://www.climatetypesforkids.com/humid-subtropical-climate", "label": "Humid Subtropical" },
    { "href": "https://www.climatetypesforkids.com/tundra", "label": "Tundra" }
  ]
}
```

The link text matters as much as the address: it is how a tool decides which subpage to fetch
first. A student who writes "Humid Subtropical" has named the page they used.

See [SCHEMA.md](SCHEMA.md) for the full format.

## The rule that makes this safe to share

**A trail may only ever add same-host subpages of a page the teacher already linked.**

Nothing here can introduce a new host. A trail for `example.org` can only ever contain
`example.org` pages, so the worst a wrong or malicious entry can do is point at a different page
of a site the teacher had already chosen to use. It can never send a tool somewhere new.

That rule is enforced **by the software reading this file, not by the file.** Margin re-checks
every entry against the host it is being used for and discards anything that does not match,
whatever this repository says. Any other consumer should do the same. Do not trust this file;
verify it, because verifying it is cheap.

## What is deliberately not here

- **No page text.** A URL is a fact. The page is somebody's writing, and it stays on their
  server — every tool fetches pages itself, from the original site.
- **No student work, and no names.** None of it ever leaves the machine it was written on.
- **No curriculum, and no rubrics.** A rubric describing what a correct answer to a licensed
  question needs is derived from that question. Not ours to publish.
- **No prompts.** Instructions that write comments on children's work should ship and be
  reviewed with the software that writes them, not fetched from a wire.
- **No URLs with a query string or a fragment**, which is where tokens and document ids live.
- **No learning-platform URLs**, no `localhost`, no hostname without a dot — an intranet name is
  somebody's private network.

## Using it

Margin reads this file and merges it with what it has worked out locally. Every rule above is
applied again on the way in. A trail it has never seen costs nothing to try and saves a page
fetch when it is right.

The file is a plain JSON object. Anything that can read JSON can use it.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md). Short version: URLs only, same host, no query
strings, public pages, and every entry has to be checkable by opening it in a browser.

## Licence

The trail data is released under [CC0 1.0](LICENSE) — public domain. These are facts about which
public pages link to which other public pages, and nobody should have to ask permission to know
that.
