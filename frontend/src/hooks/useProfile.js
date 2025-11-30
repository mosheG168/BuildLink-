import { useQuery } from "@tanstack/react-query";
import { getMyContractorProfile } from "../api/contractorProfile";

export function useMyContractorProfile(options = {}) {
  return useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyContractorProfile,
    ...options,
  });
}

export function useEmbeddingReady() {
  const { data: p } = useMyContractorProfile({
    enabled: true,
    staleTime: 30_000,
  });
  return Boolean(p?.embeddingUpdatedAt) && Boolean(p?.openForWork);
}
