import Link from "next/link";
import type { Product, ProductIcon } from "@/lib/products";

function ProductIconGraphic({ icon }: { icon: ProductIcon }) {
  const className = "w-6 h-6";

  switch (icon) {
    case "reel":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
          />
        </svg>
      );
    case "match_preview":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
          />
        </svg>
      );
    case "highlight":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.75}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      );
  }
}

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const isAvailable = product.status === "available" && product.href;

  const inner = (
    <>
      <div className="flex items-start gap-4">
        <div
          className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
            isAvailable
              ? "bg-violet-600/25 text-violet-300 border border-violet-500/30"
              : "bg-white/5 text-white/30 border border-white/10"
          }`}
        >
          <ProductIconGraphic icon={product.icon} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base font-semibold text-white">{product.name}</h2>
            {product.status === "coming_soon" && (
              <span className="text-[10px] font-semibold uppercase tracking-wide text-amber-300/90 bg-amber-500/10 border border-amber-500/25 rounded-full px-2 py-0.5">
                Coming soon
              </span>
            )}
          </div>
          <p className="text-sm text-white/50 mt-1 leading-relaxed">{product.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {product.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] text-white/40 bg-white/5 border border-white/8 rounded-full px-2 py-0.5"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {isAvailable && (
          <svg
            className="w-5 h-5 text-white/25 shrink-0 mt-1 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </>
  );

  const className = `group block w-full text-left rounded-2xl border p-5 transition-all ${
    isAvailable
      ? "bg-white/3 border-white/8 hover:border-violet-500/40 hover:bg-violet-500/5 cursor-pointer"
      : "bg-white/2 border-white/6 opacity-70 cursor-not-allowed"
  }`;

  if (isAvailable) {
    return (
      <Link href={product.href!} className={className}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={className} aria-disabled>
      {inner}
    </div>
  );
}
