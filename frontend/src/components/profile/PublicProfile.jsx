import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import CheckCircle from "@mui/icons-material/CheckCircle";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LanguageIcon from "@mui/icons-material/Language";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PersonIcon from "@mui/icons-material/Person";
import FolderIcon from "@mui/icons-material/Folder";
import DescriptionIcon from "@mui/icons-material/Description";
import ContactMailIcon from "@mui/icons-material/ContactMail";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import BusinessIcon from "@mui/icons-material/Business";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CallIcon from "@mui/icons-material/Call";
import DownloadIcon from "@mui/icons-material/Download";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import StarIcon from "@mui/icons-material/Star";
import TaskAltIcon from "@mui/icons-material/TaskAlt";

import "../styles/PublicProfile.css";
import { getPublicUser, getMe } from "../../api/users";
import { ROLES, isSubcontractor } from "@shared/roles";

const fb = (v, d = "") => (v == null || v === "" ? d : v);
const isImg = (u = "") => /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(String(u));

export default function PublicProfile() {
  const { id } = useParams();
  const nav = useNavigate();
  const [toast, setToast] = useState({ visible: false, message: "" });
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyToClipboard = useCallback((text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setToast({ visible: true, message: `${label} הועתק!` });
      setTimeout(() => setToast({ visible: false, message: "" }), 2500);
    });
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: () => getMe(),
    retry: false,
  });

  const userQ = useQuery({
    queryKey: ["public-user", id],
    queryFn: () => getPublicUser(id),
    enabled: !!id,
    retry: false,
  });

  if (userQ.isLoading) {
    return (
      <div className="public-profile">
        <div className="public-profile__loading">
          <div className="public-profile__spinner" />
          <span className="public-profile__loading-text">טוען פרופיל...</span>
        </div>
      </div>
    );
  }

  if (userQ.isError) {
    return (
      <div className="public-profile">
        <div className="public-profile__error">
          <div className="public-profile__error-icon">
            <ErrorOutlineIcon style={{ fontSize: 36 }} />
          </div>
          <h2 className="public-profile__error-title">
            לא ניתן לטעון את הפרופיל
          </h2>
          <p className="public-profile__error-message">
            {userQ.error?.response?.data?.error ||
              userQ.error?.message ||
              "אירעה שגיאה בטעינת הפרופיל"}
          </p>
        </div>
      </div>
    );
  }

  const u = userQ.data || {};
  const p = u.profile || {};
  const role = u.role || ROLES.CONTRACTOR;
  const isSub = isSubcontractor(role);
  const isBusiness = !!u.isBusiness;
  const meId = String(meQ.data?._id || meQ.data?.id || "");
  const viewerIsOwner = meId && String(u.id || u._id) === meId;
  const displayName = fb(p.displayName, u.name) || "—";
  const primaryTrade = fb(p.primaryTrade, u.title);
  const isVerified = !!p.isVerified || !!p.contractorLicense?.verified;
  const openForWork = !!p.openForWork;
  const stats = {
    projects: p.completedProjects || 0,
    experience: p.yearsExperience || 0,
    rating: p.rating || 0,
  };

  const fullAddress = p.address
    ? [
        p.address?.street &&
          `${p.address.street} ${p.address.houseNumber || ""}`.trim(),
        p.address?.city,
        p.address?.zip,
        p.address?.country === "IL" ? "ישראל" : p.address?.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const email = p.contact?.email || u.email;
  const phone = p.contact?.phone;
  const socials = p.contact?.socials || {};
  const hasAnySocial = !!(
    socials.instagram ||
    socials.linkedin ||
    socials.facebook ||
    socials.tiktok
  );

  const portfolio = Array.isArray(p.portfolio) ? p.portfolio : [];
  const documents = Array.isArray(p.documents) ? p.documents : [];

  return (
    <div className="public-profile">
      <div className="public-profile__grid-overlay" />

      <div className="public-profile__container">
        <header className="public-profile__header">
          <div className="public-profile__header-content">
            <div className="public-profile__avatar-wrapper">
              {p.profilePhotoUrl || u.avatarUrl ? (
                <img
                  src={p.profilePhotoUrl || u.avatarUrl}
                  alt={displayName}
                  className="public-profile__avatar"
                />
              ) : (
                <div className="public-profile__avatar-fallback">
                  {(displayName || "U")[0]}
                </div>
              )}
              {isVerified && (
                <Tooltip title="קבלן מאומת" placement="top">
                  <div className="public-profile__verified-badge">
                    <CheckCircle style={{ fontSize: 20 }} />
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="public-profile__info">
              <div className="public-profile__name-row">
                <h1 className="public-profile__name">{displayName}</h1>
                {viewerIsOwner && (
                  <Tooltip title="ערוך פרופיל">
                    <button
                      className="public-profile__edit-btn"
                      onClick={() => nav("/profile")}
                    >
                      <EditIcon style={{ fontSize: 18 }} />
                    </button>
                  </Tooltip>
                )}
              </div>

              {isBusiness && p.companyName && (
                <p className="public-profile__company">
                  <BusinessIcon style={{ fontSize: 18 }} />
                  {p.companyName}
                </p>
              )}

              {primaryTrade && (
                <span className="public-profile__trade">{primaryTrade}</span>
              )}

              {(stats.projects > 0 ||
                stats.experience > 0 ||
                stats.rating > 0) && (
                <div className="public-profile__stats">
                  {stats.projects > 0 && (
                    <div className="public-profile__stat">
                      <div className="public-profile__stat-value">
                        {stats.projects}
                      </div>
                      <div className="public-profile__stat-label">פרויקטים</div>
                    </div>
                  )}
                  {stats.experience > 0 && (
                    <div className="public-profile__stat">
                      <div className="public-profile__stat-value">
                        {stats.experience}
                      </div>
                      <div className="public-profile__stat-label">
                        שנות ניסיון
                      </div>
                    </div>
                  )}
                  {stats.rating > 0 && (
                    <div className="public-profile__stat">
                      <div
                        className="public-profile__stat-value"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        {stats.rating}
                        <StarIcon style={{ fontSize: 20, color: "#fbbf24" }} />
                      </div>
                      <div className="public-profile__stat-label">דירוג</div>
                    </div>
                  )}
                </div>
              )}

              <div className="public-profile__badges">
                {isVerified && (
                  <div className="public-profile__badge public-profile__badge--verified">
                    <TaskAltIcon style={{ fontSize: 16 }} />
                    <span>קבלן מאומת</span>
                  </div>
                )}

                {isSub && (
                  <div
                    className={`public-profile__badge ${
                      openForWork
                        ? "public-profile__badge--open"
                        : "public-profile__badge--unavailable"
                    }`}
                  >
                    <span className="public-profile__badge-dot" />
                    <WorkOutlineIcon style={{ fontSize: 16 }} />
                    <span>
                      {openForWork ? "פתוח/ה לעבודה" : "לא זמין כרגע"}
                    </span>
                  </div>
                )}
              </div>

              {(email || phone) && (
                <div className="public-profile__quick-actions">
                  {phone && (
                    <a
                      href={`tel:${phone}`}
                      className="public-profile__quick-btn public-profile__quick-btn--primary"
                    >
                      <CallIcon style={{ fontSize: 18 }} />
                      <span>התקשר עכשיו</span>
                    </a>
                  )}
                  {email && (
                    <a
                      href={`mailto:${email}`}
                      className="public-profile__quick-btn public-profile__quick-btn--secondary"
                    >
                      <EmailIcon style={{ fontSize: 18 }} />
                      <span>שלח אימייל</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="public-profile__main">
          <div className="public-profile__grid">
            <div className="public-profile__content">
              {/* About Card */}
              <div className="public-profile__card">
                <div className="public-profile__card-header">
                  <h2 className="public-profile__card-title">
                    <span className="public-profile__card-title-icon">
                      <PersonIcon style={{ fontSize: 18 }} />
                    </span>
                    אודות
                  </h2>
                </div>
                <div className="public-profile__card-body">
                  {isBusiness && p.companyName && (
                    <div className="public-profile__info-row">
                      <div className="public-profile__info-icon">
                        <BusinessIcon />
                      </div>
                      <div className="public-profile__info-content">
                        <div className="public-profile__info-label">
                          שם חברה
                        </div>
                        <div className="public-profile__info-value">
                          {p.companyName}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="public-profile__info-row">
                    <div className="public-profile__info-icon">
                      <LocationOnIcon />
                    </div>
                    <div className="public-profile__info-content">
                      <div className="public-profile__info-label">כתובת</div>
                      <div className="public-profile__info-value">
                        {fullAddress || "—"}
                        {p.address?.googleMapsUrl && (
                          <>
                            {" "}
                            <a
                              href={p.address.googleMapsUrl}
                              target="_blank"
                              rel="noreferrer"
                            >
                              הצג במפה
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="public-profile__tags-section">
                    <div className="public-profile__tags-label">
                      מקצועות נוספים
                    </div>
                    {p.otherTrades?.length ? (
                      <div className="public-profile__tags">
                        {p.otherTrades.map((trade, i) => (
                          <span key={i} className="public-profile__tag">
                            {trade}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="public-profile__empty">—</span>
                    )}
                  </div>

                  {(isSub || (p.skills && p.skills.length > 0)) && (
                    <div className="public-profile__tags-section">
                      <div className="public-profile__tags-label">כישורים</div>
                      {p.skills?.length ? (
                        <div className="public-profile__tags">
                          {p.skills.map((skill, i) => (
                            <span key={i} className="public-profile__tag">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="public-profile__empty">—</span>
                      )}
                    </div>
                  )}

                  {(isSub || (p.services && p.services.length > 0)) && (
                    <div className="public-profile__tags-section">
                      <div className="public-profile__tags-label">שירותים</div>
                      {p.services?.length ? (
                        <div className="public-profile__tags">
                          {p.services.map((service, i) => (
                            <span key={i} className="public-profile__tag">
                              {service}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="public-profile__empty">—</span>
                      )}
                    </div>
                  )}

                  {(isSub || (p.jobTypes && p.jobTypes.length > 0)) && (
                    <div className="public-profile__tags-section">
                      <div className="public-profile__tags-label">
                        סוגי עבודות
                      </div>
                      {p.jobTypes?.length ? (
                        <div className="public-profile__tags">
                          {p.jobTypes.map((type, i) => (
                            <span key={i} className="public-profile__tag">
                              {type}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="public-profile__empty">—</span>
                      )}
                    </div>
                  )}

                  <div className="public-profile__tags-section">
                    <div className="public-profile__tags-label">
                      אזורי כיסוי
                    </div>
                    {p.coverageAreas?.length ? (
                      <div className="public-profile__tags">
                        {p.coverageAreas.map((area, i) => (
                          <span
                            key={i}
                            className="public-profile__tag public-profile__tag--primary"
                          >
                            {area}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="public-profile__empty">—</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="public-profile__card">
                <div className="public-profile__card-header">
                  <h2 className="public-profile__card-title">
                    <span className="public-profile__card-title-icon">
                      <FolderIcon style={{ fontSize: 18 }} />
                    </span>
                    תיק עבודות
                  </h2>
                </div>
                <div className="public-profile__card-body">
                  {portfolio.length ? (
                    <div className="public-profile__portfolio-grid">
                      {portfolio.map((item, idx) => {
                        const url =
                          typeof item === "string" ? item : item?.url || "";
                        const caption =
                          typeof item === "string" ? "" : item?.caption || "";
                        const description =
                          typeof item === "string"
                            ? ""
                            : item?.description || "";

                        return (
                          <div
                            key={idx}
                            className="public-profile__portfolio-item"
                          >
                            <div className="public-profile__portfolio-image-wrapper">
                              {url && isImg(url) ? (
                                <>
                                  <img
                                    src={url}
                                    alt={caption || `עבודה ${idx + 1}`}
                                    className="public-profile__portfolio-image"
                                  />
                                  <div className="public-profile__portfolio-overlay">
                                    <a
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="public-profile__portfolio-view-btn"
                                    >
                                      <OpenInNewIcon style={{ fontSize: 14 }} />
                                      צפייה
                                    </a>
                                  </div>
                                </>
                              ) : (
                                <div className="public-profile__portfolio-placeholder">
                                  <InsertDriveFileIcon
                                    style={{ fontSize: 40 }}
                                  />
                                </div>
                              )}
                            </div>
                            <div className="public-profile__portfolio-content">
                              <h3 className="public-profile__portfolio-title">
                                {caption || `עבודה ${idx + 1}`}
                              </h3>
                              {description && (
                                <p className="public-profile__portfolio-desc">
                                  {description}
                                </p>
                              )}
                              {url && !isImg(url) && (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="public-profile__portfolio-link"
                                >
                                  הצג קובץ
                                  <OpenInNewIcon style={{ fontSize: 14 }} />
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="public-profile__empty">
                      אין פריטים בתיק העבודות
                    </span>
                  )}
                </div>
              </div>

              <div className="public-profile__card">
                <div className="public-profile__card-header">
                  <h2 className="public-profile__card-title">
                    <span className="public-profile__card-title-icon">
                      <DescriptionIcon style={{ fontSize: 18 }} />
                    </span>
                    מסמכים
                  </h2>
                </div>
                <div className="public-profile__card-body">
                  {documents.length ? (
                    <div className="public-profile__doc-list">
                      {documents.map((doc, idx) => {
                        const url =
                          typeof doc === "string"
                            ? doc
                            : doc?.url || doc?.fileUrl;
                        const title =
                          typeof doc === "string"
                            ? `מסמך ${idx + 1}`
                            : doc?.title || `מסמך ${idx + 1}`;
                        return (
                          <div key={idx} className="public-profile__doc-item">
                            <div className="public-profile__doc-icon">
                              <InsertDriveFileIcon />
                            </div>
                            <span className="public-profile__doc-name">
                              {url ? (
                                <a href={url} target="_blank" rel="noreferrer">
                                  {title}
                                </a>
                              ) : (
                                title
                              )}
                            </span>
                            {url && (
                              <Tooltip title="הורד מסמך">
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="public-profile__doc-download"
                                >
                                  <DownloadIcon style={{ fontSize: 18 }} />
                                </a>
                              </Tooltip>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <span className="public-profile__empty">אין מסמכים</span>
                  )}
                </div>
              </div>
            </div>

            <div className="public-profile__sidebar">
              <div className="public-profile__card">
                <div className="public-profile__card-header">
                  <h2 className="public-profile__card-title">
                    <span className="public-profile__card-title-icon">
                      <ContactMailIcon style={{ fontSize: 18 }} />
                    </span>
                    פרטי קשר
                  </h2>
                </div>
                <div className="public-profile__card-body">
                  {email && (
                    <div className="public-profile__contact-item">
                      <div className="public-profile__contact-icon">
                        <EmailIcon />
                      </div>
                      <div className="public-profile__contact-info">
                        <div className="public-profile__contact-label">
                          אימייל
                        </div>
                        <a
                          href={`mailto:${email}`}
                          className="public-profile__contact-link"
                        >
                          {email}
                        </a>
                      </div>
                      <Tooltip title="העתק אימייל">
                        <button
                          className="public-profile__contact-action"
                          onClick={() => copyToClipboard(email, "אימייל")}
                        >
                          <ContentCopyIcon style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                    </div>
                  )}

                  {phone && (
                    <div className="public-profile__contact-item">
                      <div className="public-profile__contact-icon">
                        <PhoneIcon />
                      </div>
                      <div className="public-profile__contact-info">
                        <div className="public-profile__contact-label">
                          טלפון
                        </div>
                        <a
                          href={`tel:${phone}`}
                          className="public-profile__contact-link"
                        >
                          {phone}
                        </a>
                      </div>
                      <Tooltip title="העתק מספר טלפון">
                        <button
                          className="public-profile__contact-action"
                          onClick={() => copyToClipboard(phone, "מספר טלפון")}
                        >
                          <ContentCopyIcon style={{ fontSize: 16 }} />
                        </button>
                      </Tooltip>
                    </div>
                  )}

                  {p.contact?.website && (
                    <div className="public-profile__contact-item">
                      <div className="public-profile__contact-icon">
                        <LanguageIcon />
                      </div>
                      <div className="public-profile__contact-info">
                        <div className="public-profile__contact-label">
                          אתר אינטרנט
                        </div>
                        <a
                          href={p.contact.website}
                          target="_blank"
                          rel="noreferrer"
                          className="public-profile__contact-link"
                        >
                          {p.contact.website.replace(/^https?:\/\//, "")}
                        </a>
                      </div>
                    </div>
                  )}

                  <div className="public-profile__social-section">
                    <div className="public-profile__social-title">
                      רשתות חברתיות
                    </div>
                    {hasAnySocial ? (
                      <div className="public-profile__social-links">
                        {socials.instagram && (
                          <Tooltip title="Instagram">
                            <a
                              href={socials.instagram}
                              target="_blank"
                              rel="noreferrer"
                              className="public-profile__social-btn public-profile__social-btn--instagram"
                            >
                              <InstagramIcon style={{ fontSize: 22 }} />
                            </a>
                          </Tooltip>
                        )}
                        {socials.linkedin && (
                          <Tooltip title="LinkedIn">
                            <a
                              href={socials.linkedin}
                              target="_blank"
                              rel="noreferrer"
                              className="public-profile__social-btn public-profile__social-btn--linkedin"
                            >
                              <LinkedInIcon style={{ fontSize: 22 }} />
                            </a>
                          </Tooltip>
                        )}
                        {socials.facebook && (
                          <Tooltip title="Facebook">
                            <a
                              href={socials.facebook}
                              target="_blank"
                              rel="noreferrer"
                              className="public-profile__social-btn public-profile__social-btn--facebook"
                            >
                              <FacebookIcon style={{ fontSize: 22 }} />
                            </a>
                          </Tooltip>
                        )}
                        {socials.tiktok && (
                          <Tooltip title="TikTok">
                            <a
                              href={socials.tiktok}
                              target="_blank"
                              rel="noreferrer"
                              className="public-profile__social-btn public-profile__social-btn--tiktok"
                            >
                              <span style={{ fontWeight: 800, fontSize: 16 }}>
                                T
                              </span>
                            </a>
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      <span className="public-profile__empty">
                        אין פרופילי רשתות
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="public-profile__card">
                <div className="public-profile__card-header">
                  <h2 className="public-profile__card-title">
                    <span className="public-profile__card-title-icon">
                      <VerifiedUserIcon style={{ fontSize: 18 }} />
                    </span>
                    {isSub ? "רישיון / הסמכה" : "רישיון קבלן"}
                  </h2>
                </div>
                <div className="public-profile__card-body">
                  {isSub ? (
                    p.subLicense?.fileUrl ? (
                      <>
                        <a
                          href={p.subLicense.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="public-profile__license-file"
                        >
                          <InsertDriveFileIcon style={{ color: "#60a5fa" }} />
                          <span>{p.subLicense.fileTitle || "תעודת הסמכה"}</span>
                        </a>
                        {p.subLicense.authorityUrl && (
                          <a
                            href={p.subLicense.authorityUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="public-profile__license-file"
                            style={{ marginTop: 12 }}
                          >
                            <LanguageIcon style={{ color: "#60a5fa" }} />
                            <span>רשות מוסמכת</span>
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="public-profile__empty">אין תעודות</span>
                    )
                  ) : p.contractorLicense ? (
                    <div className="public-profile__license-info">
                      <div className="public-profile__license-row">
                        <span className="public-profile__license-label">
                          מספר רישיון
                        </span>
                        <span className="public-profile__license-value">
                          {p.contractorLicense.licenseNumber || "—"}
                        </span>
                      </div>
                      <div className="public-profile__license-row">
                        <span className="public-profile__license-label">
                          תאריך רישום
                        </span>
                        <span className="public-profile__license-value">
                          {p.contractorLicense.registrationDate
                            ? String(
                                p.contractorLicense.registrationDate
                              ).slice(0, 10)
                            : "—"}
                        </span>
                      </div>
                      <div className="public-profile__license-row">
                        <span className="public-profile__license-label">
                          סטטוס
                        </span>
                        <span className="public-profile__license-status public-profile__license-status--active">
                          <CheckCircle style={{ fontSize: 14 }} />
                          {p.contractorLicense.status || "—"}
                        </span>
                      </div>
                      {p.contractorLicense.fileUrl && (
                        <a
                          href={p.contractorLicense.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="public-profile__license-file"
                        >
                          <InsertDriveFileIcon style={{ color: "#60a5fa" }} />
                          <span>
                            {p.contractorLicense.fileTitle || "מסמך רישוי"}
                          </span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <span className="public-profile__empty">אין רישיון</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div
        className={`public-profile__toast ${
          toast.visible ? "public-profile__toast--visible" : ""
        }`}
      >
        <CheckCircle style={{ fontSize: 18 }} />
        {toast.message}
      </div>

      <button
        className={`public-profile__scroll-top ${
          showScrollTop ? "public-profile__scroll-top--visible" : ""
        }`}
        onClick={scrollToTop}
        aria-label="Scroll to top"
      >
        <KeyboardArrowUpIcon style={{ fontSize: 24 }} />
      </button>
    </div>
  );
}
