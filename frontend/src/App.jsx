import { Routes, Route, Navigate } from "react-router-dom";
import { Box } from "@mui/material";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Landing from "./components/pages/Landing.jsx";
import Home from "./components/pages/Home";
import Login from "./components/pages/Login";
import Register from "./components/pages/Register";
import ProfileRouter from "./components/profile/ProfileRouter";
import Posts from "./components/pages/Posts";
import MyJobs from "./components/pages/MyJobs";
import RequestsInbox from "./components/pages/RequestsInbox";
import PublicProfile from "./components/profile/PublicProfile";
import ContractorHome from "./components/pages/ContractorHome";
import { useAuth } from "./context/AuthContext";
import ForgotPassword from "./components/pages/ForgotPassword";
import ResetPassword from "./components/pages/ResetPassword";
import About from "./components/pages/About.jsx";
import ScrollToTop from "./components/layout/ScrollToTop";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ScrollToTop />
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1 }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/home"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          />
          <Route
            path="/home/contractor"
            element={
              <RequireAuth>
                <ContractorHome />
              </RequireAuth>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={
              <RequireAuth>
                <ProfileRouter />
              </RequireAuth>
            }
          />
          <Route
            path="/posts"
            element={
              <RequireAuth>
                <Posts />
              </RequireAuth>
            }
          />
          <Route
            path="/jobs"
            element={
              <RequireAuth>
                <MyJobs />
              </RequireAuth>
            }
          />
          <Route
            path="/requests"
            element={
              <RequireAuth>
                <RequestsInbox />
              </RequireAuth>
            }
          />
          <Route path="/about" element={<About />} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>
      <Footer />
    </Box>
  );
}
