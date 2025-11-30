import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPosts,
  getPostById,
  getMyPosts as apiGetMyPosts,
  getRecommendedPostsForMe,
} from "../api/posts";
import { QK } from "./queryKeys";

const toArray = (d) => {
  if (Array.isArray(d)) return d;
  if (Array.isArray(d?.items)) return d.items;
  if (Array.isArray(d?.data)) return d.data;
  if (Array.isArray(d?.results)) return d.results;
  return [];
};

const asId = (v) =>
  typeof v === "string" ? v : v?._id || v?.id || v?.sub || null;

export function useAllPosts(options = {}) {
  return useQuery({
    queryKey: QK.posts,
    queryFn: getPosts,
    select: (data) => toArray(data),
    retry: false,
    ...options,
  });
}

export function useRecommendedPosts(topK = 20, options = {}) {
  return useQuery({
    queryKey: QK.recommendedPosts,
    queryFn: () => getRecommendedPostsForMe(topK),
    retry: false,
    ...options,
  });
}

export function useMyPosts(arg1, arg2 = {}, arg3 = {}) {
  let userId, params, options;

  const looksLikeIdCarrier =
    typeof arg1 === "string" || arg1?._id || arg1?.id || arg1?.sub;

  if (looksLikeIdCarrier) {
    userId = asId(arg1);
    params = arg2 || {};
    options = arg3 || {};
  } else {
    const { publisherId, ...rest } = arg1 || {};
    userId = asId(publisherId);
    params = rest || {};
    options = arg2 || {};
  }

  const limit = params.limit ?? 50;
  const sortBy = params.sortBy ?? "createdAt";
  const sortDir = params.sortDir ?? "desc";

  return useQuery({
    enabled: !!userId && (options.enabled ?? true),
    queryKey: QK.myPosts(userId),
    queryFn: () =>
      apiGetMyPosts({
        publisherId: userId,
        limit,
        sortBy,
        sortDir,
      }),
    select: (data) => toArray(data),
    ...options,
  });
}

export function usePost(
  postId,
  { includeMyRequest = true } = {},
  options = {}
) {
  return useQuery({
    enabled: !!postId,
    queryKey: QK.post(postId),
    queryFn: () => getPostById(postId, { includeMyRequest }),
    staleTime: 30_000,
    ...options,
  });
}

export function usePrefetchPost() {
  const qc = useQueryClient();
  return (postId) =>
    qc.prefetchQuery({
      queryKey: QK.post(postId),
      queryFn: () => getPostById(postId, { includeMyRequest: true }),
      staleTime: 30_000,
    });
}
