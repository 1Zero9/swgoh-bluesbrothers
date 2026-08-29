"use client";

import { useState, useEffect, useRef, useMemo, type FormEvent } from "react";
import Image from "next/image";
import {
  type DiscTrack,
  type DiscCategory,
  DISC_CATEGORIES,
  parseYouTubeId,
} from "@/lib/discs";

// Extend window for YouTube IFrame API
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getPlayerState: () => number;
  destroy: () => void;
}

type ToastState = {
  id: number;
  text: string;
  kind: "success" | "info" | "error";
};

export default function DougiesJukebox({ initialDiscs }: { initialDiscs: DiscTrack[] }) {
  const [catalog, setCatalog] = useState<DiscTrack[]>(initialDiscs);
  const [queue, setQueue] = useState<DiscTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<DiscTrack>(initialDiscs[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<"vinyl" | "video">("vinyl");
  const [activeCategory, setActiveCategory] = useState<DiscCategory>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("all");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState<boolean>(false);
  const [suggestPreviewId, setSuggestPreviewId] = useState<string | null>(null);
  const [suggestInputUrl, setSuggestInputUrl] = useState<string>("");
  const [suggestSending, setSuggestSending] = useState<boolean>(false);
  const [suggestStatus, setSuggestStatus] = useState<{ kind: "idle" | "success" | "error"; msg: string }>({ kind: "idle", msg: "" });
  const [soundboardQuote, setSoundboardQuote] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const suggestDialogRef = useRef<HTMLDialogElement | null>(null);

  function showToast(text: string, kind: "success" | "info" | "error" = "success") {
    const id = Date.now();
    setToasts((prev) => [...prev.slice(-3), { id, text, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  // Load custom tracks and queue from localStorage on mount
  useEffect(() => {
    try {
      const savedCustom = localStorage.getItem("dougies-custom-discs");
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom) as DiscTrack[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCatalog((prev) => {
            const existingIds = new Set(prev.map((d) => d.id));
            const fresh = parsed.filter((d) => !existingIds.has(d.id));
            return [...fresh, ...prev];
          });
        }
      }

      const savedQueue = localStorage.getItem("dougies-queue");
      if (savedQueue) {
        const parsedQ = JSON.parse(savedQueue) as DiscTrack[];
        if (Array.isArray(parsedQ) && parsedQ.length > 0) {
          setQueue(parsedQ);
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("dougies-queue", JSON.stringify(queue));
    } catch {
      // Ignore
    }
  }, [queue]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    let isCancelled = false;

    function initYT() {
      if (!window.YT || !window.YT.Player || isCancelled) return;

      if (!ytPlayerRef.current) {
        ytPlayerRef.current = new window.YT.Player("dougies-yt-player", {
          videoId: currentTrack?.youtubeId || "EHV0ZsAKoqI",
          playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: typeof window !== "undefined" ? window.location.origin : "",
          },
          events: {
            onReady: (event) => {
              if (isCancelled) return;
              event.target.setVolume(volume);
              if (isMuted) event.target.mute();
            },
            onStateChange: (event) => {
              if (isCancelled) return;
              if (event.data === 1) {
                // PLAYING
                setIsPlaying(true);
              } else if (event.data === 2) {
                // PAUSED
                setIsPlaying(false);
              } else if (event.data === 0) {
                // ENDED
                handleTrackEnded();
              }
            },
          },
        });
      }
    }

    if (window.YT && window.YT.Player) {
      initYT();
    } else {
      const existingScript = document.getElementById("yt-iframe-api");
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.id = "yt-iframe-api";
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        initYT();
      };
    }

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle track ending -> advance queue or loop
  function handleTrackEnded() {
    if (repeatMode === "one") {
      ytPlayerRef.current?.playVideo();
      return;
    }

    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(next);
      showToast(`Now spinning: "${next.title}" by ${next.artist}`, "info");
    } else if (autoAdvance) {
      // Pick next in catalog
      const currentIndex = catalog.findIndex((d) => d.id === currentTrack.id);
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * catalog.length);
      } else if (currentIndex >= 0 && currentIndex < catalog.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeatMode === "all") {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
      const nextTrack = catalog[nextIndex];
      if (nextTrack) {
        playTrack(nextTrack);
        showToast(`Auto-advancing: "${nextTrack.title}"`, "info");
      }
    } else {
      setIsPlaying(false);
    }
  }

  // Play specific track
  function playTrack(track: DiscTrack) {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.loadVideoById(track.youtubeId);
      ytPlayerRef.current.playVideo();
    }
  }

  function togglePlayPause() {
    if (!ytPlayerRef.current) {
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      ytPlayerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      ytPlayerRef.current.playVideo();
      setIsPlaying(true);
    }
  }

  function skipNext() {
    if (queue.length > 0) {
      const next = queue[0];
      setQueue((prev) => prev.slice(1));
      playTrack(next);
      showToast(`Next in queue: "${next.title}"`, "info");
    } else {
      const currentIndex = catalog.findIndex((d) => d.id === currentTrack.id);
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * catalog.length);
      } else if (currentIndex >= 0 && currentIndex < catalog.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        nextIndex = 0;
      }
      const nextTrack = catalog[nextIndex];
      if (nextTrack) {
        playTrack(nextTrack);
        showToast(`Spun: "${nextTrack.title}"`, "info");
      }
    }
  }

  function skipPrev() {
    const currentIndex = catalog.findIndex((d) => d.id === currentTrack.id);
    let prevIndex = catalog.length - 1;
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    }
    const prevTrack = catalog[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack);
      showToast(`Previous: "${prevTrack.title}"`, "info");
    }
  }

  function handleVolumeChange(newVol: number) {
    setVolume(newVol);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      }
    }
  }

  function toggleMute() {
    if (ytPlayerRef.current) {
      if (isMuted) {
        ytPlayerRef.current.unMute();
        setIsMuted(false);
      } else {
        ytPlayerRef.current.mute();
        setIsMuted(true);
      }
    } else {
      setIsMuted(!isMuted);
    }
  }

  // Queue helper functions
  function addToQueue(track: DiscTrack, playNext: boolean = false) {
    if (playNext) {
      setQueue((prev) => [track, ...prev]);
      showToast(`Queued next: "${track.title}"`, "success");
    } else {
      setQueue((prev) => [...prev, track]);
      showToast(`Added to queue (${queue.length + 1}): "${track.title}"`, "success");
    }
  }

  function removeFromQueue(index: number) {
    setQueue((prev) => prev.filter((_, i) => i !== index));
    showToast("Removed from queue", "info");
  }

  function moveQueueItem(fromIndex: number, toIndex: number) {
    if (toIndex < 0 || toIndex >= queue.length) return;
    setQueue((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }

  function clearQueue() {
    setQueue([]);
    showToast("Jukebox queue cleared", "info");
  }

  // Filtered crate catalog
  const filteredDiscs = useMemo(() => {
    return catalog.filter((disc) => {
      const matchesCategory = activeCategory === "all" || disc.category === activeCategory;
      if (!matchesCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        disc.title.toLowerCase().includes(q) ||
        disc.artist.toLowerCase().includes(q) ||
        disc.album.toLowerCase().includes(q) ||
        disc.vibe.toLowerCase().includes(q) ||
        (disc.addedBy && disc.addedBy.toLowerCase().includes(q))
      );
    });
  }, [catalog, activeCategory, searchQuery]);

  // YouTube URL preview updater in modal
  function handleSuggestUrlChange(val: string) {
    setSuggestInputUrl(val);
    const parsedId = parseYouTubeId(val);
    setSuggestPreviewId(parsedId);
  }

  // Submit new song
  async function submitTrack(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    setSuggestSending(true);
    setSuggestStatus({ kind: "idle", msg: "" });

    const payload = Object.fromEntries(formData.entries());

    try {
      const res = await fetch("/api/discs/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { ok?: boolean; error?: string; track?: DiscTrack; message?: string };

      if (!res.ok || !data.ok || !data.track) {
        throw new Error(data.error || "Could not submit track.");
      }

      const newTrack = data.track;

      // Add to catalog & save to localStorage
      setCatalog((prev) => [newTrack, ...prev]);
      try {
        const existing = JSON.parse(localStorage.getItem("dougies-custom-discs") || "[]") as DiscTrack[];
        localStorage.setItem("dougies-custom-discs", JSON.stringify([newTrack, ...existing]));
      } catch {
        // Ignore
      }

      // Add to queue and optionally play immediately
      addToQueue(newTrack, true);

      setSuggestStatus({ kind: "success", msg: data.message || "Disc dropped into the jukebox!" });
      showToast(`Added "${newTrack.title}" to Dougie's Jukebox!`, "success");

      form.reset();
      setSuggestInputUrl("");
      setSuggestPreviewId(null);

      setTimeout(() => {
        setIsSuggestOpen(false);
        setSuggestStatus({ kind: "idle", msg: "" });
      }, 1500);
    } catch (err) {
      setSuggestStatus({
        kind: "error",
        msg: err instanceof Error ? err.message : "Error submitting track.",
      });
    } finally {
      setSuggestSending(false);
    }
  }

  // Synthesized Soundboard Sound FX (Web Audio API)
  function playSoundbite(label: string, quote: string, type: "horn" | "engine" | "crackle" | "bell") {
    setSoundboardQuote(quote);
    setTimeout(() => setSoundboardQuote(null), 3500);

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      if (type === "horn") {
        // Brass chord flourish (Blues Brothers horn section burst)
        const freqs = [220, 277.18, 329.63, 440]; // A major / blues chord
        freqs.forEach((f) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(f, now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.6);
        });
      } else if (type === "engine") {
        // Bluesmobile rev / siren synth
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(540, now + 0.4);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === "crackle") {
        // Vinyl needle drop crackle
        const bufferSize = ctx.sampleRate * 0.5;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() < 0.04 ? (Math.random() * 2 - 1) * 0.4 : (Math.random() * 2 - 1) * 0.02;
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        noise.connect(gain);
        gain.connect(ctx.destination);
        noise.start(now);
      } else if (type === "bell") {
        // Cash register / nickel drop in jukebox slot
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1480, now);
        osc.frequency.setValueAtTime(2200, now + 0.08);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch {
      // AudioContext unavailable
    }
  }

  return (
    <section className="dougies-discs-container" aria-label="Dougie's Discs Jukebox Console">
      {/* Background Star Ambient Atmosphere */}
      <div className="jukebox-stars" aria-hidden="true" />

      {/* Floating Notification Toasts */}
      {toasts.length > 0 && (
        <aside className="disc-toasts" aria-live="polite">
          {toasts.map((toast) => (
            <div key={toast.id} className={`disc-toast toast-${toast.kind}`}>
              <span>◈</span>
              <p>{toast.text}</p>
            </div>
          ))}
        </aside>
      )}

      {/* Jukebox Heading & Top Stats */}
      <header className="jukebox-header">
        <div>
          <p className="eyebrow">Outer Rim Speakeasy · 33⅓ &amp; 45 RPM</p>
          <h2>
            Dougie&apos;s Discs.<br />
            <em>Drop a credit. Spin the blues.</em>
          </h2>
          <div className="jukebox-frequency">
            <span>BB-45</span>
            Chicago Blues &amp; Soul Transmission
          </div>
        </div>

        <div className="jukebox-stats-card">
          <div className="status-indicator">
            <span className={`live-bulb${isPlaying ? " is-pulsing" : ""}`} />
            <strong>Jukebox Online</strong>
          </div>
          <div className="stats-breakdown">
            <span><b>{catalog.length}</b> records in the crate</span>
            <span><b>{queue.length}</b> in queue</span>
          </div>
          <button
            type="button"
            className="suggest-trigger-btn"
            onClick={() => {
              setIsSuggestOpen(true);
              playSoundbite("Nickel", "Drop a nickel in the slot!", "bell");
            }}
          >
            <span aria-hidden="true">🪙</span> Drop a Record in the Slot
          </button>
        </div>
      </header>

      {/* Speech bubble for Soundboard quotes */}
      {soundboardQuote && (
        <div className="soundboard-shout" aria-live="assertive">
          <span className="shout-tag">Jake &amp; Elwood Voiceover</span>
          <p>&ldquo;{soundboardQuote}&rdquo;</p>
        </div>
      )}

      {/* MAIN JUKEBOX CONSOLE */}
      <div className="jukebox-console">
        {/* LEFT / CENTER: TURNTABLE & PLAYER STAGE */}
        <div className="jukebox-deck-stage">
          {/* Deck Header & View Mode Switcher */}
          <div className="deck-mode-bar">
            <div className="deck-station-info">
              <span className="station-led" />
              <strong>DECK A · {currentTrack.album} ({currentTrack.year})</strong>
            </div>

            <div className="deck-mode-toggles">
              <button
                type="button"
                className={playerMode === "vinyl" ? "active" : ""}
                onClick={() => setPlayerMode("vinyl")}
                title="Spinning Turntable View"
              >
                <span>💿</span> Turntable Deck
              </button>
              <button
                type="button"
                className={playerMode === "video" ? "active" : ""}
                onClick={() => setPlayerMode("video")}
                title="YouTube Video Clip View"
              >
                <span>📺</span> Video Stage
              </button>
            </div>
          </div>

          {/* TURNTABLE / VIDEO DISPLAY AREA */}
          <div className="deck-viewport" ref={playerContainerRef}>
            {/* HIDDEN / EMBEDDED YOUTUBE PLAYER CONTAINER */}
            <div
              className={`yt-embed-wrap${playerMode === "video" ? " is-visible" : " is-background"}`}
              aria-label="YouTube Music Player"
            >
              <div id="dougies-yt-player" />
            </div>

            {/* REALISTIC SPINNING VINYL DECK VIEW */}
            {playerMode === "vinyl" && (
              <div className="vinyl-deck-container" aria-hidden="false">
                <div className={`turntable-platter platter-${currentTrack.vinylColor}`}>
                  {/* Glowing Platter Neon Rim */}
                  <div className={`platter-rim-glow${isPlaying ? " is-active" : ""}`} />

                  {/* Grooved Vinyl Disc */}
                  <div className={`vinyl-disc${isPlaying ? " is-spinning" : ""}`}>
                    <div className="vinyl-groove-ring ring-1" />
                    <div className="vinyl-groove-ring ring-2" />
                    <div className="vinyl-groove-ring ring-3" />
                    <div className="vinyl-groove-ring ring-4" />
                    <div className="vinyl-groove-ring ring-5" />

                    {/* Center Record Label */}
                    <div className={`vinyl-center-label label-${currentTrack.vinylColor}`}>
                      <div className="label-top">DOUGIE&apos;S 45 RPM</div>
                      <div className="label-hole" />
                      <div className="label-track-title">{currentTrack.title}</div>
                      <div className="label-artist">{currentTrack.artist}</div>
                      <div className="label-bot">STEREOPHONIC · BLUES BROTHERS REC</div>
                    </div>
                  </div>

                  {/* Realistic Tonearm */}
                  <div className={`turntable-tonearm${isPlaying ? " arm-cued" : " arm-parked"}`}>
                    <div className="tonearm-base" />
                    <div className="tonearm-pivot" />
                    <div className="tonearm-wand" />
                    <div className="tonearm-cartridge">
                      <span className="stylus-led" />
                    </div>
                  </div>
                </div>

                {/* Animated Neon Audio Spectrum Equalizer */}
                <div className={`audio-equalizer${isPlaying ? " is-pulsing" : ""}`} aria-label="Audio Visualizer">
                  <span className="eq-bar bar-1" />
                  <span className="eq-bar bar-2" />
                  <span className="eq-bar bar-3" />
                  <span className="eq-bar bar-4" />
                  <span className="eq-bar bar-5" />
                  <span className="eq-bar bar-6" />
                  <span className="eq-bar bar-7" />
                  <span className="eq-bar bar-8" />
                  <span className="eq-bar bar-9" />
                  <span className="eq-bar bar-10" />
                  <span className="eq-bar bar-11" />
                  <span className="eq-bar bar-12" />
                </div>
              </div>
            )}
          </div>

          {/* RETRO LED READOUT / NOW PLAYING DISPLAY */}
          <div className="jukebox-readout-panel">
            <div className="readout-eyebrow">
              <span className="pulse-dot" />
              <strong>{isPlaying ? "NOW SPINNING ON THE TURNTABLE" : "JUKEBOX PAUSED · SELECT A RECORD"}</strong>
              <span className="readout-badge">{currentTrack.categoryLabel}</span>
              <span className="readout-tempo">{currentTrack.tempo}</span>
            </div>

            <div className="readout-main">
              <div className="readout-titles">
                <h3 className="track-title-led">{currentTrack.title}</h3>
                <p className="track-artist-led">{currentTrack.artist}</p>
              </div>
              <div className="readout-meta">
                <span className="meta-album">{currentTrack.album}</span>
                <span className="meta-duration">{currentTrack.duration}</span>
                {currentTrack.addedBy && (
                  <span className="meta-addedby">Queued by: <strong>{currentTrack.addedBy}</strong></span>
                )}
              </div>
            </div>

            <p className="readout-vibe">&ldquo;{currentTrack.vibe}&rdquo;</p>
          </div>

          {/* JUKEBOX CONTROLS BAR */}
          <div className="jukebox-controls-bar">
            {/* Playback Controls */}
            <div className="playback-button-group">
              <button
                type="button"
                className="control-btn btn-secondary"
                onClick={skipPrev}
                title="Previous Track"
                aria-label="Previous Track"
              >
                ⏮
              </button>

              <button
                type="button"
                className={`control-btn btn-primary${isPlaying ? " is-playing" : ""}`}
                onClick={togglePlayPause}
                title={isPlaying ? "Pause Track" : "Play Track"}
                aria-label={isPlaying ? "Pause Track" : "Play Track"}
              >
                {isPlaying ? "⏸ PAUSE" : "▶ SPIN"}
              </button>

              <button
                type="button"
                className="control-btn btn-secondary"
                onClick={skipNext}
                title="Next Track"
                aria-label="Next Track"
              >
                ⏭
              </button>

              <button
                type="button"
                className={`control-btn btn-toggle${isShuffle ? " is-active" : ""}`}
                onClick={() => {
                  setIsShuffle(!isShuffle);
                  showToast(isShuffle ? "Shuffle disabled" : "Shuffle crate enabled", "info");
                }}
                title={isShuffle ? "Shuffle On" : "Shuffle Off"}
                aria-pressed={isShuffle}
              >
                🔀
              </button>

              <button
                type="button"
                className={`control-btn btn-toggle${repeatMode !== "off" ? " is-active" : ""}`}
                onClick={() => {
                  const nextMode = repeatMode === "off" ? "all" : repeatMode === "all" ? "one" : "off";
                  setRepeatMode(nextMode);
                  showToast(`Repeat: ${nextMode.toUpperCase()}`, "info");
                }}
                title={`Repeat: ${repeatMode}`}
              >
                {repeatMode === "one" ? "🔂" : "🔁"}
              </button>
            </div>

            {/* Volume & Audio Controls */}
            <div className="volume-control-group">
              <button
                type="button"
                className="mute-btn"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}
              </button>
              <label className="volume-slider-label">
                <span className="sr-only">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="volume-slider"
                />
              </label>
              <span className="volume-percentage">{isMuted ? 0 : volume}%</span>
            </div>

            {/* Queue Toggle Button */}
            <button
              type="button"
              className={`queue-toggle-btn${isQueueOpen ? " is-open" : ""}`}
              onClick={() => setIsQueueOpen(!isQueueOpen)}
              aria-expanded={isQueueOpen}
              aria-controls="jukebox-queue-drawer"
            >
              <span>📋</span>
              <strong>Queue</strong>
              <span className="queue-count-badge">{queue.length}</span>
            </button>
          </div>
        </div>

        {/* RIGHT: THE UP NEXT QUEUE DRAWER / PANEL */}
        <aside
          className={`jukebox-queue-panel${isQueueOpen ? " is-expanded" : ""}`}
          id="jukebox-queue-drawer"
          aria-label="Up Next Queue"
        >
          <div className="queue-panel-header">
            <div>
              <h4>Up Next in the Slot</h4>
              <p>{queue.length === 0 ? "Queue is empty · Autoplaying crate" : `${queue.length} track(s) ready to spin`}</p>
            </div>
            {queue.length > 0 && (
              <button type="button" className="clear-queue-btn" onClick={clearQueue}>
                Clear
              </button>
            )}
          </div>

          {/* Queue Auto-advance toggle */}
          <div className="queue-settings-bar">
            <label className="auto-advance-toggle">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(e) => setAutoAdvance(e.target.checked)}
              />
              <span>Autoplay crate when queue ends</span>
            </label>
          </div>

          {/* Queue Track List */}
          <div className="queue-items-list">
            {queue.length === 0 ? (
              <div className="queue-empty-state">
                <span className="empty-icon">💿</span>
                <p>The queue slot is open.</p>
                <small>Click <strong>＋ Queue</strong> on any record below or drop your own YouTube link into the jukebox.</small>
              </div>
            ) : (
              queue.map((track, idx) => (
                <article className="queue-track-row" key={`${track.id}-${idx}`}>
                  <span className="queue-track-number">#{idx + 1}</span>
                  <div className="queue-track-info">
                    <strong>{track.title}</strong>
                    <small>{track.artist} · {track.duration}</small>
                  </div>
                  <div className="queue-track-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setQueue((prev) => prev.filter((_, i) => i !== idx));
                        playTrack(track);
                      }}
                      title="Play right now"
                      className="q-action-btn play"
                    >
                      ▶
                    </button>
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => moveQueueItem(idx, idx - 1)}
                        title="Move Up"
                        className="q-action-btn"
                      >
                        ▲
                      </button>
                    )}
                    {idx < queue.length - 1 && (
                      <button
                        type="button"
                        onClick={() => moveQueueItem(idx, idx + 1)}
                        title="Move Down"
                        className="q-action-btn"
                      >
                        ▼
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFromQueue(idx)}
                      title="Remove from queue"
                      className="q-action-btn remove"
                    >
                      ✕
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* SOUNDBOARD: FAMOUS BLUES BROTHERS SOUNDBITES */}
      <section className="soundboard-section" aria-labelledby="soundboard-heading">
        <div className="signature-heading">
          <div>
            <span>01</span>
            <h3 id="soundboard-heading">Dougie&apos;s Speakeasy Drops &amp; Quotes</h3>
          </div>
          <p>Hit a button for classic movie lines and analog atmosphere.</p>
        </div>

        <div className="soundboard-grid">
          <button
            type="button"
            className="soundbite-card"
            onClick={() =>
              playSoundbite(
                "Mission",
                "We're on a mission from God.",
                "bell"
              )
            }
          >
            <span className="sound-icon">✝️</span>
            <strong>&ldquo;On a mission from God&rdquo;</strong>
            <small>Jake &amp; Elwood motto</small>
          </button>

          <button
            type="button"
            className="soundbite-card"
            onClick={() =>
              playSoundbite(
                "106 Miles",
                "It's 106 miles to Chicago, we got a full tank of gas, half a pack of cigarettes, it's dark and we're wearing sunglasses.",
                "engine"
              )
            }
          >
            <span className="sound-icon">🕶️</span>
            <strong>&ldquo;106 Miles to Chicago&rdquo;</strong>
            <small>Hit it!</small>
          </button>

          <button
            type="button"
            className="soundbite-card"
            onClick={() =>
              playSoundbite(
                "Horns",
                "Play it Steve! Take it out to the street!",
                "horn"
              )
            }
          >
            <span className="sound-icon">🎺</span>
            <strong>&ldquo;Play It, Steve!&rdquo;</strong>
            <small>Memphis brass flourish</small>
          </button>

          <button
            type="button"
            className="soundbite-card"
            onClick={() =>
              playSoundbite(
                "Needle Drop",
                "Spinning 45 RPM analogue vinyl directly from Chess Records.",
                "crackle"
              )
            }
          >
            <span className="sound-icon">📻</span>
            <strong>&ldquo;Needle Drop &amp; Vinyl Crackle&rdquo;</strong>
            <small>33⅓ / 45 RPM stylus drop</small>
          </button>
        </div>
      </section>

      {/* CRATE DIGGING: CATALOG OF VINYL DISCS */}
      <section className="crate-catalog-section" aria-labelledby="crate-heading">
        <div className="signature-heading">
          <div>
            <span>02</span>
            <h3 id="crate-heading">Digging in Dougie&apos;s Vinyl Crate</h3>
          </div>
          <p>Browse Chicago blues legends, Stax soul, and movie soundtracks.</p>
        </div>

        {/* Filter Pills & Search Bar */}
        <div className="crate-filter-bar">
          <div className="category-pills" role="tablist" aria-label="Disc Categories">
            {DISC_CATEGORIES.map((cat) => {
              const count =
                cat.id === "all"
                  ? catalog.length
                  : catalog.filter((d) => d.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={activeCategory === cat.id}
                  className={`category-pill${activeCategory === cat.id ? " is-active" : ""}`}
                  onClick={() => setActiveCategory(cat.id)}
                >
                  <span className="pill-icon">{cat.icon}</span>
                  <strong>{cat.label}</strong>
                  <span className="pill-count">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="crate-search-wrap">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              placeholder="Search artist, track, album or vibe…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="crate-search-input"
              aria-label="Search records in crate"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* GRID OF VINYL RECORD CARDS */}
        {filteredDiscs.length === 0 ? (
          <div className="no-records-card">
            <p>No records found matching &ldquo;{searchQuery}&rdquo;.</p>
            <button type="button" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
              Reset filters
            </button>
          </div>
        ) : (
          <div className="vinyl-grid">
            {filteredDiscs.map((disc, idx) => {
              const isCurrent = currentTrack.id === disc.id;
              const queuePosition = queue.findIndex((q) => q.id === disc.id);
              const inQueue = queuePosition !== -1;

              return (
                <article
                  key={disc.id}
                  className={`vinyl-card card-${disc.vinylColor}${isCurrent ? " is-current-spinning" : ""}`}
                >
                  {/* Outer Sleeve with Slide-out Vinyl */}
                  <div className="vinyl-sleeve-wrap">
                    <div className="vinyl-sleeve-jacket">
                      <div className="jacket-header">
                        <span className="jacket-label-badge">{disc.categoryLabel}</span>
                        <span className="jacket-year">{disc.year}</span>
                      </div>

                      <div className="jacket-artwork">
                        <span className="jacket-disc-mark" aria-hidden="true">
                          {disc.category === "blues-brothers" ? "🕶️" : disc.category === "chicago-blues" ? "🎷" : "🎸"}
                        </span>
                        <h4>{disc.title}</h4>
                        <p>{disc.artist}</p>
                      </div>

                      <div className="jacket-footer">
                        <small>{disc.album}</small>
                        <span>{disc.duration}</span>
                      </div>
                    </div>

                    {/* Sliding Vinyl Record Edge */}
                    <div className={`sliding-vinyl disc-${disc.vinylColor}${isCurrent && isPlaying ? " is-spinning-fast" : ""}`}>
                      <div className="inner-label">
                        <span />
                      </div>
                    </div>
                  </div>

                  {/* Card Content & Action Bar */}
                  <div className="vinyl-card-body">
                    <p className="card-vibe">&ldquo;{disc.vibe}&rdquo;</p>
                    {disc.addedBy && (
                      <span className="card-contributor">Drop by: <strong>{disc.addedBy}</strong></span>
                    )}

                    <div className="card-actions">
                      <button
                        type="button"
                        className={`btn-spin-now${isCurrent && isPlaying ? " is-active" : ""}`}
                        onClick={() => playTrack(disc)}
                        aria-label={`Spin ${disc.title}`}
                      >
                        {isCurrent && isPlaying ? "⏸ Spinning" : "▶ Spin Now"}
                      </button>

                      <button
                        type="button"
                        className={`btn-queue-add${inQueue ? " in-queue" : ""}`}
                        onClick={() => addToQueue(disc)}
                        title={inQueue ? `In queue at #${queuePosition + 1}` : "Add to Jukebox queue"}
                      >
                        {inQueue ? `✓ #${queuePosition + 1}` : "＋ Queue"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* SUGGESTION / DROP A NICKEL MODAL DIALOG */}
      {isSuggestOpen && (
        <div className="modal-backdrop" onClick={() => setIsSuggestOpen(false)}>
          <div
            className="disc-suggest-dialog"
            role="dialog"
            aria-labelledby="suggest-dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dialog-head">
              <div>
                <p className="eyebrow">Guild Transmission · Crate Drop</p>
                <h3 id="suggest-dialog-title">Drop a Nickel into Dougie&apos;s Jukebox</h3>
              </div>
              <button
                type="button"
                className="dialog-close-btn"
                onClick={() => setIsSuggestOpen(false)}
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>

            <p className="dialog-intro">
              Got a legendary Chicago blues cut, Stax soul gem, or high-octane R&amp;B anthem?
              Paste the YouTube link below to immediately spin it in the Jukebox and submit it to the guild collection.
            </p>

            <form className="disc-suggest-form" onSubmit={submitTrack}>
              <div className="form-grid">
                <label className="form-field">
                  <span>Track Title *</span>
                  <input
                    name="title"
                    required
                    maxLength={120}
                    placeholder="e.g. Born in Chicago"
                  />
                </label>

                <label className="form-field">
                  <span>Artist / Band *</span>
                  <input
                    name="artist"
                    required
                    maxLength={120}
                    placeholder="e.g. The Paul Butterfield Blues Band"
                  />
                </label>

                <label className="form-field form-full">
                  <span>YouTube Video Link or ID *</span>
                  <input
                    name="youtubeUrl"
                    required
                    maxLength={500}
                    value={suggestInputUrl}
                    onChange={(e) => handleSuggestUrlChange(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=... or youtu.be/..."
                  />
                  <small className="field-hint">Supports standard YouTube URLs, short links, or direct 11-char video IDs.</small>
                </label>

                {/* Instant Live YouTube Video Preview */}
                {suggestPreviewId && (
                  <div className="yt-preview-card form-full">
                    <div className="preview-thumb-wrap">
                      <Image
                        src={`https://img.youtube.com/vi/${suggestPreviewId}/mqdefault.jpg`}
                        alt="YouTube video preview thumbnail"
                        width={180}
                        height={100}
                        unoptimized
                        className="preview-thumb"
                      />
                      <span className="preview-pill">✓ Valid YouTube ID: {suggestPreviewId}</span>
                    </div>
                    <div className="preview-meta">
                      <strong>Preview confirmed</strong>
                      <p>This video is ready to be loaded and spun on the turntable.</p>
                    </div>
                  </div>
                )}

                <label className="form-field">
                  <span>Category / Vibe</span>
                  <select name="category" defaultValue="chicago-blues">
                    <option value="blues-brothers">Blues Brothers Anthem</option>
                    <option value="chicago-blues">Chicago Blues Legend</option>
                    <option value="stax-soul">Stax, Motown &amp; Soul</option>
                    <option value="delta-roots">Delta &amp; Roots Blues</option>
                    <option value="community">Guild Member Pick</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Your Callsign / Name</span>
                  <input
                    name="submitterName"
                    maxLength={80}
                    placeholder="e.g. Elwood, Brother Mike"
                  />
                </label>

                <label className="form-field form-full">
                  <span>Why does this record have soul? (Optional story)</span>
                  <textarea
                    name="notes"
                    rows={2}
                    maxLength={1000}
                    placeholder="Tell the guild why this track deserves a spot in the crate…"
                  />
                </label>

                {/* Anti-bot Honeypot */}
                <label className="cafe-honeypot" aria-hidden="true">
                  <span>Website</span>
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              {suggestStatus.msg && (
                <div className={`form-status status-${suggestStatus.kind}`} aria-live="polite">
                  {suggestStatus.msg}
                </div>
              )}

              <div className="dialog-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsSuggestOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={suggestSending || !suggestPreviewId}
                  className="btn-submit-record"
                >
                  {suggestSending ? "Loading into Jukebox…" : "🪙 Drop in Jukebox & Spin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
