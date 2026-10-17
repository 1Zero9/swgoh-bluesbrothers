import type { Metadata } from "next";
import HubPage, { HubHeader } from "@/app/hub-page";
import MissionGame from "./mission-game";

export const metadata: Metadata = {
  title: "Mission From God · Blues Brothers",
  description: "A thirty-day Blues Brothers galactic trading game. Pay Jabba, save the orphanage, and keep the Bluesmobile moving.",
};

export default function MissionFromGodPage() {
  return (
    <HubPage backdrop="themed" inner>
      <HubHeader eyebrow="Mission From God" title="A thirty-day galactic trading run" intro="Pay Jabba, save the orphanage, and keep the Bluesmobile moving. Free play, saved on this device." />
      <div className="hub-mission">
        <MissionGame />
      </div>
    </HubPage>
  );
}
