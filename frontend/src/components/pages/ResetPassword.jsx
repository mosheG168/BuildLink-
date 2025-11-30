import * as React from "react";
import {
  useSearchParams,
  Link as RouterLink,
  useNavigate,
} from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
  Alert,
  Link,
} from "@mui/material";
import { useToast } from "../../hooks/useToast";
import { resetPassword } from "../../api/auth";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();

  const token = searchParams.get("token");
  const userId = searchParams.get("id");

  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");

  const resetMut = useMutation({
    mutationFn: ({ token, userId, password }) =>
      resetPassword({ token, userId, password }),
    onSuccess: () => {
      toast.success("Password updated. You can now log in.");
      nav("/login");
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not reset password.";
      toast.error(msg);
    },
  });

  if (!token || !userId) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
        }}
      >
        <Paper sx={{ p: 4, width: "100%", maxWidth: 420 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            This reset link is invalid. Please request a new one.
          </Alert>
          <Button
            variant="contained"
            component={RouterLink}
            to="/forgot-password"
          >
            Request new reset link
          </Button>
        </Paper>
      </Box>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password || !confirm) {
      toast.error("Please fill in both password fields.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    resetMut.mutate({ token, userId, password });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper sx={{ p: 4, width: "100%", maxWidth: 420 }}>
        <Typography variant="h5" gutterBottom>
          Set a new password
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Choose a new password for your account.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="New password"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <TextField
              label="Confirm new password"
              type="password"
              fullWidth
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={resetMut.isLoading}
            >
              Change password
            </Button>

            <Typography variant="body2" sx={{ mt: 1 }}>
              Already changed it?{" "}
              <Link component={RouterLink} to="/login">
                Back to login
              </Link>
            </Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
