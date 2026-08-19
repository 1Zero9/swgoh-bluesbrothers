from __future__ import annotations

import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class DiscordDeliveryError(RuntimeError):
    pass


def post_webhook(webhook_url: str, content: str) -> None:
    if not webhook_url.startswith("https://discord.com/api/webhooks/"):
        raise DiscordDeliveryError("DISCORD_WEBHOOK_URL is not a Discord webhook URL")

    payload = json.dumps(
        {"content": content, "allowed_mentions": {"parse": []}}
    ).encode("utf-8")
    request = Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json", "User-Agent": "BluesBrothersDroid/0.1"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=20) as response:
            if response.status not in (200, 204):
                raise DiscordDeliveryError(f"Discord returned HTTP {response.status}")
    except HTTPError as error:
        raise DiscordDeliveryError(f"Discord returned HTTP {error.code}") from error
    except URLError as error:
        raise DiscordDeliveryError(f"Could not reach Discord: {error.reason}") from error
