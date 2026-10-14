import type { Metadata } from "next";
import KnowledgePage from "../page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tips · Blues Brothers", description: "Tips from the band, checked by officers." };

export default function TipsPage() {
  return <KnowledgePage initialTab="TIP" />;
}
