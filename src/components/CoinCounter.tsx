// Coin balance chip (§10.1).
export function CoinCounter({ coins }: { coins: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-semibold tabular-nums">
      🪙 {coins}
    </span>
  );
}
