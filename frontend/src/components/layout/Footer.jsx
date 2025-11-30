import * as React from "react";
import {
  Box,
  Container,
  Stack,
  Typography,
  Button,
  IconButton,
  Divider,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import EmailIcon from "@mui/icons-material/Email";

const currentYear = new Date().getFullYear();

export default function Footer() {
  return (
    <Box
      component="footer"
      dir="ltr"
      sx={{
        mt: 6,
        pt: 4,
        pb: 3,
        borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        bgcolor: (theme) =>
          theme.palette.mode === "dark" ? "grey.900" : "grey.100",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={3}
          alignItems="center"
          justifyContent="space-between"
        >
          <Stack spacing={0.5} sx={{ width: "100%" }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, textAlign: "center" }} // 👈 centered heading
            >
              BuildLink
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ textAlign: "center" }}
            >
              Hire smarter. Work faster. Connect contractors and subs in one
              place.
            </Typography>
          </Stack>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", sm: "center" }}
          />
        </Stack>
        <Divider sx={{ my: 3 }} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={3}
          justifyContent="space-between"
          alignItems={{ xs: "center", sm: "center" }}
        >
          <Stack
            direction="row"
            spacing={2}
            flexWrap="wrap"
            useFlexGap
            sx={{
              "& a": { textDecoration: "none" },
              justifyContent: { xs: "center", sm: "flex-start" },
            }}
          >
            <Button component={RouterLink} to="/" size="small" color="inherit">
              Home
            </Button>
            <Button
              component={RouterLink}
              to="/about"
              size="small"
              color="inherit"
            >
              About
            </Button>
            <Button
              component={RouterLink}
              to="/profile"
              size="small"
              color="inherit"
            >
              My profile
            </Button>
          </Stack>
          <Stack direction="row" spacing={1}>
            <IconButton
              aria-label="Email support"
              size="small"
              href="mailto:support@buildlink.app"
            >
              <EmailIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="GitHub"
              size="small"
              href="https://github.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon fontSize="small" />
            </IconButton>
            <IconButton
              aria-label="LinkedIn"
              size="small"
              href="https://www.linkedin.com/in/moshe-green-aa2b6a349/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <LinkedInIcon fontSize="small" />
            </IconButton>
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "center", sm: "center" }}
          justifyContent="space-between"
          sx={{ textAlign: { xs: "center", sm: "left" } }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} BuildLink. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Designed for contractors & subcontractors in the field.
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
