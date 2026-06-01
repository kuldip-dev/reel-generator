export type ProductStatus = "available" | "coming_soon";

export type ProductIcon = "reel" | "match_preview" | "highlight";

export interface Product {
  id: string;
  name: string;
  description: string;
  /** Route when status is available */
  href?: string;
  status: ProductStatus;
  icon: ProductIcon;
  tags: string[];
}

/** Central catalog — add new products here as features ship */
export const PRODUCTS: Product[] = [
  {
    id: "reel",
    name: "Reel Generator",
    description:
      "Turn 3–10 images into a vertical 9:16 reel with effects, text overlays, and optional audio.",
    href: "/reel",
    status: "available",
    icon: "reel",
    tags: ["1080×1920", "MP4", "Browser render"],
  },
  {
    id: "match-preview",
    name: "Match Preview",
    description:
      "Build match-day preview videos with team graphics, scores, and branded templates.",
    status: "coming_soon",
    icon: "match_preview",
    tags: ["Sports", "Templates"],
  },
  {
    id: "highlight-reel",
    name: "Highlight Reel",
    description:
      "Auto-assemble key moments into a shareable highlight package with transitions.",
    status: "coming_soon",
    icon: "highlight",
    tags: ["Clips", "Transitions"],
  },
];

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
