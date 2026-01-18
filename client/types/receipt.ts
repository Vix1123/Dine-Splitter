export interface ReceiptItem {
  id: string;
  description: string;
  price: number;
  quantity: number;
  allocations: { [personId: string]: number };
}

export interface Person {
  id: string;
  name: string;
  colorIndex: number;
}

export interface Receipt {
  id: string;
  imageUri: string;
  items: ReceiptItem[];
  total: number;
  currency: string;
  currencySymbol: string;
  createdAt: Date;
}

export interface PersonSummary {
  person: Person;
  items: { description: string; quantity: number; price: number }[];
  subtotal: number;
  tip: number;
  total: number;
}
