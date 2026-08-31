import type { Metadata } from "next";
import SiteHeader from "@/app/site-header";
import MissionGame from "./mission-game";

export const metadata: Metadata = {
  title: "Mission From God · Blues Brothers",
  description: "A thirty-day Blues Brothers galactic trading game. Pay Jabba, save the orphanage, and keep the Bluesmobile moving.",
};

export default function MissionFromGodPage() {
  return (
    <main className="mission-page">
      <SiteHeader homeHref="/" syncLabel="Free Play · local save" />
      <MissionGame />
    </main>
  );
}
