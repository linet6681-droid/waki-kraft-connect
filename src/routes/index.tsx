import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Phone, Truck, ShieldCheck, Leaf, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, type Product } from "@/components/site/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS, whatsappLink } from "@/lib/site";
import heroBags from "@/assets/hero-bags.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Waki Packages | Brown Paper Packaging in Kiria-ini Town" },
      {
        name: "description",
        content:
          "Shop quality brown paper packaging bags, envelopes, cake boxes and more from Waki Packages, Kiria-ini Town, Murang'a County. Free delivery within Kiria-ini Town.",
      },
      { property: "og:title", content: "Waki Packages | Brown Paper Packaging" },
      {
        property: "og:description",
        content: "Quality paper packaging solutions for businesses and individuals.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, description, size, unit, price, stock, image_key")
        .eq("is_active", true)
        .order("sort_order")
        .limit(8);
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  return (
    <div>
      <section className="gradient-kraft">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <span className="inline-flex items-center rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-primary">
              Kiria-ini Town · Murang'a County
            </span>
            <h1 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Brown paper packaging that protects your brand
            </h1>
            <p className="mt-4 max-w-lg text-base text-muted-foreground">
              {BUSINESS.about}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button asChild size="lg" className="h-12 px-7">
                <Link to="/goods">Shop Now</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7">
                <Link to="/contact">Contact Us</Link>
              </Button>
              <Button asChild size="lg" variant="secondary" className="h-12 px-7">
                <a href={whatsappLink()} target="_blank" rel="noreferrer">
                  <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl shadow-lift">
            <img
              src={heroBags}
              alt="Brown kraft paper packaging bags in several sizes"
              width={1600}
              height={1008}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: Truck, title: "Free delivery in Kiria-ini", text: "Orders within Kiria-ini Town are delivered free of charge." },
            { icon: ShieldCheck, title: "Verified M-Pesa payments", text: "Pay by M-Pesa and confirm with your transaction code." },
            { icon: Leaf, title: "Paper based packaging", text: "Practical, affordable and reliable packaging solutions." },
          ].map((item) => (
            <div key={item.title} className="surface-card p-5">
              <item.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-3 font-display text-base">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl">Featured products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Our most ordered packaging items.
            </p>
          </div>
          <Button asChild variant="outline" className="h-11">
            <Link to="/goods">View all goods</Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[420px] w-full rounded-xl" />
              ))
            : featured?.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="surface-card grid gap-6 p-6 sm:grid-cols-3">
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-display text-base">Location</h3>
              <p className="text-sm text-muted-foreground">{BUSINESS.location}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-display text-base">Operating hours</h3>
              <p className="text-sm text-muted-foreground">
                {BUSINESS.days}
                <br />
                {BUSINESS.hours}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Phone className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h3 className="font-display text-base">Call us</h3>
              <a href={`tel:${BUSINESS.phone}`} className="text-sm text-muted-foreground">
                {BUSINESS.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
