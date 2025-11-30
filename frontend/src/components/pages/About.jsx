import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  Chip,
  Divider,
  Button,
} from "@mui/material";
import {
  Build,
  PeopleAlt,
  Insights,
  Security,
  RocketLaunch,
  Language,
  ChatBubbleOutline,
} from "@mui/icons-material";
import "../styles/About.css";

const JOB_LIFECYCLE = [
  {
    key: "post",
    label: "Post",
    description:
      "Contractor publishes a job with scope, location, budget and dates.",
  },
  {
    key: "requests",
    label: "Requests",
    description:
      "Subcontractors send job requests, compare options, and withdraw if needed.",
  },
  {
    key: "in_progress",
    label: "In progress",
    description:
      "Once accepted, the job moves into the active pipeline with comments and status updates.",
  },
  {
    key: "done",
    label: "Done",
    description:
      "When work is completed, both sides keep a clear record of what was done and by whom.",
  },
];

export default function About() {
  return (
    <Box
      className="about-page"
      sx={{
        overflowX: "hidden",
        width: "100%",
        minHeight: "100vh",
      }}
    >
      {/* Hero */}
      <Box
        className="about-hero"
        sx={{
          py: { xs: 4, md: 6 },
          px: { xs: 2, sm: 3, md: 0 },
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <Container maxWidth="lg">
          <Stack spacing={3} alignItems="flex-start">
            <Chip
              label="About BuildLink"
              className="about-badge"
              size="small"
              color="primary"
            />
            <Typography
              variant="h3"
              component="h1"
              className="about-title"
              gutterBottom
              sx={{
                textAlign: "left",
                fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem" },
                wordBreak: "break-word",
              }}
            >
              The control center for contractors & subcontractors.
            </Typography>
            <Typography
              variant="subtitle1"
              className="about-subtitle"
              sx={{
                maxWidth: 720,
                fontSize: { xs: "0.9rem", sm: "1rem" },
              }}
            >
              BuildLink helps contractors find the right subcontractors fast,
              manage job requests in one place, and keep every project moving
              with clear communication and status tracking.
            </Typography>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              className="about-cta-row"
              sx={{
                width: { xs: "100%", sm: "auto" },
              }}
            >
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/"
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Go to dashboard
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/"
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                Explore open jobs
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>
      <Container
        maxWidth="lg"
        className="about-content"
        sx={{
          py: { xs: 3, md: 6 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Stack
          spacing={{ xs: 2, sm: 2.5, md: 3 }}
          sx={{
            mb: { xs: 4, md: 5 },
            width: "100%",
          }}
        >
          <Paper
            className="about-card"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Build fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Why BuildLink exists
              </Typography>
            </Stack>
            <Typography variant="body1" className="about-text">
              Construction projects move quickly, but the process of finding
              reliable subcontractors, tracking offers, and managing job status
              is often messy, fragmented, and done across phone calls, WhatsApp
              groups, and spreadsheets.
            </Typography>
            <Typography variant="body1" className="about-text">
              BuildLink centralizes that flow in a single workspace where
              contractors and subcontractors can match, collaborate, and keep
              track of work from first contact to job completion.
            </Typography>
          </Paper>
          <Paper
            className="about-card"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <PeopleAlt fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Who it's for
              </Typography>
            </Stack>
            <ul className="about-list">
              <li>
                <strong>Contractors</strong> who need a clear view of their open
                job posts, applicants, and active jobs.
              </li>
              <li>
                <strong>Subcontractors</strong> who want a focused feed of
                relevant jobs, not endless generic listings.
              </li>
              <li>
                Teams who care about <strong>clarity, speed, and trust</strong>{" "}
                in the way they work together.
              </li>
            </ul>
          </Paper>
          <Paper
            className="about-card"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Insights fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                What you can do inside
              </Typography>
            </Stack>
            <ul className="about-list">
              <li>
                <strong>Post jobs</strong> with structured details, dates, and
                required skills.
              </li>
              <li>
                <strong>Request & accept jobs</strong> with a clear status flow
                (pending, accepted, in progress, completed, etc.).
              </li>
              <li>
                <strong>Track your work</strong> from the{" "}
                <em>My Jobs / My Requests</em> dashboards.
              </li>
              <li>
                <strong>Comment & discuss</strong> directly on a job, so every
                decision stays attached to the work itself.
              </li>
            </ul>
          </Paper>
          <Paper
            className="about-card about-highlight"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <Security fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Trust & clarity first
              </Typography>
            </Stack>
            <Typography variant="body2" className="about-text">
              BuildLink puts structure around the parts of the workflow that
              usually get lost:
            </Typography>
            <ul className="about-list small">
              <li>Clear job statuses and history for every post.</li>
              <li>
                Profiles that highlight experience, skills, and coverage areas.
              </li>
              <li>
                Comments and notifications tied to specific jobs — not buried in
                chats.
              </li>
            </ul>
          </Paper>
          <Paper
            className="about-card"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
              <RocketLaunch fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                Under the hood
              </Typography>
            </Stack>
            <Typography variant="body2" className="about-text">
              BuildLink is a full-stack project built with:
            </Typography>
            <ul className="about-list small">
              <li>React, Vite & MUI on the frontend.</li>
              <li>Node.js / Express & MongoDB on the backend.</li>
              <li>
                A separate Python / embeddings service for smarter matching
                (planned & evolving).
              </li>
            </ul>
            <Typography variant="body2" className="about-text">
              It was created as a capstone project to demonstrate production-
              style architecture, clean data models, and real workflows from the
              construction world.
            </Typography>
          </Paper>
        </Stack>

        <Box
          className="about-divider"
          sx={{ my: { xs: 4, md: 5 }, textAlign: "center" }}
        >
          <Divider>Job lifecycle at a glance</Divider>
        </Box>

        <Box
          className="about-timeline"
          sx={{
            maxWidth: 720,
            mx: "auto",
            mb: { xs: 4, md: 5 },
            px: { xs: 0, sm: 0 },
          }}
        >
          {JOB_LIFECYCLE.map((step, index) => (
            <Box
              key={step.key}
              sx={{
                display: "flex",
                flexDirection: "row",
                gap: { xs: 1.5, sm: 2 },
                alignItems: "stretch",
                mb:
                  index === JOB_LIFECYCLE.length - 1
                    ? 0
                    : { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  minHeight: { xs: 64, sm: 72 },
                  display: "flex",
                  justifyContent: "center",
                  flexShrink: 0,
                  width: { xs: 22, sm: 26 },
                }}
              >
                {index !== 0 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      bottom: "50%",
                      width: 2,
                      bgcolor: "divider",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  />
                )}
                {index !== JOB_LIFECYCLE.length - 1 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      bottom: 0,
                      width: 2,
                      bgcolor: "divider",
                      left: "50%",
                      transform: "translateX(-50%)",
                    }}
                  />
                )}

                <Box
                  sx={{
                    width: { xs: 22, sm: 26 },
                    height: { xs: 22, sm: 26 },
                    borderRadius: "50%",
                    border: "2px solid",
                    borderColor: "primary.main",
                    bgcolor: "background.paper",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: { xs: "0.65rem", sm: "0.75rem" },
                    fontWeight: 600,
                    zIndex: 1,
                    alignSelf: "center",
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </Box>
              </Box>

              <Paper
                className="about-step"
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2.5 },
                  display: "flex",
                  flexDirection: "column",
                  gap: 0.5,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.85rem", sm: "0.875rem" },
                  }}
                >
                  {step.label}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: { xs: "0.8rem", sm: "0.875rem" },
                    wordBreak: "break-word",
                  }}
                >
                  {step.description}
                </Typography>
              </Paper>
            </Box>
          ))}
        </Box>

        <Box mt={{ xs: 4, md: 6 }}>
          <Paper
            className="about-card"
            sx={{
              p: { xs: 2, sm: 2.5, md: 3 },
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
              <ChatBubbleOutline fontSize="small" />
              <Typography
                variant="h6"
                sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}
              >
                What's coming next
              </Typography>
            </Stack>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 2, md: 3 }}
              sx={{ width: "100%" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Collaboration
                </Typography>
                <ul className="about-list small">
                  <li>Per-job team chat and file sharing.</li>
                  <li>Smarter notifications and digest emails.</li>
                </ul>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Matching & insights
                </Typography>
                <ul className="about-list small">
                  <li>Deeper skill & profile-based recommendations.</li>
                  <li>Basic analytics around workload and win-rate.</li>
                </ul>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Experience
                </Typography>
                <ul className="about-list small">
                  <li>Full English & Hebrew interface.</li>
                  <li>Mobile-friendly dashboards and flows.</li>
                </ul>
              </Box>
            </Stack>
          </Paper>
        </Box>

        <Box
          className="about-footer-note"
          sx={{
            mt: { xs: 4, md: 5 },
            mb: { xs: 2, md: 3 },
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Language fontSize="small" className="about-footer-icon" />
          <Typography
            variant="body2"
            sx={{ fontSize: { xs: "0.85rem", sm: "0.875rem" } }}
          >
            BuildLink is a learning-oriented project: it's actively evolving as
            new features, flows and ideas are tested in real-world scenarios.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
