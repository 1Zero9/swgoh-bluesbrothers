import type { Metadata } from "next";
import KnowledgePage from "../page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ideas · Blues Brothers", description: "Ideas from the band, checked by officers." };

export default function IdeasPage() {
  return <KnowledgePage initialTab="IDEA" />;
}
