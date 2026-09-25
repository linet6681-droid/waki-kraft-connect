import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { ksh, productImage } from "@/lib/site";

export type Product = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  size: string | null;
  unit: string;
  price: number;
  stock: number;
  image_key: string | null;
};

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const add = (thenCheckout: boolean) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    addItem.mutate(
      { productId: product.id },
      { onSuccess: () => thenCheckout && navigate({ to: "/cart" }) },
    );
  };

  return (
    <article className="surface-card flex flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <div className="aspect-square overflow-hidden bg-muted">
        <img
          src={productImage(product.image_key)}
          alt={product.name}
          loading="lazy"
          width={816}
          height={816}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base leading-tight">{product.name}</h3>
          {product.size && <Badge variant="secondary">{product.size}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">{product.description}</p>
        <p className="mt-auto pt-2 text-lg font-semibold text-primary">
          {ksh(product.price)}{" "}
          <span className="text-xs font-normal text-muted-foreground">{product.unit}</span>
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Button
            variant="outline"
            className="h-11"
            onClick={() => add(false)}
            disabled={addItem.isPending}
          >
            Add to Cart
          </Button>
          <Button className="h-11" onClick={() => add(true)} disabled={addItem.isPending}>
            Buy Now
          </Button>
        </div>
      </div>
    </article>
  );
}
