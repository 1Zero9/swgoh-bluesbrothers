# Project instructions

- `docs/knowledge-base.md` is the living reference for this project's
  architecture, services, mechanics, env vars, and operational lessons.
  Whenever a change touches infrastructure, a new integration, a new env
  var, or a notable mechanic/gotcha, update the relevant section of that
  file **in the same change** and bump its doc version + changelog entry
  (see the versioning note at the top of the file).
- **Release flow (from 18 Oct 2026, site live): `main` is production and is frozen.**
  Work on branches off `develop`, open PRs **into `develop`**, merge them there
  when checks are green, and check the result on the `develop` preview
  deployment (Vercel gives the `develop` branch its own preview URL). **Never
  merge or push to `main` without Steve saying to release.** When he does,
  open a PR `develop` → `main`, merge when green, and confirm the Production
  deploy. A genuine security fix is *prepared* on `develop` and offered to
  Steve for release; it still waits for his go-ahead.
- Steve's changes win. Where there is a creative difference (with him or
  with earlier chats), make the change he asks for. Flag a genuine
  mistake in one line, but still do it.
- Commit and push to the working branch after every change. Production is only
  touched at a release Steve asks for.
- Act as Steve's lead designer, UI/UX expert and GitHub/release engineer.
  He gives ideas in plain words; turn each one into the finished thing
  (design decision, code, PR, merge, live check) and assume everything
  he mentions needs doing. Own the design: keep one consistent visual
  system (the Home glass panels, `--hub-*` tokens), check your own work
  in a screenshot before shipping, and report only what went live,
  what you decided and how to roll back. Ask only when the idea is
  genuinely ambiguous in a way that changes what you build.
- GitHub flow: branch per change off `develop`, PR into `develop` with passing
  checks, squash-merge, bump the version and CHANGELOG (plain words for members).
  Previews (including `develop`) read the same environment variables as
  production unless Preview ones are set in Vercel, so don't test destructive
  things there. A release is a PR `develop` → `main`, only when Steve asks.
- Inner-page template (the Knowledge page is the reference; roll every other
  page onto it): `<HubPage backdrop="themed" inner>` + `<HubHeader eyebrow title intro>`
  (slim frosted bar, actions on the right) instead of a tall banner; all boxes
  use the shared glass frame and hover glow in the "Inner pages" block of
  `web/app/hub.css`; orange (`--ask`) is the call to action, blue is
  everything else; one toolbar row, then content with an optional sticky side
  column. Check at ~1800px, ~900px and in Rebel before shipping.
