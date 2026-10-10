"use client";

/** Signs out everywhere, then does a full reload so every page re-renders in its signed-out state. */
export async function signOutEverywhere() {
  try {
    await fetch("/api/auth/signout", { method: "POST" });
  } finally {
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/";
  }
}
