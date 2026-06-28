// One cosmetic item in the Toko grid (§10.7).
"use client";
import { CoinCounter } from "@/components/CoinCounter";

export interface ShopItemData {
  id: string;
  label: string;
  emoji: string;
  price: number;
}

interface ShopItemProps {
  item: ShopItemData;
  owned: boolean;
  affordable: boolean;
  onBuy: (id: string) => void;
}

export function ShopItem({ item, owned, affordable, onBuy }: ShopItemProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 shadow">
      <span className="text-4xl" aria-hidden>
        {item.emoji}
      </span>
      <span className="font-medium">{item.label}</span>
      {owned ? (
        <span className="text-sm text-green-600">Dimiliki</span>
      ) : (
        <button
          type="button"
          disabled={!affordable}
          onClick={() => onBuy(item.id)}
          className="rounded-full bg-amber-400 px-3 py-1 disabled:opacity-40"
        >
          <CoinCounter coins={item.price} />
        </button>
      )}
    </div>
  );
}
