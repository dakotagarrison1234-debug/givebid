/**
 * Bid increment table:
 *   $0   – $39.99  → $1  increment
 *   $40  – $104.99 → $5  increment
 *   $105 – $499.99 → $10 increment
 *   $500+           → $25 increment
 */
export function getIncrement(currentBid: number): number {
  if (currentBid < 40) return 1;
  if (currentBid < 105) return 5;
  if (currentBid < 500) return 10;
  return 25;
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
 * valid bid above `currentBid`. Used for suggestion chips in the UI.
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
