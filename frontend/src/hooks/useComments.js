import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QK } from "./queryKeys";
import {
  listComments as apiList,
  createComment as apiCreate,
  deleteComment as apiDelete,
  updateComment as apiUpdate,
  listReplies as apiListReplies,
} from "../api/comments";

const toArray = (v) => (Array.isArray(v) ? v : []);

export function useComments(postId, options = {}) {
  return useQuery({
    enabled: !!postId,
    queryKey: QK.comments(postId),
    queryFn: () => apiList({ postId, limit: 50, sort: "date" }),
    select: (d) => toArray(d),
    ...options,
  });
}

export function useCreateComment(postId, parent) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ content, mentions }) =>
      apiCreate({ postId, content, mentions, parent }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.comments(postId) });

      if (parent) qc.invalidateQueries({ queryKey: ["replies", parent] });
    },
  });
}

export function useDeleteComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId) => apiDelete(commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.comments(postId) }),
  });
}

export function useUpdateComment(postId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }) => apiUpdate(id, { content }),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK.comments(postId) }),
  });
}

export function useReplies(parentId, options = {}) {
  const safeOptions = options && typeof options === "object" ? options : {};
  const { enabled: optEnabled, ...rest } = safeOptions;

  const normalizedEnabled =
    typeof optEnabled === "function"
      ? () => !!parentId && !!optEnabled()
      : !!parentId && (typeof optEnabled === "boolean" ? optEnabled : true);

  return useQuery({
    queryKey: ["replies", parentId],
    queryFn: () => apiListReplies(parentId, { limit: 50, sort: "date:asc" }),
    enabled: normalizedEnabled,
    select: (d) => toArray(d),
    ...rest,
  });
}
