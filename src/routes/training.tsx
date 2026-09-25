import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BUSINESS, ksh } from "@/lib/site";

export const Route = createFileRoute("/training")({
  head: () => ({
    meta: [
      { title: "Training & Learning Classes | Waki Packages" },
      {
        name: "description",
        content:
          "Learn paper packaging production with Waki Packages. Training fee KSh 15,000. Book your learning class online.",
      },
      { property: "og:title", content: "Training & Learning Classes | Waki Packages" },
      { property: "og:description", content: "Book a paper packaging production class." },
    ],
  }),
  component: Training,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
  preferred_date: z.string().min(1, "Choose a preferred date"),
});

function Training() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: "", phone: "", preferred_date: "" });

  const bookings = useQuery({
    queryKey: ["my-bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_bookings")
        .select("id, course, preferred_date, status, fee, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const book = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      if (!user) throw new Error("Please sign in to book a class.");
      const { error } = await supabase.from("training_bookings").insert({
        user_id: user.id,
        name: parsed.data.name,
        phone: parsed.data.phone,
        preferred_date: parsed.data.preferred_date,
        course: "Paper Packaging Production Training",
        fee: BUSINESS.trainingFee,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Booking submitted. We will contact you shortly.");
      setForm({ name: "", phone: "", preferred_date: "" });
      queryClient.invalidateQueries({ queryKey: ["my-bookings", user?.id] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-4xl">Training</h1>
      <p className="mt-2 text-muted-foreground">
        Learn how to produce quality paper packaging products with hands-on training at our
        Kiria-ini workshop.
      </p>

      <div className="surface-card mt-6 flex flex-wrap items-center gap-4 p-6">
        <GraduationCap className="h-8 w-8 text-primary" />
        <div>
          <h2 className="font-display text-xl">Training Fee</h2>
          <p className="text-2xl font-semibold text-primary">{ksh(BUSINESS.trainingFee)}</p>
        </div>
      </div>

      <div className="surface-card mt-8 p-6">
        <h2 className="text-2xl">Book Learning Classes</h2>
        {!user && (
          <p className="mt-2 text-sm text-muted-foreground">
            Please{" "}
            <Link to="/auth" className="font-medium text-primary underline">
              sign in or create an account
            </Link>{" "}
            to submit a booking.
          </p>
        )}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="course">Training / class</Label>
            <Input
              id="course"
              value="Paper Packaging Production Training"
              readOnly
              className="mt-1 h-12"
            />
          </div>
          <div>
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              className="mt-1 h-12"
              value={form.name || profile?.full_name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Full name"
              maxLength={100}
            />
          </div>
          <div>
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              className="mt-1 h-12"
              value={form.phone || profile?.phone || ""}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="07xxxxxxxx"
              maxLength={20}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="date">Preferred date</Label>
            <Input
              id="date"
              type="date"
              className="mt-1 h-12"
              value={form.preferred_date}
              onChange={(e) => setForm({ ...form, preferred_date: e.target.value })}
            />
          </div>
        </div>
        <Button
          className="mt-5 h-12 w-full sm:w-auto"
          disabled={!user || book.isPending}
          onClick={() =>
            book.mutate(undefined, {
              onError: () => {},
            })
          }
        >
          {book.isPending ? "Submitting..." : "Submit booking"}
        </Button>
      </div>

      {user && (
        <div className="surface-card mt-8 p-6">
          <h2 className="text-2xl">My bookings</h2>
          {bookings.data?.length ? (
            <ul className="mt-4 space-y-3">
              {bookings.data.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-4"
                >
                  <div>
                    <p className="font-medium">{b.course}</p>
                    <p className="text-sm text-muted-foreground">
                      Preferred date: {b.preferred_date} · Fee {ksh(Number(b.fee))}
                    </p>
                  </div>
                  <Badge variant="secondary">{b.status}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">No bookings yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
