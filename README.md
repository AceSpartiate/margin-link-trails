# Margin link trails

A shared map of **which pages a public teaching site has on it**, so a reading-comprehension
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

Working out that the site has thirteen climate subpages costs one page fetch. Doing it once and
sharing the result is the entire idea.

## What a map is

For one public **site**, the pages known on it and the text of each link:

```json
{
  "www.climatetypesforkids.com": [
    { "href": "https://www.climatetypesforkids.com/humid-subtropical-climate", "label": "Humid Subtropical" },
    { "href": "https://www.climatetypesforkids.com/tundra-climate", "label": "Tundra" }
  ]
}
```

Keyed by site rather than by page, so it gets **more complete** every time anybody reads anything
on that site, and a page three clicks in is as findable as one click in.

The link text matters as much as the address — it is what decides whether a page gets read at all.
A student who copied the Humid Subtropical page has written "Humid Subtropical" whether they meant
to or not. A tool should fetch the pages whose label appears in the text it is checking, and fetch
**nothing** when no label matches. In a real measurement that was the difference between **one**
page-fetch and twelve, only one of which was the page that mattered.

See [SCHEMA.md](SCHEMA.md) for the full format, including the capability-URL rules.

## The rule that makes this safe to share

**A map is only ever consulted for a host the teacher's own page linked, and every page in it is
on that host.**

Nothing here can introduce a new site. A map for `example.org` can only ever contain `example.org`
pages, so the worst a wrong or malicious entry can do is point at a different page of a site the
teacher had already chosen to use. It can never send a tool somewhere new.

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
- **No capability URLs** — a Google Doc id, a Drive link, a Dropbox share, a `forms.gle` link, a
  Canvas course. The address *is* the access control on those, so a list of them is a set of keys
  rather than a set of addresses. Every one of those passed the first version of the filter written
  to catch them; see [SCHEMA.md](SCHEMA.md).
- **No learning-platform URLs**, no `localhost`, no hostname without a dot — an intranet name is
  somebody's private network.

## Using it

In Margin: **Options → Get the shared maps**. It reads this file, re-checks every claim in it, and
merges what survives with what it already knows. It reports how many entries it refused, which is
the number worth looking at.

Nothing is fetched unless you press it. There is no automatic update, no polling, and no cookies
travel with the request. Margin also writes this format — **Save the link trails** — so a map you
build locally can come back here.

If you are writing another consumer, the contract is in [SCHEMA.md](SCHEMA.md), and three rules
matter more than the rest:

1. Drop any entry whose host differs from its key.
2. Re-apply every URL rule, including the capability-URL rules. Do not assume the file is clean.
3. **Never consult a map for a site the user has not themselves linked to.** A map answers *"I am
   already reading this site, what else is on it"* — never *"here is a site you should read."*

The file is a plain JSON object. Anything that can read JSON can use it.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md). Short version: URLs only, same host, no query
strings, no capability URLs, public pages, and every entry has to be checkable by opening it in a
browser.

## Licence

The trail data is released under [CC0 1.0](LICENSE) — public domain. These are facts about which
public pages link to which other public pages, and nobody should have to ask permission to know
that.
