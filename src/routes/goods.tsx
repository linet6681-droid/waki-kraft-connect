import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { CATEGORIES } from "@/lib/site";

export const Route = createFileRoute("/goods")({
  head: () => ({
    meta: [
      { title: "Goods Offered | Waki Packages" },
      {
        name: "description",
        content:
          "Browse packaging bags, book covers, envelopes, cake boxes, popcorn bags, charcoal briquettes and gift bags from Waki Packages.",
      },
      { property: "og:title", content: "Goods Offered | Waki Packages" },
      {
        property: "og:description",
        content: "Shop quality brown paper packaging products online.",
      },
    ],
  }),
  component: Goods,
});

function Goods() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const { data, isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, description, size, unit, price, stock, image_key")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const products = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((p) => {
      const matchCategory = category === "All" || p.category === category;
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.description ?? "").toLowerCase().includes(term);
      return matchCategory && matchSearch;
    });
  }, [data, search, category]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl">Goods Offered</h1>
      <p className="mt-2 text-muted-foreground">
        Quality paper packaging products, ready for pick-up or delivery.
      </p>

      <div className="mt-6 flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="h-12 pl-9"
          />
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
          {["All", ...CATEGORIES].map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? "default" : "outline"}
              className="h-10 shrink-0"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
            ))
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>

      {!isLoading && products.length === 0 && (
        <p className="py-16 text-center text-muted-foreground">No products match your search.</p>
      )}
    </div>
  );
}
