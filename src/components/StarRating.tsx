// Star rating display, 0–3 (§10.5).
interface StarRatingProps {
  stars: 0 | 1 | 2 | 3;
  max?: number;
}

export function StarRating({ stars, max = 3 }: StarRatingProps) {
  return (
    <div className="flex gap-1 text-3xl" aria-label={`${stars} dari ${max} bintang`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} aria-hidden>
          {i < stars ? "⭐" : "☆"}
        </span>
      ))}
    </div>
  );
}
