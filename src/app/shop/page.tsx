// Toko — spend coins on cosmetics (§10.7). Phase 3 fills the real catalog.
"use client";
import { useEffect } from "react";
import { strings } from "@/lib/strings";
import { useProgressStore } from "@/stores/useProgressStore";
import { CoinCounter } from "@/components/CoinCounter";
import { ShopItem, type ShopItemData } from "@/components/ShopItem";

const CATALOG: ShopItemData[] = [
  { id: "hat-party", label: "Topi Pesta", emoji: "🎩", price: 50 },
  { id: "glasses", label: "Kacamata", emoji: "🕶️", price: 40 },
  { id: "theme-night", label: "Tema Malam", emoji: "🌙", price: 80 },
];

export default function ShopPage() {
  const hydrate = useProgressStore((s) => s.hydrate);
  const progress = useProgressStore((s) => s.progress);
  const spendCoins = useProgressStore((s) => s.spendCoins);
  useEffect(() => hydrate(), [hydrate]);

  const owned = new Set(progress.rewards.ownedItems);
  const coins = progress.rewards.coins;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">🛍️ {strings.toko}</h1>
        <CoinCounter coins={coins} />
      </header>
      <div className="grid grid-cols-2 gap-4">
        {CATALOG.map((item) => (
          <ShopItem
            key={item.id}
            item={item}
            owned={owned.has(item.id)}
            affordable={coins >= item.price}
            onBuy={(id) => spendCoins(item.price, id)}
          />
        ))}
      </div>
    </main>
  );
}
