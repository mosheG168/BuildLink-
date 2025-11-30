import React from "react";
import { Button } from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../hooks/useToast";
import {
  createJobRequest,
  withdrawJobRequest,
  getMyRequestForPost,
} from "../../api/jobRequestsService";
import api from "../../api/client";

export default function RequestSubscribeButton({ postId, initialRequestMeta }) {
  const toast = useToast();
  const qc = useQueryClient();

  const getRequestId = (x) => x?.requestId || x?.id || x?._id || null;

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
    staleTime: 5 * 60 * 1000,
  });

  const reqQ = useQuery({
    queryKey: ["myRequestForPost", postId],
    queryFn: () => getMyRequestForPost({ postId }),
    enabled: !!postId && !initialRequestMeta,
    initialData: initialRequestMeta || null,
    staleTime: 15_000,
    retry: false,
  });

  const requestMut = useMutation({
    mutationFn: ({ postId }) => createJobRequest({ postId }),
    onSuccess: (res) => {
      const r = res?.request;
      qc.setQueriesData({ queryKey: ["posts"] }, (old) => {
        if (!old || !Array.isArray(old.items)) return old;
        return {
          ...old,
          items: old.items.map((p) =>
            String(p._id || p.id) === String(postId)
              ? {
                  ...p,
                  myRequest: r
                    ? {
                        requestId: getRequestId(r),
                        status: r.status,
                        canWithdraw: r.status === "pending",
                      }
                    : null,
                }
              : p
          ),
        };
      });

      for (const key of [
        ["posts", "recommended-for-me"],
        ["posts", "recommended"],
      ]) {
        qc.setQueryData(key, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p) =>
            String(p._id || p.id) === String(postId)
              ? {
                  ...p,
                  myRequest: r
                    ? {
                        requestId: getRequestId(r),
                        status: r.status,
                        canWithdraw: r.status === "pending",
                      }
                    : null,
                }
              : p
          );
        });
      }

      qc.setQueryData(
        ["myRequestForPost", postId],
        r ? { ...r, _id: getRequestId(r), id: getRequestId(r) } : null
      );

      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["posts", "recommended-for-me"] });

      toast.success("Request sent. Status: pending");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to create request";
      toast.error(msg);
    },
  });

  const withdrawMut = useMutation({
    mutationFn: (requestId) => withdrawJobRequest(requestId),
    onSuccess: () => {
      qc.setQueriesData({ queryKey: ["posts"] }, (old) => {
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

      for (const key of [
        ["posts", "recommended-for-me"],
        ["posts", "recommended"],
      ]) {
        qc.setQueryData(key, (old) => {
          if (!Array.isArray(old)) return old;
          return old.map((p) =>
            String(p._id || p.id) === String(postId)
              ? { ...p, myRequest: null }
              : p
          );
        });
      }

      qc.setQueryData(["myRequestForPost", postId], null);
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["posts", "recommended-for-me"] });

      toast.success("Request withdrawn");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error || err?.message || "Failed to withdraw";
      toast.error(msg);
    },
  });

  const me = meQ.data;
  const role = me?.role;
  const myReq = reqQ.data;

  const status = myReq?.status || null;
  const canWithdraw = status === "pending";
  const canRequestAgain =
    !status || ["withdrawn", "denied", "expired", "cancelled"].includes(status);

  if (role !== "subcontractor") return null;

  if (canRequestAgain) {
    return (
      <Button
        variant="contained"
        size="small"
        disabled={requestMut.isPending}
        onClick={() => requestMut.mutate({ postId })}
      >
        {requestMut.isPending ? "Requesting…" : "Request"}
      </Button>
    );
  }

  if (canWithdraw) {
    return (
      <Button
        variant="outlined"
        size="small"
        disabled={withdrawMut.isPending}
        onClick={() => {
          const rid = getRequestId(myReq);
          if (rid) withdrawMut.mutate(rid);
          else toast.error("Missing request id");
        }}
      >
        {withdrawMut.isPending ? "Cancelling…" : "Cancel request"}
      </Button>
    );
  }

  return null;
}
