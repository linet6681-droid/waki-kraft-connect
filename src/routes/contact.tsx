import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { MapPin, Phone, Clock, MessageCircle, Facebook, Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { BUSINESS, whatsappLink } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Waki Packages" },
      {
        name: "description",
        content:
          "Contact Waki Packages on 072509498 or visit us in Kiria-ini Town, behind Bingo Hardware. Open Monday to Saturday, 8:00 AM - 5:00 PM.",
      },
      { property: "og:title", content: "Contact Us | Waki Packages" },
      { property: "og:description", content: "Call, WhatsApp or visit our Kiria-ini shop." },
    ],
  }),
  component: Contact,
});

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(30),
  email: z.string().trim().email("Enter a valid email").max(255).or(z.literal("")),
  message: z.string().trim().min(5, "Enter your message").max(2000),
});

function Contact() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", message: "" });

  const send = useMutation({
    mutationFn: async () => {
      const parsed = schema.safeParse(form);
      if (!parsed.success) throw new Error(parsed.error.issues[0]!.message);
      const { error } = await supabase.from("contact_messages").insert({
        name: parsed.data.name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        message: parsed.data.message,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Message sent. We will get back to you soon.");
      setForm({ name: "", phone: "", email: "", message: "" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-4xl">Contact Us</h1>
      <p className="mt-2 text-muted-foreground">
        We are happy to help with orders, prices and training.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="surface-card flex gap-3 p-5">
            <Phone className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-base">Phone</h2>
              <a href={`tel:${BUSINESS.phone}`} className="text-muted-foreground">
                {BUSINESS.phone}
              </a>
            </div>
          </div>
          <div className="surface-card flex gap-3 p-5">
            <MapPin className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-base">Location</h2>
              <p className="text-muted-foreground">{BUSINESS.location}</p>
            </div>
          </div>
          <div className="surface-card flex gap-3 p-5">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <div>
              <h2 className="font-display text-base">Opening hours</h2>
              <p className="text-muted-foreground">
                {BUSINESS.days}
                <br />
                {BUSINESS.hours}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-12">
              <a href={whatsappLink()} target="_blank" rel="noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" /> WhatsApp us
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <a href={BUSINESS.facebookUrl} target="_blank" rel="noreferrer">
                <Facebook className="mr-2 h-5 w-5" /> Facebook
              </a>
            </Button>
            <Button asChild variant="outline" className="h-12">
              <a href={BUSINESS.tiktokUrl} target="_blank" rel="noreferrer">
                <Music2 className="mr-2 h-5 w-5" /> TikTok
              </a>
            </Button>
          </div>
        </div>

        <div className="surface-card p-6">
          <h2 className="text-2xl">Send a message</h2>
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="c-name">Name</Label>
              <Input
                id="c-name"
                className="mt-1 h-12"
                value={form.name}
                maxLength={100}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-phone">Phone number</Label>
              <Input
                id="c-phone"
                className="mt-1 h-12"
                value={form.phone}
                maxLength={30}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-email">Email</Label>
              <Input
                id="c-email"
                type="email"
                className="mt-1 h-12"
                value={form.email}
                maxLength={255}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="c-message">Message</Label>
              <Textarea
                id="c-message"
                className="mt-1 min-h-32"
                value={form.message}
                maxLength={2000}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </div>
            <Button
              className="h-12 w-full"
              disabled={send.isPending}
              onClick={() => send.mutate()}
            >
              {send.isPending ? "Sending..." : "Send Message"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
