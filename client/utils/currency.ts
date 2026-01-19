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

export const countryToCurrency: { [key: string]: string } = {
  ZA: "ZAR",
  US: "USD",
  GB: "GBP",
  DE: "EUR",
  FR: "EUR",
  IT: "EUR",
  ES: "EUR",
  NL: "EUR",
  BE: "EUR",
  AT: "EUR",
  IE: "EUR",
  PT: "EUR",
  FI: "EUR",
  GR: "EUR",
  JP: "JPY",
  CN: "CNY",
  IN: "INR",
  AU: "AUD",
  CA: "CAD",
  CH: "CHF",
  NZ: "NZD",
  SG: "SGD",
  HK: "HKD",
  KR: "KRW",
  MX: "MXN",
  BR: "BRL",
  RU: "RUB",
  TR: "TRY",
  PL: "PLN",
  SE: "SEK",
  NO: "NOK",
  DK: "DKK",
  TH: "THB",
  MY: "MYR",
  PH: "PHP",
  ID: "IDR",
  VN: "VND",
  AE: "AED",
  SA: "SAR",
  EG: "EGP",
  NG: "NGN",
  KE: "KES",
};

export function getCurrencyFromRegion(regionCode: string | null): string {
  if (!regionCode) return "USD";
  const upperCode = regionCode.toUpperCase();
  return countryToCurrency[upperCode] || "USD";
}

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
