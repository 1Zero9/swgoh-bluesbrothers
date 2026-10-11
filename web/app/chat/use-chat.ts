"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatMessage } from "@/lib/chat";

/**
 * Loads one channel's messages and keeps them fresh while the page is visible. Shared by the full chat page
 * and the home page panel. `loaded` belongs to a channel, so switching channels shows a loading state
 * without resetting state inside an effect.
 */
export function useChat(channel: string, intervalMs = 6000) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canPost, setCanPost] = useState(false);
  const [contentHidden, setContentHidden] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/messages?channel=${encodeURIComponent(channel)}`, { cache: "no-store" });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string; messages?: ChatMessage[]; canPost?: boolean; contentHidden?: boolean } | null;
      if (!response.ok || !data?.ok) throw new Error(data?.error || "Couldn't load the chat.");
      setMessages(data.messages ?? []);
      setCanPost(Boolean(data.canPost));
      setContentHidden(Boolean(data.contentHidden));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't load the chat.");
    } finally {
      setLoadedFor(channel);
    }
  }, [channel]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") void load(); };
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, intervalMs);
    document.addEventListener("visibilitychange", tick);
    return () => { clearTimeout(first); clearInterval(timer); document.removeEventListener("visibilitychange", tick); };
  }, [load, intervalMs]);

  /** Sends a message; resolves to an error message, or null when it went through. */
  const send = useCallback(async (content: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel, content }),
      });
      const data = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !data?.ok) return data?.error || "Couldn't send that.";
      await load();
      return null;
    } catch {
      return "Couldn't send that.";
    }
  }, [channel, load]);

  return { messages, loaded: loadedFor === channel, error, canPost, contentHidden, send };
}
