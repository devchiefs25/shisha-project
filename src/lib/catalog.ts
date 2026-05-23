export type Base = { name: string; price: number; desc: string };
export type Head = { name: string; price: number };
export type Addon = { name: string; price: number };

export const BASES: Base[] = [
  { name: "Standard Shisha", price: 55, desc: "One flavour, clay head" },
  { name: "Premium (Adalya)", price: 60, desc: "Signature premium line" },
  { name: "Mixed (up to 3)", price: 65, desc: "Custom flavour blend" },
];

export const FLAVOURS: Record<string, string[]> = {
  "Al Fakher": [
    "Apple",
    "Apple Mint",
    "Gum",
    "Gum Mint",
    "Mint",
    "Grape",
    "Grape Mint",
    "Blueberry",
    "Blueberry Mint",
    "Orange",
    "Orange Mint",
    "Lemon Mint",
    "Peach",
    "Strawberry",
    "Watermelon Mint",
    "Lucid Dreams",
    "Magic Love",
  ],
  Adalya: ["Love 66", "Shiekh Money", "Lady Killer", "Joker 777"],
  Afzal: [
    "Pan Raas",
    "Chief Commissioner",
    "Brain Freezer",
    "Natural Spring Water",
    "Pan Kiwi Mint",
  ],
  Nakhla: ["Double Apple"],
};

export const HEADS: Head[] = [
  { name: "Clay Head (included)", price: 0 },
  { name: "Apple Fresh Head", price: 5 },
  { name: "Orange Fresh Head", price: 15 },
  { name: "Grapefruit Fresh Head", price: 15 },
  { name: "Pineapple Fresh Head", price: 30 },
];

export const ADDONS: Addon[] = [
  { name: "Extra Coal (3 pcs)", price: 3 },
  { name: "Extra Mouth Piece", price: 1 },
  { name: "Extra Hose", price: 4 },
  { name: "V Energy", price: 4.5 },
  { name: "Red Bull", price: 4.5 },
];

export const ALL_FLAVOURS = new Set(
  Object.values(FLAVOURS).flat(),
);

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
