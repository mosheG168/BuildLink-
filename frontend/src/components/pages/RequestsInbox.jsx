import * as React from "react";
import {
  Box,
  Container,
  Typography,
  Stack,
  Paper,
  Chip,
  Button,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from "@mui/material";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listMyJobRequests,
  acceptJobRequest,
  denyJobRequest,
} from "../../api/jobRequestsService";
import { useToast } from "../../hooks/useToast";

const toArray = (d) =>
  Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : [];

function useInboxState() {
  const [status, setStatus] = React.useState("all");
  const [sortBy, setSortBy] = React.useState("createdAt");
  const [sortDir, setSortDir] = React.useState("desc");
  const [page, setPage] = React.useState(1);
  const limit = 10;

  return {
    status,
    sortBy,
    sortDir,
    page,
    limit,
    setStatus,
    setSortBy,
    setSortDir,
    setPage,
  };
}

export default function RequestsInbox() {
  const toast = useToast();
  const qc = useQueryClient();
  const s = useInboxState();

  const q = useQuery({
    queryKey: [
      "jobRequests",
      "contractor",
      s.status,
      s.page,
      s.sortBy,
      s.sortDir,
      s.limit,
    ],
    queryFn: () =>
      listMyJobRequests({
        mine: "contractor",
        status: s.status === "all" ? undefined : s.status,
        page: s.page,
        limit: s.limit,
        sortBy: s.sortBy,
        sortDir: s.sortDir,
      }),
    keepPreviousData: true,
    staleTime: 15_000,
  });

  const total = q.data?.total || 0;
  const pageSize = q.data?.pageSize || s.limit;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const items = toArray(q.data).filter((r) => r?.post);

  const onAfterAction = () => {
    qc.invalidateQueries({ queryKey: ["jobRequests", "contractor"] });
    qc.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
    qc.invalidateQueries({ queryKey: ["pipeline"] });
  };

  const acceptMut = useMutation({
    mutationFn: (id) => acceptJobRequest(id),
    onSuccess: () => {
      toast.success("Request accepted");
      onAfterAction();
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e?.message || "Failed to accept"),
  });

  const denyMut = useMutation({
    mutationFn: (id) => denyJobRequest(id),
    onSuccess: () => {
      toast.info("Request updated");
      onAfterAction();
    },
    onError: (e) =>
      toast.error(e?.response?.data?.error || e?.message || "Failed to update"),
  });

  return (
    <Container sx={{ py: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", md: "center" }}
        justifyContent="space-between"
        mb={3}
      >
        <Typography variant="h5">Requests Inbox</Typography>

        <Stack direction="row" spacing={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={s.status}
              onChange={(e) => {
                s.setStatus(e.target.value);
                s.setPage(1);
              }}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="accepted">Accepted</MenuItem>
              <MenuItem value="denied">Denied</MenuItem>
              <MenuItem value="withdrawn">Withdrawn</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
              <MenuItem value="all">All</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort</InputLabel>
            <Select
              label="Sort"
              value={`${s.sortBy}:${s.sortDir}`}
              onChange={(e) => {
                const [sb, sd] = String(e.target.value).split(":");
                s.setSortBy(sb);
                s.setSortDir(sd);
                s.setPage(1);
              }}
            >
              <MenuItem value="createdAt:desc">Newest</MenuItem>
              <MenuItem value="createdAt:asc">Oldest</MenuItem>
              <MenuItem value="matchScore:desc">
                Match score (high→low)
              </MenuItem>
              <MenuItem value="matchScore:asc">Match score (low→high)</MenuItem>
              <MenuItem value="updatedAt:desc">Recently updated</MenuItem>
              <MenuItem value="updatedAt:asc">Least recently updated</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      {q.isLoading ? (
        <Typography>Loading requests…</Typography>
      ) : q.isError ? (
        <Typography color="error">
          {q.error?.response?.data?.error ||
            q.error?.message ||
            "Failed to load requests"}
        </Typography>
      ) : (
        <>
          <Stack spacing={2}>
            {items.map((r) => {
              const id = r.id || r._id;
              const post = r.post || {};
              const sub = r.subcontractor || {};
              const scorePct =
                typeof r.matchScore === "number"
                  ? Math.round(r.matchScore * 100)
                  : null;

              const origin = (r.origin || "sub").toLowerCase();
              const isInvite = origin === "contractor";
              const canAcceptDeny = !isInvite && r.status === "pending";
              const canCancelInvite = isInvite && r.status === "pending";

              return (
                <Paper key={id} sx={{ p: 2 }}>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ xs: "flex-start", md: "center" }}
                  >
                    <Stack spacing={0.5}>
                      <Typography variant="subtitle1">
                        {post.title || "Job"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {sub?.displayName
                          ? sub.displayName
                          : `${sub?.name?.first ?? ""} ${
                              sub?.name?.last ?? ""
                            }`.trim() || "Subcontractor"}
                        {" • "}
                        {r.createdAt
                          ? new Date(r.createdAt).toLocaleString()
                          : ""}
                        {post.location ? ` • ${post.location}` : ""}
                        {typeof scorePct === "number"
                          ? ` • Match ${scorePct}%`
                          : ""}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        label={isInvite ? "Invite" : "Application"}
                      />

                      {canAcceptDeny ? (
                        <>
                          <Button
                            variant="contained"
                            onClick={() => acceptMut.mutate(id)}
                            disabled={acceptMut.isPending}
                          >
                            {acceptMut.isPending ? "Accepting..." : "Accept"}
                          </Button>
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => denyMut.mutate(id)}
                            disabled={denyMut.isPending}
                          >
                            {denyMut.isPending ? "Denying..." : "Deny"}
                          </Button>
                        </>
                      ) : canCancelInvite ? (
                        <>
                          <Chip
                            size="small"
                            label="Awaiting subcontractor"
                            sx={{ mr: 1 }}
                          />
                          <Button
                            variant="outlined"
                            color="warning"
                            onClick={() => denyMut.mutate(id)}
                            disabled={denyMut.isPending}
                          >
                            {denyMut.isPending
                              ? "Cancelling..."
                              : "Cancel invite"}
                          </Button>
                        </>
                      ) : (
                        <Chip
                          label={r.status}
                          color={
                            r.status === "accepted"
                              ? "success"
                              : r.status === "denied"
                                ? "default"
                                : "warning"
                          }
                          size="small"
                          sx={{ textTransform: "capitalize" }}
                        />
                      )}
                    </Stack>
                  </Stack>

                  {Array.isArray(r.matchedFields) &&
                    r.matchedFields.length > 0 && (
                      <>
                        <Divider sx={{ my: 1.5 }} />
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                        >
                          {r.matchedFields.map((mf, i) => (
                            <Chip
                              key={i}
                              label={mf}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                        </Stack>
                      </>
                    )}
                </Paper>
              );
            })}
          </Stack>

          <Box mt={3} display="flex" justifyContent="center">
            <Pagination
              page={s.page}
              count={pageCount}
              onChange={(_, p) => s.setPage(p)}
              shape="rounded"
            />
          </Box>
        </>
      )}
    </Container>
  );
}
