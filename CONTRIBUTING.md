# Contributing a trail

Trails are checkable by opening them in a browser, and that is the point. A reviewer should never
have to take a contribution on trust.

## Before you open a pull request

Margin writes the file for you: **Options → Save the link trails**. It applies every rule in
[SCHEMA.md](SCHEMA.md) on the way out and tells you how many entries it left out.

Open the file and read it. It should contain only pages you would be happy to see linked from a
public repository with your name on the commit.

## The checklist a reviewer will use

Every one of these is mechanical. None of them requires knowing anything about your class.

- [ ] Every `href` is on the **same host** as the key it sits under.
- [ ] Every URL is `http` or `https`, with **no query string, no fragment, no credentials**.
- [ ] Every hostname has a dot in it, and is not `localhost` or a loopback address.
- [ ] No learning-platform URLs. Nothing that requires a login to see.
- [ ] No files — no `.pdf`, `.png`, `.docx`, and so on.
- [ ] Opening a sample of the URLs in a browser reaches a **public page** with content on it.
- [ ] The `label` is the link's own text. Not a description, not a note, not a comment.
- [ ] Nothing in the diff is text from a page, a student, a rubric, or a curriculum.

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

If you believe something in this repository identifies a student, a teacher, or a school, please
open an issue immediately, or email the maintainer rather than posting details. It will be treated
as urgent and removed first, discussed after.
