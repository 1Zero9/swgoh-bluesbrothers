"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CHARACTERS,
  COMMODITIES,
  COMMODITY_IDS,
  ENGINE_VERSION,
  FINAL_DAY,
  GameRuleError,
  PLANETS,
  PLANET_IDS,
  buyCommodity,
  createGame,
  getDailyNews,
  getMarket,
  getNetWorth,
  getTravelEncounter,
  getUsedCargo,
  missInterimDemand,
  payInterimDemand,
  payJabba,
  resolveEncounter,
  sellCommodity,
  travel,
  type CharacterId,
  type CommodityId,
  type Encounter,
  type GameState,
  type PlanetId,
} from "@/lib/game";
import styles from "./mission.module.css";

const SAVE_KEY = "bb-mission-from-god-free-play-v1";
type LogEntry = { day: number; text: string; tone?: "good" | "bad" };
type SavedRun = { engineVersion: string; state: GameState; encounter: Encounter | null; log: LogEntry[] };

function credits(value: number) { return `${Math.round(value).toLocaleString("en-GB")} cr`; }
function makeSeed() { return `free-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`; }

export default function MissionGame() {
  const [selectedCharacter, setSelectedCharacter] = useState<CharacterId>("jake");
  const [game, setGame] = useState<GameState | null>(null);
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [notice, setNotice] = useState<string>("");
  const [quantity, setQuantity] = useState<Record<CommodityId, number>>(() => Object.fromEntries(COMMODITY_IDS.map((id) => [id, 1])) as Record<CommodityId, number>);
  const [saveFound, setSaveFound] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as SavedRun;
      if (saved.engineVersion === ENGINE_VERSION && saved.state?.engineVersion === ENGINE_VERSION) {
        queueMicrotask(() => { setGame(saved.state); setEncounter(saved.encounter); setLog(saved.log || []); setSaveFound(true); });
      } else localStorage.removeItem(SAVE_KEY);
    } catch { localStorage.removeItem(SAVE_KEY); }
  }, []);

  useEffect(() => {
    if (!game) return;
    const save: SavedRun = { engineVersion: ENGINE_VERSION, state: game, encounter, log };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }, [game, encounter, log]);

  const market = useMemo(() => game ? getMarket(game.seed, game.day, game.planetId, game.character) : null, [game]);
  const news = useMemo(() => game ? getDailyNews(game) : [], [game]);

  function addLog(text: string, tone?: LogEntry["tone"], day = game?.day || 1) {
    setLog((current) => [{ day, text, tone }, ...current].slice(0, 14));
  }

  function startRun() {
    const next = createGame(makeSeed(), selectedCharacter);
    setGame(next); setEncounter(null); setLog([{ day: 1, text: "Jabba wants one million Credits. The orphanage has thirty days." }]); setNotice(""); setSaveFound(false);
  }

  function resetRun() {
    localStorage.removeItem(SAVE_KEY); setGame(null); setEncounter(null); setLog([]); setNotice(""); setSaveFound(false);
  }

  function act(action: () => GameState, success: string) {
    try { const next = action(); setGame(next); setNotice(success); addLog(success, "good"); }
    catch (error) { const message = error instanceof GameRuleError ? error.message : "The action failed."; setNotice(message); addLog(message, "bad"); }
  }

  function trade(kind: "buy" | "sell", commodityId: CommodityId) {
    if (!game) return;
    const amount = Math.max(1, Math.floor(quantity[commodityId] || 1));
    act(() => kind === "buy" ? buyCommodity(game, commodityId, amount) : sellCommodity(game, commodityId, amount), `${kind === "buy" ? "Bought" : "Sold"} ${amount} × ${COMMODITIES[commodityId].name}.`);
  }

  function jump(destination: PlanetId) {
    if (!game) return;
    try {
      const next = travel(game, destination);
      setGame(next); setNotice(`Arrived at ${PLANETS[destination].name}.`); addLog(`Jumped to ${PLANETS[destination].name}.`, undefined, next.day);
      if (next.status === "active" && next.interimPaymentStatus !== "pending") setEncounter(getTravelEncounter(next));
    } catch (error) { const message = error instanceof GameRuleError ? error.message : "Hyperspace jump failed."; setNotice(message); addLog(message, "bad"); }
  }

  function choose(choiceId: string) {
    if (!game || !encounter) return;
    const result = resolveEncounter(game, encounter, choiceId);
    setGame(result.state); setEncounter(null); setNotice(result.message); addLog(`${result.title}: ${result.message}`, result.tone === "neutral" ? undefined : result.tone);
  }

  if (!game) return (
    <section className={styles.intro} aria-labelledby="mission-title">
      <div className={styles.introGlow} />
      <div className={styles.introCopy}>
        <p className={styles.kicker}>Free play · local save</p>
        <h1 id="mission-title">Mission <em>From God</em></h1>
        <p className={styles.lede}>You have 30 days to turn a battered Bluesmobile and 18,000 Credits into Jabba&apos;s million. Trade gear, read the news, survive the road.</p>
        <div className={styles.missionBrief}><span>Objective</span><strong>Pay Jabba. Save the orphanage.</strong><small>No account required. Your run stays on this device.</small></div>
      </div>
      <div className={styles.characterPanel}>
        <p className={styles.panelLabel}>01 · Choose your brother</p>
        <div className={styles.characterGrid}>
          {(Object.keys(CHARACTERS) as CharacterId[]).map((id) => <button key={id} type="button" className={`${styles.characterCard} ${selectedCharacter === id ? styles.selected : ""}`} onClick={() => setSelectedCharacter(id)}><span>{id === "jake" ? "JB" : "EB"}</span><strong>{CHARACTERS[id].name}</strong><em>{CHARACTERS[id].ability}</em><small>{id === "jake" ? "+5% sale price" : "+10 cargo capacity"}</small></button>)}
        </div>
        <button className={styles.startButton} type="button" onClick={startRun}>{saveFound ? "Start a new run" : "Start the Bluesmobile"} <span>→</span></button>
      </div>
    </section>
  );

  const usedCargo = getUsedCargo(game);
  const daysLeft = FINAL_DAY - game.day;
  const active = game.status === "active";
  return (
    <section className={styles.gameShell}>
      <header className={styles.gameHeader}>
        <div><p className={styles.kicker}>Mission From God</p><h1>{PLANETS[game.planetId].name}</h1><span>{PLANETS[game.planetId].profile}</span></div>
        <div className={styles.dayDial}><small>Day</small><strong>{game.day}<i>/30</i></strong><span>{daysLeft} days remain</span></div>
      </header>

      <div className={styles.statStrip}>
        <div><span>Credits</span><strong>{credits(game.credits)}</strong></div><div><span>Jabba debt</span><strong>{credits(game.jabbaDebt)}</strong></div><div><span>Net worth</span><strong>{credits(getNetWorth(game))}</strong></div><div><span>Cargo</span><strong>{usedCargo} / {game.cargoCapacity}</strong></div><div><span>Bounty</span><strong className={styles.bounty}>{"★".repeat(game.bountyLevel)}{"☆".repeat(5 - game.bountyLevel)}</strong></div>
      </div>

      {notice && <div className={styles.notice} role="status"><span>COMLINK</span>{notice}<button type="button" onClick={() => setNotice("")} aria-label="Dismiss message">×</button></div>}

      <div className={styles.dashboard}>
        <section className={styles.marketPanel} aria-labelledby="market-title">
          <div className={styles.sectionHeading}><div><p className={styles.panelLabel}>02 · Trade terminal</p><h2 id="market-title">Local exchange</h2></div><span>Market refreshes after travel</span></div>
          <div className={styles.marketTable}>
            <div className={styles.marketHead}><span>Commodity</span><span>Hold</span><span>Buy</span><span>Sell</span><span>Quantity</span><span>Actions</span></div>
            {COMMODITY_IDS.map((id) => { const item = game.inventory[id]; const quote = market![id]; return <div className={styles.marketRow} key={id}><div className={styles.commodity}><i>{id.slice(0, 2).toUpperCase()}</i><span><strong>{COMMODITIES[id].name}</strong><small>Avg {item.averagePurchasePrice ? credits(item.averagePurchasePrice) : "—"}</small></span></div><span data-label="Hold">{item.quantity}</span><span data-label="Buy">{credits(quote.buyPrice)}</span><span data-label="Sell">{credits(quote.sellPrice)}</span><label><span className={styles.mobileLabel}>Qty</span><input aria-label={`${COMMODITIES[id].name} quantity`} type="number" min="1" max="100" value={quantity[id]} onChange={(event) => setQuantity((current) => ({ ...current, [id]: Math.max(1, Number(event.target.value)) }))} /></label><div className={styles.tradeActions}><button type="button" disabled={!active || game.interimPaymentStatus === "pending"} onClick={() => trade("buy", id)}>Buy</button><button type="button" disabled={!active || item.quantity === 0 || game.interimPaymentStatus === "pending"} onClick={() => trade("sell", id)}>Sell</button></div></div>; })}
          </div>
        </section>

        <aside className={styles.sideRail}>
          <section className={styles.newsPanel}><div className={styles.sectionHeading}><div><p className={styles.panelLabel}>Galactic News Network</p><h2>Signals</h2></div><span>Day {game.day}</span></div>{news.map((item) => <p key={item.id} data-tone={item.tone}><i>{item.tone === "up" ? "▲" : item.tone === "down" ? "▼" : item.tone === "alert" ? "!" : "●"}</i>{item.headline}</p>)}</section>
          <section className={styles.travelPanel}><div className={styles.sectionHeading}><div><p className={styles.panelLabel}>03 · Hyperspace</p><h2>Next stop</h2></div></div><div className={styles.planetList}>{PLANET_IDS.filter((id) => id !== game.planetId).map((id) => <button key={id} type="button" disabled={!active || game.interimPaymentStatus === "pending" || Boolean(encounter)} onClick={() => jump(id)}><span>{PLANETS[id].name}</span><small>{PLANETS[id].profile}</small><b>→</b></button>)}</div></section>
          <section className={styles.logPanel}><div className={styles.sectionHeading}><div><p className={styles.panelLabel}>Road log</p><h2>Last transmissions</h2></div></div>{log.slice(0, 5).map((entry, index) => <p key={`${entry.day}-${index}`} data-tone={entry.tone}><span>D{entry.day}</span>{entry.text}</p>)}</section>
        </aside>
      </div>

      <footer className={styles.gameFooter}><div><strong>{CHARACTERS[game.character].name}</strong><span>{CHARACTERS[game.character].ability}</span></div><div className={styles.footerActions}>{active && <button type="button" onClick={() => act(() => payJabba(game), "Jabba has been paid. The orphanage is safe.")}>Pay Jabba</button>}<button type="button" onClick={resetRun}>End run</button></div></footer>

      {game.interimPaymentStatus === "pending" && <div className={styles.modalLayer}><div className={styles.modal}><p className={styles.panelLabel}>Incoming transmission · Day 15</p><h2>Jabba wants 250,000 Credits.</h2><p>Pay now to reduce the final debt, or refuse and put Boba Fett on your trail.</p><div><button type="button" disabled={game.credits < 250_000} onClick={() => act(() => payInterimDemand(game), "Interim payment made. Jabba's debt is reduced.")}>Pay 250,000</button><button type="button" onClick={() => act(() => missInterimDemand(game), "Payment refused. Boba Fett is hunting the Bluesmobile.")}>Refuse payment</button></div></div></div>}
      {encounter && <div className={styles.modalLayer}><div className={`${styles.modal} ${styles.encounterModal}`}><p className={styles.panelLabel}>{encounter.category} encounter</p><h2>{encounter.title}</h2><p>{encounter.description}</p><div>{encounter.choices.map((choice) => <button key={choice.id} type="button" onClick={() => choose(choice.id)}><strong>{choice.label}</strong><small>{choice.hint}</small></button>)}</div></div></div>}
      {!active && <div className={styles.modalLayer}><div className={styles.modal}><p className={styles.panelLabel}>Run complete</p><h2>{game.status === "won" ? "The band made it." : "The mission is over."}</h2><p>{game.outcome}</p><dl><div><dt>Final Credits</dt><dd>{credits(game.credits)}</dd></div><div><dt>Trade profit</dt><dd>{credits(game.stats.totalProfit)}</dd></div><div><dt>Jumps</dt><dd>{game.stats.hyperspaceJumps}</dd></div></dl><div><button type="button" onClick={resetRun}>Start another run</button></div></div></div>}
    </section>
  );
}
