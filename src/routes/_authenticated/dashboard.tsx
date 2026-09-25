import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { Package, GraduationCap, ShoppingCart, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ksh } from "@/lib/site";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard | Waki Packages" },
      {
        name: "description",
        content: "Manage your Waki Packages profile, delivery location, orders and bookings.",
      },
      { property: "og:title", content: "My Dashboard | Waki Packages" },
      { property: "og:description", content: "Your customer account overview." },
    ],
  }),
  component: Dashboard,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
  delivery_location: z.string().trim().max(200),
});

function Dashboard() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ full_name: "", phone: "", delivery_location: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name ?? "",
        phone: profile.phone ?? "",
        delivery_location: profile.delivery_location ?? "",
      });
    }
  }, [profile]);

  const stats = useQuery({
    queryKey: ["customer-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [orders, bookings] = await Promise.all([
        supabase.from("orders").select("id, total, status").eq("user_id", user!.id),
        supabase.from("training_bookings").select("id").eq("user_id", user!.id),
      ]);
      if (orders.error) throw orders.error;
      if (bookings.error) throw bookings.error;
      const spent = (orders.data ?? [])
        .filter((o) => o.status !== "Cancelled")
        .reduce((sum, o) => sum + Number(o.total), 0);
      return {
        orders: orders.data?.length ?? 0,
        bookings: bookings.data?.length ?? 0,
        spent,
      };
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user!.id, ...parsed.data })
        .eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated");
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast.error(error.message);
      return;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", user.id);
    setUploading(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success("Profile picture updated");
    queryClient.invalidateQueries({ queryKey: ["profile", user.id] });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl">My Dashboard</h1>
      <p className="mt-2 text-muted-foreground">{user?.email}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Link to="/orders" className="surface-card p-5 transition-shadow hover:shadow-lift">
          <Package className="h-6 w-6 text-primary" />
          <p className="mt-2 text-2xl font-semibold">{stats.data?.orders ?? 0}</p>
          <p className="text-sm text-muted-foreground">My orders</p>
        </Link>
        <Link to="/training" className="surface-card p-5 transition-shadow hover:shadow-lift">
          <GraduationCap className="h-6 w-6 text-primary" />
          <p className="mt-2 text-2xl font-semibold">{stats.data?.bookings ?? 0}</p>
          <p className="text-sm text-muted-foreground">Training bookings</p>
        </Link>
        <Link to="/goods" className="surface-card p-5 transition-shadow hover:shadow-lift">
          <ShoppingCart className="h-6 w-6 text-primary" />
          <p className="mt-2 text-2xl font-semibold">{ksh(stats.data?.spent ?? 0)}</p>
          <p className="text-sm text-muted-foreground">Total ordered</p>
        </Link>
      </div>

      <div className="surface-card mt-8 p-6">
        <h2 className="text-2xl">My profile</h2>

        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={profile?.avatar_url ?? undefined} alt="Profile picture" />
            <AvatarFallback className="text-xl">
              {(profile?.full_name ?? user?.email ?? "W").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar" className="mb-2 block">
              Profile picture
            </Label>
            <label
              htmlFor="avatar"
              className="inline-flex h-11 cursor-pointer items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-secondary"
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? "Uploading..." : "Upload / change photo"}
            </label>
            <input
              id="avatar"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadAvatar(file);
              }}
            />
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="p-name">Name</Label>
            <Input
              id="p-name"
              className="mt-1 h-12"
              value={form.full_name}
              maxLength={100}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="p-phone">Phone number</Label>
            <Input
              id="p-phone"
              className="mt-1 h-12"
              value={form.phone}
              maxLength={20}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="p-location">Delivery location</Label>
            <Input
              id="p-location"
              className="mt-1 h-12"
              placeholder="e.g. Kiria-ini Town, near the market"
              value={form.delivery_location}
              maxLength={200}
              onChange={(e) => setForm({ ...form, delivery_location: e.target.value })}
            />
          </div>
        </div>

        <Button
          className="mt-5 h-12 w-full sm:w-auto"
          disabled={save.isPending}
          onClick={() => save.mutate()}
        >
          {save.isPending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
