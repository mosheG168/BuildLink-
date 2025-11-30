import React, { useRef, useState } from "react";
import { Avatar, Box, IconButton, CircularProgress } from "@mui/material";
import { Add, Edit, Close } from "@mui/icons-material";
import { uploadAvatar } from "../../api/uploads";
import { useToast } from "../../hooks/useToast";

export default function AvatarUpload({
  value = "",
  onChange,
  onRemove,
  size = 112,
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handlePick = () => {
    if (!loading) inputRef.current?.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const { url } = await uploadAvatar(file);
      onChange?.(url || "");
      toast.success("Profile photo updated");
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed";
      toast.error(msg);
    } finally {
      setLoading(false);
      if (e?.target) e.target.value = "";
    }
  };

  const removePhoto = () => {
    if (loading) return;
    if (typeof onRemove === "function") {
      onRemove();          
    } else {
      onChange?.("");    
    }
  };

  const iconSize = Math.max(24, Math.floor(size * 0.22));

  return (
    <Box sx={{ position: "relative", width: size, height: size }}>
      <Avatar
        alt="Profile photo"
        src={value || undefined}
        sx={{ width: size, height: size, border: "2px solid #eee" }}
      />

      <IconButton
        aria-label={value ? "Edit profile photo" : "Add profile photo"}
        onClick={handlePick}
        disabled={loading}
        sx={{
          position: "absolute",
          right: 6,
          bottom: 6,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          boxShadow: 1,
          "&:hover": { bgcolor: "background.paper" },
          width: iconSize + 12,
          height: iconSize + 12,
        }}
      >
        {value ? (
          <Edit sx={{ fontSize: iconSize }} />
        ) : (
          <Add sx={{ fontSize: iconSize }} />
        )}
      </IconButton>

      {value ? (
        <IconButton
          aria-label="Remove photo"
          onClick={removePhoto}
          disabled={loading}
          size="small"
          sx={{
            position: "absolute",
            left: -6,
            top: -6,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 1,
            "&:hover": { bgcolor: "background.paper" },
          }}
        >
          <Close fontSize="small" />
        </IconButton>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={handleFile}
        disabled={loading}
      />

      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            bgcolor: "rgba(255,255,255,0.6)",
            borderRadius: "50%",
          }}
        >
          <CircularProgress size={Math.max(28, Math.floor(size * 0.25))} />
        </Box>
      )}
    </Box>
  );
}
