from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass(frozen=True)
class MemberActivity:
    player_id: str
    name: str
    galactic_power: int
    raid_tickets: int
    last_activity_time: int
    guild_join_time: int = 0


@dataclass(frozen=True)
class GuildSnapshot:
    guild_name: str
    members: int
    galactic_power: int
    character_power: int
    ship_power: int
    galactic_legends: int | None
    captured_at: str
    raid_tickets: int | None = None
    inactive_24h: int | None = None
    member_activity: list[MemberActivity] = field(default_factory=list)

    @classmethod
    def create(
        cls,
        *,
        guild_name: str,
        members: int,
        galactic_power: int,
        character_power: int,
        ship_power: int,
        galactic_legends: int | None,
        raid_tickets: int | None = None,
        inactive_24h: int | None = None,
        member_activity: list[MemberActivity] | None = None,
    ) -> "GuildSnapshot":
        return cls(
            guild_name=guild_name,
            members=members,
            galactic_power=galactic_power,
            character_power=character_power,
            ship_power=ship_power,
            galactic_legends=galactic_legends,
            captured_at=datetime.now(timezone.utc).isoformat(),
            raid_tickets=raid_tickets,
            inactive_24h=inactive_24h,
            member_activity=member_activity or [],
        )

    @classmethod
    def from_dict(cls, value: dict[str, Any]) -> "GuildSnapshot":
        normalized = dict(value)
        normalized["member_activity"] = [
            MemberActivity(**member) for member in normalized.get("member_activity", [])
        ]
        return cls(**normalized)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)
