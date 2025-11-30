import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from "@mui/material";
import { getPostsPaged } from "../../api/posts";
import {
  Box,
  Paper,
  Stack,
  Typography,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import {
  Link as RouterLink,
  useNavigate,
  Navigate,
  useSearchParams,
} from "react-router-dom";
import api from "../../api/client";
import { useToast } from "../../hooks/useToast";
import RequestSubscribeButton from "../jobs/RequestSubscribeButton.jsx";
import JobDetailsModal from "../jobs/JobDetailsModal.jsx";
import { getMyJobs, setJobStatus } from "../../api/jobs";
import {
  listMyJobRequests,
  withdrawJobRequest,
} from "../../api/jobRequestsService.js";

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
  if (Array.isArray(v?.items)) return v.items;
  if (typeof v === "object") return Object.values(v);
  return [];
};

function useMe(enabled) {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
    enabled,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export default function Home() {
  const toast = useToast();
  const nav = useNavigate();
  const qc = useQueryClient();

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const loggedIn = !!token;
  const [search, setSearch] = React.useState("");
  const [tab, setTab] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [limit] = React.useState(12);
  const [sort, setSort] = React.useState({ by: "date", dir: "desc" });
  const [recPage, setRecPage] = React.useState(1);
  const [recLimit] = React.useState(10);
  const [recSort, setRecSort] = React.useState({ by: "score", dir: "desc" });
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const focusId = searchParams.get("focus");
  const [detailsPostId, setDetailsPostId] = React.useState(null);
  const activePostId = openId || detailsPostId;
  const closeDetails = () => {
    if (openId) {
      const sp = new URLSearchParams(searchParams);
      sp.delete("open");
      sp.delete("focus");
      setSearchParams(sp, { replace: true });
    } else {
      setDetailsPostId(null);
    }
  };

  React.useEffect(() => {
    setPage(1);
    setRecPage(1);
  }, [tab]);

  React.useEffect(() => {
    if (tab === 0) setPage(1);
    else setRecPage(1);
  }, [search, tab]);

  const meQ = useMe(loggedIn);
  const role = meQ.data?.role;
  const isContractor = !!meQ.data?.isBusiness;
  const isSub = role === "subcontractor";
  const userId = meQ.data?._id || meQ.data?.id;
  const postsQ = useQuery({
    enabled: loggedIn && tab === 0,
    queryKey: ["posts", page, limit, sort.by, sort.dir],
    queryFn: () =>
      getPostsPaged({
        page,
        limit,
        sortBy: sort.by,
        sortDir: sort.dir,
        includeMyRequest: true,
      }),
    keepPreviousData: true,
  });

  const recQ = useQuery({
    queryKey: ["posts", "recommended-for-me"],
    queryFn: async () => (await api.get("/posts/recommended-for-me")).data,
    enabled: loggedIn && tab === 1 && isSub, // 🔒 subs only
    retry: false,
  });

  const myJobsQ = useQuery({
    queryKey: ["myJobs"],
    queryFn: getMyJobs,
    enabled: loggedIn,
    staleTime: 15 * 1000,
  });

  const myReqsQ = useQuery({
    queryKey: ["myRequests", { mine: "subcontractor" }],
    queryFn: () => listMyJobRequests({ mine: "subcontractor" }),
    enabled: loggedIn && isSub, // 🔒 subs only
    staleTime: 15 * 1000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  const cancelJobMut = useMutation({
    mutationFn: ({ jobId }) => setJobStatus({ jobId, status: "cancelled" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["posts", "recommended-for-me"] });
      toast.success("Job cancelled");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.error || err?.message || "Failed to cancel job"
      );
    },
  });

  const withdrawReqMut = useMutation({
    mutationFn: (requestId) => withdrawJobRequest(requestId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["myRequests"] });
      qc.invalidateQueries({ queryKey: ["myJobs"] });
      qc.invalidateQueries({ queryKey: ["posts"] });
      qc.invalidateQueries({ queryKey: ["posts", "recommended-for-me"] });
      toast.success("Request withdrawn");
    },
    onError: (err) => {
      toast.error(
        err?.response?.data?.error || err?.message || "Failed to withdraw"
      );
    },
  });

  const searchLc = search.toLowerCase();
  const filterFn = (p) => {
    const title = (p?.title || "").toLowerCase();
    const content = (p?.content || "").toLowerCase();
    const author = `${p?.publisher?.name?.first || ""} ${
      p?.publisher?.name?.last || ""
    }`.toLowerCase();
    const req = (p?.requirements || "").toLowerCase();
    const loc = (p?.location || "").toLowerCase();
    return (
      title.includes(searchLc) ||
      content.includes(searchLc) ||
      author.includes(searchLc) ||
      req.includes(searchLc) ||
      loc.includes(searchLc)
    );
  };

  const allPosts = Array.isArray(postsQ.data?.items) ? postsQ.data.items : [];
  const total = postsQ.data?.total ?? 0;
  const pageSize = postsQ.data?.pageSize ?? limit;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allFiltered = allPosts.filter(filterFn);
  const recList = Array.isArray(recQ.data) ? recQ.data : [];
  const recFiltered = recList.filter(filterFn);
  const recSorted = React.useMemo(() => {
    const get = (p) => {
      switch (recSort.by) {
        case "score":
          return typeof p?.score === "number" ? p.score : -Infinity;
        case "date":
          return p?.date ? new Date(p.date).getTime() : 0;
        case "title":
          return (p?.title || "").toLowerCase();
        case "location":
          return (p?.location || "").toLowerCase();
        default:
          return 0;
      }
    };
    const arr = [...recFiltered];
    arr.sort((a, b) => {
      const va = get(a),
        vb = get(b);
      if (typeof va === "number" && typeof vb === "number") {
        return recSort.dir === "asc" ? va - vb : vb - va;
      }
      return (
        String(va).localeCompare(String(vb)) * (recSort.dir === "asc" ? 1 : -1)
      );
    });
    return arr;
  }, [recFiltered, recSort]);

  const recStart = (recPage - 1) * recLimit;
  const recPaged = recSorted.slice(recStart, recStart + recLimit);
  const myJobsArr = toArray(myJobsQ.data);
  const jobByPostId = React.useMemo(() => {
    const m = new Map();
    for (const j of myJobsArr) {
      const workerId =
        j?.worker?._id ||
        j?.worker?.id ||
        j?.workerUser?._id ||
        j?.workerUser?.id ||
        j?.workerId ||
        j?.worker_id;
      if (!workerId || String(workerId) !== String(userId)) continue;

      const pid = j?.post?._id || j?.post?.id;
      if (!pid) continue;
      const key = String(pid);
      const plannedStart =
        j.startDate || j.post?.startDate || j.scheduledStartDate || null;
      const plannedEnd =
        j.endDate || j.post?.endDate || j.scheduledEndDate || null;
      const actualStart =
        j.actualStartDate || j.startedAt || plannedStart || null;
      const actualEnd = j.actualEndDate || j.completedAt || plannedEnd || null;
      if (!m.has(key)) {
        m.set(key, {
          status: j?.status,
          jobId: j?.id || j?._id,
          plannedStart,
          plannedEnd,
          actualStart,
          actualEnd,
        });
      }
    }
    return m;
  }, [myJobsArr, userId]);

  const myReqsArr = toArray(myReqsQ.data);
  const reqByPostId = React.useMemo(() => {
    const m = new Map();
    for (const r of myReqsArr) {
      const pid = r?.post?._id || r?.post?.id;
      if (!pid) continue;
      const key = String(pid);
      if (!m.has(key)) {
        m.set(key, { status: r?.status, requestId: r?.id || r?._id });
      }
    }
    return m;
  }, [myReqsArr]);

  const listToShow = tab === 0 ? allFiltered : recPaged;
  const hasAnyPosts = allPosts.length > 0;
  const recErrorMsg =
    recQ.error?.response?.data?.error || recQ.error?.message || "";
  const isEligibilityError =
    /not open for work/i.test(recErrorMsg) ||
    /no profile embedding/i.test(recErrorMsg);
  const showGate = !loggedIn;
  const loadingAll = tab === 0 && postsQ.isLoading;
  const loadingRec = tab === 1 && recQ.isLoading;
  const anyLoading = meQ.isLoading || loadingAll || loadingRec;
  const meError = meQ.isError;
  const allError = tab === 0 && postsQ.isError;

  if (isContractor) {
    return <Navigate to="/home/contractor" replace />;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 960, mx: "auto" }}>
      {showGate ? (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            minHeight: "70vh",
            p: 2,
          }}
        >
          <Paper sx={{ p: 4, width: "100%", maxWidth: 800 }}>
            <Stack spacing={2} alignItems="flex-start">
              <Typography variant="h4">Welcome 👋</Typography>
              <Typography variant="body1">
                Please <RouterLink to="/login">log in</RouterLink> or{" "}
                <RouterLink to="/register">create an account</RouterLink> to
                continue.
              </Typography>
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => nav("/login")}>
                  Login
                </Button>
                <Button variant="outlined" onClick={() => nav("/register")}>
                  Register
                </Button>
              </Stack>
            </Stack>
          </Paper>
        </Box>
      ) : (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="center"
            sx={{ mb: 2 }}
          >
            <Stack sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                sx={(theme) => ({
                  color:
                    theme.palette.mode === "dark"
                      ? theme.palette.primary.light
                      : theme.palette.primary.main,
                  fontWeight: 700,
                })}
              >
                Welcome back, {meQ.data?.name?.first} {meQ.data?.name?.last} !
              </Typography>

              <Typography
                variant="caption"
                sx={{ mt: 0.5, color: "text.secondary" }}
              >
                Role: {meQ.data?.isBusiness ? "Contractor" : role || "—"}
              </Typography>
            </Stack>

            {meQ.data?.isBusiness && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                component={RouterLink}
                to="/home/contractor"
                title="Create a new job"
              >
                Create Job
              </Button>
            )}
          </Stack>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="All" />
            <Tab label="Recommended for me" />
          </Tabs>
          {meError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Couldn’t load your profile. Try re-logging.
            </Alert>
          )}
          {allError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Couldn’t load the feed.
            </Alert>
          )}
          {tab === 0 && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="sort-by">Sort by</InputLabel>
                <Select
                  labelId="sort-by"
                  label="Sort by"
                  value={`${sort.by}:${sort.dir}`}
                  onChange={(e) => {
                    const [by, dir] = String(e.target.value).split(":");
                    setSort({ by, dir });
                    setPage(1);
                  }}
                >
                  <MenuItem value="date:desc">Newest</MenuItem>
                  <MenuItem value="date:asc">Oldest</MenuItem>
                  <MenuItem value="createdAt:desc">Created (newest)</MenuItem>
                  <MenuItem value="createdAt:asc">Created (oldest)</MenuItem>
                  <MenuItem value="title:asc">Title (A→Z)</MenuItem>
                  <MenuItem value="title:desc">Title (Z→A)</MenuItem>
                  <MenuItem value="location:asc">Location (A→Z)</MenuItem>
                  <MenuItem value="location:desc">Location (Z→A)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {tab === 1 && (
            <Stack
              direction="row"
              spacing={2}
              alignItems="center"
              sx={{ mb: 2 }}
            >
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel id="rec-sort-by">Sort by</InputLabel>
                <Select
                  labelId="rec-sort-by"
                  label="Sort by"
                  value={`${recSort.by}:${recSort.dir}`}
                  onChange={(e) => {
                    const [by, dir] = String(e.target.value).split(":");
                    setRecSort({ by, dir });
                    setRecPage(1);
                  }}
                >
                  <MenuItem value="score:desc">Match (high→low)</MenuItem>
                  <MenuItem value="score:asc">Match (low→high)</MenuItem>
                  <MenuItem value="date:desc">Newest</MenuItem>
                  <MenuItem value="date:asc">Oldest</MenuItem>
                  <MenuItem value="title:asc">Title (A→Z)</MenuItem>
                  <MenuItem value="title:desc">Title (Z→A)</MenuItem>
                  <MenuItem value="location:asc">Location (A→Z)</MenuItem>
                  <MenuItem value="location:desc">Location (Z→A)</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          )}

          {tab === 1 &&
            isSub &&
            !recQ.isLoading &&
            recQ.isError &&
            isEligibilityError && (
              <Alert severity="info" sx={{ mb: 2 }}>
                To see recommendations, make sure your profile is set to{" "}
                <strong>Open for Work</strong> and you’ve filled:{" "}
                <em>Primary Trade</em>, <em>Skills</em>, <em>Coverage Areas</em>
                , <em>License/Certification file</em>, and uploaded an{" "}
                <em>Avatar</em>. Then toggle Open for Work again to generate
                your profile embedding.
                <Button
                  variant="text"
                  size="small"
                  onClick={() => nav("/profile")}
                  sx={{ ml: 1 }}
                >
                  Go to Profile
                </Button>
              </Alert>
            )}

          <TextField
            fullWidth
            placeholder={
              tab === 0 ? "Search all jobs…" : "Search your recommended jobs…"
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {anyLoading && (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          )}

          {!anyLoading && (
            <Stack spacing={2}>
              {listToShow.map((post) => {
                const createdByMe =
                  String(post?.publisher?._id || post?.publisher) ===
                  String(userId);

                const pid = String(post?._id || post?.id || "");
                const jobMeta = jobByPostId.get(pid);
                const requestMeta =
                  reqByPostId.get(pid) || post.myRequest || null;

                const chipMeta = jobMeta || requestMeta;

                const createdLabel = formatDate(post?.date || post?.createdAt);
                const plannedStartLabel = formatDate(
                  post?.startDate || jobMeta?.plannedStart
                );
                const plannedEndLabel = formatDate(
                  post?.endDate || jobMeta?.plannedEnd
                );
                const requirementsText = normalizeRequirementsText(
                  post?.requirements
                );

                return (
                  <Paper key={post?._id || post?.id} sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      {(() => {
                        const p = post?.publisher || {};
                        const pubId = String(p?._id || p?.id || "");
                        const fullName =
                          `${p?.name?.first || ""} ${
                            p?.name?.last || ""
                          }`.trim() ||
                          p?.displayName ||
                          "—";
                        const avatar =
                          p?.profilePhotoUrl || p?.avatarUrl || p?.image || "";
                        return (
                          <>
                            <Avatar
                              component={pubId ? RouterLink : "div"}
                              to={pubId ? `/users/${pubId}` : undefined}
                              src={avatar}
                              alt={fullName}
                              sx={{ width: 44, height: 44 }}
                            >
                              {(fullName || "U")[0]}
                            </Avatar>
                            <Stack sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="h6" noWrap>
                                {post?.title || "Job Posting"}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                noWrap
                              >
                                Posted by{" "}
                                {pubId ? (
                                  <RouterLink to={`/users/${pubId}`}>
                                    {fullName}
                                  </RouterLink>
                                ) : (
                                  fullName
                                )}
                                {createdLabel ? ` • ${createdLabel}` : ""}
                                {post?.location ? ` • ${post.location}` : ""}
                                {post?.salary ? ` • ${post.salary}` : ""}
                                {plannedStartLabel &&
                                  ` • Planned: ${plannedStartLabel}${
                                    plannedEndLabel
                                      ? ` → ${plannedEndLabel}`
                                      : ""
                                  }`}
                              </Typography>
                            </Stack>
                          </>
                        );
                      })()}
                      <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                        {post?.location && (
                          <Chip size="small" label={post.location} />
                        )}
                        {typeof post?.score === "number" && (
                          <Chip
                            size="small"
                            color="success"
                            label={`${Math.round(post.score * 100)}% match`}
                          />
                        )}
                        {createdByMe && (
                          <Chip size="small" color="primary" label="Mine" />
                        )}
                        {chipMeta?.status && (
                          <Chip
                            size="small"
                            color={statusColor(chipMeta.status)}
                            label={statusLabel(chipMeta.status)}
                          />
                        )}
                      </Stack>
                    </Stack>

                    <Typography variant="body1" sx={{ mt: 1 }}>
                      {post?.content}
                    </Typography>

                    {requirementsText && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Requirements:</strong> {requirementsText}
                      </Typography>
                    )}

                    {jobMeta && (jobMeta.actualStart || jobMeta.actualEnd) && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        Job dates: {formatDate(jobMeta.actualStart) || "—"}
                        {jobMeta.actualEnd
                          ? ` → ${formatDate(jobMeta.actualEnd)}`
                          : ""}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => {
                          const pid = post?._id || post?.id;
                          if (!pid) return;
                          const sp = new URLSearchParams(searchParams);
                          sp.set("open", String(pid));
                          sp.delete("focus");
                          setSearchParams(sp, { replace: false });
                        }}
                      >
                        View details
                      </Button>

                      {!!(post?._id || post?.id) && isSub && (
                        <RequestSubscribeButton
                          postId={post._id || post.id}
                          initialRequestMeta={post.myRequest || null}
                        />
                      )}

                      {(() => {
                        if (!jobMeta) return null;
                        const canCancel = ["accepted", "in_progress"].includes(
                          jobMeta.status
                        );
                        if (!canCancel) return null;
                        return (
                          <Button
                            variant="text"
                            size="small"
                            color="warning"
                            onClick={() =>
                              cancelJobMut.mutate({ jobId: jobMeta.jobId })
                            }
                            disabled={cancelJobMut.isPending}
                          >
                            Cancel job
                          </Button>
                        );
                      })()}

                      {(() => {
                        if (jobMeta) return null;
                        if (!requestMeta || requestMeta.status !== "pending")
                          return null;
                        const requestId =
                          requestMeta.requestId || requestMeta.id;
                        if (!requestId) return null;
                        return (
                          <Button
                            variant="text"
                            size="small"
                            color="warning"
                            onClick={() => withdrawReqMut.mutate(requestId)}
                            disabled={withdrawReqMut.isPending}
                          >
                            Withdraw request
                          </Button>
                        );
                      })()}
                    </Stack>
                  </Paper>
                );
              })}

              {listToShow.length === 0 && (
                <Typography
                  color="text.secondary"
                  align="center"
                  sx={{ py: 6 }}
                >
                  {tab === 0 ? "No posts yet." : "No recommendations yet."}
                </Typography>
              )}

              {tab === 0 && pageCount > 1 && (
                <Box mt={3} display="flex" justifyContent="center">
                  <Pagination
                    page={page}
                    count={pageCount}
                    onChange={(_, p) => setPage(p)}
                    shape="rounded"
                  />
                </Box>
              )}

              {tab === 1 && recSorted.length > recLimit && (
                <Box mt={3} display="flex" justifyContent="center">
                  <Pagination
                    page={recPage}
                    count={Math.max(1, Math.ceil(recSorted.length / recLimit))}
                    onChange={(_, p) => setRecPage(p)}
                    shape="rounded"
                  />
                </Box>
              )}
            </Stack>
          )}
          <JobDetailsModal
            postId={activePostId || undefined}
            open={Boolean(activePostId)}
            onClose={closeDetails}
            focusId={focusId || undefined}
          />
        </>
      )}
    </Box>
  );
}
