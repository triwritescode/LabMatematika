// Toko (sticker shop) catalog — pure data + lookup helpers, no state.
// Stickers are emoji (no image assets) bought with diamonds earned by practicing.
// A sticker's `id` IS its emoji glyph — stable + unique, so it doubles as the
// persistence/sync key (owned_stickers.sticker_id). Never rename an existing one.

export type Rarity = 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';

export type Sticker = {
  id: string; // the emoji glyph, e.g. '🎉'
  rarity: Rarity;
};

// Diamond cost per rarity tier — a rising ladder so the top tiers are long-term
// collection goals and a real sink for earned diamonds.
export const RARITY_PRICE: Record<Rarity, number> = {
  common: 20,
  rare: 50,
  epic: 120,
  legendary: 300,
  mythic: 700,
};

// Per-tier accent color (rings, badges) — signals rarity at a glance.
export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#94A3B8',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
  mythic: '#EC4899',
};

// Display order (cheapest tier first).
export const RARITY_ORDER: Rarity[] = ['common', 'rare', 'epic', 'legendary', 'mythic'];

// 100 stickers total across the five tiers.
const TIER_EMOJIS: Record<Rarity, string[]> = {
  common: [
    '🎉', '⭐', '🎯', '🎨', '✨', '😀', '😄', '😁', '🙂', '😊',
    '😉', '🐱', '🐶', '🐰', '🐻', '🍎', '🍊', '🍋', '🍉', '🍓',
    '🌸', '🌼', '🌻', '⚽', '🏀', '🎈', '🎁', '🎵', '🎂', '🍭',
  ],
  rare: [
    '🚀', '🧠', '🌈', '🧩', '🦉', '🐬', '🦄', '🦁', '🐯', '🐨',
    '🐸', '🍕', '🍔', '🍟', '🌵', '🌴', '⛄', '🌟', '💫', '🎸',
    '🎺', '🥁', '🎻', '🪁', '🛼',
  ],
  epic: [
    '🔥', '🏆', '💯', '👑', '🏅', '🎖️', '🐉', '🦅', '🦈', '🐙',
    '🦖', '🦕', '🍰', '🧁', '🎆', '🎇', '🪐', '☄️', '🌌', '🗿',
  ],
  legendary: [
    '💎', '🏵️', '🎗️', '🕹️', '🛸', '👾', '🤖', '🦾', '🧬', '⚗️',
    '🔭', '🔮', '🧿', '🪄', '🎭',
  ],
  mythic: ['🐲', '🦚', '🦩', '🦢', '🕊️', '🌠', '⚡', '🌋', '🏰', '🎠'],
};

export const STICKERS: Sticker[] = RARITY_ORDER.flatMap((rarity) =>
  TIER_EMOJIS[rarity].map((id) => ({ id, rarity }))
);

const BY_ID = new Map(STICKERS.map((s) => [s.id, s]));

export function getSticker(id: string): Sticker | undefined {
  return BY_ID.get(id);
}

/** Diamond price of a sticker id; 0 for an unknown id (never blocks the UI). */
export function priceOf(id: string): number {
  const s = BY_ID.get(id);
  return s ? RARITY_PRICE[s.rarity] : 0;
}

/** Catalog grouped by rarity, each group in catalog order — for sectioned lists. */
export function stickersByRarity(): Record<Rarity, Sticker[]> {
  const groups: Record<Rarity, Sticker[]> = {
    common: [],
    rare: [],
    epic: [],
    legendary: [],
    mythic: [],
  };
  for (const s of STICKERS) groups[s.rarity].push(s);
  return groups;
}
