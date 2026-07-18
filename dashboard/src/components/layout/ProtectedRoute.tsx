import { Navigate, Outlet } from "react-router";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-6 text-muted-foreground" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
