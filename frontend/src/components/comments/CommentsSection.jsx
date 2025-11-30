import * as React from "react";
import { Paper, Stack, Typography, Divider } from "@mui/material";
import { useComments, useCreateComment } from "../../hooks/useComments";
import CommentsList from "./CommentsList";
import CommentComposer from "./CommentComposer";

export default function CommentsSection({
  postId,
  postPublisherId: _postPublisherIdProp,
  meId,
  focusId,
  focusCommentId,
}) {
  const {
    data: itemsRaw = [],
    isLoading,
    isError,
    error,
  } = useComments(postId);
  const createMut = useCreateComment(postId);
  const items = Array.isArray(itemsRaw) ? itemsRaw : [];
  const effectiveFocus = focusId || focusCommentId || "";

  return (
    <Paper sx={{ mt: 3, p: 2, borderRadius: 2 }}>
      <Stack spacing={1.5}>
        <Typography variant="h6">Comments</Typography>

        <CommentComposer
          onSubmit={({ content, mentions }) =>
            createMut.mutate({ content, mentions })
          }
          disabled={createMut.isPending}
        />

        <Divider />

        <CommentsList
          postId={postId}
          comments={items}
          isLoading={isLoading}
          errorMsg={
            isError
              ? error?.response?.data?.error ||
                error?.message ||
                "Failed to load comments"
              : ""
          }
          meId={meId}
          focusId={effectiveFocus}
        />
      </Stack>
    </Paper>
  );
}
