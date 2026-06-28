// Sticker collection grid that fills as stickers are earned/bought (§2.2, §10.7).
interface StickerAlbumProps {
  /** All sticker ids in the catalog. */
  catalog: { id: string; emoji: string }[];
  collected: string[];
}

export function StickerAlbum({ catalog, collected }: StickerAlbumProps) {
  const have = new Set(collected);
  return (
    <div className="grid grid-cols-4 gap-3">
      {catalog.map((s) => {
        const has = have.has(s.id);
        return (
          <div
            key={s.id}
            className={`flex aspect-square items-center justify-center rounded-2xl text-3xl ${has ? "bg-white shadow" : "bg-black/5"}`}
          >
            <span aria-hidden>{has ? s.emoji : "❔"}</span>
          </div>
        );
      })}
    </div>
  );
}
