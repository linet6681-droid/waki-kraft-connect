import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BUSINESS } from "@/lib/site";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In or Create Account | Waki Packages" },
      {
        name: "description",
        content:
          "Create a Waki Packages account to shop packaging products, track orders and book training classes.",
      },
      { property: "og:title", content: "Sign In or Create Account | Waki Packages" },
      { property: "og:description", content: "Your Waki Packages customer account." },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().min(9, "Enter a valid phone number").max(20),
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [signIn, setSignIn] = useState({ email: "", password: "" });
  const [signUp, setSignUp] = useState({ full_name: "", phone: "", email: "", password: "" });

  useEffect(() => {
    if (user) navigate({ to: "/dashboard", replace: true });
  }, [user, navigate]);

  const handleSignIn = async () => {
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: signIn.email.trim(),
      password: signIn.password,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate({ to: "/dashboard" });
  };

  const handleSignUp = async () => {
    const parsed = signUpSchema.safeParse(signUp);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      toast.success("Account created!");
      navigate({ to: "/dashboard" });
    } else {
      toast.success("Account created. Check your email to confirm before signing in.");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-center text-3xl">{BUSINESS.name}</h1>
      <p className="mt-1 text-center text-sm text-muted-foreground">
        Sign in to shop, track orders and book training.
      </p>

      <div className="surface-card mt-8 p-6">
        <Tabs defaultValue="signin">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Sign in</TabsTrigger>
            <TabsTrigger value="signup">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="mt-5 space-y-4">
            <div>
              <Label htmlFor="in-email">Email</Label>
              <Input
                id="in-email"
                type="email"
                className="mt-1 h-12"
                value={signIn.email}
                onChange={(e) => setSignIn({ ...signIn, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="in-pass">Password</Label>
              <Input
                id="in-pass"
                type="password"
                className="mt-1 h-12"
                value={signIn.password}
                onChange={(e) => setSignIn({ ...signIn, password: e.target.value })}
              />
            </div>
            <Button className="h-12 w-full" disabled={busy} onClick={handleSignIn}>
              Sign in
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="mt-5 space-y-4">
            <div>
              <Label htmlFor="up-name">Full name</Label>
              <Input
                id="up-name"
                className="mt-1 h-12"
                value={signUp.full_name}
                maxLength={100}
                onChange={(e) => setSignUp({ ...signUp, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="up-phone">Phone number</Label>
              <Input
                id="up-phone"
                className="mt-1 h-12"
                value={signUp.phone}
                maxLength={20}
                onChange={(e) => setSignUp({ ...signUp, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="up-email">Email</Label>
              <Input
                id="up-email"
                type="email"
                className="mt-1 h-12"
                value={signUp.email}
                maxLength={255}
                onChange={(e) => setSignUp({ ...signUp, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="up-pass">Password</Label>
              <Input
                id="up-pass"
                type="password"
                className="mt-1 h-12"
                value={signUp.password}
                onChange={(e) => setSignUp({ ...signUp, password: e.target.value })}
              />
            </div>
            <Button className="h-12 w-full" disabled={busy} onClick={handleSignUp}>
              Create account
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
