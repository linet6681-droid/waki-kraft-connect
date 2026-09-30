import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BUSINESS, ksh } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "My Orders | Waki Packages" },
      {
        name: "description",
        content:
          "Track your Waki Packages orders, submit your M-Pesa transaction code and follow delivery status.",
      },
      { property: "og:title", content: "My Orders | Waki Packages" },
      { property: "og:description", content: "Order history and payment status." },
    ],
  }),
  component: Orders,
});

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  delivery_location: string;
  delivery_zone: string | null;
  mpesa_code: string | null;
  payment_verified: boolean;
  payment_note: string | null;
  created_at: string;
  order_items: {
    id: string;
    product_name: string;
    size: string | null;
    unit: string | null;
    unit_price: number;
    quantity: number;
  }[];
};

function Orders() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [codes, setCodes] = useState<Record<string, string>>({});

  const orders = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, subtotal, delivery_fee, total, delivery_location, delivery_zone, mpesa_code, payment_verified, payment_note, created_at, order_items(id, product_name, size, unit, unit_price, quantity)",
        )
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as OrderRow[];
    },
  });

  const submitCode = useMutation({
    mutationFn: async ({ id, code }: { id: string; code: string }) => {
      const { data, error } = await supabase.rpc("verify_mpesa_payment" as never, {
        _order_id: id,
        _code: code,
      } as never);
      if (error) throw error;
      const result = data as unknown as string;
      if (result === "declined_invalid")
        throw new Error("Payment declined: that is not a valid M-Pesa code.");
      if (result === "declined_used")
        throw new Error("Payment declined: this M-Pesa code has already been used.");
      if (result !== "paid" && result !== "already_paid")
        throw new Error("Payment could not be verified.");
    },
    onSuccess: () => {
      toast.success("Thank you for shopping with us! Your package will be delivered soon.");
      queryClient.invalidateQueries({ queryKey: ["my-orders", user?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
      queryClient.invalidateQueries({ queryKey: ["my-orders", user?.id] });
    },
  });

  const cancelOrder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ status: "Cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order cancelled");
      queryClient.invalidateQueries({ queryKey: ["my-orders", user?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl">My Orders</h1>

      {orders.isLoading && <p className="mt-6 text-muted-foreground">Loading orders...</p>}

      {!orders.isLoading && !orders.data?.length && (
        <div className="surface-card mt-6 p-10 text-center">
          <p className="text-muted-foreground">You have not placed any orders yet.</p>
          <Button asChild className="mt-5 h-12">
            <Link to="/goods">Shop now</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {orders.data?.map((order) => (
          <article key={order.id} className="surface-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-display text-lg">{order.order_number}</h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <Badge variant={order.status === "Delivered" ? "default" : "secondary"}>
                {order.status}
              </Badge>
            </div>

            <ul className="mt-4 space-y-1 text-sm">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span className="text-muted-foreground">
                    {item.product_name}
                    {item.size ? ` (${item.size})` : ""} × {item.quantity}
                  </span>
                  <span>{ksh(Number(item.unit_price) * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{ksh(Number(order.subtotal))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd>{Number(order.delivery_fee) === 0 ? "FREE" : ksh(Number(order.delivery_fee))}</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Total</dt>
                <dd>{ksh(Number(order.total))}</dd>
              </div>
            </dl>

            <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
              <Truck className="mt-0.5 h-4 w-4 shrink-0" />
              {order.delivery_location}
              {order.delivery_zone ? ` · ${order.delivery_zone}` : ""}
            </p>

            {order.payment_verified ? (
              <p className="mt-4 flex items-center gap-2 rounded-lg bg-secondary p-3 text-sm font-medium text-foreground">
                <CheckCircle2 className="h-5 w-5 text-success" />
                Thank you for shopping with us! Your package will be delivered soon.
              </p>
            ) : order.status === "Cancelled" ? (
              <p className="mt-4 rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
                This order was cancelled.
              </p>
            ) : (
              <div className="mt-4 rounded-lg bg-secondary p-4">
                <h3 className="font-display text-base">M-Pesa payment</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Send {ksh(Number(order.total))} to {BUSINESS.phone} ({BUSINESS.name}), then enter
                  the M-Pesa transaction code below.
                </p>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <Input
                    className="h-12"
                    placeholder="Enter M-Pesa Transaction Code"
                    value={codes[order.id] ?? order.mpesa_code ?? ""}
                    maxLength={15}
                    onChange={(e) => setCodes({ ...codes, [order.id]: e.target.value })}
                  />
                  <Button
                    className="h-12 shrink-0"
                    disabled={submitCode.isPending}
                    onClick={() =>
                      submitCode.mutate({
                        id: order.id,
                        code: codes[order.id] ?? order.mpesa_code ?? "",
                      })
                    }
                  >
                    Verify Payment
                  </Button>
                </div>
                {order.payment_note && (
                  <p className="mt-2 text-xs text-destructive">{order.payment_note}</p>
                )}
                <Button
                  variant="ghost"
                  className="mt-2 h-10 px-0 text-destructive"
                  onClick={() => cancelOrder.mutate(order.id)}
                >
                  Cancel this order
                </Button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
