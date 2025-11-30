import * as React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

export default function ConfirmDialog({
  open,
  title,
  content,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onClose,
  onConfirm,
}) {
  const handleClose = (_, reason) => {
    if (loading) return;
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-content"
    >
      {title ? (
        <DialogTitle id="confirm-dialog-title">{title}</DialogTitle>
      ) : null}

      {content ? (
        <DialogContent>
          {typeof content === "string" ? (
            <Typography id="confirm-dialog-content">{content}</Typography>
          ) : (
            content
          )}
        </DialogContent>
      ) : null}

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          {cancelText}
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Working…" : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
