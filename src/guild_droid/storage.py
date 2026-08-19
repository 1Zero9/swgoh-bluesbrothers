from __future__ import annotations

import json
from pathlib import Path

from .models import GuildSnapshot


def load_snapshot(path: Path) -> GuildSnapshot | None:
    if not path.exists():
        return None
    return GuildSnapshot.from_dict(json.loads(path.read_text(encoding="utf-8")))


def save_snapshot(path: Path, snapshot: GuildSnapshot) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(snapshot.to_dict(), indent=2) + "\n", encoding="utf-8")
