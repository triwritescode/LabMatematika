// Sub-skill detection: does a given operand pair exercise carrying/borrowing? (§6, §13)
import type { Operation, SubSkill } from "@/types";

/** True if adding a + b carries in any column (sum of a digit-pair >= 10). */
export function hasCarrying(a: number, b: number): boolean {
  let x = Math.abs(a);
  let y = Math.abs(b);
  let carry = 0;
  while (x > 0 || y > 0) {
    const sum = (x % 10) + (y % 10) + carry;
    if (sum >= 10) return true;
    carry = sum >= 10 ? 1 : 0;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

/** True if subtracting a - b borrows in any column (a digit < b digit). */
export function hasBorrowing(a: number, b: number): boolean {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y > 0) {
    if (x % 10 < y % 10) return true;
    x = Math.floor(x / 10);
    y = Math.floor(y / 10);
  }
  return false;
}

/** Tag the sub-skill an operand pair trains, if any. */
export function detectSubSkill(
  operation: Operation,
  a: number,
  b: number,
): SubSkill | undefined {
  if (operation === "add" && hasCarrying(a, b)) return "carrying";
  if (operation === "subtract" && hasBorrowing(a, b)) return "borrowing";
  return undefined;
}
