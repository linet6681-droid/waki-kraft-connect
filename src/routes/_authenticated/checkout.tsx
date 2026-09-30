import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { ksh } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | Waki Packages" },
      {
        name: "description",
        content:
          "Confirm your delivery location, review the delivery fee and place your Waki Packages order.",
      },
      { property: "og:title", content: "Checkout | Waki Packages" },
      { property: "og:description", content: "Complete your packaging order." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
  location: z.string().trim().min(3, "Enter your delivery location").max(200),
});

function Checkout() {
  const { user, profile } = useAuth();
  const { items, subtotal } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [area, setArea] = useState<"inside" | "outside">("inside");
  const [form, setForm] = useState({ name: "", phone: "", location: "", notes: "" });

  useEffect(() => {
    if (profile) {
      setForm((f) => ({
        ...f,
        name: f.name || profile.full_name || "",
        phone: f.phone || profile.phone || "",
        location: f.location || profile.delivery_location || "",
      }));
    }
  }, [profile]);

  const zone = useMemo(
    () => ({ name: area === "inside" ? "Kiria-ini Town" : "Outside Kiria-ini Town" }),
    [area],
  );
  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const placeOrder = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      if (!items.length) throw new Error("Your cart is empty.");

      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: user!.id,
          customer_name: parsed.data.name,
          customer_phone: parsed.data.phone,
          delivery_location: parsed.data.location,
          delivery_zone: zone.name,
          delivery_fee: deliveryFee,
          subtotal,
          total,
          notes: form.notes || null,
        })
        .select("id, order_number")
        .single();
      if (error) throw error;

      const orderItems = items.map((row) => ({
        order_id: order.id,
        product_id: row.product_id,
        product_name: row.products?.name ?? "Product",
        size: row.products?.size ?? null,
        unit: row.products?.unit ?? null,
        unit_price: Number(row.products?.price ?? 0),
        quantity: row.quantity,
      }));
      const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
      if (itemsError) throw itemsError;

      await supabase.from("cart_items").delete().eq("user_id", user!.id);
      await supabase
        .from("profiles")
        .update({
          full_name: parsed.data.name,
          phone: parsed.data.phone,
          delivery_location: parsed.data.location,
        })
        .eq("id", user!.id);

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries();
      toast.success(`Order ${order.order_number} placed. Please complete M-Pesa payment.`);
      navigate({ to: "/orders" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!items.length) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl">Checkout</h1>
        <p className="mt-2 text-muted-foreground">Your cart is empty.</p>
        <Button asChild className="mt-6 h-12 w-full">
          <Link to="/goods">Shop now</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl">Checkout</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="surface-card p-6">
          <h2 className="text-2xl">Delivery details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="o-name">Name</Label>
              <Input
                id="o-name"
                className="mt-1 h-12"
                value={form.name}
                maxLength={100}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="o-phone">Phone number</Label>
              <Input
                id="o-phone"
                className="mt-1 h-12"
                value={form.phone}
                maxLength={20}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="o-zone">Delivery area</Label>
              <Select value={area} onValueChange={(v) => setArea(v as "inside" | "outside")}>
                <SelectTrigger id="o-zone" className="mt-1 h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inside">Within Kiria-ini Town — Free delivery</SelectItem>
                  <SelectItem value="outside">Outside Kiria-ini Town</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="o-location">
                {area === "outside" ? "Type your delivery location" : "Exact delivery location"}
              </Label>
              <Input
                id="o-location"
                className="mt-1 h-12"
                placeholder="Town, estate, landmark"
                value={form.location}
                maxLength={200}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="o-notes">Order notes (optional)</Label>
              <Textarea
                id="o-notes"
                className="mt-1"
                value={form.notes}
                maxLength={500}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
            {area === "inside"
              ? "Delivery within Kiria-ini Town is free."
              : "Delivery outside Kiria-ini Town: our team will call you to agree on the delivery cost for your location."}
          </p>
        </div>

        <aside className="surface-card h-fit p-5">
          <h2 className="font-display text-xl">Order summary</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((row) => (
              <li key={row.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {row.products?.name} × {row.quantity}
                </span>
                <span>{ksh(Number(row.products?.price ?? 0) * row.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{ksh(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Delivery fee</dt>
              <dd>{area === "inside" ? "FREE" : "Agreed by phone"}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{ksh(total)}</dd>
            </div>
          </dl>
          <Button
            className="mt-5 h-12 w-full"
            disabled={placeOrder.isPending}
            onClick={() => placeOrder.mutate()}
          >
            {placeOrder.isPending ? "Placing order..." : "Place order"}
          </Button>
        </aside>
      </div>
    </div>
  );
}
