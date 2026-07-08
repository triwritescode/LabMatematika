import { computeAnswer, Level, Operation, Question } from './types';

// Session question sampler (specs §3). Fixes the "repetitive, always small
// numbers" problem the naive generate()+seen approach had:
//
//  - It samples the whole ability band [~diff/3 .. diff] on every draw, not just
//    the (low) ceiling a single diff maps to, so a level's value domain is
//    covered evenly instead of clustering at one magnitude.
//  - It never repeats a *canonical* pair until the reachable domain is
//    exhausted; for commutative labs 2+3 and 3+2 are the same question.
//  - As the adaptive diff climbs across a session, bigger pairs enter the pool,
//    so numbers grow with the child instead of staying stuck at 1+2, 1+3, 1+4.

const DISCOVERY_TRIES = 220; // generate() calls per draw — pure arithmetic, cheap
const LOW_BAND = 0.35; // sample from LOW_BAND*diff upward, skipping trivial floor

function isCommutative(lab: Operation): boolean {
  return lab === 'add' || lab === 'mul';
}

/** Canonical fingerprint of a pair; commutative labs fold a·b and b·a into one. */
export function canonicalKey(lab: Operation, a: number, b: number): string {
  return isCommutative(lab) && a > b ? `${b}:${a}` : `${a}:${b}`;
}

export type Sampler = {
  /** Draw the next unique question at the current difficulty dial. */
  next: (diff: number) => Question;
};

export function createSampler(level: Level): Sampler {
  const served = new Set<string>(); // canonical pairs already used this session

  /** Map the level's reachable pairs by sampling across the ability band. */
  function discover(diff: number): Map<string, [number, number]> {
    const found = new Map<string, [number, number]>();
    const lo = diff * LOW_BAND;
    for (let i = 0; i < DISCOVERY_TRIES; i++) {
      const d = lo + Math.random() * (diff - lo);
      const [a, b] = level.generate(d);
      found.set(canonicalKey(level.lab, a, b), [a, b]);
    }
    return found;
  }

  return {
    next(diff: number): Question {
      const found = discover(diff);
      let fresh = [...found].filter(([k]) => !served.has(k));
      if (fresh.length === 0) {
        // Reachable domain smaller than the session (tiny fact sets, e.g. bonds
        // within 5) — allow reuse rather than loop forever.
        served.clear();
        fresh = [...found];
      }
      const [key, [a, b]] = fresh[Math.floor(Math.random() * fresh.length)];
      served.add(key);
      return {
        levelId: level.id,
        lab: level.lab,
        a,
        b,
        answer: computeAnswer(level.lab, a, b),
        diff,
      };
    },
  };
}
