from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from .comlink import fetch_snapshot
from .discord import post_webhook
from .models import GuildSnapshot
from .report import render_officer_report, render_report
from .storage import load_snapshot, save_snapshot

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_SNAPSHOT = PROJECT_ROOT / "data" / "latest.json"


def load_dotenv(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


def sample_snapshot() -> GuildSnapshot:
    return GuildSnapshot.create(
        guild_name="Blues Brothers",
        members=49,
        galactic_power=572_000_000,
        character_power=365_000_000,
        ship_power=207_000_000,
        galactic_legends=349,
    )


def snapshot_from_json(path: Path) -> GuildSnapshot:
    return GuildSnapshot.from_dict(json.loads(path.read_text(encoding="utf-8")))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Create a Blues Brothers guild report")
    parser.add_argument("--input", type=Path, help="Normalized guild snapshot JSON")
    parser.add_argument("--live", action="store_true", help="Fetch live guild data from Comlink")
    parser.add_argument("--send", action="store_true", help="Post the report to Discord")
    parser.add_argument(
        "--report",
        choices=("summary", "officer"),
        default="summary",
        help="Report format to generate",
    )
    parser.add_argument(
        "--no-save", action="store_true", help="Do not replace data/latest.json"
    )
    return parser


def main() -> None:
    args = build_parser().parse_args()
    load_dotenv(PROJECT_ROOT / ".env")

    if args.live and args.input:
        raise SystemExit("Choose either --live or --input, not both")

    if args.live:
        config = json.loads((PROJECT_ROOT / "config.json").read_text(encoding="utf-8"))
        current = fetch_snapshot(
            os.environ.get("COMLINK_URL", "http://localhost:3000"), config["guild_id"]
        )
    else:
        current = snapshot_from_json(args.input) if args.input else sample_snapshot()
    previous = load_snapshot(DEFAULT_SNAPSHOT)
    report = (
        render_officer_report(current, previous)
        if args.report == "officer"
        else render_report(current, previous)
    )
    print(report)

    if args.send:
        webhook_url = os.environ.get("DISCORD_WEBHOOK_URL", "")
        if not webhook_url:
            raise SystemExit("DISCORD_WEBHOOK_URL is missing; add it to .env")
        post_webhook(webhook_url, report)
        print("\nSent to Discord.")

    if not args.no_save:
        save_snapshot(DEFAULT_SNAPSHOT, current)


if __name__ == "__main__":
    main()
