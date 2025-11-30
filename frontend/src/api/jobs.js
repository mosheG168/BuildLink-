import api from "./client";

export const getMyJobs = async () => (await api.get("/jobs/my")).data;

export const getMyJobsPaged = async ({
  page = 1,
  limit = 20,
  sortBy = "createdAt",
  sortDir = "desc",
} = {}) => {
  const { data } = await api.get("/jobs/my", {
    params: { page, limit, sortBy, sortDir },
  });
  return data;
};

export const acceptJob = async (postId) =>
  (await api.post("/jobs/accept", { postId })).data;

export async function setJobStatus(jobOrId, status) {
  if (!status) {
    throw new Error("status is required");
  }

  let jobId = null;

  if (typeof jobOrId === "string") {
    jobId = jobOrId;
  } else if (jobOrId && typeof jobOrId === "object") {
    jobId =
      jobOrId._id ||
      jobOrId.id ||
      jobOrId.jobId ||
      jobOrId.job_id ||
      jobOrId.job?._id ||
      jobOrId.job?.id ||
      jobOrId.job?.jobId ||
      null;
  }

  if (!jobId || jobId === "undefined") {
    throw new Error("Could not derive job id for status update");
  }

  const { data } = await api.patch(`/jobs/${jobId}/status`, { status });
  return data.job || data;
}
