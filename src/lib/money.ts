// All prices are whole VND amounts (no decimals), stored as integers.

const vndFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 });

/** 1500000 → "1.500.000₫" */
export function formatVnd(amount: number): string {
  if (!Number.isInteger(amount)) {
    throw new Error(`VND amounts must be whole numbers, got ${amount}`);
  }
  return `${vndFormat.format(amount)}₫`;
}
