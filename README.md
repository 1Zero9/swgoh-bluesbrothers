# Blues Brothers Droid

[![CI](https://github.com/1Zero9/swgoh-bluesbrothers/actions/workflows/ci.yml/badge.svg)](https://github.com/1Zero9/swgoh-bluesbrothers/actions/workflows/ci.yml)

A small, free reporting service for the **Blues Brothers** SWGOH guild.

Current milestone: fetch live public guild data through SWGOH Comlink, format
snapshots, detect changes, and deliver reports to a private Discord test channel.

## First local run

Python 3.11 or newer is required.

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -e .
guild-report --no-save
```

Remove `--no-save` to store the baseline in `data/latest.json`. The next run will
show changes relative to that saved snapshot.

## Connect the private Discord test channel

1. In Discord, edit `#bot-lab` and open **Integrations → Webhooks**.
2. Create a webhook named **Blues Brothers Droid** and copy its URL.
3. Locally, copy `.env.example` to `.env`.
4. Put the URL after `DISCORD_WEBHOOK_URL=` in `.env`.
5. Send the sample report:

```bash
guild-report --send --no-save
```

Never paste the webhook URL into chat or commit `.env`. If it is exposed, delete
the webhook in Discord and create another.

## Fetch live guild data with Comlink

Comlink is a free, read-only bridge to public SWGOH game data. Version 4.4.0 is
pinned because newer macOS binaries currently fail here with a `pkg`/V8 bytecode
error.

In one terminal:

```bash
scripts/setup_comlink.sh
scripts/start_comlink.sh
```

Leave it running. In another terminal:

```bash
source .venv/bin/activate
guild-report --live --no-save
```

After checking the output, save it as the new baseline and send it to Discord:

```bash
guild-report --live --send
```

Generate the officer-only ticket and inactivity view with:

```bash
guild-report --live --report officer --no-save
```

This view assumes 600 daily tickets is the per-member target and should be sent
to an officer channel near the guild's ticket reset, not used as a public shame
list during the middle of the day.

The daily officer view includes a Discord-localized capture time, ticket
completion percentage and shortfall, ticket bands, completed-member count,
24-hour inactivity with a grace period for new members, membership changes, and
the five largest GP gains since the previous saved snapshot.

## Daily schedule

The macOS LaunchAgent runs at **23:00 Europe/Dublin**, normally **18:00 US
Eastern**. This is an initial estimate intended to run shortly before a common
18:30 Eastern guild reset. The real guild reset is fixed by the timezone in
which the guild was created, so adjust the schedule once officers confirm it.

The scheduled runner starts Comlink, waits for it to become ready, posts one
officer report, saves the snapshot, and shuts down the Comlink process it
started. Logs are stored under `data/logs/`. If a scheduled run fails, the
runner attempts to post an automation alert to the configured Discord webhook.
If Discord itself is unavailable, the failure is recorded only in the local
error log.

The installed LaunchAgent source is:

```text
launchd/com.bluesbrothers.guild-droid.plist
```

## Run tests

```bash
python -m pip install pytest
pytest
```

## Configuration

`config.json` contains the public guild ID and the administrator's public ally
code. Secrets belong only in `.env` or the hosting provider's secret store.

## Current status and next milestones

The live Comlink report, Discord delivery, snapshot comparison, officer view,
and daily macOS schedule are operational. The immediate milestone is to observe
several consecutive daily runs, confirm the guild's actual ticket reset time,
and adjust the schedule if necessary.

Once SWGOH.GG approves the API application, it can become an optional second
data source for roster details not included in the basic Comlink guild response:

1. Add the API key to `.env` as `SWGOH_GG_API_KEY=...`.
2. Implement the authenticated data adapter.
3. Add roster-focused reports that use the additional data.
4. Schedule those reports after the guild's usual SWGOH.GG sync time.
