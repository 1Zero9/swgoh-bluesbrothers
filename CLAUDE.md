# Project instructions

- `docs/knowledge-base.md` is the living reference for this project's
  architecture, services, mechanics, env vars, and operational lessons.
  Whenever a change touches infrastructure, a new integration, a new env
  var, or a notable mechanic/gotcha, update the relevant section of that
  file **in the same change** and bump its doc version + changelog entry
  (see the versioning note at the top of the file).
- Merge PRs into `main` automatically once checks are green — no need to
  ask for confirmation first.
- Steve's changes win. Where there is a creative difference (with him or
  with earlier chats), make the change he asks for. Flag a genuine
  mistake in one line, but still do it.
- Commit, push and sync (pull/rebase, push, confirm production is live)
  after every change, all the time. Never ask first.
