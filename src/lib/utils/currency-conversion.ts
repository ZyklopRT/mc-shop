// Currency conversion utilities
export const CURRENCY_EXCHANGE_RATES = {
  emeralds: 1,
  emerald_blocks: 9, // 1 emerald block = 9 emeralds
} as const;

export type CurrencyType = keyof typeof CURRENCY_EXCHANGE_RATES;

/**
 * Convert any currency amount to emeralds (base currency)
 */
export function convertToEmeralds(amount: number, currency: string): number {
  const currencyKey = currency as CurrencyType;
  const rate = CURRENCY_EXCHANGE_RATES[currencyKey] ?? 1;
  return amount * rate;
}

/**
 * Convert emeralds to any other currency
 */
export function convertFromEmeralds(
  emeraldAmount: number,
  targetCurrency: string,
): number {
  const currencyKey = targetCurrency as CurrencyType;
  const rate = CURRENCY_EXCHANGE_RATES[currencyKey] ?? 1;
  return emeraldAmount / rate;
}

/**
 * Compare two currency amounts by converting both to emeralds
 */
export function compareCurrencyValues(
  amount1: number,
  currency1: string,
  amount2: number,
  currency2: string,
): number {
  const emeraldValue1 = convertToEmeralds(amount1, currency1);
  const emeraldValue2 = convertToEmeralds(amount2, currency2);
  return emeraldValue1 - emeraldValue2;
}

/**
 * Get the minimum equivalent amount in a target currency
 */
export function getMinimumInCurrency(
  minimumAmount: number,
  minimumCurrency: string,
  targetCurrency: string,
): number {
  const emeraldValue = convertToEmeralds(minimumAmount, minimumCurrency);
  const converted = convertFromEmeralds(emeraldValue, targetCurrency);
  // Round to 2 decimal places for currency display
  return Math.round(converted * 100) / 100;
}

/**
 * Format currency for display with exchange rate info
 */
export function formatCurrencyWithRate(
  amount: number,
  currency: string,
  showEquivalent = true,
): string {
  const rate = CURRENCY_EXCHANGE_RATES[currency as CurrencyType] ?? 1;

  if (!showEquivalent || rate === 1) {
    return `${amount} ${currency === "emerald_blocks" ? "Emerald Blocks" : "Emeralds"}`;
  }

  const emeraldEquivalent = convertToEmeralds(amount, currency);
  return `${amount} ${currency === "emerald_blocks" ? "Emerald Blocks" : "Emeralds"} (≈ ${emeraldEquivalent} emeralds)`;
}
