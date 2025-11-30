import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CssBaseline,
  ThemeProvider,
  createTheme,
  responsiveFontSizes,
} from "@mui/material";
import App from "./App.jsx";
import { ToastProvider } from "./hooks/useToast.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import "./index.css";

const qc = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 300000 },
  },
});

let theme = createTheme({
  breakpoints: { values: { xs: 0, sm: 600, md: 900, lg: 1200, xl: 1536 } },
  palette: {
    mode: "dark",
    primary: { main: "#8b5cf6", light: "#a78bfa", dark: "#7c3aed" },
    secondary: { main: "#ec4899", light: "#f472b6", dark: "#db2777" },
    success: { main: "#10b981" },
    error: { main: "#ef4444" },
    background: { default: "#0f0f23", paper: "rgba(30, 30, 60, 0.6)" },
    text: { primary: "#f8fafc", secondary: "#cbd5e1" },
    divider: "rgba(139, 92, 246, 0.2)",
  },
  typography: {
    fontFamily: '"Inter", "Segoe UI", "Roboto", sans-serif',
    h5: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: { fontWeight: 600, textTransform: "none" },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background:
            "linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%)",
          backgroundAttachment: "fixed",
          "&::before": {
            content: '""',
            position: "fixed",
            inset: 0,
            zIndex: -1,
            pointerEvents: "none",
            background: `radial-gradient(circle at 20% 30%, rgba(139,92,246,0.15) 0%, transparent 50%),
                         radial-gradient(circle at 80% 70%, rgba(236,72,153,0.15) 0%, transparent 50%)`,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(30, 30, 60, 0.4)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { textTransform: "none", fontWeight: 600, borderRadius: 12 },
        contained: {
          background: "linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #7c3aed 0%, #db2777 100%)",
            transform: "translateY(-2px)",
            boxShadow: "0 8px 24px rgba(139, 92, 246, 0.4)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            backgroundColor: "rgba(15, 15, 35, 0.5)",
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#8b5cf6",
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "rgba(15, 15, 35, 0.98)",
          backdropFilter: "blur(20px)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(15, 15, 35, 0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(139, 92, 246, 0.2)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundImage: "none",
          backgroundColor: "rgba(30, 30, 60, 0.95)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.2)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: "2px 8px",
          "&:hover": { backgroundColor: "rgba(139, 92, 246, 0.15)" },
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <ToastProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
