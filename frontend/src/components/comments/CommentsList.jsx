import * as React from "react";
import {
  Avatar,
  Box,
  CircularProgress,
  Link,
  Stack,
  Typography,
  Button,
  Collapse,
  Paper,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useMe } from "../../hooks/useMe";
import {
  useDeleteComment,
  useUpdateComment,
  useReplies,
  useCreateComment,
} from "../../hooks/useComments";
import CommentComposer from "./CommentComposer";
import { getCommentById } from "../../api/comments";

const focusStyle = {
  outline: "2px solid rgba(139, 92, 246, 0.7)",
  outlineOffset: "2px",
  borderRadius: 8,
};

export default function CommentsList({
  postId,
  comments,
  isLoading,
  errorMsg,
  meId: meIdProp,
  focusId,
}) {
  const meQ = useMe();
  const myId = String(
    meIdProp ?? meQ.data?._id ?? meQ.data?.id ?? meQ.data?.sub ?? ""
  );
  const delMut = useDeleteComment(postId);
  const updMut = useUpdateComment(postId);

  const [resolvedFocus, setResolvedFocus] = React.useState({
    focusId: focusId ? String(focusId) : "",
    parentId: null,
  });

  const [focusedParentDoc, setFocusedParentDoc] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!focusId) return;
      const fid = String(focusId);

      if ((comments || []).some((c) => String(c._id || c.id) === fid)) {
        if (alive) {
          setResolvedFocus({ focusId: fid, parentId: null });

          const meAsParent = (comments || []).find(
            (c) => String(c._id || c.id) === fid
          );
          setFocusedParentDoc(meAsParent || null);
        }
        return;
      }

      try {
        const c = await getCommentById(fid).catch(() => null);
        if (!alive || !c) return;

        const parent = c.parent ? String(c.parent) : null;
        setResolvedFocus({ focusId: fid, parentId: parent });

        if (parent) {
          const pdoc = await getCommentById(parent).catch(() => null);
          if (alive) setFocusedParentDoc(pdoc || null);
        } else {
          if (alive) setFocusedParentDoc(c);
        }
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [focusId, comments]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={3}>
        <CircularProgress size={22} />
      </Box>
    );
  }
  if (errorMsg) {
    return (
      <Typography color="error" variant="body2" sx={{ py: 2 }}>
        {errorMsg}
      </Typography>
    );
  }
  if (!comments?.length) {
    return (
      <Typography color="text.secondary" variant="body2" sx={{ py: 2 }}>
        Be the first to comment.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {!!focusedParentDoc &&
        !(comments || []).some(
          (c) =>
            String(c._id || c.id) ===
            String(focusedParentDoc._id || focusedParentDoc.id)
        ) && (
          <ParentComment
            key={`focused-${String(
              focusedParentDoc._id || focusedParentDoc.id
            )}`}
            postId={postId}
            comment={focusedParentDoc}
            myId={myId}
            focusInfo={resolvedFocus}
            delMut={delMut}
            updMut={updMut}
          />
        )}

      {comments.map((c) => (
        <ParentComment
          key={String(c._id || c.id)}
          postId={postId}
          comment={c}
          myId={myId}
          focusInfo={resolvedFocus}
          delMut={delMut}
          updMut={updMut}
        />
      ))}
    </Stack>
  );
}

function ParentComment({ postId, comment, myId, focusInfo, delMut, updMut }) {
  const id = String(comment._id || comment.id);
  const d = comment.publisherDisplay || {};
  const when = comment.createdAt
    ? new Date(comment.createdAt).toLocaleString()
    : comment.date
      ? new Date(comment.date).toLocaleString()
      : "";

  const hasProfile = !!d.hasProfile && !!d.id;
  const isOwner =
    myId && String(comment?.publisher?._id || d.id || "") === myId;

  const [openReplies, setOpenReplies] = React.useState(
    !!(focusInfo?.parentId && String(focusInfo.parentId) === id)
  );
  const [openReplyBox, setOpenReplyBox] = React.useState(false);

  const repliesQ = useReplies(openReplies ? id : null, {
    enabled: openReplies,
  });
  const createReply = useCreateComment(postId, id);

  const rowRef = React.useRef(null);
  const isFocusedParent = focusInfo.focusId && focusInfo.focusId === id;
  React.useEffect(() => {
    if (isFocusedParent && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isFocusedParent]);

  React.useEffect(() => {
    if (focusInfo?.parentId && String(focusInfo.parentId) === id) {
      setOpenReplies(true);
    }
  }, [focusInfo?.parentId, id]);

  return (
    <Stack
      ref={rowRef}
      direction="row"
      spacing={1.5}
      sx={isFocusedParent ? focusStyle : undefined}
    >
      {hasProfile ? (
        <Avatar
          component={RouterLink}
          to={`/users/${d.id}`}
          src={d.avatarUrl}
          alt={d.name}
          sx={{ textDecoration: "none" }}
        >
          {(d.name || "U")[0]}
        </Avatar>
      ) : (
        <Avatar src={d.avatarUrl} alt={d.name}>
          {(d.name || "U")[0]}
        </Avatar>
      )}

      <Stack sx={{ minWidth: 0, flex: 1 }}>
        <HeaderLine d={d} when={when} />
        <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
          {comment.content}
        </Typography>

        <ActionsLine
          isOwner={isOwner}
          onEdit={() => {
            const content = prompt("Edit comment:", comment.content || "");
            if (content != null) {
              const trimmed = String(content).trim();
              if (trimmed.length) {
                updMut.mutate({ id, content: trimmed });
              }
            }
          }}
          onDelete={() => delMut.mutate(id)}
          onReply={() => {
            setOpenReplies(true);
            setOpenReplyBox(true);
          }}
        />

        <Box sx={{ mt: 0.5 }}>
          <Button
            size="small"
            variant="text"
            onClick={() => setOpenReplies((s) => !s)}
          >
            {openReplies ? "Hide replies" : "Show replies"}
          </Button>

          <Collapse in={openReplies} unmountOnExit>
            <Box sx={{ pl: 5, pt: 1 }}>
              {repliesQ.isLoading ? (
                <Box display="flex" justifyContent="center" py={1}>
                  <CircularProgress size={18} />
                </Box>
              ) : repliesQ.isError ? (
                <Typography color="error" variant="body2">
                  Failed to load replies
                </Typography>
              ) : (
                <RepliesList
                  replies={repliesQ.data || []}
                  myId={myId}
                  focusId={
                    focusInfo.parentId && String(focusInfo.parentId) === id
                      ? focusInfo.focusId
                      : ""
                  }
                />
              )}

              {openReplyBox ? (
                <Paper sx={{ p: 1, mt: 1 }} variant="outlined">
                  <CommentComposer
                    onSubmit={({ content, mentions }) =>
                      createReply.mutate({ content, mentions })
                    }
                    disabled={createReply.isPending}
                  />
                </Paper>
              ) : (
                <Button
                  size="small"
                  onClick={() => setOpenReplyBox(true)}
                  sx={{ mt: 0.5 }}
                >
                  Reply
                </Button>
              )}
            </Box>
          </Collapse>
        </Box>
      </Stack>
    </Stack>
  );
}

function HeaderLine({ d, when }) {
  const hasProfile = !!d.hasProfile && !!d.id;
  return (
    <Stack direction="row" spacing={1} alignItems="baseline">
      {hasProfile ? (
        <Link
          component={RouterLink}
          to={`/users/${d.id}`}
          underline="hover"
          fontWeight={600}
        >
          {d.name || "—"}
        </Link>
      ) : (
        <Typography fontWeight={600}>{d.name || "—"}</Typography>
      )}
      {d.title ? (
        <Typography variant="caption" color="text.secondary">
          • {d.title}
        </Typography>
      ) : null}
      {when ? (
        <Typography variant="caption" color="text.secondary">
          • {when}
        </Typography>
      ) : null}
    </Stack>
  );
}

function ActionsLine({ isOwner, onEdit, onDelete, onReply }) {
  return (
    <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
      <Button size="small" onClick={onReply}>
        Reply
      </Button>
      {isOwner ? (
        <>
          <Button size="small" onClick={onEdit}>
            Edit
          </Button>
          <Button size="small" color="warning" onClick={onDelete}>
            Delete
          </Button>
        </>
      ) : null}
    </Stack>
  );
}

function RepliesList({ replies, myId, focusId }) {
  return (
    <Stack spacing={1}>
      {replies.map((r) => {
        const rid = String(r._id || r.id);
        const d = r.publisherDisplay || {};
        const when = r.createdAt
          ? new Date(r.createdAt).toLocaleString()
          : r.date
            ? new Date(r.date).toLocaleString()
            : "";
        const isFocused = focusId && rid === focusId;

        return (
          <Stack
            key={rid}
            direction="row"
            spacing={1}
            sx={isFocused ? focusStyle : undefined}
            ref={(node) => {
              if (isFocused && node) {
                node.scrollIntoView({ behavior: "smooth", block: "center" });
              }
            }}
          >
            <Avatar
              component={RouterLink}
              to={d?.id ? `/users/${d.id}` : undefined}
              src={d.avatarUrl}
            >
              {(d.name || "U")[0]}
            </Avatar>
            <Stack sx={{ minWidth: 0 }}>
              <HeaderLine d={d} when={when} />
              <Typography sx={{ whiteSpace: "pre-wrap", mt: 0.5 }}>
                {r.content}
              </Typography>
            </Stack>
          </Stack>
        );
      })}
      {!replies?.length && (
        <Typography variant="body2" color="text.secondary">
          No replies yet.
        </Typography>
      )}
    </Stack>
  );
}
