import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type CartRow = {
  id: string;
  quantity: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    size: string | null;
    unit: string;
    price: number;
    image_key: string | null;
  } | null;
};

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const cart = useQuery({
    queryKey: ["cart", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("id, quantity, product_id, products(id, name, size, unit, price, image_key)")
        .eq("user_id", userId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as unknown as CartRow[];
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cart", userId] });

  const addItem = useMutation({
    mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
      if (!userId) throw new Error("Please sign in to add products to your cart.");
      const existing = cart.data?.find((row) => row.product_id === productId);
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + quantity })
          .eq("id", existing.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase
        .from("cart_items")
        .insert({ user_id: userId, product_id: productId, quantity });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Added to cart");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setQuantity = useMutation({
    mutationFn: async ({ id, quantity }: { id: string; quantity: number }) => {
      if (quantity < 1) {
        const { error } = await supabase.from("cart_items").delete().eq("id", id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (error: Error) => toast.error(error.message),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cart_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success("Removed from cart");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const items = cart.data ?? [];
  const subtotal = items.reduce(
    (sum, row) => sum + Number(row.products?.price ?? 0) * row.quantity,
    0,
  );
  const count = items.reduce((sum, row) => sum + row.quantity, 0);

  return { items, subtotal, count, isLoading: cart.isLoading, addItem, setQuantity, removeItem };
}
