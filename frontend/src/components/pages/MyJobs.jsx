import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useToast } from "../../hooks/useToast";
import { getMyJobs, setJobStatus } from "../../api/jobs";
import api from "../../api/client";
import {
  listMyJobRequests,
  withdrawJobRequest,
} from "../../api/jobRequestsService";
import JobDetailsModal from "../../components/jobs/JobDetailsModal.jsx";

const statusLabel = (s) =>
  ({
    pending: "Pending",
    accepted: "Accepted",
    in_progress: "In progress",
    completed: "Completed",
    cancelled: "Cancelled",
    denied: "Denied",
    withdrawn: "Withdrawn",
    expired: "Expired",
  })[s] || s;

const statusColor = (s) =>
  ({
    pending: "warning",
    accepted: "info",
    in_progress: "primary",
    completed: "success",
    cancelled: "warning",
    denied: "warning",
    withdrawn: "warning",
    expired: "warning",
  })[s] || "default";

const formatDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const normalizeRequirementsText = (rawReq) => {
  if (!rawReq) return "";
  if (Array.isArray(rawReq)) {
    return rawReq
      .map((s) => String(s).trim())
      .filter((s) => s && s !== "0")
      .join(", ");
  }
  const trimmed = String(rawReq).trim();
  if (!trimmed || trimmed === "0") return "";
  return trimmed
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter((s) => s && s !== "0")
    .join(", ");
};

const toArray = (v) => {
  if (Array.isArray(v)) return v;
  if (!v) return [];
  if (Array.isArray(v.items)) return v.items;
  if (typeof v === "object") return Object.values(v);
  return [];
};

export default function MyJobs() {
  const toast = useToast();
  const qc = useQueryClient();
  const location = useLocation();
  const initialStatusFilter = React.useMemo(() => {
    const sp = new URLSearchParams(location.search);
    return sp.get("status") || "all";
  }, [location.search]);

  // who am I?
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
    staleTime: 5 * 60 * 1000,
  });

  const meId = meQ.data?._id || meQ.data?.sub || meQ.data?.id;
  const isBusiness = !!meQ.data?.isBusiness;
  const jobsQ = useQuery({
    queryKey: ["myJobs"],
    queryFn: getMyJobs,
    staleTime: 30 * 1000,
  });

  const reqQ = useQuery({
    queryKey: ["myRequests", { mine: "subcontractor", limit: 200 }],
    queryFn: () =>
      listMyJobRequests({
        mine: "subcontractor",
        limit: 200,
      }),
    staleTime: 15 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const updateMut = useMutation({
    mutationFn: ({ jobId, status }) => setJobStatus({ jobId, status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      toast.success("Status updated ✔");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.error || err?.message || "Failed to update status"
      );
    },
  });

  const withdrawMut = useMutation({
    mutationFn: (requestId) => withdrawJobRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      toast.success("Request withdrawn");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.error || err?.message || "Failed to withdraw"
      );
    },
  });

  const handleStatus = (jobId, status) => {
    if (!jobId) return;
    updateMut.mutate({ jobId, status });
  };

  const handleWithdraw = (requestId) => {
    if (!requestId) return;
    withdrawMut.mutate(requestId);
  };

  const [statusFilter, setStatusFilter] = React.useState(initialStatusFilter);
  React.useEffect(() => {
    setStatusFilter(initialStatusFilter);
  }, [initialStatusFilter]);

  const [detailsPostId, setDetailsPostId] = React.useState(null);
  const jobs = toArray(jobsQ.data);
  const reqs = toArray(reqQ.data);
  const loading = jobsQ.isLoading || meQ.isLoading || reqQ.isLoading;
  const loadError =
    (jobsQ.isError &&
      (jobsQ.error?.response?.data?.error ||
        jobsQ.error?.message ||
        "Couldn’t load your jobs.")) ||
    (reqQ.isError &&
      (reqQ.error?.response?.data?.error ||
        reqQ.error?.message ||
        "Couldn’t load your job requests."));

  React.useEffect(() => {
    if (!isBusiness) return;
    if (!jobs.length) return;

    const nowTs = Date.now();
    const updates = [];

    for (const job of jobs) {
      const jobId = job?._id || job?.id;
      if (!jobId || !job?.status) continue;

      const startRaw = job.startDate || job.post?.startDate;
      const endRaw = job.endDate || job.post?.endDate;
      const startTs = startRaw ? new Date(startRaw).getTime() : null;
      const endTs = endRaw ? new Date(endRaw).getTime() : null;

      if (job.status === "accepted" && startTs && startTs <= nowTs) {
        updates.push(
          setJobStatus({ jobId, status: "in_progress" }).catch(() => {})
        );
      }

      if (job.status === "in_progress" && endTs && endTs <= nowTs) {
        updates.push(
          setJobStatus({ jobId, status: "completed" }).catch(() => {})
        );
      }
    }

    if (!updates.length) return;

    Promise.all(updates).then(() => {
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
    });
  }, [jobs, isBusiness, qc]);

  const pendingReqs = reqs.filter((r) => r?.status === "pending");
  const deniedReqs = reqs.filter((r) => r?.status === "denied");
  const withdrawnReqs = reqs.filter((r) => r?.status === "withdrawn");
  const expiredReqs = reqs.filter((r) => r?.status === "expired");
  const acceptedJobs = jobs.filter((j) => j?.status === "accepted");
  const inProgressJobs = jobs.filter((j) => j?.status === "in_progress");
  const completedJobs = jobs.filter((j) => j?.status === "completed");
  const cancelledJobs = jobs.filter((j) => j?.status === "cancelled");
  const activeJobs = [...acceptedJobs, ...inProgressJobs];
  const previousJobs = [...completedJobs, ...cancelledJobs];
  const previousReqs = [...deniedReqs, ...withdrawnReqs, ...expiredReqs];
  const JobCard = ({ job }) => {
    const contractor = job?.contractor || {};
    const worker = job?.worker || {};
    const post = job?.post || {};
    const jobId = job?._id || job?.id;
    const postId = post?._id || post?.id;
    const iAmWorker = String(worker?._id || worker?.id) === String(meId);
    const iAmContractor =
      String(contractor?._id || contractor?.id) === String(meId);

    const otherParty = iAmWorker ? contractor : worker;
    const od = iAmWorker ? job?.contractorDisplay : job?.workerDisplay;
    const otherId = od?.id || String(otherParty?._id || otherParty?.id || "");
    const otherName =
      od?.name ||
      `${otherParty?.name?.first || ""} ${
        otherParty?.name?.last || ""
      }`.trim() ||
      "—";

    const otherAvatar =
      od?.profilePhotoUrl ||
      od?.avatarUrl ||
      od?.image ||
      otherParty?.profilePhotoUrl ||
      otherParty?.avatarUrl ||
      otherParty?.image ||
      "";

    const otherTitle = od?.title || "";

    const dateLabel = formatDate(
      post?.date || post?.createdAt || job?.createdAt
    );

    const plannedStart =
      job.startDate || post.startDate || job.scheduledStartDate || null;
    const plannedEnd =
      job.endDate || post.endDate || job.scheduledEndDate || null;
    const plannedStartLabel = formatDate(plannedStart);
    const plannedEndLabel = formatDate(plannedEnd);

    const actualStart =
      job.actualStartDate || job.startedAt || plannedStart || null;
    const actualEnd =
      job.actualEndDate || job.completedAt || plannedEnd || null;
    const endRaw = job?.endDate || post?.endDate;
    let displayStatus = job?.status;

    if (!isBusiness && iAmWorker && displayStatus === "accepted" && endRaw) {
      const endTs = new Date(endRaw).getTime();
      if (!Number.isNaN(endTs) && endTs <= Date.now()) {
        displayStatus = "completed";
      }
    }

    const requirementsText = normalizeRequirementsText(post?.requirements);

    return (
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            component={otherId ? RouterLink : "div"}
            to={otherId ? `/users/${otherId}` : undefined}
            src={otherAvatar}
            alt={otherName}
            sx={{ width: 44, height: 44 }}
          >
            {(otherName || "U")[0]}
          </Avatar>

          <Stack sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" noWrap>
              {post?.title || "Job"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              With{" "}
              {otherId ? (
                <RouterLink to={`/users/${otherId}`}>{otherName}</RouterLink>
              ) : (
                otherName
              )}
              {otherTitle ? ` • ${otherTitle}` : ""}
              {dateLabel ? ` • ${dateLabel}` : ""}
              {post?.location ? ` • ${post.location}` : ""}
              {post?.salary ? ` • ${post.salary}` : ""}
              {plannedStartLabel &&
                ` • Planned: ${plannedStartLabel}${
                  plannedEndLabel ? ` → ${plannedEndLabel}` : ""
                }`}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
            {displayStatus && (
              <Chip
                size="small"
                color={statusColor(displayStatus)}
                label={statusLabel(displayStatus)}
              />
            )}
          </Stack>
        </Stack>

        {post?.content && (
          <Typography variant="body1" sx={{ mt: 1 }}>
            {post.content}
          </Typography>
        )}

        {requirementsText && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Requirements
            </Typography>
            <Typography variant="body2">{requirementsText}</Typography>
          </>
        )}

        {(actualStart || actualEnd) && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Job dates: {formatDate(actualStart) || "—"}
            {actualEnd ? ` → ${formatDate(actualEnd)}` : ""}
          </Typography>
        )}

        <Stack direction="row" spacing={1.5} sx={{ mt: 2 }} alignItems="center">
          {/* Open JobDetailsModal (with comments etc.) */}
          <Button
            variant="outlined"
            size="small"
            onClick={() => {
              if (!postId) return;
              setDetailsPostId(String(postId));
            }}
          >
            View details
          </Button>

          {iAmContractor && job?.status === "accepted" && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleStatus(jobId, "in_progress")}
              disabled={updateMut.isPending}
            >
              Start work
            </Button>
          )}
          {iAmContractor && job?.status === "in_progress" && (
            <Button
              variant="contained"
              size="small"
              onClick={() => handleStatus(jobId, "completed")}
              disabled={updateMut.isPending}
            >
              Mark completed
            </Button>
          )}

          {(iAmContractor || iAmWorker) &&
            (job?.status === "accepted" || job?.status === "in_progress") && (
              <Button
                variant="text"
                size="small"
                color="warning"
                onClick={() => handleStatus(jobId, "cancelled")}
                disabled={updateMut.isPending}
              >
                Cancel job
              </Button>
            )}
        </Stack>
      </Paper>
    );
  };

  const RequestCard = ({ req }) => {
    const reqId = req?.id || req?._id;
    const post = req?.post || {};
    const contractor = req?.contractor || {};
    const createdAtLabel = formatDate(req?.createdAt);
    const requirementsText = normalizeRequirementsText(post?.requirements);
    const contractorName =
      `${contractor?.name?.first || ""} ${
        contractor?.name?.last || ""
      }`.trim() || "—";
    const contractorId = String(contractor?._id || contractor?.id || "");
    const contractorAvatar =
      contractor?.profilePhotoUrl ||
      contractor?.avatarUrl ||
      contractor?.image ||
      "";

    return (
      <Paper sx={{ p: 2 }}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h6">{post?.title || "Job Request"}</Typography>
          <Chip
            size="small"
            label={statusLabel(req?.status)}
            color={statusColor(req?.status)}
            variant="outlined"
          />
        </Stack>
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mt: 0.75 }}
        >
          <Avatar
            component={contractorId ? RouterLink : "div"}
            to={contractorId ? `/users/${contractorId}` : undefined}
            src={contractorAvatar}
            alt={contractorName}
            sx={{ width: 28, height: 28 }}
          >
            {(contractorName || "U")[0]}
          </Avatar>
          <Stack sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ lineHeight: 1.1 }}>
              <strong>To: {contractorName}</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap>
              {(post?.location ? `${post.location} • ` : "") +
                (post?.salary ? `${post.salary} • ` : "") +
                (createdAtLabel || "")}
            </Typography>
          </Stack>
          <Box sx={{ flex: 1 }} />
          {contractorId && (
            <Button
              component={RouterLink}
              to={`/users/${contractorId}`}
              size="small"
              variant="text"
            >
              View Profile
            </Button>
          )}
        </Stack>
        {post?.content && (
          <Typography variant="body1" sx={{ mt: 1 }}>
            {post.content}
          </Typography>
        )}
        {requirementsText && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 1 }}>
              Requirements
            </Typography>
            <Typography variant="body2">{requirementsText}</Typography>
          </>
        )}

        <Stack direction="row" spacing={1} sx={{ mt: 2 }} alignItems="center">
          <Button
            component={RouterLink}
            to={post?._id || post?.id ? `/posts/${post._id || post.id}` : "#"}
            variant="outlined"
            size="small"
            disabled={!post?._id && !post?.id}
          >
            View post
          </Button>

          {req?.status === "pending" && (
            <Button
              variant="text"
              size="small"
              color="warning"
              onClick={() => handleWithdraw(reqId)}
              disabled={withdrawMut.isPending}
            >
              Withdraw
            </Button>
          )}
        </Stack>
      </Paper>
    );
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1000, mx: "auto" }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{
          mb: 2,
          gap: { xs: 1.5, sm: 0 },
        }}
      >
        <Box sx={{ flex: 1 }} />
        <Typography variant="h4" sx={{ textAlign: "center", flexShrink: 0 }}>
          My Jobs
        </Typography>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <FormControl
            size="small"
            sx={{
              minWidth: { xs: 140, sm: 220 },
              "& .MuiInputBase-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
              "& .MuiInputLabel-root": {
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              },
            }}
          >
            <InputLabel id="status-filter">Filter by status</InputLabel>
            <Select
              labelId="status-filter"
              label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(String(e.target.value))}
            >
              <MenuItem value="all">All (grouped)</MenuItem>
              <MenuItem value="pending">Pending (requests)</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="in_progress">In progress</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="denied">Denied (requests)</MenuItem>
              <MenuItem value="withdrawn">Withdrawn (requests)</MenuItem>
              <MenuItem value="expired">Expired (requests)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Stack>

      {loading && (
        <Box sx={{ display: "grid", placeItems: "center", minHeight: "40vh" }}>
          <CircularProgress />
        </Box>
      )}

      {!loading && loadError && (
        <Box sx={{ p: 2 }}>
          <Typography color="error">{loadError}</Typography>
        </Box>
      )}

      {!loading && !loadError && (
        <>
          {statusFilter === "all" ? (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                Pending
              </Typography>
              <Stack spacing={2}>
                {pendingReqs.length ? (
                  pendingReqs.map((r) => (
                    <RequestCard key={r?.id || r?._id} req={r} />
                  ))
                ) : (
                  <Paper sx={{ p: 2 }}>
                    <Typography color="text.secondary">
                      No pending requests.
                    </Typography>
                  </Paper>
                )}
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" sx={{ mb: 1 }}>
                Active
              </Typography>
              <Stack spacing={2}>
                {activeJobs.length ? (
                  activeJobs.map((j) => (
                    <JobCard key={j?.id || j?._id} job={j} />
                  ))
                ) : (
                  <Paper sx={{ p: 2 }}>
                    <Typography color="text.secondary">
                      No active jobs yet.
                    </Typography>
                  </Paper>
                )}
              </Stack>

              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Previous
              </Typography>
              <Stack spacing={2}>
                {[...previousJobs, ...previousReqs].length ? (
                  [...previousJobs, ...previousReqs].map((item) =>
                    item?.post && item?.contractor && item?.subcontractor ? (
                      <RequestCard key={item?.id || item?._id} req={item} />
                    ) : (
                      <JobCard key={item?.id || item?._id} job={item} />
                    )
                  )
                ) : (
                  <Paper sx={{ p: 2 }}>
                    <Typography color="text.secondary">
                      No previous items yet.
                    </Typography>
                  </Paper>
                )}
              </Stack>
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{ mb: 1 }}>
                {statusLabel(statusFilter)}
              </Typography>
              <Stack spacing={2}>
                {(() => {
                  if (
                    ["pending", "denied", "withdrawn", "expired"].includes(
                      statusFilter
                    )
                  ) {
                    const source =
                      statusFilter === "pending"
                        ? pendingReqs
                        : statusFilter === "denied"
                          ? deniedReqs
                          : statusFilter === "withdrawn"
                            ? withdrawnReqs
                            : expiredReqs;
                    return source.length ? (
                      source.map((r) => (
                        <RequestCard key={r?.id || r?._id} req={r} />
                      ))
                    ) : (
                      <Paper sx={{ p: 2 }}>
                        <Typography color="text.secondary">
                          No requests in this status.
                        </Typography>
                      </Paper>
                    );
                  }

                  const source =
                    statusFilter === "accepted"
                      ? acceptedJobs
                      : statusFilter === "in_progress"
                        ? inProgressJobs
                        : statusFilter === "completed"
                          ? completedJobs
                          : statusFilter === "cancelled"
                            ? cancelledJobs
                            : [];
                  return source.length ? (
                    source.map((j) => <JobCard key={j?.id || j?._id} job={j} />)
                  ) : (
                    <Paper sx={{ p: 2 }}>
                      <Typography color="text.secondary">
                        No jobs in this status.
                      </Typography>
                    </Paper>
                  );
                })()}
              </Stack>
            </>
          )}
        </>
      )}

      <JobDetailsModal
        postId={detailsPostId || undefined}
        open={Boolean(detailsPostId)}
        onClose={() => setDetailsPostId(null)}
      />
    </Box>
  );
}
