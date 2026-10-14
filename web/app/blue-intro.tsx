"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { keyGreen } from "@/lib/chroma-key";

const WIDTH = 640; // the clip is 16:9; keying at this size keeps phones smooth
const HEIGHT = 360;

/**
 * "Meet B-Lue3": B-Lue3's avatar with a play badge. A tap opens a short clip of B-Lue3 with the green screen
 * removed live, so he floats over the page. The video only downloads when someone taps.
 */
export default function BlueIntro({ variant = "avatar", size = 56, endHref = "#ask-blue", endLabel = "Ask B-Lue3 a question" }: { variant?: "avatar" | "welcome" | "hub"; size?: number; endHref?: string; endLabel?: string }) {
  const [open, setOpen] = useState(false);
  const [ended, setEnded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number | null>(null);

  const close = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    videoRef.current?.pause();
    setOpen(false);
    setEnded(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d", { willReadFrequently: true });
    if (!video || !canvas || !context) return;

    const draw = () => {
      context.drawImage(video, 0, 0, WIDTH, HEIGHT);
      const frame = context.getImageData(0, 0, WIDTH, HEIGHT);
      keyGreen(frame.data);
      context.putImageData(frame, 0, 0);
      if (!video.paused && !video.ended) frameRef.current = requestAnimationFrame(draw);
    };
    const start = () => { frameRef.current = requestAnimationFrame(draw); };
    video.addEventListener("play", start);
    // The tap that opened this counts as the permission to play with sound; fall back to silent if refused.
    video.play().catch(() => {
      video.muted = true;
      void video.play().catch(() => undefined);
    });

    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => {
      video.removeEventListener("play", start);
      window.removeEventListener("keydown", onKey);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [open, close]);

  return (
    <>
      {variant === "hub" ? (
        <button type="button" className="hub-blue-play" onClick={() => setOpen(true)} aria-label="Meet B-Lue3: play a short clip">
          <Image src="/blue.png" alt="" width={size * 2} height={size * 2} style={{ width: size, height: size }} />
          <span aria-hidden="true">▶ Meet B-Lue3</span>
        </button>
      ) : variant === "welcome" ? (
        <button type="button" className="blue-intro-welcome" onClick={() => setOpen(true)} aria-label="Play a welcome from B-Lue3">
          <Image src="/blue.png" alt="" width={60} height={60} />
          <span aria-hidden="true">▶</span>
        </button>
      ) : (
        <button type="button" className="blue-intro-btn" onClick={() => setOpen(true)} aria-label="Meet B-Lue3: play a short clip">
          <Image src="/blue.png" alt="" className="blue-briefing-avatar" width={300} height={300} priority />
          <span className="blue-intro-play" aria-hidden="true">▶<b> Meet B-Lue3</b></span>
        </button>
      )}
      {open ? (
        <div className="blue-intro-overlay" role="dialog" aria-modal="true" aria-label="Meet B-Lue3">
          <button type="button" className="blue-intro-backdrop" aria-label="Close" onClick={close} />
          <div className="blue-intro-stage">
            <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} className="blue-intro-canvas" />
            <video ref={videoRef} src="/blue-intro.mp4" playsInline preload="auto" className="blue-intro-video" onEnded={() => setEnded(true)} />
            <div className="blue-intro-actions">
              {ended ? <a href={endHref} onClick={close}>{endLabel}</a> : null}
              <button type="button" onClick={close}>{ended ? "Close" : "Skip"}</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
