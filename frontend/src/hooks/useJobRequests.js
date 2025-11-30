import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "./queryKeys";
import {
  listMyJobRequests,
  getMyRequestForPost,
  createJobRequest,
  withdrawJobRequest,
  acceptJobRequest,
  denyJobRequest,
  getPendingRequestsCount,
} from "../api/jobRequestsService";

export function useMyRequests(params = {}, options = {}) {
  const { mine = "contractor", status, postId, page = 1, limit = 50 } = params;
  return useQuery({
    queryKey: [...QK.myRequests, { mine, status, postId, page, limit }],
    queryFn: () =>
      listMyJobRequests({
        mine,
        status,
        postId,
        page,
        limit,
        sortBy: "createdAt",
        sortDir: "desc",
      }),
    staleTime: 15_000,
    retry: false,
    ...options,
  });
}

export function useMyRequestForPost(postId, options = {}) {
  return useQuery({
    enabled: !!postId,
    queryKey: QK.myRequestForPost(postId),
    queryFn: () => getMyRequestForPost({ postId }),
    staleTime: 15_000,
    retry: false,
    ...options,
  });
}

export function usePendingRequestsCount(options = {}) {
  return useQuery({
    queryKey: ["pendingRequestsCount"], // legacy external callers use this
    queryFn: getPendingRequestsCount,
    refetchInterval: 30_000,
    ...options,
  });
}

export function useCreateRequestMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId }) => createJobRequest({ postId }),
    onSuccess: (res, vars) => {
      const postId = vars?.postId;
      const r = res?.request;

      qc.setQueriesData({ queryKey: QK.posts }, (old) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((p) =>
            String(p._id || p.id) === String(postId)
              ? {
                  ...p,
                  myRequest: r
                    ? {
                        requestId: r?.id || r?._id,
                        status: r?.status,
                        canWithdraw: r?.status === "pending",
                      }
                    : null,
                }
              : p
          ),
        };
      });

      for (const key of [QK.recommendedPosts, ["posts", "recommended"]]) {
        qc.setQueryData(key, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p) =>
            String(p._id || p.id) === String(postId)
              ? {
                  ...p,
                  myRequest: r
                    ? {
                        requestId: r?.id || r?._id,
                        status: r?.status,
                        canWithdraw: r?.status === "pending",
                      }
                    : null,
                }
              : p
          );
        });
      }

      if (postId)
        qc.invalidateQueries({ queryKey: QK.myRequestForPost(postId) });
      qc.invalidateQueries({ queryKey: QK.myRequests });
      qc.invalidateQueries({ queryKey: QK.myJobs });
      qc.invalidateQueries({ queryKey: QK.posts });
      qc.invalidateQueries({ queryKey: QK.recommendedPosts });
    },
  });
}

export function useWithdrawRequestMutations(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (requestId) => withdrawJobRequest(requestId),
    onSuccess: () => {
      qc.setQueriesData({ queryKey: QK.posts }, (old) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((p) =>
            String(p._id || p.id) === String(postId)
              ? { ...p, myRequest: null }
              : p
          ),
        };
      });

      for (const key of [QK.recommendedPosts, ["posts", "recommended"]]) {
        qc.setQueryData(key, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p) =>
            String(p._id || p.id) === String(postId)
              ? { ...p, myRequest: null }
              : p
          );
        });
      }

      if (postId) qc.setQueryData(QK.myRequestForPost(postId), null);
      qc.invalidateQueries({ queryKey: QK.myRequests });
      qc.invalidateQueries({ queryKey: QK.myJobs });
      qc.invalidateQueries({ queryKey: QK.posts });
      qc.invalidateQueries({ queryKey: QK.recommendedPosts });
    },
  });
}

export function useAcceptRequestMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => acceptJobRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.myRequests });
      qc.invalidateQueries({ queryKey: QK.myJobs });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      qc.invalidateQueries({ queryKey: QK.pipeline() });
    },
  });
}

export function useDenyRequestMutations() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => denyJobRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.myRequests });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      qc.invalidateQueries({ queryKey: QK.pipeline() });
    },
  });
}
