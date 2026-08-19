import sys

import pytest

from guild_droid import cli


def test_alert_posts_without_creating_a_report(monkeypatch, tmp_path, capsys) -> None:
    delivered: list[tuple[str, str]] = []
    monkeypatch.setattr(cli, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(cli, "post_webhook", lambda url, content: delivered.append((url, content)))
    monkeypatch.setenv("DISCORD_WEBHOOK_URL", "https://discord.com/api/webhooks/example/value")
    monkeypatch.setattr(sys, "argv", ["guild-report", "--alert", "Daily run failed"])

    cli.main()

    assert delivered == [
        (
            "https://discord.com/api/webhooks/example/value",
            "**BLUES BROTHERS DROID — AUTOMATION ALERT**\n\nDaily run failed",
        )
    ]
    assert capsys.readouterr().out == "Alert sent to Discord.\n"


def test_alert_rejects_report_options(monkeypatch, tmp_path) -> None:
    monkeypatch.setattr(cli, "PROJECT_ROOT", tmp_path)
    monkeypatch.setattr(
        sys,
        "argv",
        ["guild-report", "--alert", "Daily run failed", "--live"],
    )

    with pytest.raises(SystemExit, match="cannot be combined"):
        cli.main()
