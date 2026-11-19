"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to log out"
      );
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={handleLogout}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Logging out…
        </>
      ) : (
        <>
          <LogOut className="size-4" aria-hidden="true" />
          Logout
        </>
      )}
    </Button>
  );
}
