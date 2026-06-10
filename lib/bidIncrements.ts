/**
 * Bid increment table — slow growth matching live auction conventions:
 *   $0    – $9.99   → $1  increment
 *   $10   – $29.99  → $2  increment
 *   $30   – $99.99  → $5  increment
 *   $100  – $499.99 → $10 increment
 *   $500  – $999.99 → $25 increment
 *   $1000+           → $50 increment
 */
export function getIncrement(currentBid: number): number {
  if (currentBid < 10) return 1;
  if (currentBid < 30) return 2;
  if (currentBid < 100) return 5;
  if (currentBid < 500) return 10;
  if (currentBid < 1000) return 25;
  return 50;
}

/**
 * Returns the minimum valid next bid given the current bid level.
 * Only call this when currentBid > 0 (for the first bid, use item.startingBid).
 */
export function getNextValidBid(currentBid: number): number {
  return currentBid + getIncrement(currentBid);
}

/**
 * Returns an array of `count` valid bid amounts starting from the next
 * valid bid above `currentBid`. Used for regular bid suggestion chips in the UI.
 */
export function getValidBidSuggestions(currentBid: number, count = 5): number[] {
  const suggestions: number[] = [];
  let level = currentBid;
  for (let i = 0; i < count; i++) {
    level = level > 0 ? getNextValidBid(level) : level + getIncrement(level);
    suggestions.push(level);
  }
  return suggestions;
}

/**
 * Returns proxy max suggestions — round numbers meaningfully above the current minimum.
 * Intentionally spaced far apart so they never accidentally land on a competing proxy's
 * exact max amount (which would leak that information to the bidder).
 *
 * Suggestions are: ~1.5x, ~2x, ~3x, ~5x the minimum next bid, rounded up to nearest $5.
 */
export function getProxySuggestions(currentBid: number, count = 4): number[] {
  const min = currentBid > 0 ? getNextValidBid(currentBid) : 1;
  const multipliers = [1.5, 2, 3, 5];
  return multipliers.slice(0, count).map((m) => {
    const raw = min * m;
    return Math.ceil(raw / 5) * 5; // round up to nearest $5
  });
}
