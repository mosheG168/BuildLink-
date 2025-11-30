import React, { useState } from "react";
import {
  useSearchParams,
  useNavigate,
  Link as RouterLink,
} from "react-router-dom";
import JobDetailsModal from "../jobs/JobDetailsModal";
import { useQuery } from "@tanstack/react-query";
import { useAllPosts, useRecommendedPosts } from "../../hooks/usePosts";
import { useEmbeddingReady } from "../../hooks/useProfile";
import { getRecommendedSubsForPost } from "../../api/posts";
import { useMe } from "../../hooks/useMe";
import {
  Box,
  Paper,
  Typography,
  Stack,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Divider,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import { useToast } from "../../hooks/useToast";
import RequestSubscribeButton from "../jobs/RequestSubscribeButton.jsx";

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

export default function Posts() {
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get("open");
  const focusId = searchParams.get("focus");

  const closeDetails = () => {
    const sp = new URLSearchParams(searchParams);
    sp.delete("open");
    sp.delete("focus");
    setSearchParams(sp, { replace: true });
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [tab, setTab] = useState(0);
  const meQ = useMe();
  React.useEffect(() => {
    if (meQ.data?.role === "subcontractor") {
      navigate("/home", { replace: true });
    }
  }, [meQ.data?.role, navigate]);
  const role = meQ.data?.role;

  const postsQ = useAllPosts({
    select: (d) =>
      Array.isArray(d)
        ? d
        : Array.isArray(d?.items)
          ? d.items
          : Array.isArray(d?.data)
            ? d.data
            : Array.isArray(d?.results)
              ? d.results
              : [],
  });

  const embeddingReady = useEmbeddingReady();
  const recQ = useRecommendedPosts(20, {
    enabled: tab === 1 && embeddingReady,
  });

  const isLoading = postsQ.isLoading || meQ.isLoading;
  const posts = Array.isArray(postsQ.data) ? postsQ.data : [];

  const filteredPosts = posts.filter((post) => {
    const q = searchTerm.toLowerCase();
    const content = post?.content?.toLowerCase() || "";
    const title = (post?.title || "").toLowerCase();
    const publisher = `${post?.publisher?.name?.first ?? ""} ${
      post?.publisher?.name?.last ?? ""
    }`.toLowerCase();
    return content.includes(q) || title.includes(q) || publisher.includes(q);
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (postsQ.isError) {
    const msg =
      postsQ.error?.response?.data?.error ||
      postsQ.error?.response?.data?.message ||
      postsQ.error?.message ||
      "Failed to load posts.";
    return (
      <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Job Listings
          </Typography>
          <Typography color="text.secondary">{msg}</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: "auto" }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h4">Job Listings</Typography>

        {(role === "contractor" || role === "business") && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/home/contractor?new=1")}
          >
            Create Job
          </Button>
        )}
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ mb: 2 }}
        aria-label="jobs tabs"
      >
        <Tab label="All Jobs" />
        <Tab label="Recommended For Me" />
      </Tabs>

      {tab === 0 && (
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search jobs..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      )}

      {tab === 0 ? (
        <JobsList items={filteredPosts} role={role} />
      ) : embeddingReady ? (
        <RecommendedList
          query={recQ}
          onLearnHow={() =>
            toast.info(
              'Open your profile and toggle "Open for Work" once required fields are filled.'
            )
          }
        />
      ) : (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recommended For You
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Turn on “Open for Work” in your profile to enable recommendations.
          </Typography>
          <Button
            variant="outlined"
            onClick={() =>
              toast.info(
                'Open your profile and toggle "Open for Work" once required fields are filled.'
              )
            }
          >
            How to enable recommendations
          </Button>
        </Paper>
      )}

      <JobDetailsModal
        postId={openId || undefined}
        open={Boolean(openId)}
        onClose={closeDetails}
        focusId={focusId || undefined}
      />
    </Box>
  );
}

function JobsList({ items, role }) {
  const [dialogOpenForPostId, setDialogOpenForPostId] = useState(null);

  return (
    <Stack spacing={2}>
      {items.map((post) => {
        const requirementsText = normalizeRequirementsText(post.requirements);

        return (
          <Paper key={post._id || post.id} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {post.title || "Job Posting"}
            </Typography>

            {(() => {
              const p = post?.publisher || {};
              const pubId = String(p?._id || p?.id || "");
              const fullName =
                `${p?.name?.first || ""} ${p?.name?.last || ""}`.trim() ||
                p?.displayName ||
                "—";
              const avatar =
                p?.profilePhotoUrl || p?.avatarUrl || p?.image || "";
              const title =
                p?.primaryTrade ||
                (p?.isBusiness ? "Contractor" : p?.role || "");
              const dateLabel = formatDate(post?.date || post?.createdAt);

              return (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <Avatar
                    component={pubId ? RouterLink : "div"}
                    to={pubId ? `/users/${pubId}` : undefined}
                    src={avatar}
                    alt={fullName}
                    sx={{ width: 32, height: 32 }}
                  >
                    {(fullName || "U")[0]}
                  </Avatar>
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.1 }}>
                      <strong>
                        {pubId ? (
                          <RouterLink to={`/users/${pubId}`}>
                            {fullName}
                          </RouterLink>
                        ) : (
                          fullName
                        )}
                      </strong>
                      {title ? ` • ${title}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {(dateLabel ? `${dateLabel} • ` : "") +
                        (post?.location ? `${post.location} • ` : "") +
                        (post?.salary || "")}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })()}

            <Typography variant="body1" sx={{ mt: 1 }}>
              {post.content}
            </Typography>

            {requirementsText && (
              <>
                <Typography
                  variant="subtitle1"
                  sx={{ mt: 2, fontWeight: "bold" }}
                >
                  Requirements:
                </Typography>
                <Typography variant="body2">{requirementsText}</Typography>
              </>
            )}

            <Stack
              direction="row"
              spacing={1.5}
              sx={{ mt: 2 }}
              alignItems="center"
            >
              <RequestSubscribeButton
                postId={post._id || post.id}
                initialRequestMeta={post.myRequest || null}
              />
              {(role === "contractor" || role === "business") && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<PeopleOutlineIcon />}
                  onClick={() => setDialogOpenForPostId(post._id || post.id)}
                >
                  View Matching Subs
                </Button>
              )}
            </Stack>

            <RecommendedSubsDialog
              postId={dialogOpenForPostId}
              onClose={() => setDialogOpenForPostId(null)}
            />
          </Paper>
        );
      })}
      {items.length === 0 && (
        <Typography color="text.secondary" align="center">
          No posts yet
        </Typography>
      )}
    </Stack>
  );
}

function RecommendedList({ query, onLearnHow }) {
  if (query.isPending) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  if (query.isError) {
    const msg =
      query.error?.response?.data?.error ||
      query.error?.message ||
      "Unable to load recommendations.";
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recommended For You
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {msg}
        </Typography>
        <Button variant="outlined" onClick={onLearnHow}>
          How to enable recommendations
        </Button>
      </Paper>
    );
  }

  const items = Array.isArray(query.data) ? query.data : [];
  if (!items.length) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Recommended For You
        </Typography>
        <Typography color="text.secondary">No matches yet.</Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={2}>
      {items.map((post) => {
        const requirementsText = normalizeRequirementsText(post.requirements);

        return (
          <Paper key={post._id || post.id} sx={{ p: 2 }}>
            <Typography variant="h6">{post.title || "Job Posting"}</Typography>
            {(() => {
              const p = post?.publisher || {};
              const pubId = String(p?._id || p?.id || "");
              const fullName =
                `${p?.name?.first || ""} ${p?.name?.last || ""}`.trim() ||
                p?.displayName ||
                "—";
              const avatar =
                p?.profilePhotoUrl || p?.avatarUrl || p?.image || "";
              const title =
                p?.primaryTrade ||
                (p?.isBusiness ? "Contractor" : p?.role || "");
              return (
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mt: 0.5 }}
                >
                  <Avatar
                    component={pubId ? RouterLink : "div"}
                    to={pubId ? `/users/${pubId}` : undefined}
                    src={avatar}
                    alt={fullName}
                    sx={{ width: 28, height: 28 }}
                  >
                    {(fullName || "U")[0]}
                  </Avatar>
                  <Stack sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ lineHeight: 1.1 }}>
                      <strong>
                        {pubId ? (
                          <RouterLink to={`/users/${pubId}`}>
                            {fullName}
                          </RouterLink>
                        ) : (
                          fullName
                        )}
                      </strong>
                      {title ? ` • ${title}` : ""}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {(post?.location ? `${post.location} • ` : "") +
                        `Score: ${(post.score ?? 0).toFixed(3)}`}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })()}

            <Divider sx={{ my: 1 }} />
            <Typography variant="body1">{post.content}</Typography>

            {requirementsText && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Requirements:</strong> {requirementsText}
              </Typography>
            )}

            <Box sx={{ mt: 1.5 }}>
              <RequestSubscribeButton postId={post._id || post.id} />
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}

function RecommendedSubsDialog({ postId, onClose }) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["subs-recommended", postId],
    queryFn: () => getRecommendedSubsForPost(postId, 20),
    enabled: !!postId,
    retry: false,
  });

  return (
    <Dialog open={!!postId} onClose={onClose} maxWidth="md" fullWidth>
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
            {data.map((s) => (
              <Paper key={s._id || s.user} sx={{ p: 1.5 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Avatar
                    src={s.profilePhotoUrl || ""}
                    alt={s.displayName || "—"}
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle1">{s.displayName}</Typography>
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
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
