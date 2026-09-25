import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ksh, ORDER_STATUSES, CATEGORIES } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard | Waki Packages" },
      { name: "description", content: "Waki Packages staff dashboard." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard | Waki Packages" },
      { property: "og:description", content: "Staff only." },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const anyAdmin = useQuery({
    queryKey: ["any-admin"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("user_roles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");
      if (error) return 0;
      return count ?? 0;
    },
  });

  const claim = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("claim_first_admin");
      if (error) throw error;
      if (!data) throw new Error("An administrator already exists for this shop.");
    },
    onSuccess: () => {
      toast.success("You are now the administrator.");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-3xl">Admin Dashboard</h1>
        <p className="mt-3 text-muted-foreground">
          This area is for authorised administrators only.
        </p>
        {anyAdmin.data === 0 && (
          <Button className="mt-6 h-12 w-full" onClick={() => claim.mutate()}>
            Make this account the administrator
          </Button>
        )}
        <Button asChild variant="outline" className="mt-3 h-12 w-full">
          <Link to="/dashboard">Back to my dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-4xl">Admin Dashboard</h1>
      <p className="mt-1 text-muted-foreground">Signed in as {user?.email}</p>

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="training">Training</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="business">Business info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <Overview />
        </TabsContent>
        <TabsContent value="orders" className="mt-6">
          <AdminOrders />
        </TabsContent>
        <TabsContent value="products" className="mt-6">
          <AdminProducts />
        </TabsContent>
        <TabsContent value="customers" className="mt-6">
          <AdminCustomers />
        </TabsContent>
        <TabsContent value="training" className="mt-6">
          <AdminTraining />
        </TabsContent>
        <TabsContent value="delivery" className="mt-6">
          <AdminDelivery />
        </TabsContent>
        <TabsContent value="business" className="mt-6">
          <AdminBusiness />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Overview() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [orders, customers, bookings] = await Promise.all([
        supabase.from("orders").select("id, status, total, payment_verified"),
        supabase.from("profiles").select("id"),
        supabase.from("training_bookings").select("id"),
      ]);
      const list = orders.data ?? [];
      return {
        total: list.length,
        pending: list.filter((o) => o.status === "Pending Payment").length,
        verifying: list.filter((o) => o.status === "Payment Verification").length,
        paid: list.filter((o) => o.payment_verified).length,
        delivered: list.filter((o) => o.status === "Delivered").length,
        customers: customers.data?.length ?? 0,
        bookings: bookings.data?.length ?? 0,
        sales: list
          .filter((o) => o.payment_verified)
          .reduce((sum, o) => sum + Number(o.total), 0),
      };
    },
  });

  const cards = [
    { label: "Total orders", value: data?.total ?? 0 },
    { label: "Pending payment", value: data?.pending ?? 0 },
    { label: "Awaiting verification", value: data?.verifying ?? 0 },
    { label: "Paid orders", value: data?.paid ?? 0 },
    { label: "Delivered", value: data?.delivered ?? 0 },
    { label: "Customers", value: data?.customers ?? 0 },
    { label: "Training bookings", value: data?.bookings ?? 0 },
    { label: "Total sales", value: ksh(data?.sales ?? 0) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="surface-card p-5">
          <p className="text-sm text-muted-foreground">{c.label}</p>
          <p className="mt-1 text-2xl font-semibold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

type AdminOrder = {
  id: string;
  order_number: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_location: string;
  delivery_zone: string | null;
  delivery_fee: number;
  subtotal: number;
  total: number;
  mpesa_code: string | null;
  payment_verified: boolean;
  created_at: string;
  order_items: { id: string; product_name: string; size: string | null; quantity: number }[];
};

function AdminOrders() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, order_number, status, customer_name, customer_phone, delivery_location, delivery_zone, delivery_fee, subtotal, total, mpesa_code, payment_verified, created_at, order_items(id, product_name, size, quantity)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminOrder[];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { error } = await supabase.from("orders").update(patch as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading orders...</p>;

  return (
    <div className="space-y-4">
      {data?.map((order) => (
        <div key={order.id} className="surface-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg">{order.order_number}</h3>
              <p className="text-sm text-muted-foreground">
                {order.customer_name} · {order.customer_phone} ·{" "}
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
            <Badge variant={order.payment_verified ? "default" : "secondary"}>
              {order.status}
            </Badge>
          </div>

          <ul className="mt-3 text-sm text-muted-foreground">
            {order.order_items.map((i) => (
              <li key={i.id}>
                {i.product_name}
                {i.size ? ` (${i.size})` : ""} × {i.quantity}
              </li>
            ))}
          </ul>

          <p className="mt-2 text-sm">
            {order.delivery_location}
            {order.delivery_zone ? ` · ${order.delivery_zone}` : ""} · Delivery{" "}
            {Number(order.delivery_fee) === 0 ? "FREE" : ksh(Number(order.delivery_fee))} · Total{" "}
            <strong>{ksh(Number(order.total))}</strong>
          </p>

          <div className="mt-3 rounded-lg bg-secondary p-3">
            <p className="text-sm">
              M-Pesa code:{" "}
              <strong>{order.mpesa_code ?? "Not submitted"}</strong>
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                className="h-10"
                disabled={!order.mpesa_code || order.payment_verified}
                onClick={() =>
                  update.mutate({
                    id: order.id,
                    patch: { payment_verified: true, status: "Paid", payment_note: null },
                  })
                }
              >
                Approve payment
              </Button>
              <Button
                variant="outline"
                className="h-10"
                disabled={!order.mpesa_code}
                onClick={() =>
                  update.mutate({
                    id: order.id,
                    patch: {
                      payment_verified: false,
                      status: "Pending Payment",
                      payment_note: "The M-Pesa code could not be verified. Please check and resubmit.",
                    },
                  })
                }
              >
                Reject payment
              </Button>
              <Select
                value={order.status}
                onValueChange={(status) => update.mutate({ id: order.id, patch: { status } })}
              >
                <SelectTrigger className="h-10 w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
      {!data?.length && <p className="text-muted-foreground">No orders yet.</p>}
    </div>
  );
}

type AdminProduct = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  size: string | null;
  unit: string;
  price: number;
  stock: number;
  image_key: string | null;
  is_active: boolean;
};

const emptyProduct = {
  name: "",
  category: CATEGORIES[0] as string,
  description: "",
  size: "",
  unit: "each",
  price: "0",
  stock: "100",
  image_key: "packaging-bags",
};

function AdminProducts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...emptyProduct });

  const { data } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, category, description, size, unit, price, stock, image_key, is_active")
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as AdminProduct[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Enter a product name.");
      const { error } = await supabase.from("products").insert({
        name: form.name.trim(),
        category: form.category,
        description: form.description || null,
        size: form.size || null,
        unit: form.unit || "each",
        price: Number(form.price),
        stock: Number(form.stock),
        image_key: form.image_key,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product added");
      setForm({ ...emptyProduct });
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: Record<string, unknown> }) => {
      const { error } = await supabase.from("products").update(values as never).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Product deleted");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <div className="surface-card p-5">
        <h3 className="font-display text-lg">Add a product</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Input
            className="h-11"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Select
            value={form.category}
            onValueChange={(category) => setForm({ ...form, category })}
          >
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-11"
            placeholder="Size"
            value={form.size}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
          />
          <Input
            className="h-11"
            placeholder="Unit (each / per 50 pieces)"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value })}
          />
          <Input
            className="h-11"
            type="number"
            placeholder="Price"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
          <Input
            className="h-11"
            type="number"
            placeholder="Available quantity"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
          />
          <Textarea
            className="sm:col-span-3"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <Button className="mt-4 h-11" disabled={create.isPending} onClick={() => create.mutate()}>
          Add product
        </Button>
      </div>

      <div className="space-y-3">
        {data?.map((p) => (
          <div key={p.id} className="surface-card flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-48 flex-1">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">
                {p.category} · {p.unit}
                {p.size ? ` · ${p.size}` : ""}
              </p>
            </div>
            <div>
              <Label className="text-xs">Price</Label>
              <Input
                className="h-10 w-28"
                type="number"
                defaultValue={p.price}
                onBlur={(e) => patch.mutate({ id: p.id, values: { price: Number(e.target.value) } })}
              />
            </div>
            <div>
              <Label className="text-xs">Stock</Label>
              <Input
                className="h-10 w-24"
                type="number"
                defaultValue={p.stock}
                onBlur={(e) => patch.mutate({ id: p.id, values: { stock: Number(e.target.value) } })}
              />
            </div>
            <Button
              variant="outline"
              className="h-10"
              onClick={() => patch.mutate({ id: p.id, values: { is_active: !p.is_active } })}
            >
              {p.is_active ? "Hide" : "Show"}
            </Button>
            <Button
              variant="ghost"
              className="h-10 text-destructive"
              onClick={() => remove.mutate(p.id)}
            >
              Delete
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminCustomers() {
  const { data } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: async () => {
      const [profiles, orders] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, phone, delivery_location, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("orders").select("id, user_id, total, payment_verified"),
      ]);
      if (profiles.error) throw profiles.error;
      return (profiles.data ?? []).map((p) => {
        const theirs = (orders.data ?? []).filter((o) => o.user_id === p.id);
        return {
          ...p,
          orders: theirs.length,
          spent: theirs
            .filter((o) => o.payment_verified)
            .reduce((sum, o) => sum + Number(o.total), 0),
        };
      });
    },
  });

  return (
    <div className="space-y-3">
      {data?.map((c) => (
        <div key={c.id} className="surface-card flex flex-wrap justify-between gap-3 p-4">
          <div>
            <p className="font-medium">{c.full_name ?? "Unnamed customer"}</p>
            <p className="text-sm text-muted-foreground">
              {c.phone ?? "No phone"} · {c.delivery_location ?? "No delivery location"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {c.orders} orders · {ksh(c.spent)} paid
          </p>
        </div>
      ))}
      {!data?.length && <p className="text-muted-foreground">No customers yet.</p>}
    </div>
  );
}

function AdminTraining() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_bookings")
        .select("id, name, phone, preferred_date, course, fee, status, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("training_bookings").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking updated");
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-3">
      {data?.map((b) => (
        <div key={b.id} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <p className="font-medium">
              {b.name} · {b.phone}
            </p>
            <p className="text-sm text-muted-foreground">
              {b.course} · {b.preferred_date} · {ksh(Number(b.fee))}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{b.status}</Badge>
            <Select value={b.status} onValueChange={(status) => update.mutate({ id: b.id, status })}>
              <SelectTrigger className="h-10 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Pending", "Approved", "Confirmed", "Completed", "Cancelled"].map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button asChild variant="outline" className="h-10">
              <a href={`tel:${b.phone}`}>Call</a>
            </Button>
          </div>
        </div>
      ))}
      {!data?.length && <p className="text-muted-foreground">No training bookings yet.</p>}
    </div>
  );
}

function AdminDelivery() {
  const queryClient = useQueryClient();
  const [zone, setZone] = useState({ name: "", fee: "0" });

  const { data } = useQuery({
    queryKey: ["admin-zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_zones")
        .select("id, name, fee")
        .order("fee");
      if (error) throw error;
      return data ?? [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      if (zone.name.trim().length < 2) throw new Error("Enter the location name.");
      const { error } = await supabase
        .from("delivery_zones")
        .insert({ name: zone.name.trim(), fee: Number(zone.fee) });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Delivery area added");
      setZone({ name: "", fee: "0" });
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const patch = useMutation({
    mutationFn: async ({ id, fee }: { id: string; fee: number }) => {
      const { error } = await supabase.from("delivery_zones").update({ fee }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error: Error) => toast.error(error.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("delivery_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-5">
      <div className="surface-card p-5">
        <h3 className="font-display text-lg">Add a delivery area</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          <Input
            className="h-11 w-56"
            placeholder="Location name"
            value={zone.name}
            onChange={(e) => setZone({ ...zone, name: e.target.value })}
          />
          <Input
            className="h-11 w-32"
            type="number"
            placeholder="Fee"
            value={zone.fee}
            onChange={(e) => setZone({ ...zone, fee: e.target.value })}
          />
          <Button className="h-11" onClick={() => add.mutate()}>
            Add
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {data?.map((z) => (
          <div key={z.id} className="surface-card flex flex-wrap items-center gap-3 p-4">
            <p className="flex-1 font-medium">{z.name}</p>
            <Input
              className="h-10 w-28"
              type="number"
              defaultValue={z.fee}
              onBlur={(e) => patch.mutate({ id: z.id, fee: Number(e.target.value) })}
            />
            <Button
              variant="ghost"
              className="h-10 text-destructive"
              onClick={() => remove.mutate(z.id)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminBusiness() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Record<string, string>>({});

  const { data } = useQuery({
    queryKey: ["business-info"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_info").select("*").eq("id", 1).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (data) {
      setForm({
        phone: data.phone,
        whatsapp: data.whatsapp,
        location: data.location,
        operating_days: data.operating_days,
        operating_hours: data.operating_hours,
        facebook: data.facebook,
        tiktok: data.tiktok,
        about: data.about,
        mission: data.mission,
        vision: data.vision,
      });
    }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("business_info").update(form as never).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Business information updated");
      queryClient.invalidateQueries({ queryKey: ["business-info"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const fields: [string, string][] = [
    ["phone", "Phone number"],
    ["whatsapp", "WhatsApp number"],
    ["location", "Location"],
    ["operating_days", "Operating days"],
    ["operating_hours", "Operating hours"],
    ["facebook", "Facebook"],
    ["tiktok", "TikTok"],
  ];

  return (
    <div className="surface-card p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              className="mt-1 h-11"
              value={form[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
        {(["about", "mission", "vision"] as const).map((key) => (
          <div key={key} className="sm:col-span-2">
            <Label htmlFor={key} className="capitalize">
              {key === "about" ? "About Us" : key}
            </Label>
            <Textarea
              id={key}
              className="mt-1"
              value={form[key] ?? ""}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <Button className="mt-4 h-11" disabled={save.isPending} onClick={() => save.mutate()}>
        Save business information
      </Button>
    </div>
  );
}
