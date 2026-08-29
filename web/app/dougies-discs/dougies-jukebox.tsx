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
        element: string | HTMLElement,
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
  const [hasStartedPlayback, setHasStartedPlayback] = useState<boolean>(false);
  const [playerMode, setPlayerMode] = useState<"vinyl" | "video">("vinyl");
  const [activeCategory, setActiveCategory] = useState<DiscCategory>("all");
  const [crateViewMode, setCrateViewMode] = useState<"grid" | "compact">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [volume, setVolume] = useState<number>(100);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<"off" | "all" | "one">("all");
  const [isShuffle, setIsShuffle] = useState<boolean>(false);
  const [autoAdvance, setAutoAdvance] = useState<boolean>(true);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
  const [quickAddSearch, setQuickAddSearch] = useState<string>("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [isSuggestOpen, setIsSuggestOpen] = useState<boolean>(false);
  const [suggestPreviewId, setSuggestPreviewId] = useState<string | null>(null);
  const [suggestInputUrl, setSuggestInputUrl] = useState<string>("");
  const [suggestSending, setSuggestSending] = useState<boolean>(false);
  const [suggestStatus, setSuggestStatus] = useState<{ kind: "idle" | "success" | "error"; msg: string }>({ kind: "idle", msg: "" });
  const [soundboardQuote, setSoundboardQuote] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const consoleRef = useRef<HTMLDivElement | null>(null);
  const crateRef = useRef<HTMLElement | null>(null);

  // Live state refs to prevent any closure capture / stale state in YT event callbacks
  const queueRef = useRef<DiscTrack[]>(queue);
  queueRef.current = queue;
  const catalogRef = useRef<DiscTrack[]>(catalog);
  catalogRef.current = catalog;
  const currentTrackRef = useRef<DiscTrack>(currentTrack);
  currentTrackRef.current = currentTrack;
  const repeatModeRef = useRef(repeatMode);
  repeatModeRef.current = repeatMode;
  const autoAdvanceRef = useRef(autoAdvance);
  autoAdvanceRef.current = autoAdvance;
  const isShuffleRef = useRef(isShuffle);
  isShuffleRef.current = isShuffle;

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

  // Track cockpit visibility to show floating bottom player bar when scrolled past
  useEffect(() => {
    if (!consoleRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyBar(!entry.isIntersecting);
      },
      { threshold: 0.15 }
    );
    observer.observe(consoleRef.current);
    return () => observer.disconnect();
  }, []);

  // Save queue to localStorage when it changes
  useEffect(() => {
    try {
      localStorage.setItem("dougies-queue", JSON.stringify(queue));
    } catch {
      // Ignore
    }
  }, [queue]);

  // Direct postMessage helper to send commands to YouTube IFrame
  const postToYT = (func: string, args: unknown[] = []) => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: "command", func, args }),
          "*"
        );
      } catch {
        // Ignore cross-origin error
      }
    }
  };

  // Handle track ending -> advance queue or loop (always reads live refs)
  function handleTrackEnded() {
    if (repeatModeRef.current === "one") {
      postToYT("seekTo", [0, true]);
      postToYT("playVideo");
      if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
      return;
    }

    const currentQ = queueRef.current;
    if (currentQ.length > 0) {
      const next = currentQ[0];
      setQueue(currentQ.slice(1));
      playTrack(next);
      showToast(`Now spinning from queue: "${next.title}"`, "info");
    } else if (autoAdvanceRef.current) {
      const cat = catalogRef.current;
      const current = currentTrackRef.current;
      const currentIndex = cat.findIndex((d) => d.id === current.id);
      let nextIndex = 0;
      if (isShuffleRef.current) {
        nextIndex = Math.floor(Math.random() * cat.length);
      } else if (currentIndex >= 0 && currentIndex < cat.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (repeatModeRef.current === "all") {
        nextIndex = 0;
      } else {
        setIsPlaying(false);
        return;
      }
      const nextTrack = cat[nextIndex];
      if (nextTrack) {
        playTrack(nextTrack);
        showToast(`Auto-advancing: "${nextTrack.title}"`, "info");
      }
    } else {
      setIsPlaying(false);
    }
  }

  // Listen to messages from YouTube iframe to track state
  useEffect(() => {
    const handleYTMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== "string") return;
        const data = JSON.parse(event.data) as { event?: string; info?: number | Record<string, unknown> };
        if (data.event === "onStateChange" && typeof data.info === "number") {
          if (data.info === 1) {
            // PLAYING
            setIsPlaying(true);
            setHasStartedPlayback(true);
          } else if (data.info === 2) {
            // PAUSED
            setIsPlaying(false);
          } else if (data.info === 0) {
            // ENDED -> Trigger track transition
            handleTrackEnded();
          }
        }
      } catch {
        // Ignore non-JSON messages
      }
    };

    window.addEventListener("message", handleYTMessage);
    return () => window.removeEventListener("message", handleYTMessage);
  }, []);

  // Initialize YT API wrapper when script loads
  useEffect(() => {
    let isCancelled = false;

    function initYT() {
      if (!window.YT || !window.YT.Player || !iframeRef.current || isCancelled) return;
      try {
        if (!ytPlayerRef.current) {
          ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onReady: (event) => {
                if (isCancelled) return;
                event.target.setVolume(volume);
                if (isMuted) event.target.mute();
                if (hasStartedPlayback && isPlaying) {
                  event.target.playVideo();
                }
              },
              onStateChange: (event) => {
                if (isCancelled) return;
                if (event.data === 1) {
                  setIsPlaying(true);
                  setHasStartedPlayback(true);
                } else if (event.data === 2) {
                  setIsPlaying(false);
                } else if (event.data === 0) {
                  handleTrackEnded();
                }
              },
            },
          });
        }
      } catch {
        // Fallback to postMessage
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
  }, [currentTrack]);

  // Play specific track with guaranteed iframe trigger
  function playTrack(track: DiscTrack) {
    setCurrentTrack(track);
    setIsPlaying(true);
    setHasStartedPlayback(true);

    if (ytPlayerRef.current) {
      try {
        ytPlayerRef.current.loadVideoById(track.youtubeId);
        ytPlayerRef.current.playVideo();
      } catch {
        postToYT("loadVideoById", [track.youtubeId]);
        postToYT("playVideo");
      }
    } else {
      // Direct postMessage + reload if needed
      postToYT("loadVideoById", [track.youtubeId]);
      postToYT("playVideo");
    }
  }

  function togglePlayPause() {
    if (!hasStartedPlayback) {
      setHasStartedPlayback(true);
      playTrack(currentTrack);
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      postToYT("pauseVideo");
      if (ytPlayerRef.current) ytPlayerRef.current.pauseVideo();
    } else {
      setIsPlaying(true);
      postToYT("playVideo");
      if (ytPlayerRef.current) ytPlayerRef.current.playVideo();
    }
  }

  function skipNext() {
    const currentQ = queueRef.current;
    if (currentQ.length > 0) {
      const next = currentQ[0];
      setQueue(currentQ.slice(1));
      playTrack(next);
      showToast(`Next in queue: "${next.title}"`, "info");
    } else {
      const cat = catalogRef.current;
      const currentIndex = cat.findIndex((d) => d.id === currentTrack.id);
      let nextIndex = 0;
      if (isShuffle) {
        nextIndex = Math.floor(Math.random() * cat.length);
      } else if (currentIndex >= 0 && currentIndex < cat.length - 1) {
        nextIndex = currentIndex + 1;
      } else {
        nextIndex = 0;
      }
      const nextTrack = cat[nextIndex];
      if (nextTrack) {
        playTrack(nextTrack);
        showToast(`Spun: "${nextTrack.title}"`, "info");
      }
    }
  }

  function skipPrev() {
    const cat = catalogRef.current;
    const currentIndex = cat.findIndex((d) => d.id === currentTrack.id);
    let prevIndex = cat.length - 1;
    if (currentIndex > 0) {
      prevIndex = currentIndex - 1;
    }
    const prevTrack = cat[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack);
      showToast(`Previous: "${prevTrack.title}"`, "info");
    }
  }

  function handleVolumeChange(newVol: number) {
    setVolume(newVol);
    postToYT("setVolume", [newVol]);
    if (ytPlayerRef.current) {
      ytPlayerRef.current.setVolume(newVol);
    }
    if (newVol > 0 && isMuted) {
      postToYT("unMute");
      if (ytPlayerRef.current) ytPlayerRef.current.unMute();
      setIsMuted(false);
    }
  }

  function toggleMute() {
    if (isMuted) {
      postToYT("unMute");
      if (ytPlayerRef.current) ytPlayerRef.current.unMute();
      setIsMuted(false);
    } else {
      postToYT("mute");
      if (ytPlayerRef.current) ytPlayerRef.current.mute();
      setIsMuted(true);
    }
  }

  // Enhanced Queue Helpers
  function addToQueue(track: DiscTrack, playNext: boolean = false) {
    if (playNext) {
      setQueue((prev) => [track, ...prev]);
      showToast(`⚡ Set as Up Next (#1): "${track.title}"`, "success");
    } else {
      setQueue((prev) => [...prev, track]);
      showToast(`Added to queue (#${queue.length + 1}): "${track.title}"`, "success");
    }
  }

  function queueCategory(catId: DiscCategory) {
    const tracksToAdd =
      catId === "all"
        ? catalog
        : catalog.filter((d) => d.category === catId);

    setQueue((prev) => [...prev, ...tracksToAdd]);
    const label = DISC_CATEGORIES.find((c) => c.id === catId)?.label || catId;
    showToast(`Added ${tracksToAdd.length} tracks from "${label}" to the queue!`, "success");
  }

  function queueRandomHits(count: number = 5) {
    const shuffled = [...catalog].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    setQueue((prev) => [...prev, ...selected]);
    showToast(`Queued ${selected.length} random crate cuts into the slot!`, "success");
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

  // Quick-Add filter options
  const quickAddOptions = useMemo(() => {
    if (!quickAddSearch.trim()) return catalog.slice(0, 8);
    const q = quickAddSearch.toLowerCase();
    return catalog.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.artist.toLowerCase().includes(q) ||
        d.categoryLabel.toLowerCase().includes(q)
    ).slice(0, 10);
  }, [catalog, quickAddSearch]);

  function handleSuggestUrlChange(val: string) {
    setSuggestInputUrl(val);
    const parsedId = parseYouTubeId(val);
    setSuggestPreviewId(parsedId);
  }

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
      setCatalog((prev) => [newTrack, ...prev]);
      try {
        const existing = JSON.parse(localStorage.getItem("dougies-custom-discs") || "[]") as DiscTrack[];
        localStorage.setItem("dougies-custom-discs", JSON.stringify([newTrack, ...existing]));
      } catch {
        // Ignore
      }

      addToQueue(newTrack, true);
      setSuggestStatus({ kind: "success", msg: data.message || "Disc dropped into the jukebox!" });
      showToast(`Added "${newTrack.title}" to Dougie's Jukebox!`, "success");

      form.reset();
      setSuggestInputUrl("");
      setSuggestPreviewId(null);

      setTimeout(() => {
        setIsSuggestOpen(false);
        setSuggestStatus({ kind: "idle", msg: "" });
      }, 1200);
    } catch (err) {
      setSuggestStatus({
        kind: "error",
        msg: err instanceof Error ? err.message : "Error submitting track.",
      });
    } finally {
      setSuggestSending(false);
    }
  }

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
        const freqs = [220, 277.18, 329.63, 440];
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
      // AudioContext fallback
    }
  }

  function scrollToDeck() {
    consoleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function scrollToCrate() {
    crateRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const iframeSrc = `https://www.youtube-nocookie.com/embed/${currentTrack.youtubeId}?enablejsapi=1&autoplay=${hasStartedPlayback ? 1 : 0}&rel=0&playsinline=1`;

  const nextTrackPreview = queue.length > 0 ? queue[0] : null;

  return (
    <section className="dougies-discs-container" aria-label="Dougie's Discs Jukebox Console">
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

      {/* Speech bubble for Soundboard quotes */}
      {soundboardQuote && (
        <div className="soundboard-shout" aria-live="assertive">
          <span className="shout-tag">Jake &amp; Elwood Voiceover</span>
          <p>&ldquo;{soundboardQuote}&rdquo;</p>
        </div>
      )}

      {/* COMPACT JUKEBOX CHASSIS & COCKPIT */}
      <div className="jukebox-cockpit-wrapper" ref={consoleRef} id="jukebox-deck">
        {/* Cockpit Top Bar */}
        <div className="cockpit-top-bar">
          <div className="cockpit-station">
            <span className={`live-bulb${isPlaying ? " is-pulsing" : ""}`} />
            <strong>DOUGIE&apos;S HI-FI JUKEBOX</strong>
            <span className="station-code">FREQ BB-45</span>
            {queue.length > 0 && (
              <span className="station-queue-badge">
                ⚡ {queue.length} in Up Next
              </span>
            )}
          </div>

          <div className="cockpit-top-actions">
            <button
              type="button"
              className="cockpit-scroll-down-btn"
              onClick={scrollToCrate}
              title="Jump down to dig in crate"
            >
              <span>📂</span> Dig in Crate ({catalog.length})
            </button>

            <div className="cockpit-mode-pills">
              <button
                type="button"
                className={playerMode === "vinyl" ? "active" : ""}
                onClick={() => setPlayerMode("vinyl")}
              >
                <span>💿</span> Turntable
              </button>
              <button
                type="button"
                className={playerMode === "video" ? "active" : ""}
                onClick={() => setPlayerMode("video")}
              >
                <span>📺</span> Video Clip
              </button>
            </div>

            <button
              type="button"
              className="cockpit-drop-record-btn"
              onClick={() => {
                setIsSuggestOpen(true);
                playSoundbite("Nickel", "Drop a nickel in the slot!", "bell");
              }}
            >
              <span aria-hidden="true">🪙</span> Drop a Record
            </button>
          </div>
        </div>

        {/* Cockpit Main Stage: Compact Turntable + Integrated LED Readout & Controls */}
        <div className="cockpit-main-deck">
          {/* LEFT: COMPACT TURNTABLE OR DIRECT VIDEO */}
          <div className={`cockpit-stage-display${playerMode === "video" ? " is-video-active" : ""}`}>
            {/* EMBEDDED YOUTUBE IFRAME (Always active in DOM so sound NEVER gets throttled) */}
            <div className={`active-yt-container${playerMode === "video" ? " is-full-view" : " is-audio-docked"}`}>
              <iframe
                ref={iframeRef}
                id="dougies-yt-iframe"
                src={iframeSrc}
                title="YouTube Video Player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>

            {/* REALISTIC ROTATING VINYL DECK (Visible in Vinyl mode) */}
            {playerMode === "vinyl" && (
              <div className="compact-turntable-card">
                <div className={`compact-platter platter-${currentTrack.vinylColor}`}>
                  <div className={`compact-platter-glow${isPlaying ? " is-active" : ""}`} />

                  {/* Spinning Disc */}
                  <div className={`compact-vinyl-disc${isPlaying ? " is-spinning" : ""}`}>
                    <div className="compact-groove-ring ring-1" />
                    <div className="compact-groove-ring ring-2" />
                    <div className="compact-groove-ring ring-3" />

                    {/* Center 45 RPM Label */}
                    <div className={`compact-center-label label-${currentTrack.vinylColor}`}>
                      <span className="compact-label-tag">45 RPM</span>
                      <div className="compact-spindle-hole" />
                      <strong className="compact-label-title">{currentTrack.title}</strong>
                      <small className="compact-label-artist">{currentTrack.artist}</small>
                    </div>
                  </div>

                  {/* Tonearm */}
                  <div className={`compact-tonearm${isPlaying ? " arm-cued" : " arm-parked"}`}>
                    <div className="c-tonearm-base" />
                    <div className="c-tonearm-wand" />
                    <div className="c-tonearm-cartridge">
                      <span className="c-stylus-light" />
                    </div>
                  </div>
                </div>

                {/* Pulsing Audio Spectrum Equalizer */}
                <div className={`compact-equalizer${isPlaying ? " is-pulsing" : ""}`} aria-label="Audio Visualizer">
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
                </div>
              </div>
            )}
          </div>

          {/* CENTER: NOW PLAYING READOUT & INTEGRATED CONTROLS */}
          <div className="cockpit-center-console">
            {/* LED Status Display */}
            <div className="cockpit-led-screen">
              <div className="screen-header">
                <div className="screen-indicator">
                  <span className="pulse-dot" />
                  <strong>{isPlaying ? "NOW SPINNING" : "JUKEBOX READY"}</strong>
                </div>
                <div className="screen-badges">
                  <span className="badge-cat">{currentTrack.categoryLabel}</span>
                  <span className="badge-tempo">{currentTrack.tempo}</span>
                </div>
              </div>

              <div className="screen-track-info">
                <h3 className="screen-title">{currentTrack.title}</h3>
                <p className="screen-artist">{currentTrack.artist}</p>
              </div>

              <div className="screen-metadata">
                <span>{currentTrack.album} ({currentTrack.year})</span>
                <span className="screen-duration">{currentTrack.duration}</span>
                {currentTrack.addedBy && (
                  <span className="screen-contributor">Queued by: <b>{currentTrack.addedBy}</b></span>
                )}
              </div>

              <p className="screen-vibe">&ldquo;{currentTrack.vibe}&rdquo;</p>

              {/* Up Next Preview Banner */}
              {nextTrackPreview && (
                <div className="screen-up-next-preview">
                  <span className="up-next-tag">Up Next:</span>
                  <strong>{nextTrackPreview.title}</strong>
                  <span className="up-next-artist">({nextTrackPreview.artist})</span>
                  <button
                    type="button"
                    className="up-next-quick-skip"
                    onClick={skipNext}
                    title="Skip immediately to this queued track"
                  >
                    ▶ Spin Next
                  </button>
                </div>
              )}
            </div>

            {/* TIGHT INTEGRATED PLAYBACK CONTROLS (Right below the screen) */}
            <div className="cockpit-controls-row">
              {/* Primary Buttons */}
              <div className="cockpit-playback-group">
                <button
                  type="button"
                  className="c-btn btn-prev"
                  onClick={skipPrev}
                  title="Previous Track"
                  aria-label="Previous Track"
                >
                  ⏮
                </button>

                <button
                  type="button"
                  className={`c-btn btn-main-play${isPlaying ? " is-playing" : ""}`}
                  onClick={togglePlayPause}
                  title={isPlaying ? "Pause Track" : "Play Track"}
                  aria-label={isPlaying ? "Pause Track" : "Play Track"}
                >
                  {isPlaying ? "⏸ PAUSE" : "▶ SPIN"}
                </button>

                <button
                  type="button"
                  className="c-btn btn-next"
                  onClick={skipNext}
                  title={queue.length > 0 ? `Next in Queue: ${queue[0].title}` : "Next Track"}
                  aria-label="Next Track"
                >
                  ⏭
                </button>

                <button
                  type="button"
                  className={`c-btn btn-icon${isShuffle ? " is-active" : ""}`}
                  onClick={() => {
                    setIsShuffle(!isShuffle);
                    showToast(isShuffle ? "Shuffle disabled" : "Shuffle crate enabled", "info");
                  }}
                  title={isShuffle ? "Shuffle: ON" : "Shuffle: OFF"}
                  aria-pressed={isShuffle}
                >
                  🔀
                </button>

                <button
                  type="button"
                  className={`c-btn btn-icon${repeatMode !== "off" ? " is-active" : ""}`}
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

              {/* Volume & Queue Button */}
              <div className="cockpit-secondary-group">
                <div className="cockpit-volume-slider-wrap">
                  <button
                    type="button"
                    className="c-vol-mute-btn"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute" : "Mute"}
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted || volume === 0 ? "🔇" : volume < 50 ? "🔉" : "🔊"}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="cockpit-volume-input"
                    aria-label="Volume Slider"
                  />
                  <span className="cockpit-vol-number">{isMuted ? 0 : volume}%</span>
                </div>

                <button
                  type="button"
                  className={`cockpit-queue-btn${isQueueOpen ? " is-active" : ""}`}
                  onClick={() => setIsQueueOpen(!isQueueOpen)}
                  aria-expanded={isQueueOpen}
                  aria-controls="cockpit-queue-drawer"
                >
                  <span>📋</span>
                  <strong>Up Next</strong>
                  <span className="queue-pill">{queue.length}</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT: UP NEXT QUEUE DRAWER WITH QUICK-ADD & PRESETS */}
          <aside
            className={`cockpit-queue-drawer${isQueueOpen ? " is-open" : ""}`}
            id="cockpit-queue-drawer"
            aria-label="Up Next Queue"
          >
            <div className="queue-head">
              <div>
                <h4>Up Next in the Slot</h4>
                <small>{queue.length === 0 ? "Autoplaying crate catalog" : `${queue.length} track(s) in line`}</small>
              </div>
              {queue.length > 0 && (
                <button type="button" className="q-clear-btn" onClick={clearQueue}>
                  Clear All
                </button>
              )}
            </div>

            {/* INLINE QUICK-ADD SEARCH & DROP BAR */}
            <div className="queue-quick-add-wrap">
              <div className="quick-add-input-row">
                <input
                  type="text"
                  placeholder="⚡ Quick add track to queue…"
                  value={quickAddSearch}
                  onFocus={() => setIsQuickAddOpen(true)}
                  onChange={(e) => {
                    setQuickAddSearch(e.target.value);
                    setIsQuickAddOpen(true);
                  }}
                  className="quick-add-input"
                  aria-label="Quick add track"
                />
                {quickAddSearch && (
                  <button
                    type="button"
                    className="quick-add-clear"
                    onClick={() => {
                      setQuickAddSearch("");
                      setIsQuickAddOpen(false);
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Quick-add Dropdown Suggestions */}
              {isQuickAddOpen && (
                <div className="quick-add-dropdown">
                  <div className="quick-add-dropdown-header">
                    <span>Click to add to queue:</span>
                    <button
                      type="button"
                      className="quick-add-close"
                      onClick={() => setIsQuickAddOpen(false)}
                    >
                      Done
                    </button>
                  </div>
                  <div className="quick-add-items">
                    {quickAddOptions.map((opt) => (
                      <div key={opt.id} className="quick-add-option-row">
                        <div className="opt-meta">
                          <strong>{opt.title}</strong>
                          <small>{opt.artist} · {opt.duration}</small>
                        </div>
                        <div className="opt-actions">
                          <button
                            type="button"
                            className="opt-btn-next"
                            onClick={() => {
                              addToQueue(opt, true);
                              setQuickAddSearch("");
                              setIsQuickAddOpen(false);
                            }}
                            title="Play right after current song"
                          >
                            ⚡ Play Next
                          </button>
                          <button
                            type="button"
                            className="opt-btn-add"
                            onClick={() => {
                              addToQueue(opt, false);
                              setQuickAddSearch("");
                              setIsQuickAddOpen(false);
                            }}
                            title="Add to end of queue"
                          >
                            ＋ Queue
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* QUICK-FILL PRESET SHORTCUTS */}
            <div className="queue-preset-shortcuts">
              <button
                type="button"
                className="q-preset-chip"
                onClick={() => queueCategory("blues-brothers")}
                title="Queue all 10 Blues Brothers anthems"
              >
                🕶️ +Blues Brothers
              </button>
              <button
                type="button"
                className="q-preset-chip"
                onClick={() => queueCategory("chicago-blues")}
                title="Queue all Chicago Blues legends"
              >
                🎷 +Chicago Blues
              </button>
              <button
                type="button"
                className="q-preset-chip"
                onClick={() => queueRandomHits(5)}
                title="Queue 5 random hits from the crate"
              >
                🎲 +5 Random
              </button>
            </div>

            <div className="queue-toggle-row">
              <label className="q-auto-toggle">
                <input
                  type="checkbox"
                  checked={autoAdvance}
                  onChange={(e) => setAutoAdvance(e.target.checked)}
                />
                <span>Continuous crate autoplay</span>
              </label>
            </div>

            <div className="queue-list-scroll">
              {queue.length === 0 ? (
                <div className="queue-empty-box">
                  <span className="q-empty-disc">💿</span>
                  <p>Slot is open.</p>
                  <small>Use <strong>⚡ Quick Add</strong> above, or click <strong>＋ Queue</strong> on any track in the crate below.</small>
                </div>
              ) : (
                queue.map((track, idx) => (
                  <article className="queue-item-card" key={`${track.id}-${idx}`}>
                    <span className="q-num">#{idx + 1}</span>
                    <div className="q-text">
                      <strong>{track.title}</strong>
                      <small>{track.artist} · {track.duration}</small>
                    </div>
                    <div className="q-btns">
                      <button
                        type="button"
                        onClick={() => {
                          setQueue((prev) => prev.filter((_, i) => i !== idx));
                          playTrack(track);
                        }}
                        title="Spin now"
                        className="q-btn-play"
                      >
                        ▶ Spin
                      </button>
                      {idx > 0 && (
                        <button
                          type="button"
                          onClick={() => moveQueueItem(idx, idx - 1)}
                          title="Move up"
                          className="q-btn-move"
                        >
                          ▲
                        </button>
                      )}
                      {idx < queue.length - 1 && (
                        <button
                          type="button"
                          onClick={() => moveQueueItem(idx, idx + 1)}
                          title="Move down"
                          className="q-btn-move"
                        >
                          ▼
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFromQueue(idx)}
                        title="Remove"
                        className="q-btn-del"
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
      </div>

      {/* QUICK SOUNDBOARD: BLUES BROTHERS SOUNDBITES */}
      <section className="soundboard-section" id="soundboard" aria-labelledby="soundboard-heading">
        <div className="signature-heading">
          <div>
            <span>01</span>
            <h3 id="soundboard-heading">Speakeasy Quotes &amp; Analog Drops</h3>
          </div>
          <p>Instant movie quotes &amp; needle-drop atmosphere.</p>
        </div>

        <div className="soundboard-grid">
          <button
            type="button"
            className="soundbite-card"
            onClick={() => playSoundbite("Mission", "We're on a mission from God.", "bell")}
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
            onClick={() => playSoundbite("Horns", "Play it Steve! Take it out to the street!", "horn")}
          >
            <span className="sound-icon">🎺</span>
            <strong>&ldquo;Play It, Steve!&rdquo;</strong>
            <small>Memphis brass flourish</small>
          </button>

          <button
            type="button"
            className="soundbite-card"
            onClick={() => playSoundbite("Needle Drop", "Spinning 45 RPM analogue vinyl directly from Chess Records.", "crackle")}
          >
            <span className="sound-icon">📻</span>
            <strong>&ldquo;Needle Drop &amp; Crackle&rdquo;</strong>
            <small>33⅓ / 45 RPM stylus drop</small>
          </button>
        </div>
      </section>

      {/* CRATE DIGGING: FULL CATALOG */}
      <section className="crate-catalog-section" id="crate-catalog" ref={crateRef} aria-labelledby="crate-heading">
        <div className="signature-heading">
          <div>
            <span>02</span>
            <h3 id="crate-heading">Digging in Dougie&apos;s Vinyl Crate</h3>
          </div>
          <div className="crate-heading-actions">
            <span className="crate-count-chip">{filteredDiscs.length} of {catalog.length} records</span>
            <div className="crate-view-switcher" role="radiogroup" aria-label="Crate view mode">
              <button
                type="button"
                className={crateViewMode === "grid" ? "active" : ""}
                onClick={() => setCrateViewMode("grid")}
                title="Sleeve Grid View"
                aria-checked={crateViewMode === "grid"}
                role="radio"
              >
                <span>▦</span> Sleeves
              </button>
              <button
                type="button"
                className={crateViewMode === "compact" ? "active" : ""}
                onClick={() => setCrateViewMode("compact")}
                title="Compact List View"
                aria-checked={crateViewMode === "compact"}
                role="radio"
              >
                <span>☰</span> Compact
              </button>
            </div>
          </div>
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

        {/* COMPACT LIST VIEW MODE */}
        {filteredDiscs.length === 0 ? (
          <div className="no-records-card">
            <p>No records found matching &ldquo;{searchQuery}&rdquo;.</p>
            <button type="button" onClick={() => { setSearchQuery(""); setActiveCategory("all"); }}>
              Reset filters
            </button>
          </div>
        ) : crateViewMode === "compact" ? (
          <div className="compact-crate-table-card">
            <div className="compact-table-head">
              <span>#</span>
              <span>Title &amp; Artist</span>
              <span className="hide-mobile">Album &amp; Year</span>
              <span>Duration</span>
              <span className="hide-mobile">Vibe</span>
              <span className="th-actions">Actions</span>
            </div>
            <div className="compact-table-body">
              {filteredDiscs.map((disc, i) => {
                const isCurrent = currentTrack.id === disc.id;
                const queuePosition = queue.findIndex((q) => q.id === disc.id);
                const inQueue = queuePosition !== -1;

                return (
                  <div
                    key={disc.id}
                    className={`compact-table-row row-${disc.vinylColor}${isCurrent ? " is-current" : ""}`}
                  >
                    <span className="row-num">{i + 1}</span>
                    <div className="row-title-col">
                      <span className={`vinyl-dot dot-${disc.vinylColor}`} />
                      <div>
                        <strong>{disc.title}</strong>
                        <small>{disc.artist}</small>
                      </div>
                    </div>
                    <div className="row-album-col hide-mobile">
                      <span>{disc.album}</span>
                      <small>{disc.year} · {disc.categoryLabel}</small>
                    </div>
                    <span className="row-duration">{disc.duration}</span>
                    <p className="row-vibe hide-mobile">&ldquo;{disc.vibe}&rdquo;</p>
                    <div className="row-actions">
                      <button
                        type="button"
                        className={`tbl-btn-spin${isCurrent && isPlaying ? " is-playing" : ""}`}
                        onClick={() => playTrack(disc)}
                        title="Spin immediately"
                      >
                        {isCurrent && isPlaying ? "⏸ Spinning" : "▶ Spin"}
                      </button>
                      <button
                        type="button"
                        className="tbl-btn-next"
                        onClick={() => addToQueue(disc, true)}
                        title="Play next after current song"
                      >
                        ⚡ Next
                      </button>
                      <button
                        type="button"
                        className={`tbl-btn-queue${inQueue ? " in-queue" : ""}`}
                        onClick={() => addToQueue(disc, false)}
                        title={inQueue ? `In queue at #${queuePosition + 1}` : "Add to queue"}
                      >
                        {inQueue ? `✓ #${queuePosition + 1}` : "＋ Queue"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* RICH SLEEVES GRID VIEW MODE */
          <div className="vinyl-grid">
            {filteredDiscs.map((disc) => {
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

                    {/* Sliding Vinyl Record */}
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

                    {/* Multi-action Queue Buttons */}
                    <div className="card-actions-row">
                      <button
                        type="button"
                        className={`btn-spin-now${isCurrent && isPlaying ? " is-active" : ""}`}
                        onClick={() => playTrack(disc)}
                        aria-label={`Spin ${disc.title}`}
                      >
                        {isCurrent && isPlaying ? "⏸ Spinning" : "▶ Spin"}
                      </button>

                      <button
                        type="button"
                        className="btn-play-next"
                        onClick={() => addToQueue(disc, true)}
                        title="Play right after current track"
                      >
                        ⚡ Next
                      </button>

                      <button
                        type="button"
                        className={`btn-queue-add${inQueue ? " in-queue" : ""}`}
                        onClick={() => addToQueue(disc, false)}
                        title={inQueue ? `In queue at #${queuePosition + 1}` : "Add to end of queue"}
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

      {/* PERSISTENT FLOATING STICKY MINI-PLAYER (Visible when scrolled past main cockpit) */}
      {showStickyBar && (
        <aside className="jukebox-floating-bar" aria-label="Persistent Mini Jukebox Controller">
          <div className="floating-inner">
            {/* Left: Mini Spinning Vinyl + Track info */}
            <div className="floating-track-info" onClick={scrollToDeck} title="Click to jump to Turntable Deck">
              <div className={`floating-mini-disc disc-${currentTrack.vinylColor}${isPlaying ? " is-spinning" : ""}`}>
                <div className="mini-disc-hole" />
              </div>
              <div className="floating-text">
                <strong>{currentTrack.title}</strong>
                <small>{currentTrack.artist} · {currentTrack.duration}</small>
              </div>
            </div>

            {/* Center: Playback buttons */}
            <div className="floating-controls">
              <button
                type="button"
                className="fl-btn"
                onClick={skipPrev}
                title="Previous Track"
                aria-label="Previous Track"
              >
                ⏮
              </button>

              <button
                type="button"
                className={`fl-btn-play${isPlaying ? " is-playing" : ""}`}
                onClick={togglePlayPause}
                title={isPlaying ? "Pause Track" : "Play Track"}
                aria-label={isPlaying ? "Pause Track" : "Play Track"}
              >
                {isPlaying ? "⏸" : "▶"}
              </button>

              <button
                type="button"
                className="fl-btn"
                onClick={skipNext}
                title={queue.length > 0 ? `Next: ${queue[0].title}` : "Next Track"}
                aria-label="Next Track"
              >
                ⏭
              </button>

              {/* Volume Slider in Mini-bar */}
              <div className="floating-volume">
                <button
                  type="button"
                  className="fl-vol-btn"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? "🔇" : "🔊"}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="fl-vol-slider"
                  aria-label="Floating Volume"
                />
              </div>
            </div>

            {/* Right: Up Next Pill + Jump to Top Deck */}
            <div className="floating-actions">
              <button
                type="button"
                className="fl-queue-pill"
                onClick={scrollToDeck}
                title="View Up Next queue in Cockpit"
              >
                <span>📋 Up Next</span>
                <span className="fl-queue-num">{queue.length}</span>
              </button>

              <button
                type="button"
                className="fl-jump-deck-btn"
                onClick={scrollToDeck}
                title="Scroll back up to Turntable Deck"
              >
                ↑ Turntable
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* SUGGESTION / DROP A RECORD MODAL */}
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
