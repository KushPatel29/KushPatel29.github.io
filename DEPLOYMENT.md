# Portfolio release runbook

The portfolio is a static GitHub Pages site. Production is the `main` branch;
the build has no database, migrations, secrets, feature flags, or runtime API.

## Before merge

- Run `pnpm test:contracts`.
- Run `pnpm test:e2e` at desktop and mobile widths.
- Run `pnpm test:lighthouse` and keep every configured budget green.
- Review the generated visual snapshots when intentional layout changes occur.
- Confirm every new claim is labelled as paid experience, deterministic
  portfolio evidence, synthetic data, or a modelled outcome.
- Confirm the resume PDF and visible portfolio remain consistent.
- Require the `links`, `quality`, and `demos` workflow jobs before merging.

## Release

1. Merge the reviewed commit to `main`.
2. Wait for GitHub Pages to publish the exact commit SHA.
3. Open the homepage in a clean mobile and desktop browser session.
4. Verify the hero, three flagship links, project filtering, theme toggle,
   dashboard lightbox, resume download, contact link, and 404 page.
5. Record the deployed SHA in the GitHub release notes.

## Rollback

Create a normal revert commit for the faulty release and push that commit to
`main`. Do not rewrite branch history. GitHub Pages will deploy the reverted
state, preserving a reviewable record of both the release and rollback.

Rollback immediately when any of these conditions is true:

- The homepage or resume returns a non-success response after deployment.
- A flagship CTA opens the wrong destination or a not-found page.
- A serious or critical accessibility violation is introduced.
- A published metric, employment date, or evidence boundary becomes false.
- Mobile navigation, project filtering, or resume download stops working.
- LCP exceeds 2.5 seconds or CLS exceeds 0.1 in two consecutive CI runs.

External demo downtime does not require rolling back an otherwise healthy
portfolio. Keep the screenshot and source-code fallback available, investigate
the host, and update or remove the live link if the outage is permanent.
