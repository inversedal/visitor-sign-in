import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: session, isLoading } = useQuery({
    queryKey: ["/api/admin/session"],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    isAuthenticated: session?.authenticated || false,
    user: session?.user || null,
    isLoading,
  };
}
