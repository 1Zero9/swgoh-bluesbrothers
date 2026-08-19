from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .models import GuildSnapshot, MemberActivity


class ComlinkError(RuntimeError):
    pass


def _integer(value: Any) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return 0


def fetch_guild(comlink_url: str, guild_id: str) -> dict[str, Any]:
    payload = json.dumps(
        {
            "payload": {
                "guildId": guild_id,
                "includeRecentGuildActivityInfo": True,
            },
            "enums": False,
        }
    ).encode("utf-8")
    request = Request(
        f"{comlink_url.rstrip('/')}/guild",
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "BluesBrothersDroid/0.1"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=45) as response:
            return json.load(response)
    except HTTPError as error:
        raise ComlinkError(f"Comlink returned HTTP {error.code}") from error
    except URLError as error:
        raise ComlinkError(f"Could not reach Comlink at {comlink_url}: {error.reason}") from error


def normalize_guild(response: dict[str, Any]) -> GuildSnapshot:
    guild = response.get("guild")
    if not isinstance(guild, dict):
        raise ComlinkError("Comlink response did not contain a guild")

    profile = guild.get("profile", {})
    members = guild.get("member", [])
    if not isinstance(profile, dict) or not isinstance(members, list):
        raise ComlinkError("Comlink returned an unexpected guild shape")

    now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)
    inactive_cutoff_ms = now_ms - (24 * 60 * 60 * 1000)
    raid_tickets = 0
    inactive_24h = 0
    member_activity: list[MemberActivity] = []

    for member in members:
        last_activity_time = _integer(member.get("lastActivityTime"))
        if last_activity_time < inactive_cutoff_ms:
            inactive_24h += 1
        member_tickets = 0
        for contribution in member.get("memberContribution", []):
            if _integer(contribution.get("type")) == 2:
                member_tickets = _integer(contribution.get("currentValue"))
                raid_tickets += member_tickets
        member_activity.append(
            MemberActivity(
                player_id=str(member.get("playerId") or ""),
                name=str(member.get("playerName") or "Unknown player"),
                galactic_power=_integer(member.get("galacticPower")),
                raid_tickets=member_tickets,
                last_activity_time=last_activity_time,
                guild_join_time=_integer(member.get("guildJoinTime")),
            )
        )

    return GuildSnapshot.create(
        guild_name=str(profile.get("name") or "Unknown guild"),
        members=len(members),
        galactic_power=sum(_integer(member.get("galacticPower")) for member in members),
        character_power=sum(
            _integer(member.get("characterGalacticPower")) for member in members
        ),
        ship_power=sum(_integer(member.get("shipGalacticPower")) for member in members),
        galactic_legends=None,
        raid_tickets=raid_tickets,
        inactive_24h=inactive_24h,
        member_activity=member_activity,
    )


def fetch_snapshot(comlink_url: str, guild_id: str) -> GuildSnapshot:
    return normalize_guild(fetch_guild(comlink_url, guild_id))
