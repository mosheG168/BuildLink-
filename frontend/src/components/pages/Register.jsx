import * as React from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "../../hooks/useToast";
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Stack,
  MenuItem,
  Fade,
  styled,
} from "@mui/material";
import { registerUser } from "../../api/auth";
import { useNavigate, Link } from "react-router-dom";

const israeliPhonePattern = /^(?:\+972|0)5[0-9](?:[- ]?\d){7}$/;
const passwordPattern =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*\-]).{9,}$/;

const addressSchema = z.object({
  country: z
    .string()
    .trim()
    .min(2, "Country is required")
    .max(256)
    .default("IL"),
  city: z.string().trim().min(2, "City is required").max(256),
  street: z.string().trim().min(2, "Street is required").max(256),
  houseNumber: z
    .string()
    .trim()
    .regex(/^\d{1,4}$/, "House number must be 1–4 digits"),
  zip: z
    .string()
    .trim()
    .regex(/^\d{5,7}$/, "ZIP must be 5–7 digits"),
});

const schema = z
  .object({
    first: z.string().trim().min(2, "First name must be at least 2 characters"),
    middle: z.string().trim().optional(),
    last: z.string().trim().min(2, "Last name must be at least 2 characters"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z
      .string()
      .trim()
      .regex(israeliPhonePattern, "Phone must be Israeli format"),
    role: z.enum(["subcontractor", "contractor"]).default("subcontractor"),
    password: z
      .string()
      .regex(passwordPattern, "≥9 chars, upper, lower, digit, special"),
    confirm: z.string(),
    address: addressSchema,
  })
  .refine((v) => v.password === v.confirm, {
    path: ["confirm"],
    message: "Passwords do not match",
  });

const AnimatedPaper = styled(Paper)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "-50%",
    left: "-50%",
    width: "200%",
    height: "200%",
    background: `
      radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)
    `,
    animation: "rotate 20s linear infinite",
  },
  "@keyframes rotate": {
    "0%": { transform: "rotate(0deg)" },
    "100%": { transform: "rotate(360deg)" },
  },
}));

const StyledLink = styled(Link)(({ theme }) => ({
  color: theme.palette.primary.light,
  textDecoration: "none",
  fontWeight: 600,
  transition: "all 0.2s ease",
  "&:hover": {
    color: theme.palette.primary.main,
    textDecoration: "underline",
  },
}));

const GlowingBox = styled(Box)({
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "600px",
    height: "600px",
    background:
      "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)",
    pointerEvents: "none",
    animation: "pulse 4s ease-in-out infinite",
  },
  "@keyframes pulse": {
    "0%, 100%": {
      opacity: 0.5,
      transform: "translate(-50%, -50%) scale(1)",
    },
    "50%": {
      opacity: 0.8,
      transform: "translate(-50%, -50%) scale(1.1)",
    },
  },
});

const SectionDivider = styled(Box)(({ theme }) => ({
  height: "1px",
  background:
    "linear-gradient(90deg, transparent 0%, rgba(139, 92, 246, 0.3) 50%, transparent 100%)",
  margin: theme.spacing(4, 0, 3, 0),
}));

export default function Register() {
  const nav = useNavigate();
  const toast = useToast();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    setError,
    resetField,
    trigger,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      first: "",
      middle: "",
      last: "",
      email: "",
      phone: "",
      role: "subcontractor",
      password: "",
      confirm: "",
      address: {
        country: "Israel",
        city: "",
        street: "",
        houseNumber: "",
        zip: "",
      },
    },
    mode: "onChange",
  });

  const liveRef = React.useRef(new Set());
  const startLive = (name) => liveRef.current.add(name);
  const stopLive = (name) => liveRef.current.delete(name);
  const isLive = (name) => liveRef.current.has(name);

  const lv = (name) =>
    register(name, {
      onChange: async (e) => {
        if (!isLive(name)) startLive(name);
        const ok = await trigger(name);
        if (ok) stopLive(name);
      },
    });

  const onSubmit = async (form) => {
    try {
      await registerUser({
        ...form,
        email: String(form.email || "")
          .trim()
          .toLowerCase(),
        phone: String(form.phone || "").trim(),
      });
      toast.success("Registered successfully");
      resetField("password");
      resetField("confirm");
      nav("/login");
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors && typeof data.errors === "object") {
        for (const [k, v] of Object.entries(data.errors)) {
          setError(k, { type: "server", message: String(v) });
          startLive(k);
        }
        toast.error("Please fix the highlighted errors and try again");
      } else {
        setError("root", {
          type: "server",
          message: data?.message || "Registration failed",
        });
        toast.error(data?.message || "Registration failed");
      }
    }
  };

  return (
    <GlowingBox
      sx={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        p: 2,
        py: 4,
      }}
    >
      <Fade in={mounted} timeout={800}>
        <AnimatedPaper
          sx={{
            p: { xs: 3, sm: 4 },
            width: "100%",
            maxWidth: 650,
            position: "relative",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Typography
              variant="h5"
              gutterBottom
              sx={{
                background: "linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 1,
                fontSize: { xs: "1.25rem", sm: "1.75rem" },
                textAlign: "center",
                fontWeight: 700,
              }}
            >
              Create an Account
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                mb: 3,
                textAlign: "center",
                fontSize: "0.9rem",
              }}
            >
              Join us today and start managing your projects efficiently
            </Typography>
            <Stack
              component="form"
              onSubmit={handleSubmit(onSubmit)}
              spacing={2}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 2,
                }}
              >
                <TextField
                  label="First name"
                  {...lv("first")}
                  error={!!errors.first}
                  helperText={errors.first?.message || " "}
                  fullWidth
                />
                <TextField
                  label="Middle (optional)"
                  {...lv("middle")}
                  error={!!errors.middle}
                  helperText={errors.middle?.message || " "}
                  fullWidth
                />
                <TextField
                  label="Last name"
                  {...lv("last")}
                  error={!!errors.last}
                  helperText={errors.last?.message || " "}
                  fullWidth
                />
              </Box>
              <TextField
                label="Email"
                placeholder="example.com@..."
                type="email"
                {...lv("email")}
                error={!!errors.email}
                helperText={errors.email?.message || " "}
                autoComplete="username"
                fullWidth
              />

              <TextField
                label="Phone"
                placeholder="05XXXXXXXX or +9725XXXXXXXX"
                {...lv("phone")}
                error={!!errors.phone}
                helperText={errors.phone?.message || " "}
                fullWidth
              />

              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    label="Role"
                    {...field}
                    onChange={async (e) => {
                      field.onChange(e);
                      const name = "role";
                      if (!isLive(name)) startLive(name);
                      const ok = await trigger(name);
                      if (ok) stopLive(name);
                    }}
                    fullWidth
                    helperText=" "
                  >
                    <MenuItem value="subcontractor">Subcontractor</MenuItem>
                    <MenuItem value="contractor">Contractor</MenuItem>
                  </TextField>
                )}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="Password"
                  type="password"
                  {...lv("password")}
                  error={!!errors.password}
                  helperText={
                    errors.password?.message ||
                    "At least 9 chars with upper, lower, digit, special"
                  }
                  autoComplete="new-password"
                  fullWidth
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  {...lv("confirm")}
                  error={!!errors.confirm}
                  helperText={errors.confirm?.message || " "}
                  autoComplete="new-password"
                  fullWidth
                />
              </Box>

              <SectionDivider />

              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 600,
                  color: "text.primary",
                  textAlign: "center",
                  fontSize: "1rem",
                }}
              >
                Address Information
              </Typography>
              <TextField
                label="Country"
                {...lv("address.country")}
                error={!!errors.address?.country}
                helperText={errors.address?.country?.message || " "}
                autoComplete="country-name"
                fullWidth
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="City"
                  {...lv("address.city")}
                  error={!!errors.address?.city}
                  helperText={errors.address?.city?.message || " "}
                  autoComplete="address-level2"
                  fullWidth
                />
                <TextField
                  label="Street"
                  {...lv("address.street")}
                  error={!!errors.address?.street}
                  helperText={errors.address?.street?.message || " "}
                  autoComplete="street-address"
                  fullWidth
                />
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "150px 1fr" },
                  gap: 2,
                }}
              >
                <TextField
                  label="House number"
                  {...lv("address.houseNumber")}
                  error={!!errors.address?.houseNumber}
                  helperText={errors.address?.houseNumber?.message || " "}
                  inputProps={{ inputMode: "numeric", pattern: "\\d{1,4}" }}
                  fullWidth
                />
                <TextField
                  label="ZIP / Postal code"
                  {...lv("address.zip")}
                  error={!!errors.address?.zip}
                  helperText={errors.address?.zip?.message || " "}
                  inputProps={{ inputMode: "numeric", pattern: "\\d{5,7}" }}
                  autoComplete="postal-code"
                  fullWidth
                />
              </Box>
              {errors.root?.message && (
                <Box
                  sx={{
                    p: 2,
                    bgcolor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: 2,
                  }}
                >
                  <Typography color="error" variant="body2">
                    {errors.root.message}
                  </Typography>
                </Box>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting}
                fullWidth
                size="large"
                sx={{
                  mt: 2,
                  py: 1.25,
                  fontSize: "1rem",
                }}
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
              <Box sx={{ textAlign: "center", mt: 2.5 }}>
                <Typography variant="body2" color="text.secondary">
                  Already have an account?{" "}
                  <StyledLink to="/login">Sign in</StyledLink>
                </Typography>
              </Box>
            </Stack>
          </Box>
        </AnimatedPaper>
      </Fade>
    </GlowingBox>
  );
}
