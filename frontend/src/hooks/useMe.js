import { useQuery } from "@tanstack/react-query";
import api, { getAuthToken } from "../api/client";
import { QK } from "./queryKeys";

export function useMe(options = {}) {
  const hasToken = !!getAuthToken();

  return useQuery({
    queryKey: QK.me,
    queryFn: async () => (await api.get("/users/me")).data,
    enabled: hasToken && (options.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    retry: false,
    ...options,
  });
}
