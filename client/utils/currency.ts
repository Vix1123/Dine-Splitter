export const currencySymbols: { [key: string]: string } = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  INR: "₹",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  NZD: "NZ$",
  SGD: "S$",
  HKD: "HK$",
  KRW: "₩",
  MXN: "MX$",
  BRL: "R$",
  RUB: "₽",
  TRY: "₺",
  PLN: "zł",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  THB: "฿",
  MYR: "RM",
  PHP: "₱",
  IDR: "Rp",
  VND: "₫",
  AED: "د.إ",
  SAR: "﷼",
  EGP: "E£",
  NGN: "₦",
  KES: "KSh",
};

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency.toUpperCase()] || currency;
}

export function formatCurrency(amount: number, currencySymbol: string): string {
  const formatted = amount.toFixed(2);
  return `${currencySymbol}${formatted}`;
}

export function detectCurrency(text: string): { currency: string; symbol: string } {
  const patterns: { pattern: RegExp; currency: string }[] = [
    { pattern: /R\s*\d+[,.]?\d*/i, currency: "ZAR" },
    { pattern: /ZAR\s*\d+/i, currency: "ZAR" },
    { pattern: /\$\s*\d+[,.]?\d*/, currency: "USD" },
    { pattern: /USD\s*\d+/i, currency: "USD" },
    { pattern: /€\s*\d+[,.]?\d*/, currency: "EUR" },
    { pattern: /EUR\s*\d+/i, currency: "EUR" },
    { pattern: /£\s*\d+[,.]?\d*/, currency: "GBP" },
    { pattern: /GBP\s*\d+/i, currency: "GBP" },
    { pattern: /¥\s*\d+[,.]?\d*/, currency: "JPY" },
  ];

  for (const { pattern, currency } of patterns) {
    if (pattern.test(text)) {
      return { currency, symbol: getCurrencySymbol(currency) };
    }
  }

  return { currency: "USD", symbol: "$" };
}
