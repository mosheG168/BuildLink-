import * as React from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Stack,
} from "@mui/material";
import { useToast } from "../../hooks/useToast";
import { requestPasswordReset } from "../../api/auth";

export default function ForgotPassword() {
  const toast = useToast();
  const [email, setEmail] = React.useState("");

  const resetMut = useMutation({
    mutationFn: (em) => requestPasswordReset(em),
    onSuccess: () => {
      toast.success(
        "If an account exists for that email, a reset link has been sent."
      );
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Could not request password reset.";
      toast.error(msg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = String(email || "").trim();
    if (!trimmed) {
      toast.error("Please enter your email.");
      return;
    }
    resetMut.mutate(trimmed);
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
          Forgot your password?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Enter your email address and we'll send you a link to reset your
          password.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={resetMut.isLoading}
            >
              Send reset link
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
