import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/brand";
import { Panel } from "@/components/panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

type Mode = "signin" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>): { mode: Mode } => ({
    mode: search['mode'] === "signup" ? "signup" : "signin",
  }),
  head: () => ({
    meta: [
      { title: "ElevateX — Sign in or create an account" },
      {
        name: "description",
        content:
          "Log in to your ElevateX account or sign up to save elevation projects and 3D terrain runs.",
      },
      { property: "og:title", content: "ElevateX — Sign in" },
      {
        property: "og:description",
        content: "Access the ElevateX elevation workspace with your account.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user) navigate({ to: "/workspace", replace: true });
  }, [user, navigate]);

  const isSignup = mode === "signup";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (isSignup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setSent(true);
          toast.success("Check your email to confirm your account.");
        } else {
          toast.success("Account created");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="grid-backdrop pointer-events-none absolute inset-0 opacity-30" aria-hidden />

      <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
        <Link to="/">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>

      <main className="relative mx-auto flex w-full max-w-md flex-1 items-center px-5 pb-16">
        <Panel className="w-full">
          <h1 className="text-xl font-semibold tracking-tight">
            {isSignup ? "Create your account" : "Log in to ElevateX"}
          </h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {isSignup
              ? "Sign up with an email and password to keep your elevation projects."
              : "Enter your email and password to continue."}
          </p>

          {sent ? (
            <p className="mt-6 rounded-lg border border-border bg-surface/60 p-3 text-xs leading-relaxed text-muted-foreground">
              We sent a confirmation link to <span className="text-foreground">{email}</span>. Click
              it to finish creating your account, then log in.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "Please wait…" : isSignup ? "Create account" : "Log in"}
              </Button>
            </form>
          )}

          <p className="mt-5 text-center text-xs text-muted-foreground">
            {isSignup ? "Already have an account?" : "New to ElevateX?"}{" "}
            <Link
              to="/auth"
              search={{ mode: isSignup ? "signin" : "signup" }}
              className="text-primary underline-offset-4 hover:underline"
            >
              {isSignup ? "Log in" : "Create one"}
            </Link>
          </p>
        </Panel>
      </main>
    </div>
  );
}
