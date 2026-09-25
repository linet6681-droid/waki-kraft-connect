import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ksh, productImage } from "@/lib/site";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Shopping Cart | Waki Packages" },
      {
        name: "description",
        content: "Review your Waki Packages order, edit quantities and continue to checkout.",
      },
      { property: "og:title", content: "Shopping Cart | Waki Packages" },
      { property: "og:description", content: "Your selected packaging products." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { items, subtotal, setQuantity, removeItem, isLoading } = useCart();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <ShoppingBag className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-4 text-3xl">Your cart</h1>
        <p className="mt-2 text-muted-foreground">
          Sign in or create an account to add products and place orders.
        </p>
        <Button asChild className="mt-6 h-12 w-full">
          <Link to="/auth">Sign in / Create account</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl">Shopping Cart</h1>

      {isLoading ? (
        <p className="mt-6 text-muted-foreground">Loading your cart...</p>
      ) : items.length === 0 ? (
        <div className="surface-card mt-6 p-10 text-center">
          <p className="text-muted-foreground">Your cart is empty.</p>
          <Button asChild className="mt-5 h-12">
            <Link to="/goods">Shop now</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <ul className="space-y-4">
            {items.map((row) => (
              <li key={row.id} className="surface-card flex gap-4 p-4">
                <img
                  src={productImage(row.products?.image_key)}
                  alt={row.products?.name ?? "Product"}
                  loading="lazy"
                  width={816}
                  height={816}
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.products?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {row.products?.size ? `Size ${row.products.size} · ` : ""}
                        {ksh(Number(row.products?.price ?? 0))} {row.products?.unit}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 text-destructive"
                      aria-label="Remove"
                      onClick={() => removeItem.mutate(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-auto flex items-center justify-between pt-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        aria-label="Decrease quantity"
                        onClick={() =>
                          setQuantity.mutate({ id: row.id, quantity: row.quantity - 1 })
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-10 text-center font-medium">{row.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10"
                        aria-label="Increase quantity"
                        onClick={() =>
                          setQuantity.mutate({ id: row.id, quantity: row.quantity + 1 })
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="font-semibold">
                      {ksh(Number(row.products?.price ?? 0) * row.quantity)}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="surface-card h-fit p-5">
            <h2 className="font-display text-xl">Order summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-medium">{ksh(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd className="font-medium">Calculated at checkout</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-lg bg-secondary p-3 text-xs text-muted-foreground">
              Free delivery within Kiria-ini Town. Outside Kiria-ini Town a delivery fee applies
              depending on your location.
            </p>
            <Button asChild className="mt-4 h-12 w-full">
              <Link to="/checkout">Proceed to checkout</Link>
            </Button>
            <Button asChild variant="outline" className="mt-2 h-12 w-full">
              <Link to="/goods">Continue shopping</Link>
            </Button>
          </aside>
        </div>
      )}
    </div>
  );
}
