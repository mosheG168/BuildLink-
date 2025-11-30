import * as React from "react";
import { Link as RouterLink } from "react-router-dom";
import "../styles/Landing.css";
import { sendContactMessage } from "../../api/contact";

export default function Landing() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const year = new Date().getFullYear();

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => setMobileOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileOpen(false);

  const [sending, setSending] = React.useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");

    try {
      setSending(true);
      await sendContactMessage({ name, email, message });
      alert("Thanks! Your message has been sent.");
      form.reset();
    } catch (err) {
      console.error("Contact form error:", err);
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        "Sorry, we couldn't send your message. Please try again later.";
      alert(msg);
    } finally {
      setSending(false);
    }
  };

  const features = [
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
      title: "Post jobs in minutes",
      description:
        "Simple forms, smart templates, and instant publishing with attachments for plans & specs.",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
      ),
      title: "AI-powered matching",
      description:
        "Smart recommendations ranked by skills, location, ratings, and real-time availability.",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      ),
      title: "Verified & secure",
      description:
        "License verification, secure document vault, and role-based access controls.",
    },
    {
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Team collaboration",
      description:
        "Requests, messages, files, and approvals—organized per project in one place.",
    },
  ];

  const steps = [
    {
      num: "1",
      title: "Create a job",
      desc: "Describe the scope, location, budget, and timeline. Attach plans, photos, or specifications.",
    },
    {
      num: "2",
      title: "Get matched instantly",
      desc: "Our AI ranks subcontractors by fit. Compare verified profiles and message candidates directly.",
    },
    {
      num: "3",
      title: "Hire and collaborate",
      desc: "Approve requests, share files, track progress, and communicate—all inside BuildLink.",
    },
  ];

  return (
    <div className="landing-page">
      {/* Animated background */}
      <div className="landing-bg" aria-hidden="true">
        <div className="landing-bg-orb landing-bg-orb-1" />
        <div className="landing-bg-orb landing-bg-orb-2" />
        <div className="landing-bg-orb landing-bg-orb-3" />
      </div>

      {/* NAVBAR */}
      <header className={`landing-header ${scrolled ? "scrolled" : ""}`}>
        <div className="landing-header-inner">
          <a href="#home" className="landing-logo">
            <div className="landing-logo-icon">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path d="M8 21V12h8v9" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <span>BuildLink</span>
          </a>

          <nav className="landing-nav">
            <a href="#features">Features</a>
            <a href="#how">How it Works</a>
            <a href="#contact">Contact</a>
          </nav>

          <div className="landing-header-actions">
            <RouterLink to="/login" className="landing-btn-ghost">
              Log in
            </RouterLink>
            <RouterLink to="/register" className="landing-btn-primary">
              Get Started
            </RouterLink>
          </div>

          <button
            type="button"
            onClick={toggleMobileMenu}
            className="landing-mobile-toggle"
            aria-label="Toggle Menu"
            aria-expanded={mobileOpen}
          >
            <span className={`hamburger ${mobileOpen ? "open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`landing-mobile-menu ${mobileOpen ? "open" : ""}`}>
          <nav>
            <a href="#features" onClick={closeMobileMenu}>
              Features
            </a>
            <a href="#how" onClick={closeMobileMenu}>
              How it Works
            </a>
            <a href="#contact" onClick={closeMobileMenu}>
              Contact
            </a>
          </nav>
          <div className="landing-mobile-actions">
            <RouterLink
              to="/login"
              className="landing-btn-ghost"
              onClick={closeMobileMenu}
            >
              Log in
            </RouterLink>
            <RouterLink
              to="/register"
              className="landing-btn-primary"
              onClick={closeMobileMenu}
            >
              Get Started
            </RouterLink>
          </div>
        </div>
      </header>

      <main>
        <section id="home" className="landing-hero">
          <div className="landing-container">
            <div className="landing-hero-grid">
              <div className="landing-hero-content">
                <div className="landing-badge">
                  <span className="landing-badge-dot" />
                  <span>Now with AI-powered matching</span>
                </div>

                <h1 className="landing-hero-title">
                  The smarter way to
                  <span className="landing-gradient-text">
                    {" "}
                    build your team
                  </span>
                </h1>

                <p className="landing-hero-subtitle">
                  BuildLink connects contractors and subcontractors in seconds.
                  Post jobs, match by skills & location with AI, and collaborate
                  securely—all in one powerful platform.
                </p>

                <div className="landing-hero-actions">
                  <RouterLink
                    to="/register"
                    className="landing-btn-primary landing-btn-lg"
                  >
                    Start for free
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </RouterLink>
                  <a
                    href="#how"
                    className="landing-btn-secondary landing-btn-lg"
                  >
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polygon points="10,8 16,12 10,16" fill="currentColor" />
                    </svg>
                    See how it works
                  </a>
                </div>

                <div className="landing-social-proof">
                  <div className="landing-avatar-stack">
                    <div className="landing-avatar gradient-blue">A</div>
                    <div className="landing-avatar gradient-indigo">N</div>
                    <div className="landing-avatar gradient-violet">Y</div>
                  </div>
                  <div className="landing-social-text">
                    <span>Join construction teams already using BuildLink</span>
                  </div>
                </div>
              </div>

              <div className="landing-hero-visual">
                <div className="landing-mockup-browser">
                  <div className="landing-mockup-header">
                    <div className="landing-mockup-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="landing-mockup-url">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>app.buildlink.io</span>
                    </div>
                  </div>
                  <div className="landing-mockup-content">
                    <img
                      src="/landing/pictures/dashboard.png"
                      alt="BuildLink Dashboard"
                    />
                  </div>
                </div>

                <div className="landing-float-card landing-float-card-1">
                  <div className="landing-float-icon success">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="landing-float-text">
                    <strong>New Match Found</strong>
                    <span>98% skill match • 2km away</span>
                  </div>
                </div>

                <div className="landing-float-card landing-float-card-2">
                  <img
                    src="/landing/pictures/job-listings.png"
                    alt="Job Matching"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="landing-features">
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-tag">Features</span>
              <h2 className="landing-section-title">
                Everything you need to staff jobs fast
              </h2>
              <p className="landing-section-desc">
                From posting to approval, BuildLink streamlines every step with
                AI helping you match the right pro.
              </p>
            </div>

            <div className="landing-features-grid">
              {features.map((f, i) => (
                <div key={i} className="landing-feature-card">
                  <div className="landing-feature-icon">{f.icon}</div>
                  <h3>{f.title}</h3>
                  <p>{f.description}</p>
                </div>
              ))}
            </div>
            <div className="landing-gallery">
              <div className="landing-gallery-main">
                <div className="landing-mockup-browser large">
                  <div className="landing-mockup-header">
                    <div className="landing-mockup-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                    <div className="landing-mockup-url">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      </svg>
                      <span>app.buildlink.io/jobs</span>
                    </div>
                  </div>
                  <div className="landing-mockup-content">
                    <img
                      src="/landing/pictures/job-listings.png"
                      alt="AI Job Matching"
                    />
                  </div>
                </div>
              </div>

              <div className="landing-gallery-side">
                <div className="landing-gallery-card">
                  <img
                    src="/landing/pictures/profile.png"
                    alt="Verified Profiles"
                  />
                  <span>Verified Profiles</span>
                </div>
                <div className="landing-gallery-card">
                  <img
                    src="/landing/pictures/create-job.png"
                    alt="Job Creation"
                  />
                  <span>Quick Job Creation</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="landing-how">
          <div className="landing-container">
            <div className="landing-section-header">
              <span className="landing-section-tag">How it Works</span>
              <h2 className="landing-section-title">
                From post to partner in three steps
              </h2>
            </div>

            <div className="landing-how-grid">
              <div className="landing-steps">
                {steps.map((step, i) => (
                  <div key={i} className="landing-step">
                    <div className="landing-step-num">{step.num}</div>
                    <div className="landing-step-content">
                      <h3>{step.title}</h3>
                      <p>{step.desc}</p>
                    </div>
                  </div>
                ))}
                <RouterLink
                  to="/register"
                  className="landing-btn-primary landing-btn-lg"
                >
                  Start Building Your Team
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </RouterLink>
              </div>

              <div className="landing-how-visual">
                <div className="landing-mockup-phone">
                  <div className="landing-phone-notch" />
                  <img
                    src="/landing/pictures/job-details.png"
                    alt="Job Collaboration"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="landing-cta">
          <div className="landing-container">
            <div className="landing-cta-card">
              <h2>Ready to transform how you hire?</h2>
              <p>
                Start connecting with verified construction professionals today.
                It&apos;s free to get started.
              </p>
              <div className="landing-cta-actions">
                <RouterLink
                  to="/register"
                  className="landing-btn-white landing-btn-lg"
                >
                  Create free account
                </RouterLink>
                <a href="#contact" className="landing-btn-ghost-light">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="contact" className="landing-contact">
          <div className="landing-container">
            <div className="landing-contact-grid">
              <div className="landing-contact-info">
                <h2>Contact us</h2>
                <p>
                  Questions, partnerships, or enterprise? We&apos;d love to hear
                  from you.
                </p>

                <div className="landing-contact-cards">
                  <div className="landing-contact-card">
                    <div className="landing-contact-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M21 10c0 7-9 12-9 12S3 17 3 10a9 9 0 1 1 18 0Z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div>
                      <strong>Tel Aviv, Israel</strong>
                      <span>Global support • Mon–Fri</span>
                    </div>
                  </div>
                  <div className="landing-contact-card">
                    <div className="landing-contact-icon">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 6-10 7L2 6" />
                      </svg>
                    </div>
                    <div>
                      <strong>Email</strong>
                      <a href="mailto:hello@buildlink.app">
                        buildlink634@gmail.com
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <form
                className="landing-contact-form"
                onSubmit={handleContactSubmit}
              >
                <div className="landing-form-group">
                  <label htmlFor="name">Name</label>
                  <input id="name" name="name" required />
                </div>
                <div className="landing-form-group">
                  <label htmlFor="email">Email</label>
                  <input type="email" id="email" name="email" required />
                </div>
                <div className="landing-form-group">
                  <label htmlFor="msg">Message</label>
                  <textarea id="msg" name="message" rows={4} required />
                </div>
                <button
                  type="submit"
                  className="landing-btn-primary landing-btn-lg full-width"
                  disabled={sending}
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>
                <p className="landing-form-disclaimer">
                  By contacting us you agree to our{" "}
                  <a href="#">privacy policy</a>.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <a href="#home" className="landing-logo">
                <div className="landing-logo-icon">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 10.5L12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 19.5v-9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M8 21V12h8v9"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <span>BuildLink</span>
              </a>
              <p>Connecting construction teams, faster.</p>
            </div>

            <nav className="landing-footer-nav">
              <div>
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how">How it Works</a>
              </div>
              <div>
                <h4>Company</h4>
                <a href="#contact">Contact</a>
                <a href="#">About</a>
                <a href="#">Careers</a>
              </div>
              <div>
                <h4>Account</h4>
                <RouterLink to="/login">Log in</RouterLink>
                <RouterLink to="/register">Sign up</RouterLink>
              </div>
            </nav>
          </div>

          <div className="landing-footer-bottom">
            <span>© {year} BuildLink. All rights reserved.</span>
            <div className="landing-footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
