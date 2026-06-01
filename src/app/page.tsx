import { AppHeader } from "@/components/AppHeader";
import { ProductCard } from "@/components/ProductCard";
import { PRODUCTS } from "@/lib/products";

export default function HomePage() {
  const available = PRODUCTS.filter((p) => p.status === "available");
  const upcoming = PRODUCTS.filter((p) => p.status === "coming_soon");

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white">
      <AppHeader
        title="Video Studio"
        subtitle="Choose a product to start creating"
        badge="Vercel-ready"
      />

      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <section className="text-center space-y-3 pb-2">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            What do you want to create?
          </h2>
          <p className="text-sm text-white/45 max-w-md mx-auto">
            Pick a product below. Each tool opens its own workspace — more products
            will appear here as we ship them.
          </p>
        </section>

        <section className="space-y-4">
          <SectionHeading label="Products" count={available.length} />
          <div className="grid gap-3">
            {available.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {upcoming.length > 0 && (
          <section className="space-y-4">
            <SectionHeading label="Coming soon" count={upcoming.length} />
            <div className="grid gap-3">
              {upcoming.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function SectionHeading({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-white/35">
        {label}
      </h3>
      <div className="flex-1 h-px bg-white/8" />
      <span className="text-[11px] text-white/25">{count}</span>
    </div>
  );
}
