import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, UserRound } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/lib/use-session";

export function AuthMenu({ compact = false }: { compact?: boolean }) {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (loading) {
    return <span className="h-8 w-20 animate-pulse rounded-md bg-muted" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/auth" search={{ mode: "signin" }}>
          <Button variant="ghost" size="sm">
            Log in
          </Button>
        </Link>
        <Link to="/auth" search={{ mode: "signup" }}>
          <Button size="sm">Sign up</Button>
        </Link>
      </div>
    );
  }

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/", replace: true });
  };

  return (
    <div className="flex items-center gap-2">
      {compact ? null : (
        <span className="hidden items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1 text-xs text-foreground/90 sm:inline-flex">
          <UserRound className="size-3.5 text-primary" />
          {user.email}
        </span>
      )}
      <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSignOut}>
        <LogOut className="size-3.5" />
        Sign out
      </Button>
    </div>
  );
}
