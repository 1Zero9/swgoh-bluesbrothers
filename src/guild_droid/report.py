from __future__ import annotations

from datetime import datetime, timezone

from .models import GuildSnapshot

DISCORD_CONTENT_LIMIT = 2000


def compact_number(value: int) -> str:
    if abs(value) >= 1_000_000:
        rendered = f"{value / 1_000_000:.1f}".rstrip("0").rstrip(".")
        return f"{rendered}M"
    if abs(value) >= 1_000:
        rendered = f"{value / 1_000:.1f}".rstrip("0").rstrip(".")
        return f"{rendered}K"
    return str(value)


def signed_number(value: int) -> str:
    prefix = "+" if value > 0 else ""
    return f"{prefix}{compact_number(value)}"


def render_report(current: GuildSnapshot, previous: GuildSnapshot | None = None) -> str:
    average_gp = current.galactic_power // current.members if current.members else 0
    lines = [
        f"**{current.guild_name.upper()} — GUILD REPORT**",
        "",
        f"Members: **{current.members}/50**",
        f"Guild GP: **{compact_number(current.galactic_power)}**",
        f"Average GP: **{compact_number(average_gp)}**",
    ]
    if current.galactic_legends is not None:
        lines.append(f"Galactic Legends: **{current.galactic_legends}**")
    if current.raid_tickets is not None:
        lines.append(f"Current raid tickets: **{current.raid_tickets:,}**")
    if current.inactive_24h is not None:
        lines.append(f"Inactive over 24h: **{current.inactive_24h}**")

    if previous is None:
        lines.extend(["", "_Baseline saved. Changes will appear after the next snapshot._"])
        return "\n".join(lines)

    member_delta = current.members - previous.members
    gp_delta = current.galactic_power - previous.galactic_power
    gl_delta = None
    if current.galactic_legends is not None and previous.galactic_legends is not None:
        gl_delta = current.galactic_legends - previous.galactic_legends
    lines.extend(
        [
            "",
            "**Changes since the previous snapshot**",
            f"• Guild GP: **{signed_number(gp_delta)}**",
            f"• Members: **{member_delta:+d}**",
        ]
    )
    if gl_delta is not None:
        lines.append(f"• Galactic Legends: **{gl_delta:+d}**")
    return "\n".join(lines)


def _hours_since(epoch_ms: int, now: datetime) -> int:
    if epoch_ms <= 0:
        return 0
    elapsed = now.timestamp() - (epoch_ms / 1000)
    return max(0, int(elapsed // 3600))


def render_officer_report(
    current: GuildSnapshot,
    previous: GuildSnapshot | None = None,
    *,
    now: datetime | None = None,
) -> str:
    now = now or datetime.now(timezone.utc)
    members = current.member_activity
    if not members:
        return "**OFFICER ACTIVITY REPORT**\n\nNo member activity data was returned."

    zero_tickets = sorted(
        (member for member in members if member.raid_tickets == 0),
        key=lambda member: member.name.casefold(),
    )
    low_tickets = sorted(
        (member for member in members if 1 <= member.raid_tickets <= 299),
        key=lambda member: (member.raid_tickets, member.name.casefold()),
    )
    near_tickets = sorted(
        (member for member in members if 300 <= member.raid_tickets <= 599),
        key=lambda member: (member.raid_tickets, member.name.casefold()),
    )
    complete_count = sum(member.raid_tickets >= 600 for member in members)

    def is_new_member(member: object) -> bool:
        join_time = getattr(member, "guild_join_time", 0)
        return join_time > 0 and now.timestamp() - join_time < 24 * 60 * 60

    inactive = sorted(
        (
            (member, _hours_since(member.last_activity_time, now))
            for member in members
            if _hours_since(member.last_activity_time, now) >= 24 and not is_new_member(member)
        ),
        key=lambda item: (-item[1], item[0].name.casefold()),
    )

    possible_tickets = len(members) * 600
    current_tickets = current.raid_tickets or 0
    remaining_tickets = max(0, possible_tickets - current_tickets)
    completion = current_tickets / possible_tickets * 100 if possible_tickets else 0
    captured_epoch = int(datetime.fromisoformat(current.captured_at).timestamp())
    lines = [
        f"**{current.guild_name.upper()} — OFFICER ACTIVITY**",
        f"Captured: <t:{captured_epoch}:F> (<t:{captured_epoch}:R>)",
        "",
        f"Guild GP: **{compact_number(current.galactic_power)}**",
        f"Members: **{current.members}/50**",
        f"Raid tickets: **{current_tickets:,}/{possible_tickets:,} — {completion:.1f}%**",
        f"Still needed: **{remaining_tickets:,}**",
        f"Inactive 24h+: **{len(inactive)}**",
        "",
        f"**0 tickets ({len(zero_tickets)})**",
    ]
    lines.append("• " + ", ".join(member.name for member in zero_tickets) if zero_tickets else "• None")

    lines.append(f"\n**1–299 tickets ({len(low_tickets)})**")
    lines.extend(
        (f"• {member.name}: **{member.raid_tickets}**" for member in low_tickets)
        if low_tickets
        else ["• None"]
    )

    lines.append(f"\n**300–599 tickets ({len(near_tickets)})**")
    lines.extend(
        (f"• {member.name}: **{member.raid_tickets}**" for member in near_tickets)
        if near_tickets
        else ["• None"]
    )
    lines.append(f"\n**600 complete: {complete_count}**")

    lines.extend(["", "**Inactive 24h+**"])
    lines.extend(
        (f"• {member.name}: **{hours}h**" for member, hours in inactive)
        if inactive
        else ["• None"]
    )

    if previous is not None and previous.member_activity:
        previous_by_id = {member.player_id: member for member in previous.member_activity}
        current_by_id = {member.player_id: member for member in members}
        joined = sorted(
            (member.name for player_id, member in current_by_id.items() if player_id not in previous_by_id),
            key=str.casefold,
        )
        left = sorted(
            (member.name for player_id, member in previous_by_id.items() if player_id not in current_by_id),
            key=str.casefold,
        )
        lines.extend(["", "**Membership changes**"])
        if joined:
            lines.append("• Joined: " + ", ".join(joined))
        if left:
            lines.append("• Left: " + ", ".join(left))
        if not joined and not left:
            lines.append("• No changes")

        gp_gains = sorted(
            (
                (member.galactic_power - previous_by_id[member.player_id].galactic_power, member.name)
                for member in members
                if member.player_id in previous_by_id
                and member.galactic_power > previous_by_id[member.player_id].galactic_power
            ),
            reverse=True,
        )[:5]
        lines.extend(["", "**Top GP gains**"])
        lines.extend(
            (f"• {name}: **+{compact_number(gain)}**" for gain, name in gp_gains)
            if gp_gains
            else ["• No gains detected"]
        )

    report = "\n".join(lines)
    if len(report) <= DISCORD_CONTENT_LIMIT:
        return report
    return report[: DISCORD_CONTENT_LIMIT - 20].rstrip() + "\n…report truncated"
