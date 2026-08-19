from guild_droid.comlink import normalize_guild


def test_normalize_guild() -> None:
    response = {
        "guild": {
            "profile": {"name": "Blues Brothers", "memberCount": 2},
            "member": [
                {
                    "galacticPower": "12000000",
                    "characterGalacticPower": "8000000",
                    "shipGalacticPower": "4000000",
                    "lastActivityTime": "0",
                    "guildJoinTime": "1600000000",
                    "memberContribution": [{"type": 2, "currentValue": "500"}],
                },
                {
                    "galacticPower": "10000000",
                    "characterGalacticPower": "6500000",
                    "shipGalacticPower": "3500000",
                    "lastActivityTime": "9999999999999",
                    "memberContribution": [{"type": 2, "currentValue": "600"}],
                },
            ],
        }
    }

    snapshot = normalize_guild(response)
    assert snapshot.members == 2
    assert snapshot.galactic_power == 22_000_000
    assert snapshot.raid_tickets == 1100
    assert snapshot.inactive_24h == 1
    assert snapshot.member_activity[0].name == "Unknown player"
    assert snapshot.member_activity[0].raid_tickets == 500
    assert snapshot.member_activity[0].guild_join_time == 1_600_000_000
