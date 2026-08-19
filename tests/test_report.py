from datetime import datetime, timezone

from guild_droid.models import GuildSnapshot, MemberActivity
from guild_droid.report import compact_number, render_officer_report, render_report


def snapshot(**overrides: int) -> GuildSnapshot:
    values = {
        "guild_name": "Blues Brothers",
        "members": 49,
        "galactic_power": 572_000_000,
        "character_power": 365_000_000,
        "ship_power": 207_000_000,
        "galactic_legends": 349,
    }
    values.update(overrides)
    return GuildSnapshot.create(**values)


def test_compact_number() -> None:
    assert compact_number(572_000_000) == "572M"
    assert compact_number(11_673_469) == "11.7M"
    assert compact_number(-250_000) == "-250K"


def test_baseline_report() -> None:
    report = render_report(snapshot())
    assert "Members: **49/50**" in report
    assert "Guild GP: **572M**" in report
    assert "Baseline saved" in report


def test_change_report() -> None:
    previous = snapshot(members=48, galactic_power=570_500_000, galactic_legends=348)
    report = render_report(snapshot(), previous)
    assert "Guild GP: **+1.5M**" in report
    assert "Members: **+1**" in report
    assert "Galactic Legends: **+1**" in report


def test_live_fields_are_optional() -> None:
    current = snapshot(galactic_legends=None)
    report = render_report(current)
    assert "Galactic Legends" not in report


def test_officer_activity_report() -> None:
    current = snapshot(galactic_legends=None)
    current = GuildSnapshot(
        **{
            **current.to_dict(),
            "member_activity": [
                MemberActivity("one", "Player One", 10_000_000, 600, 1_700_050_000_000),
                MemberActivity("two", "Player Two", 9_000_000, 250, 1_699_900_000_000),
            ],
            "raid_tickets": 850,
        }
    )
    now = datetime.fromtimestamp(1_700_100_000, tz=timezone.utc)
    report = render_officer_report(current, now=now)
    assert "Raid tickets: **850/1,200 — 70.8%**" in report
    assert "Still needed: **350**" in report
    assert "Player Two: **250**" in report
    assert "Inactive 24h+: **1**" in report


def test_membership_changes_and_gp_gains() -> None:
    old = snapshot(galactic_legends=None)
    old = GuildSnapshot(
        **{
            **old.to_dict(),
            "member_activity": [
                MemberActivity("one", "Player One", 9_900_000, 600, 1_700_050_000_000),
                MemberActivity("gone", "Old Player", 8_000_000, 600, 1_700_050_000_000),
            ],
        }
    )
    current = snapshot(galactic_legends=None)
    current = GuildSnapshot(
        **{
            **current.to_dict(),
            "member_activity": [
                MemberActivity("one", "Player One", 10_000_000, 600, 1_700_050_000_000),
                MemberActivity("new", "New Player", 9_000_000, 0, 1_700_050_000_000),
            ],
            "raid_tickets": 600,
        }
    )
    now = datetime.fromtimestamp(1_700_100_000, tz=timezone.utc)
    report = render_officer_report(current, old, now=now)
    assert "Joined: New Player" in report
    assert "Left: Old Player" in report
    assert "Player One: **+100K**" in report
