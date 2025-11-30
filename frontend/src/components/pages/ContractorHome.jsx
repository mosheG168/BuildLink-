import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  useSearchParams,
  Navigate,
  Link as RouterLink,
} from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import { useMyPosts } from "../../hooks/usePosts";
import {
  usePendingRequestsCount,
  useMyRequests,
} from "../../hooks/useJobRequests";
import {
  Box,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  Button,
  Chip,
  Divider,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Collapse,
  Autocomplete,
  InputAdornment,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  SKILL_OPTIONS,
  SERVICE_OPTIONS,
  JOBTYPE_OPTIONS,
  AREAS_IL,
} from "../constants/profileOptions";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import {
  createPostWithEmbedding,
  updatePost,
  deletePostById,
  getRecommendedSubsForPost,
} from "../../api/posts";
import { getMyJobs, setJobStatus } from "../../api/jobs";
import {
  acceptJobRequest,
  denyJobRequest,
  inviteSubToPost,
} from "../../api/jobRequestsService";
import { getMyContractorProfile } from "../../api/contractorProfile";
import { useToast } from "../../hooks/useToast";
import {
  JOB_TITLE_SUGGESTIONS,
  SALARY_SUGGESTIONS,
  REQUIREMENTS_SUGGESTIONS,
} from "../../../../shared/jobPostOptions";
import api from "../../api/client";
import CommentsSection from "../comments/CommentsSection";
import JobDetailsModal from "../jobs/JobDetailsModal";

const toArray = (d) =>
  Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [];

const trimOrNull = (v) => {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
};

const filterByInput = (options, input) => {
  const s = String(input || "")
    .trim()
    .toLowerCase();
  if (s.length < 2) return [];
  return options
    .filter((opt) => String(opt).toLowerCase().includes(s))
    .slice(0, 12);
};

const contractorCreateJobMissing = (p) => {
  if (!p) return ["פרופיל חסר"];
  const miss = [];
  if (!p.primaryTrade?.trim()) miss.push("מקצוע ראשי");
  if (!p.profilePhotoUrl?.trim()) miss.push("תמונת פרופיל");
  if (!p.contractorLicense?.verified) miss.push("רישיון קבלן מאומת (gov.il)");
  return miss;
};

const statusLabelMap = {
  pending: "Pending",
  accepted: "Accepted",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const deriveStatusMeta = (jobsForPost) => {
  if (!jobsForPost?.length) {
    return { label: "Awaiting subcontractor", color: "default", job: null };
  }

  const primary =
    jobsForPost.find((j) => j.status === "in_progress") ||
    jobsForPost.find((j) => j.status === "accepted") ||
    jobsForPost[0];

  const status = primary.status || "pending";

  let color = "info";
  if (status === "in_progress") color = "warning";
  else if (status === "completed") color = "success";
  else if (status === "cancelled") color = "default";

  return {
    label: statusLabelMap[status] || status,
    color,
    job: primary,
  };
};

export default function ContractorHome() {
  const qc = useQueryClient();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const focusId = searchParams.get("focus");
  const closeDetails = () => {
    const sp = new URLSearchParams(searchParams);
    sp.delete("open");
    sp.delete("focus");
    setSearchParams(sp, { replace: true });
  };

  const meQ = useMe();
  const userId = meQ.data?._id || meQ.data?.id;
  const isContractor = !!meQ.data?.isBusiness;
  const profileQ = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyContractorProfile,
    enabled: !!userId,
    staleTime: 30_000,
  });

  const { data: pendingCount = 0 } = usePendingRequestsCount();

  const myPostsQ = useMyPosts(
    { publisherId: userId, limit: 50, sortBy: "createdAt", sortDir: "desc" },
    { enabled: !!userId, select: (d) => toArray(d) }
  );

  const myJobsQ = useQuery({
    queryKey: ["myJobs"],
    queryFn: getMyJobs,
    enabled: !!userId,
    select: (d) => toArray(d),
    staleTime: 30_000,
  });

  const startJobMut = useMutation({
    mutationFn: (jobId) => setJobStatus(jobId, "in_progress"),
    onSuccess: () => {
      toast.success("Job started");
      qc.invalidateQueries({ queryKey: ["myJobs"] });
    },
    onError: (e) =>
      toast.error(
        e?.response?.data?.error || e.message || "Could not start the job"
      ),
  });

  const completeJobMut = useMutation({
    mutationFn: (jobId) => setJobStatus(jobId, "completed"),
    onSuccess: () => {
      toast.success("Job completed");
      qc.invalidateQueries({ queryKey: ["myJobs"] });
    },
    onError: (e) =>
      toast.error(
        e?.response?.data?.error || e.message || "Could not complete the job"
      ),
  });

  const cancelJobMut = useMutation({
    mutationFn: (jobId) => setJobStatus(jobId, "cancelled"),
    onSuccess: () => {
      toast.success("Job cancelled");
      qc.invalidateQueries({ queryKey: ["myJobs"] });
    },
    onError: (e) =>
      toast.error(
        e?.response?.data?.error || e.message || "Could not cancel the job"
      ),
  });

  const removeWorkerMut = useMutation({
    mutationFn: (jobId) => setJobStatus(jobId, "cancelled"),
    onSuccess: () => {
      toast.success("Worker removed from job");
      qc.invalidateQueries({ queryKey: ["myJobs"] });
    },
    onError: (e) =>
      toast.error(
        e?.response?.data?.error ||
          e.message ||
          "Could not remove worker from job"
      ),
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [editPost, setEditPost] = useState(null);
  const [openForPostId, setOpenForPostId] = useState(null);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("new") === "1") handleCreateClick();
  }, [profileQ.data, isContractor]);

  const createMut = useMutation({
    mutationFn: (payload) => createPostWithEmbedding(payload),
    onSuccess: () => {
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      toast.success("Job created");
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e.message || "Failed"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, patch }) => updatePost(id, patch),
    onSuccess: () => {
      setEditPost(null);
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      toast.success("Job updated");
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e.message || "Failed"),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => deletePostById(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-posts"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      qc.invalidateQueries({ queryKey: ["jobRequests"] });
      qc.invalidateQueries({ queryKey: ["jobRequests", "contractor"] });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      toast.success("Job deleted");
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e.message || "Failed"),
  });

  const handleCreateClick = () => {
    if (isContractor) {
      const missing = contractorCreateJobMissing(profileQ.data || {});
      if (missing.length) {
        toast.error(
          `הפרופיל לא מוכן ליצירת משרה: ${missing.join(
            ", "
          )}. פתח/י את הפרופיל והשלמ/י את השדות.`,
          6500
        );
        return;
      }
    }
    setCreateOpen(true);
  };

  const posts = myPostsQ.data || [];
  const jobs = myJobsQ.data || [];
  const activeJobsCount = jobs.filter(
    (j) => j?.status === "in_progress"
  ).length;
  const completedJobsCount = jobs.filter(
    (j) => j?.status === "completed"
  ).length;

  if (meQ.isLoading || myPostsQ.isLoading || profileQ.isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isContractor) return <Navigate to="/home" replace />;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: 1100,
        mx: "auto",
        "@media (max-width:400px)": {
          px: 1.5,
        },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems="center"
        spacing={{ xs: 1.5, sm: 0 }}
        sx={{ mb: 2 }}
      >
        <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />

        <Typography
          variant="h4"
          sx={{
            flex: 1,
            textAlign: "center",
            fontSize: { xs: "1.6rem", sm: "2rem" },
          }}
        >
          Contractor Dashboard
        </Typography>

        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: { xs: "center", sm: "flex-end" },
            mt: { xs: 1, sm: 0 },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <Button
            variant="contained"
            onClick={handleCreateClick}
            startIcon={<AddIcon />}
            sx={{
              minWidth: { xs: "100%", sm: 180 },
              borderRadius: 999,
              textTransform: "none",
            }}
          >
            Create Job
          </Button>
        </Box>
      </Stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3, flexWrap: "wrap" }}
      >
        <Paper
          sx={{
            p: 2,
            minWidth: { xs: "100%", sm: 220 },
            flex: 1,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Pending Requests
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            {pendingCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Requests waiting for your decision
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 2,
            minWidth: { xs: "100%", sm: 220 },
            flex: 1,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Your Posts
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            {posts.length}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            All open and past job posts
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 2,
            minWidth: { xs: "100%", sm: 220 },
            flex: 1,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Active Jobs
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            {activeJobsCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Jobs currently in progress
          </Typography>
        </Paper>
        <Paper
          sx={{
            p: 2,
            minWidth: { xs: "100%", sm: 220 },
            flex: 1,
            textAlign: { xs: "center", sm: "left" },
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Completed Jobs
          </Typography>
          <Typography variant="h5" sx={{ mt: 0.5 }}>
            {completedJobsCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Jobs finished and closed
          </Typography>
        </Paper>
      </Stack>
      <ApplicantsPipeline posts={posts} />
      <Paper
        sx={{
          p: { xs: 1.5, sm: 2 },
          mt: 3,
        }}
      >
        <Typography
          variant="h6"
          gutterBottom
          sx={{ textAlign: "center", mb: 1.5 }}
        >
          Your Job Posts
        </Typography>

        {!posts.length ? (
          <Typography color="text.secondary">
            No posts yet. Use &quot;Create Job&quot; to publish your first
            project.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {posts.map((p) => {
              const postId = p._id || p.id;

              const jobsForPost = (jobs || []).filter((j) => {
                const pid = j.post?._id || j.post || j.postId;
                return pid && postId && String(pid) === String(postId);
              });

              const statusMeta = deriveStatusMeta(jobsForPost);

              const workers = (jobsForPost || [])
                .filter((j) =>
                  ["accepted", "in_progress", "completed"].includes(j.status)
                )
                .map((job) => {
                  const raw =
                    job.workerDisplay ||
                    job.worker ||
                    job.workerProfile ||
                    job.workerUser ||
                    {};

                  const display = {
                    id:
                      raw.id ||
                      raw._id ||
                      raw.userId ||
                      raw.user ||
                      raw.user_id,
                    name:
                      raw.name ||
                      raw.displayName ||
                      [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
                      raw.fullName ||
                      "Subcontractor",
                    title: raw.title || raw.primaryTrade || "",
                    avatarUrl: raw.avatarUrl || raw.profilePhotoUrl || "",
                    hasProfile:
                      raw.hasProfile != null
                        ? raw.hasProfile
                        : !!(
                            raw.id ||
                            raw._id ||
                            raw.userId ||
                            raw.user ||
                            raw.user_id
                          ),
                  };

                  return {
                    jobId: job._id || job.id,
                    display,
                    status: job.status,
                  };
                })
                .filter((w) => w.jobId && w.display && w.display.name);

              return (
                <PostCard
                  key={postId}
                  post={p}
                  meId={userId}
                  jobsForPost={jobsForPost}
                  statusMeta={statusMeta}
                  workers={workers}
                  onStartJob={(jobId) => startJobMut.mutate(jobId)}
                  onEndJob={(jobId) => completeJobMut.mutate(jobId)}
                  onCancelJobs={(jobIds) =>
                    jobIds.forEach((id) => cancelJobMut.mutate(id))
                  }
                  onRemoveWorker={(jobId) => removeWorkerMut.mutate(jobId)}
                  onEdit={(postWithDates) => setEditPost(postWithDates || p)}
                  onDelete={() => deleteMut.mutate(p._id || p.id)}
                  onViewSubs={() => setOpenForPostId(p._id || p.id)}
                />
              );
            })}
          </Stack>
        )}
      </Paper>
      <UpsertDialog
        title="Create New Job"
        open={createOpen}
        initial={{
          title: "",
          content: "",
          salary: "",
          requirements: [],
          maxWorkers: 1,
          jobTypes: [],
          areas: [],
          skills: [],
          services: [],
          startDate: null,
          endDate: null,
        }}
        submitting={createMut.isPending}
        onSubmit={(vals) => {
          const maxWorkersNum =
            vals.maxWorkers == null || vals.maxWorkers === ""
              ? 1
              : Math.max(1, Number(vals.maxWorkers) || 1);

          const requirementsString =
            Array.isArray(vals.requirements) && vals.requirements.length
              ? vals.requirements.join(", ")
              : undefined;

          const payload = {
            title: trimOrNull(vals.title),
            content: trimOrNull(vals.content),
            salary: trimOrNull(vals.salary) || undefined,
            requirements: requirementsString,
            maxWorkers: maxWorkersNum,
            jobTypes: Array.isArray(vals.jobTypes) ? vals.jobTypes : [],
            areas: Array.isArray(vals.areas) ? vals.areas : [],
            skills: Array.isArray(vals.skills) ? vals.skills : [],
            services: Array.isArray(vals.services) ? vals.services : [],
            startDate: vals.startDate || null,
            endDate: vals.endDate || null,
          };

          createMut.mutate(payload);
        }}
        onClose={() => setCreateOpen(false)}
      />
      <UpsertDialog
        title="Edit Job"
        open={!!editPost}
        initial={editPost || {}}
        submitting={updateMut.isPending}
        onSubmit={(vals) =>
          updateMut.mutate({
            id: editPost._id || editPost.id,
            patch: {
              title: trimOrNull(vals.title),
              content: trimOrNull(vals.content),
              salary: trimOrNull(vals.salary) || undefined,
              requirements:
                Array.isArray(vals.requirements) && vals.requirements.length
                  ? vals.requirements.join(", ")
                  : undefined,
              maxWorkers:
                vals.maxWorkers == null || vals.maxWorkers === ""
                  ? undefined
                  : Math.max(1, Number(vals.maxWorkers) || 1),
              jobTypes: Array.isArray(vals.jobTypes) ? vals.jobTypes : [],
              areas: Array.isArray(vals.areas) ? vals.areas : [],
              skills: Array.isArray(vals.skills) ? vals.skills : [],
              services: Array.isArray(vals.services) ? vals.services : [],
              startDate: vals.startDate || null,
              endDate: vals.endDate || null,
            },
          })
        }
        onClose={() => setEditPost(null)}
      />
      <MatchingSubsDialog
        postId={openForPostId}
        onClose={() => setOpenForPostId(null)}
      />
      <JobDetailsModal
        postId={openId || undefined}
        open={Boolean(openId)}
        onClose={closeDetails}
        focusId={focusId || undefined}
      />
    </Box>
  );
}

function ApplicantsPipeline({ posts }) {
  const qc = useQueryClient();
  const toast = useToast();
  const [postFilter, setPostFilter] = useState("all");
  const postOptions = React.useMemo(
    () => [
      { label: "All Posts", value: "all" },
      ...posts.map((p) => ({
        label: p.title || "Untitled",
        value: String(p._id || p.id),
      })),
    ],
    [posts]
  );

  const selectedOption =
    postOptions.find((opt) => opt.value === postFilter) || postOptions[0];

  const commonParams = {
    limit: 50,
    ...(postFilter !== "all" ? { postId: postFilter } : {}),
  };

  const pendingQ = useMyRequests(
    { mine: "contractor", status: "pending", ...commonParams },
    { select: (d) => d.filter((r) => r?.post) }
  );

  const acceptedQ = useMyRequests(
    { mine: "contractor", status: "accepted", ...commonParams },
    { select: (d) => d.filter((r) => r?.post) }
  );

  const deniedQ = useMyRequests(
    { mine: "contractor", status: "denied", ...commonParams },
    { select: (d) => d.filter((r) => r?.post) }
  );

  const acceptMut = useMutation({
    mutationFn: (id) => acceptJobRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobRequests"] });
      qc.invalidateQueries({ queryKey: ["jobRequests", "contractor"] });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      toast.success("Request accepted");
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e.message || "Failed"),
  });

  const denyMut = useMutation({
    mutationFn: (id) => denyJobRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["jobRequests"] });
      qc.invalidateQueries({ queryKey: ["jobRequests", "contractor"] });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      toast.success("Request updated");
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e.message || "Failed"),
  });

  const renderCol = (title, q, actions) => {
    const rows = q.data || [];
    return (
      <Paper
        sx={{
          p: 2,
          flex: 1,
          minWidth: { xs: "100%", sm: 280 },
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="subtitle1">{title}</Typography>
          <Chip label={rows.length} size="small" />
        </Stack>
        <Divider sx={{ my: 1.5 }} />
        {q.isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={20} />
          </Box>
        ) : !rows.length ? (
          <Typography color="text.secondary">No items</Typography>
        ) : (
          <Stack spacing={1.25}>
            {rows.map((r) => {
              const id = r._id || r.id;
              const origin = (r.origin || "sub").toLowerCase();
              const isInvite = origin === "contractor";
              return (
                <Paper key={id} sx={{ p: 1.25 }}>
                  <Typography variant="body2" fontWeight={600}>
                    {r.subcontractor?.displayName ||
                      `${r.subcontractor?.name?.first || ""} ${
                        r.subcontractor?.name?.last || ""
                      }`.trim() ||
                      "Subcontractor"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    for: {r.post?.title || "—"}
                  </Typography>
                  {actions?.(r, { isInvite })}
                </Paper>
              );
            })}
          </Stack>
        )}
      </Paper>
    );
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={{ xs: 1.5, sm: 0 }}
        sx={{ mb: 1.5 }}
      >
        <Typography variant="h6">Applicants</Typography>
        <Autocomplete
          size="small"
          sx={{ width: { xs: "100%", sm: 260 }, maxWidth: 320 }}
          options={postOptions}
          getOptionLabel={(option) => option.label}
          value={selectedOption}
          onChange={(_, option) => {
            setPostFilter(option?.value || "all");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Filter by job"
              placeholder="Type job title…"
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
        />
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {renderCol("Pending", pendingQ, (r, { isInvite }) => (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {isInvite ? (
              <>
                <Chip
                  size="small"
                  label="Awaiting subcontractor"
                  sx={{ mr: 1 }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => denyMut.mutate(r._id || r.id)}
                  disabled={denyMut.isPending}
                >
                  {denyMut.isPending ? "Cancelling…" : "Cancel invite"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => acceptMut.mutate(r._id || r.id)}
                  disabled={acceptMut.isPending}
                >
                  {acceptMut.isPending ? "Accepting…" : "Accept"}
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={() => denyMut.mutate(r._id || r.id)}
                  disabled={denyMut.isPending}
                >
                  {denyMut.isPending ? "Denying…" : "Deny"}
                </Button>
              </>
            )}
          </Stack>
        ))}
        {renderCol("Accepted", acceptedQ, () => (
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              variant="outlined"
              component={RouterLink}
              to="/jobs/my?status=accepted"
            >
              Manage job
            </Button>
          </Stack>
        ))}
        {renderCol("Denied", deniedQ)}
      </Stack>
    </Box>
  );
}

function UpsertDialog({ title, open, initial, submitting, onSubmit, onClose }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const normalizeRequirements = (req) => {
    if (!req) return [];
    if (Array.isArray(req)) {
      return req.map((s) => String(s).trim()).filter((s) => s && s !== "0");
    }
    return String(req)
      .split(/[,\n;]+/)
      .map((s) => s.trim())
      .filter((s) => s && s !== "0");
  };

  const toDateInput = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const makeInitial = (init) => ({
    title: init?.title || "",
    content: init?.content || "",
    salary: init?.salary || "",
    maxWorkers:
      init?.maxWorkers != null && !Number.isNaN(Number(init.maxWorkers))
        ? Math.max(1, Number(init.maxWorkers))
        : 1,
    jobTypes: init?.jobTypes || [],
    areas: init?.areas || [],
    skills: init?.skills || [],
    services: init?.services || [],
    requirements: normalizeRequirements(init?.requirements),
    startDate: init?.startDate ? toDateInput(init.startDate) : "",
    endDate: init?.endDate ? toDateInput(init.endDate) : "",
  });

  const [v, setV] = useState(makeInitial(initial));
  const [touched, setTouched] = useState({ title: false, content: false });

  const [titleInput, setTitleInput] = useState(initial?.title || "");
  const [titleOpen, setTitleOpen] = useState(false);
  const [salaryInput, setSalaryInput] = useState(initial?.salary || "");
  const [salaryOpen, setSalaryOpen] = useState(false);
  const [reqInput, setReqInput] = useState("");
  const [reqOpen, setReqOpen] = useState(false);

  const prevIdRef = React.useRef(null);

  React.useEffect(() => {
    if (!open) {
      prevIdRef.current = null;
      return;
    }
    const id =
      initial && (initial._id || initial.id)
        ? String(initial._id || initial.id)
        : "__create__";

    if (prevIdRef.current === id) return;
    prevIdRef.current = id;

    const next = makeInitial(initial);
    setV(next);
    setTouched({ title: false, content: false });
    setTitleInput(next.title || "");
    setSalaryInput(next.salary || "");
    setReqInput("");
  }, [open, initial]);

  const titleVal = String(v.title || "").trim();
  const contentVal = String(v.content || "").trim();

  const titleInvalid = titleVal.length < 3;
  const contentInvalid = contentVal.length < 10;

  const titleErr =
    touched.title && titleVal && titleInvalid
      ? "Title must be at least 3 characters"
      : "";
  const contentErr =
    touched.content && contentVal && contentInvalid
      ? "Description must be at least 10 characters"
      : "";

  const maxWorkersNum =
    v.maxWorkers === "" || v.maxWorkers == null ? null : Number(v.maxWorkers);
  const maxWorkersErr =
    maxWorkersNum !== null && (Number.isNaN(maxWorkersNum) || maxWorkersNum < 1)
      ? "Team size must be at least 1"
      : "";

  const todayIso = new Date().toISOString().slice(0, 10);
  const startDateErr =
    v.startDate && v.startDate < todayIso
      ? "Start date cannot be earlier than today"
      : "";

  const endDateErr =
    v.endDate && v.startDate && v.endDate < v.startDate
      ? "End date cannot be before start date"
      : v.endDate && v.endDate < todayIso
        ? "End date cannot be earlier than today"
        : "";

  const disabled =
    titleInvalid ||
    contentInvalid ||
    !!maxWorkersErr ||
    !!startDateErr ||
    !!endDateErr;

  const titleOpts = React.useMemo(
    () => filterByInput(JOB_TITLE_SUGGESTIONS, titleInput),
    [titleInput]
  );
  const salaryOpts = React.useMemo(
    () => filterByInput(SALARY_SUGGESTIONS, salaryInput),
    [salaryInput]
  );
  const reqOpts = React.useMemo(
    () => filterByInput(REQUIREMENTS_SUGGESTIONS, reqInput),
    [reqInput]
  );

  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setV((s) => ({ ...s, content: val }));
    if (!touched.content && val !== "") {
      setTouched((t) => ({ ...t, content: true }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ textAlign: "center" }}>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Basic details
          </Typography>
          <Autocomplete
            freeSolo
            forcePopupIcon={false}
            open={titleOpen && titleOpts.length > 0}
            onOpen={() => setTitleOpen(true)}
            onClose={() => setTitleOpen(false)}
            inputValue={titleInput}
            onInputChange={(_, val, reason) => {
              setTitleInput(val);
              setTitleOpen(reason === "input" && val.trim().length >= 2);
              setV((s) => ({ ...s, title: val }));
              if (!touched.title && val !== "") {
                setTouched((t) => ({ ...t, title: true }));
              }
            }}
            options={titleOpts}
            value={v.title || ""}
            onChange={(_, val) =>
              setV((s) => ({ ...s, title: val || s.title }))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Job Title"
                error={!!titleErr}
                helperText={titleErr || " "}
              />
            )}
          />
          <Autocomplete
            freeSolo
            forcePopupIcon={false}
            open={salaryOpen && salaryOpts.length > 0}
            onOpen={() => setSalaryOpen(true)}
            onClose={() => setSalaryOpen(false)}
            inputValue={salaryInput}
            onInputChange={(_, val, reason) => {
              setSalaryInput(val);
              setSalaryOpen(reason === "input" && val.trim().length >= 2);
              setV((s) => ({ ...s, salary: val }));
            }}
            options={salaryOpts}
            value={v.salary || ""}
            onChange={(_, val) =>
              setV((s) => ({ ...s, salary: val || s.salary }))
            }
            renderInput={(params) => (
              <TextField {...params} label="Salary Range" />
            )}
          />
          <TextField
            label="Job Description"
            fullWidth
            multiline
            rows={4}
            value={v.content || ""}
            error={!!contentErr}
            helperText={contentErr || " "}
            onChange={handleDescriptionChange}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Schedule
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label="Planned start date"
              type="date"
              fullWidth
              value={v.startDate || ""}
              onChange={(e) =>
                setV((s) => ({ ...s, startDate: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              error={!!startDateErr}
              helperText={startDateErr || " "}
            />
            <TextField
              label="Planned end date"
              type="date"
              fullWidth
              value={v.endDate || ""}
              onChange={(e) => setV((s) => ({ ...s, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              error={!!endDateErr}
              helperText={endDateErr || " "}
            />
          </Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Requirements & scope
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            forcePopupIcon={false}
            open={reqOpen && reqOpts.length > 0}
            onOpen={() => setReqOpen(true)}
            onClose={() => setReqOpen(false)}
            value={Array.isArray(v.requirements) ? v.requirements : []}
            onChange={(_, vals) =>
              setV((s) => ({ ...s, requirements: vals || [] }))
            }
            inputValue={reqInput}
            onInputChange={(_, val, reason) => {
              setReqInput(val);
              setReqOpen(reason === "input" && val.trim().length >= 2);
            }}
            options={reqOpts}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={`${option}-${index}`}
                  label={option}
                  size="small"
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Requirements"
                placeholder='Type or select (e.g., "Electrician", "Plumber")'
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={JOBTYPE_OPTIONS}
            value={Array.isArray(v.jobTypes) ? v.jobTypes : []}
            onChange={(_, val) => setV((s) => ({ ...s, jobTypes: val || [] }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Job Type"
                placeholder="e.g. מגורים / Residential, מסחרי / Commercial"
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={SKILL_OPTIONS}
            value={Array.isArray(v.skills) ? v.skills : []}
            onChange={(_, val) => setV((s) => ({ ...s, skills: val || [] }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Required Skills"
                placeholder="Select or type skills"
              />
            )}
          />
          <Autocomplete
            multiple
            freeSolo
            options={SERVICE_OPTIONS}
            value={Array.isArray(v.services) ? v.services : []}
            onChange={(_, val) => setV((s) => ({ ...s, services: val || [] }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Services"
                placeholder="Select or type services"
              />
            )}
          />
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Location & team
          </Typography>
          <Autocomplete
            multiple
            freeSolo
            options={AREAS_IL}
            value={Array.isArray(v.areas) ? v.areas : []}
            onChange={(_, val) => setV((s) => ({ ...s, areas: val || [] }))}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Area"
                placeholder="e.g. גוש דן / Gush Dan, צפון / North"
              />
            )}
          />
          <TextField
            label="Number of workers needed"
            type="number"
            fullWidth
            inputProps={{ min: 1, max: 50 }}
            value={v.maxWorkers ?? ""}
            onChange={(e) =>
              setV((s) => ({ ...s, maxWorkers: e.target.value }))
            }
            error={!!maxWorkersErr}
            helperText={maxWorkersErr || " "}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button
          variant="contained"
          disabled={disabled || submitting}
          onClick={() => onSubmit(v)}
          startIcon={submitting ? <CircularProgress size={18} /> : null}
        >
          {(() => {
            const isCreate = /create/i.test(title || "");
            if (submitting) {
              return isCreate ? "Posting..." : "Saving...";
            }
            return isCreate ? "Post" : "Save";
          })()}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function WorkerRow({ worker, onAskRemove }) {
  const d = worker?.display || {};
  const status = worker?.status;
  const hasProfile = !!d.hasProfile && !!d.id;
  const name = d.name || "Subcontractor";

  return (
    <Paper variant="outlined" sx={{ p: 1, borderRadius: 1.5 }}>
      <Stack direction="row" spacing={1.5} alignItems="center">
        {hasProfile ? (
          <Avatar
            component={RouterLink}
            to={`/users/${d.id}`}
            src={d.avatarUrl}
            alt={name}
            sx={{ textDecoration: "none" }}
          >
            {(name || "U")[0]}
          </Avatar>
        ) : (
          <Avatar src={d.avatarUrl} alt={name}>
            {(name || "U")[0]}
          </Avatar>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="baseline">
            {hasProfile ? (
              <Typography
                component={RouterLink}
                to={`/users/${d.id}`}
                fontWeight={600}
                sx={{
                  textDecoration: "none",
                  color: "inherit",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {name}
              </Typography>
            ) : (
              <Typography fontWeight={600}>{name}</Typography>
            )}

            {d.title && (
              <Typography variant="caption" color="text.secondary">
                • {d.title}
              </Typography>
            )}

            {status && (
              <Typography variant="caption" color="text.secondary">
                • {statusLabelMap[status] || status}
              </Typography>
            )}
          </Stack>
        </Box>

        {onAskRemove && (
          <Button
            size="small"
            color="error"
            variant="outlined"
            onClick={onAskRemove}
          >
            Remove
          </Button>
        )}
      </Stack>
    </Paper>
  );
}

function PostCard({
  post,
  onEdit,
  onDelete,
  onViewSubs,
  meId,
  jobsForPost = [],
  statusMeta,
  workers = [],
  onStartJob,
  onEndJob,
  onCancelJobs,
  onRemoveWorker,
}) {
  const toast = useToast();
  const [showComments, setShowComments] = useState(false);
  const [showWorkers, setShowWorkers] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [workerToRemove, setWorkerToRemove] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const postId = post._id || post.id;

  const primaryInProgress = jobsForPost.find((j) => j.status === "in_progress");
  const primaryAccepted = jobsForPost.find((j) => j.status === "accepted");
  const hasInProgress = !!primaryInProgress;
  const hasAccepted = !!primaryAccepted;
  const hasCompleted = jobsForPost.some((j) => j.status === "completed");

  const actionLabel = hasInProgress ? "End Job" : "Start Job";

  const jobTypes = Array.isArray(post.jobTypes) ? post.jobTypes : [];
  const areas = Array.isArray(post.areas) ? post.areas : [];
  const skills = Array.isArray(post.skills) ? post.skills : [];
  const services = Array.isArray(post.services) ? post.services : [];
  const requiredLicenses = Array.isArray(post.requiredLicenses)
    ? post.requiredLicenses
    : [];

  const rawReq = post.requirements;

  let requirementsText = "";

  if (Array.isArray(rawReq)) {
    requirementsText = rawReq
      .map((s) => String(s).trim())
      .filter((s) => s && s !== "0")
      .join(", ");
  } else if (rawReq != null) {
    const trimmed = String(rawReq).trim();
    if (trimmed && trimmed !== "0") {
      const parts = trimmed
        .split(/[,\n;]+/)
        .map((s) => s.trim())
        .filter((s) => s && s !== "0");
      requirementsText = parts.join(", ");
    }
  }

  const maxWorkers = Math.max(
    1,
    post.maxWorkers != null && !Number.isNaN(Number(post.maxWorkers))
      ? Number(post.maxWorkers)
      : 1
  );
  const workersCount = workers.length;
  const primaryJob =
    jobsForPost.find((j) => j.status === "in_progress") ||
    jobsForPost.find((j) => j.status === "accepted") ||
    jobsForPost.find((j) => j.status === "completed") ||
    jobsForPost[0];

  const plannedStartRaw =
    post.startDate || (primaryJob && primaryJob.startDate);
  const plannedEndRaw = post.endDate || (primaryJob && primaryJob.endDate);

  const plannedStartLabel = formatDate(plannedStartRaw);
  const plannedEndLabel = formatDate(plannedEndRaw);
  const actualStartRaw =
    (primaryJob &&
      (primaryJob.actualStartDate ||
        primaryJob.startedAt ||
        primaryJob.startDate)) ||
    plannedStartRaw;
  const actualEndRaw =
    (primaryJob &&
      (primaryJob.actualEndDate ||
        primaryJob.completedAt ||
        primaryJob.endDate)) ||
    plannedEndRaw;

  const actualStartLabel = formatDate(actualStartRaw);
  const actualEndLabel = formatDate(actualEndRaw);
  const postedDateLabel = formatDate(post.date || post.createdAt);
  const workersButtonLabel =
    maxWorkers != null
      ? `Workers: ${workersCount}/${maxWorkers}`
      : `Workers${workersCount ? ` (${workersCount})` : ""}`;

  const showMetaRow =
    jobTypes.length > 0 ||
    areas.length > 0 ||
    skills.length > 0 ||
    services.length > 0 ||
    requiredLicenses.length > 0;

  const handlePrimaryActionClick = () => {
    if (hasInProgress) {
      const jobId =
        primaryInProgress && (primaryInProgress._id || primaryInProgress.id);
      if (!jobId) {
        toast.error("Could not find job id for this post.");
        return;
      }
      onEndJob?.(jobId);
      return;
    }

    if (!hasAccepted) {
      toast.info(
        "You can only start a job after at least one subcontractor has accepted it."
      );
      return;
    }
    const jobId =
      primaryAccepted && (primaryAccepted._id || primaryAccepted.id);
    if (!jobId) {
      toast.error("Could not find job id for this post.");
      return;
    }
    onStartJob?.(jobId);
  };

  const handleCancelJobClick = () => {
    const cancellable = (jobsForPost || []).filter((j) =>
      ["accepted", "in_progress"].includes(j.status)
    );
    if (!cancellable.length) {
      toast.info("There is no active job to cancel for this post.");
      return;
    }
    const ids = cancellable.map((j) => j._id || j.id).filter(Boolean);
    onCancelJobs?.(ids);
  };

  const handleEditClick = () => {
    const normalized = {
      ...post,
      startDate: plannedStartRaw || post.startDate || null,
      endDate: plannedEndRaw || post.endDate || null,
    };
    onEdit?.(normalized);
  };

  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: 2,
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={{ xs: 1, sm: 0 }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="subtitle1">
            {post.title || "Job Posting"}
          </Typography>
          {statusMeta && (
            <Chip
              size="small"
              label={statusMeta.label}
              color={statusMeta.color}
              variant={statusMeta.job ? "filled" : "outlined"}
            />
          )}
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flexWrap: "wrap",
            justifyContent: { xs: "flex-start", sm: "flex-end" },
            rowGap: 1,
          }}
        >
          {!hasCompleted && (
            <>
              <Button
                variant="outlined"
                size="small"
                startIcon={<PeopleOutlineIcon />}
                onClick={onViewSubs}
              >
                View Matching Subs
              </Button>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowWorkers((s) => !s)}
              >
                {workersButtonLabel}
              </Button>
            </>
          )}
          {hasCompleted && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => setShowSummary((s) => !s)}
            >
              {showSummary ? "Hide Summary" : "Summary"}
            </Button>
          )}
          {!hasCompleted && (
            <>
              <IconButton size="small" onClick={handleEditClick}>
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Stack>
      </Stack>
      <Typography variant="body2" color="text.secondary">
        {postedDateLabel}
        {post.location ? ` • ${post.location}` : ""}
        {post.salary ? ` • ${post.salary}` : ""}
        {plannedStartLabel &&
          ` • Planned: ${plannedStartLabel}${
            plannedEndLabel ? ` → ${plannedEndLabel}` : ""
          }`}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        {post.content}
      </Typography>
      {requirementsText && (
        <Typography variant="body2" sx={{ mt: 0.5 }}>
          <strong>Requirements:</strong> {requirementsText}
        </Typography>
      )}

      {showMetaRow && (
        <Box
          sx={{
            mt: 0.75,
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
          }}
        >
          {jobTypes.map((jt) => (
            <Chip key={`jt-${jt}`} size="small" label={jt} />
          ))}
          {areas.map((a) => (
            <Chip key={`area-${a}`} size="small" variant="outlined" label={a} />
          ))}
          {skills.slice(0, 6).map((s) => (
            <Chip
              key={`skill-${s}`}
              size="small"
              variant="outlined"
              label={s}
            />
          ))}
          {services.slice(0, 4).map((svc) => (
            <Chip
              key={`svc-${svc}`}
              size="small"
              variant="outlined"
              label={svc}
            />
          ))}
          {requiredLicenses.map((lic) => (
            <Chip
              key={`lic-${lic}`}
              size="small"
              color="info"
              variant="outlined"
              label={lic}
            />
          ))}
        </Box>
      )}
      <Collapse in={showWorkers && !hasCompleted}>
        <Box sx={{ mt: 1 }}>
          {!workersCount ? (
            <Typography variant="body2" color="text.secondary">
              No workers assigned yet.
            </Typography>
          ) : (
            <Stack spacing={1}>
              {workers.map((w) => (
                <WorkerRow
                  key={w.jobId || `${w.display?.id || "worker"}-${postId}`}
                  worker={w}
                  onAskRemove={
                    onRemoveWorker ? () => setWorkerToRemove(w) : undefined
                  }
                />
              ))}
            </Stack>
          )}
        </Box>
      </Collapse>
      <Collapse in={showSummary && hasCompleted}>
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {actualStartLabel || actualEndLabel
              ? `Job dates: ${actualStartLabel || "—"}${
                  actualEndLabel ? ` → ${actualEndLabel}` : ""
                }`
              : "No job dates recorded."}
          </Typography>

          <Box sx={{ mt: 1 }}>
            {!workersCount ? (
              <Typography variant="body2" color="text.secondary">
                No workers were assigned to this job.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {workers.map((w) => (
                  <WorkerRow
                    key={w.jobId || `${w.display?.id || "worker"}-${postId}`}
                    worker={w}
                    onAskRemove={undefined}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Box>
      </Collapse>
      {!hasCompleted && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ mt: 1 }}
        >
          <Button
            size="small"
            variant="contained"
            onClick={handlePrimaryActionClick}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {actionLabel}
          </Button>
          {hasInProgress && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              onClick={handleCancelJobClick}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Cancel Job
            </Button>
          )}
        </Stack>
      )}
      <Button
        size="small"
        sx={{ mt: 1, width: { xs: "100%", sm: "auto" } }}
        onClick={() => setShowComments((s) => !s)}
      >
        {showComments ? "Hide Comments" : "Show Comments"}
      </Button>
      <Collapse in={showComments}>
        <CommentsSection postId={post._id || post.id} meId={meId} />
      </Collapse>
      <Dialog
        open={!!workerToRemove}
        onClose={() => setWorkerToRemove(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Remove worker from job?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove{" "}
            <strong>{workerToRemove?.display?.name}</strong> from this job?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkerToRemove(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (workerToRemove && onRemoveWorker) {
                onRemoveWorker(workerToRemove.jobId);
              }
              setWorkerToRemove(null);
            }}
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete job post?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{post.title || "this job"}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              onDelete?.();
              setConfirmDeleteOpen(false);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

function MatchingSubsDialog({ postId, onClose }) {
  const toast = useToast();
  const qc = useQueryClient();
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subs-recommended", postId],
    queryFn: () => getRecommendedSubsForPost(postId, 20),
    enabled: !!postId,
    retry: false,
  });
  const [invited, setInvited] = React.useState(() => new Set());

  const inviteMut = useMutation({
    mutationFn: ({ subId, note }) =>
      inviteSubToPost({ postId, subcontractorId: subId, note }),
    onSuccess: (res, vars) => {
      setInvited((prev) => {
        const n = new Set(prev);
        n.add(String(vars.subId));
        return n;
      });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      qc.invalidateQueries({ queryKey: ["jobRequests"] });
      qc.invalidateQueries({ queryKey: ["jobRequests", "contractor"] });
      qc.invalidateQueries({ queryKey: ["pipeline"] });
      toast.success("Invitation sent");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Failed to send invitation";
      toast.error(msg);
    },
  });

  return (
    <Dialog
      open={!!postId}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={fullScreen}
    >
      <DialogTitle>Matching Subcontractors</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Typography color="error">
            {error?.response?.data?.error ||
              error?.message ||
              "Failed to load."}
          </Typography>
        ) : !data?.length ? (
          <Typography color="text.secondary">No matches found.</Typography>
        ) : (
          <Stack spacing={1.5}>
            {data.map((s) => {
              const subId = String(s.user || s._id);
              const isInvited = invited.has(subId);
              return (
                <Paper key={subId} sx={{ p: 1.5 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      src={s.profilePhotoUrl || ""}
                      alt={s.displayName || "—"}
                    />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1">
                        {s.displayName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {s.primaryTrade}
                      </Typography>
                      <Box
                        sx={{
                          mt: 1,
                          display: "flex",
                          gap: 0.5,
                          flexWrap: "wrap",
                        }}
                      >
                        {(s.skills || []).slice(0, 6).map((t, i) => (
                          <Chip key={i} size="small" label={t} />
                        ))}
                        {(s.services || []).slice(0, 4).map((t, i) => (
                          <Chip
                            key={`svc-${i}`}
                            size="small"
                            variant="outlined"
                            label={t}
                          />
                        ))}
                      </Box>
                    </Box>

                    {isInvited ? (
                      <Chip color="success" label="Invited" />
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        disabled={inviteMut.isPending}
                        onClick={() => inviteMut.mutate({ subId })}
                      >
                        {inviteMut.isPending ? "Inviting…" : "Invite"}
                      </Button>
                    )}
                  </Stack>
                </Paper>
              );
            })}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
