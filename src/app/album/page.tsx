// Sticker album — collection grid (§2.2, §10.7). Phase 3 fills the real catalog.
"use client";
import { useEffect } from "react";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { StickerAlbum } from "@/components/StickerAlbum";

const CATALOG = [
  { id: "fox", emoji: "🦊" },
  { id: "star", emoji: "⭐" },
  { id: "rocket", emoji: "🚀" },
  { id: "trophy", emoji: "🏆" },
  { id: "rainbow", emoji: "🌈" },
  { id: "balloon", emoji: "🎈" },
  { id: "medal", emoji: "🏅" },
  { id: "crown", emoji: "👑" },
];

export default function AlbumPage() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const collected = useProgressStore((s) => s.progress.rewards.stickers);
  useEffect(() => hydrate(), [hydrate]);

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <h1 className="text-2xl font-bold">📔 {strings.albumStiker}</h1>
      <StickerAlbum catalog={CATALOG} collected={collected} />
    </main>
  );
}
