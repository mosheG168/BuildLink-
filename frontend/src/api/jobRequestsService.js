import api from "./client";

export async function createJobRequest({ postId, message = "" }) {
  const { data } = await api.post("/job-requests", { postId, message });
  return data; // { ok, alreadyRequested, request }
}

export async function listMyJobRequests({
  mine = "contractor",
  status,
  postId,
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortDir = "desc",
} = {}) {
  const params = { mine, page, limit, sortBy, sortDir };
  if (status) params.status = status;
  if (postId) params.postId = postId;
  const { data } = await api.get("/job-requests/my", { params });
  return data;
}

export async function listJobRequestsForContractor(opts = {}) {
  return listMyJobRequests({ mine: "contractor", ...opts });
}
export async function listJobRequestsForSubcontractor(opts = {}) {
  return listMyJobRequests({ mine: "subcontractor", ...opts });
}

export async function getMyRequestForPost({ postId }) {
  const { data } = await api.get("/job-requests/my-status", {
    params: { postIds: postId },
  });

  const x = data?.[postId];
  return x ? { ...x, _id: x.requestId, id: x.requestId } : null;
}

export async function acceptJobRequest(id) {
  const { data } = await api.patch(`/job-requests/${id}/accept`);
  return data;
}

export async function denyJobRequest(id) {
  const { data } = await api.patch(`/job-requests/${id}/deny`);
  return data;
}

export async function withdrawJobRequest(id) {
  const { data } = await api.patch(`/job-requests/${id}/withdraw`);
  return data;
}

export async function getPendingRequestsCount() {
  const { data } = await api.get("/job-requests/pending/count");
  return typeof data === "number" ? data : (data?.count ?? data?.total ?? 0);
}

export async function countPendingForContractor() {
  return getPendingRequestsCount();
}

export async function getMyRequestStatusForPosts(postIds = []) {
  const ids = (Array.isArray(postIds) ? postIds : []).filter(
    (s) => typeof s === "string" && s.length === 24
  );
  if (!ids.length) return {};
  const { data } = await api.get("/job-requests/my-status", {
    params: { postIds: ids.join(",") },
  });
  return data;
}

export async function inviteSubToPost({ postId, subcontractorId, note }) {
  const { data } = await api.post("/job-requests/invite", {
    postId,
    subcontractorId,
    note,
  });
  return data;
}

export default {
  createJobRequest,
  listMyJobRequests,
  listJobRequestsForContractor,
  listJobRequestsForSubcontractor,
  getMyRequestForPost,
  acceptJobRequest,
  denyJobRequest,
  withdrawJobRequest,
  getPendingRequestsCount,
  countPendingForContractor,
  getMyRequestStatusForPosts,
  inviteSubToPost,
};
