# Contributing a trail

Trails are checkable by opening them in a browser, and that is the point. A reviewer should never
have to take a contribution on trust.

## Before you open a pull request

Margin writes the file for you: **Options → Save the link trails**. It applies every rule in
[SCHEMA.md](SCHEMA.md) on the way out and tells you how many entries it left out.

## One file per site

Your contribution goes in `trails/<host>.json` — `trails/earthhow.com.json` for pages on
earthhow.com. Create it if it is not there; merge into it if it is. **A pull request should touch
one host file**, because that is what lets it be judged by its path before anybody reads it.

`trails/index.json` is generated from those files. Never edit it — CI rebuilds it and fails if it
has drifted. If you have a map covering several sites, split it: one file each.

Set `checked` to the day you actually fetched the pages. Not the day you edited the file — a
reformat is not a re-crawl, and a date that anything can move is a date that never expires.

Then run the checker:

```
node tools/validate.mjs
```

No dependencies, so there is nothing to install. It checks every file under `trails/`, prints one
line per problem naming the rule broken, and exits non-zero if anything failed. The same command
runs on every pull request, alongside `node tools/build-index.mjs --check`.

Open the file and read it too. The checker enforces rules; only you can tell whether these are pages
you would be happy to see linked from a public repository with your name on the commit.

## What the checker enforces, so nobody has to read for it

`tools/validate.mjs` refuses all of this, and names the rule when it does:

- An `href` on a different host from the key it sits under. **This is the one that matters** — it is
  the rule the whole design rests on.
- A query string, a fragment, or credentials in a URL.
- A **capability URL**, where the address is the access control: a Google Doc id, a Drive link, a
  Dropbox share, a `forms.gle` link, a Canvas course. Caught two ways — a host list, and a
  path-shape rule for the services nobody has listed yet.
- A hostname without a dot, `localhost`, or a loopback address.
- A file rather than a page. A trailing slash. A URL listed twice.
- A `label` that is not a string, or longer than 120 characters.
- **Any field other than `href`, `label` and `words`** on an entry — and `words` has to be a whole
  number between 0 and 1,000,000, because the reason this list is short is that a number cannot
  carry a note about a child. Any field other than `what`, `rule`,
  `version`, `checked` and `trails` at the top — which is how a stray note about a student would be
  caught if one ever reached a file, at either level.
- A file named for a host that describes a **different** host, or more than one. The filename is the
  claim, and this is what checks it.
- A `checked` date that is missing, malformed, or in the future.

## The two things a person still has to do

The checker cannot judge these, so a reviewer does:

- [ ] Opening a sample of the URLs reaches a **public page with teaching content on it** — not a
      sign-up flow, a checkout, or an ad landing page.
- [ ] The contribution is a plausible set of pages a lesson might send a student to, rather than a
      whole domain crawled exhaustively. Nobody can review a thousand-entry dump, and it is no more
      useful than a small one.

## What will be turned down

- **Anything behind a login.** If a reviewer cannot open it, it cannot be verified, so it cannot
  be merged.
- **Pages that are not teaching content** — sign-up flows, checkout pages, ad landing pages.
- **A whole site crawled exhaustively.** A trail is the pages a lesson might plausibly send a
  student to. A thousand-entry dump of every URL on a domain is not more useful, and nobody can
  review it.
- **Anything with a query string**, even a harmless-looking one. There is no way for a reviewer to
  tell a tracking parameter from a session token by looking, so the rule is absolute.
- **Text of any kind that is not a link label.**

## Why the rules are shaped like rules

A trail is used by software that writes comments on children's work. That software must be able to
treat this repository as **untrusted input** and still be safe — which is why the same-host rule is
enforced by the reader and re-checked on every entry.

Rules a reviewer can apply mechanically are the only ones that survive a repository getting
popular. Anything needing judgement about a stranger's classroom does not belong in the checklist.

## Removing something

Open an issue, or a pull request deleting it. No justification needed beyond *"this should not be
public"* — nothing here is valuable enough to argue about. If you own a site and would rather it
were not listed, say so and it will be removed.

## Privacy

If you believe something in this repository identifies a student, a teacher, or a school, **open an
issue saying so and leave the details out of it** — say which file and roughly where, not what it
reveals. It will be removed first and discussed after.

Please do not post the identifying detail in a public issue in order to report it. Saying "there is
a URL under `example.org` that contains a name" is enough to act on.
