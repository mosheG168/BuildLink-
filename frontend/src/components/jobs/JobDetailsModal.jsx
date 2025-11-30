import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Chip,
  Divider,
  Box,
  Skeleton,
  Avatar,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { getPostById } from "../../api/posts";
import RequestSubscribeButton from "./RequestSubscribeButton";
import CommentsSection from "../comments/CommentsSection";
import { Link as RouterLink } from "react-router-dom";
import { useMe } from "../../hooks/useMe";

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

export default function JobDetailsModal({ postId, open, onClose, focusId }) {
  if (!open) return null;

  const {
    data: post,
    isLoading,
    isFetching,
    isError,
    error,
  } = useQuery({
    enabled: !!open && !!postId,
    queryKey: ["post", postId],
    queryFn: () => getPostById(postId, { includeMyRequest: true }),
    staleTime: 30_000,
  });

  const { data: me } = useMe();
  const isSelfPublisher =
    !!post?.publisher?._id &&
    String(post.publisher._id) === String(me?.id || me?._id);

  const loading = isLoading || isFetching;

  const postedDateLabel = React.useMemo(() => {
    const d = post?.date || post?.createdAt;
    return formatDate(d);
  }, [post]);

  const plannedStartLabel = React.useMemo(
    () => formatDate(post?.startDate),
    [post]
  );
  const plannedEndLabel = React.useMemo(
    () => formatDate(post?.endDate),
    [post]
  );

  const requirementsText = React.useMemo(
    () => normalizeRequirementsText(post?.requirements),
    [post]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      BackdropProps={{ sx: { backdropFilter: "blur(6px)" } }}
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle>Job Details</DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Skeleton variant="circular" width={44} height={44} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="40%" />
                <Skeleton width="60%" />
              </Box>
            </Stack>
            <Skeleton variant="rectangular" height={120} />
            <Skeleton width="50%" />
            <Skeleton width="30%" />
          </Stack>
        ) : isError ? (
          <Typography color="error">
            {error?.response?.data?.error ||
              error?.message ||
              "Failed to load job."}
          </Typography>
        ) : !post ? (
          <Typography color="text.secondary">No data for this job.</Typography>
        ) : (
          <>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Typography variant="h6">{post?.title || "Job"}</Typography>

              <Stack direction="row" spacing={1}>
                {post?.location ? (
                  <Chip label={post.location} size="small" />
                ) : null}
                {post?.salary ? (
                  <Chip label={post.salary} size="small" />
                ) : null}
              </Stack>
            </Stack>

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
              const meta =
                (postedDateLabel ? `${postedDateLabel} • ` : "") +
                (post?.location ? `${post.location} • ` : "") +
                (post?.salary || "");

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
                      {meta}
                    </Typography>
                  </Stack>
                </Stack>
              );
            })()}

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="subtitle2">Description</Typography>
            <Typography sx={{ whiteSpace: "pre-line", mb: 1 }}>
              {post?.content || "—"}
            </Typography>

            {(plannedStartLabel || plannedEndLabel) && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                Planned dates: {plannedStartLabel || "—"}
                {plannedEndLabel ? ` → ${plannedEndLabel}` : ""}
              </Typography>
            )}

            {requirementsText && (
              <>
                <Typography variant="subtitle2">Requirements</Typography>
                <Typography sx={{ whiteSpace: "pre-line" }}>
                  {requirementsText}
                </Typography>
              </>
            )}

            <Divider sx={{ my: 2 }} />
            <CommentsSection postId={postId} focusId={focusId} />
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Box sx={{ flex: 1 }} />
        {!!post?.publisher?._id && !isSelfPublisher && (
          <Button
            variant="outlined"
            component={RouterLink}
            to={`/users/${post.publisher._id}`}
          >
            View Profile
          </Button>
        )}
        {!!postId && <RequestSubscribeButton postId={postId} />}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
