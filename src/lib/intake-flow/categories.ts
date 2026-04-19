import type { IntakeCategoryId } from "./types";

export const INTAKE_CATEGORIES: {
  id: IntakeCategoryId;
  label: string;
  emoji: string;
  hint: string;
}[] = [
  { id: "clothing", label: "Clothing", emoji: "👕", hint: "Men's, women's, kids, vintage & new" },
  { id: "accessories", label: "Clothing accessories", emoji: "👜", hint: "Shoes, bags, belts, hats…" },
  { id: "linens", label: "Linens & textiles", emoji: "🛏️", hint: "Blankets, towels, curtains…" },
  { id: "housewares", label: "Housewares", emoji: "🍽️", hint: "Kitchen, décor, small appliances" },
  { id: "electronics", label: "Electronics & appliances", emoji: "📺", hint: "Flat-screen TVs, small appliances…" },
  { id: "art", label: "Art & antiques", emoji: "🖼️", hint: "Prints, collectibles, comics…" },
  { id: "furniture", label: "Furniture", emoji: "🪑", hint: "Small pieces under 50 lbs" },
  {
    id: "books_media",
    label: "Books, DVDs, video games, and media",
    emoji: "📚",
    hint: "Games, CDs, VHS, records…",
  },
  { id: "computers", label: "Computers & software", emoji: "💻", hint: "Any condition — recycling path" },
  { id: "sports", label: "Sports & exercise", emoji: "⚽", hint: "Bikes, weights, gear under 50 lbs" },
  { id: "toys", label: "Toys", emoji: "🧸", hint: "Games, puzzles, plush — no baby furniture" },
  {
    id: "vehicles",
    label: "Vehicles, boats, and motorcycles",
    emoji: "🚗",
    hint: "Separate program — title required",
  },
];
