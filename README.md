# vilan-lang.org

The static site behind [vilan-lang.org](https://vilan-lang.org): GitHub
Pages publishes this repository's `main` as-is (`CNAME`, `.nojekyll`). Three
writers share the tree, each inside its own prefix and nowhere else — that
is what lets two bots push without coordinating, and what a change to any
workflow must preserve (`docs-port.md` §3.2 in the vilan repo).

## Who writes what

| path | writer | from |
|---|---|---|
| `docs/**` | [`.github/workflows/docs.yml`](.github/workflows/docs.yml) here, as `docs-builder` | `vilan-lang/vilan@main` (the released compiler's book), built with mdBook; `docs/sitemap.xml` is generated there from what built. Runs on dispatch (the vilan cut flow), a daily cron, a push that changes the workflow itself, and a push that changes `chrome/**`. |
| `index.html`, `client.js`, `client.css`, `.nojekyll` | [`vilan-lang/website`](https://github.com/vilan-lang/website)'s `deploy.yml`, as the **vilan-site-deploy** GitHub App (`vilan-site-deploy[bot]`) | every push to the website's `main`: the site builds, the server renders each page, the deploy captures it |
| `playground/**` | the same `deploy.yml` | the playground page and bundles, plus the compiler as wasm under an immutable `playground/v<tag>/` per release; `playground/manifest.json` lists every version directory present |
| `chrome/**` | the same `deploy.yml` | the site's masthead, exported for the book — the contract below |
| `assets/` | hand deploys (the owner) | the brand marks, fonts, icons; served under the brand-assets license, not this repo's |
| `CNAME`, `404.html`, `robots.txt`, `sitemap.xml`, `favicon.ico`, this README, `.gitignore` | hand-owned | `404.html` is also the `/vilan/*` → `/docs/*` forwarder older editor builds deep-link |

`deploy.yml` stages an explicit filename allowlist — never `git add -A` —
so it cannot touch `docs/` or `assets/`; `docs.yml` stages `docs/` and
nothing else. Neither bot sets the other's files, and the website's push
carries a rebase fallback for the day the two land together.

## The chrome contract (`chrome/`)

The book should wear the same masthead as the landing page and the
playground, and that masthead cannot be hand-copied: the website's classes
are content-hashed atomic classes emitted by its build. So the website's
deploy exports the bar it renders, and `docs.yml` folds it into the book
(`docs-port.md` §4 Q2, mechanism (i)).

**`chrome/header.html`** — the site's `top_bar` at full fade, rendered by the
website's own server-side render path (`src/chrome.vl` there) and nothing
else:

- exactly one root element, `<nav … style="--nav-fade:1">`; no `<html>`,
  `<head>`, or `<body>`, no doctype, no `<link>`;
- no `{{` or `}}` anywhere (it is pasted into an mdBook Handlebars partial
  verbatim; the deploy fails rather than publish one that has them);
- every `href` absolute from the site root — `/`, `/#install`,
  `/docs/tour/hello-vilan.html`, `/playground/`, `/docs/` — and every asset
  an absolute `https://vilan-lang.org/assets/…` URL, so the same bytes work
  from `/`, `/playground/`, and any depth of `/docs/`.

**`chrome/header.css`** — the chrome leg's own emitted stylesheet: exactly
the rules that leg reaches, under content-hashed class names (`.s…`), so it
cannot restyle anything it did not render. Colour never appears as a
literal; every colour is a role consumed as `var(--role)`:

- consumed by the bar: `--down-dim` (its ground, seen through the fade),
  `--stroke-hard` (its bottom hairline), `--up-normal` (a link at rest),
  `--up-bright` (a link under the pointer); `--nav-fade` is set inline on
  the `<nav>` (1) and read by the ground, hairline, and blur;
- also declared, because the site's theme module rides along: `--down-normal`,
  `--primary`, `--accent`, `--stroke-soft`, `--tint-callable`, `--up-dim`,
  `--up-caution`, `--up-error`;
- the site's spacing scale, `--space-0/3/4/6/24`, which the host is not
  expected to supply.

The stylesheet declares the site's dark defaults for all of those at
`:root` — specificity (0,1,0). A host that declares the same roles on
`html.light` / `html.navy` (0,1,1) re-themes the bar to itself, and so does
one that declares them at `.light` / `.navy` (0,1,0) later in the cascade:
mdBook's `{{> head}}` lands before its own `variables.css`, so a link from
`head.hbs` is always earlier. The fragment follows the BOOK's theme; it
never brings its own.

What the book does with it (the docs half of S4, in `vilan-lang/vilan`'s
`vilan/docs/theme/`): `head.hbs` links `/chrome/header.css`; `docs.yml`
copies `chrome/header.html` over `theme/header.hbs` before each build — only
when that `head.hbs` exists, so a toolchain whose theme predates the chrome
never renders the bar unstyled; and the docs stylesheet gives the bar its
row (mdBook pulls `.page` up under its sticky menu bar by
`--menu-bar-height`, and the bar itself is `position: sticky; top: 0` with a
64px row in a 1264px column). The bar sits at the top of `.page`, beside
the sidebar, not above it — `docs-port.md` §4 Q5.

A chrome change reaches the book on the deploy that published it:
`docs.yml` also runs on a push that changes `chrome/**`.

## Two sitemaps (N13)

There are two today: the root `sitemap.xml` is hand-kept and lists `/` and
`/playground/`; the book's `docs/sitemap.xml` is generated by `docs.yml`
from whatever mdBook actually built, and `robots.txt` points at both.
Neither carries `lastmod`, deliberately — the book rebuilds on a daily cron
whose "commit only if it changed" guard a build date would defeat, and the
root file follows the same rule so the pair reads alike. Whether a visually
merged site keeps two documents is filed as N13 in the vilan repo's backlog
and is not decided here.
