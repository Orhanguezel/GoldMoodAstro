// Credit packages define 10 credits per TRY. Media settings and the UI use TRY.
export function mediaPriceToCredits(priceTry: number): number {
  if (!Number.isFinite(priceTry) || priceTry <= 0) throw new Error('media_price_invalid');
  return Math.ceil(Math.round(priceTry * 100) / 10);
}

export function sameMediaPrice(quotedTry: number, currentTry: number): boolean {
  return Number.isFinite(quotedTry) && Number.isFinite(currentTry)
    && Math.round(quotedTry * 100) === Math.round(currentTry * 100);
}
