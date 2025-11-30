import React from "react";
import WorkOutlineIcon from "@mui/icons-material/WorkOutline";
import "../styles/Profile.css";
import AvatarUpload from "../avatar/AvatarUpload";
import SubcontractorProfileForm from "./forms/SubcontractorProfileForm";
import { useProfileForm } from "./useProfileForm";
import { toggleOpenForWork } from "../../api/contractorProfile";
import { useToast } from "../../hooks/useToast";
import AccountEmailSection from "./sections/AccountEmailSection.jsx";

const subOpenForWorkMissing = (p) => {
  if (!p) return ["פרופיל חסר"];
  const missing = [];
  if (!p.primaryTrade?.trim()) missing.push("מקצוע ראשי");
  if (!p.profilePhotoUrl?.trim()) missing.push("תמונת פרופיל");
  if (!Array.isArray(p.skills) || p.skills.length === 0)
    missing.push("כישורים");
  if (!Array.isArray(p.coverageAreas) || p.coverageAreas.length === 0)
    missing.push("אזורי כיסוי");
  if (!p.subLicense?.fileUrl?.trim()) missing.push("רישיון/הסמכה");
  return missing;
};

export default function SubcontractorProfile() {
  const toast = useToast();
  const {
    isBusiness,
    form,
    setForm,
    loading,
    isPrimaryTradeValid,
    primaryTradeError,
    primaryTradeTouched,
    setPrimaryTradeTouched,
    completion,
    displayName,
    saveMut,
    updateField,
    handleAvatarUploaded,
    handleAvatarRemove,
  } = useProfileForm();

  const [togglingOpen, setTogglingOpen] = React.useState(false);

  if (loading || !form) {
    return (
      <div className="container container--padding profile-page">
        <div className="skeleton-header" />
        <div className="skeleton-body" />
      </div>
    );
  }

  const onSubmit = (e) => {
    e.preventDefault();
    saveMut.mutate(form);
  };

  const onToggleOpenForWork = async () => {
    const wantOpen = !form.openForWork;
    if (wantOpen) {
      const missing = subOpenForWorkMissing(form);
      if (missing.length) {
        toast.error(`חסר/ים: ${missing.join(", ")}`);
        return;
      }
    }
    try {
      setTogglingOpen(true);
      const res = await toggleOpenForWork(wantOpen);
      setForm((prev) => ({
        ...(prev || {}),
        openForWork: !!res.openForWork,
        openForWorkSince: res.openForWorkSince || null,
      }));
      toast.success(
        res.openForWork
          ? "את/ה עכשיו 'פתוח/ה לעבודה' 🎉"
          : "כיבית את 'פתוח/ה לעבודה'."
      );
    } catch (e) {
      const missing = e?.response?.data?.missing;
      if (Array.isArray(missing) && missing.length) {
        toast.error(`הפרופיל לא מוכן: ${missing.join(", ")}`);
      } else {
        toast.error("שגיאה בעדכון מצב 'פתוח/ה לעבודה'.");
      }
    } finally {
      setTogglingOpen(false);
    }
  };

  return (
    <div className="container container--padding profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="header-content">
          <div className="profile-avatar-wrapper">
            <AvatarUpload
              value={form.profilePhotoUrl}
              name={displayName}
              size={120}
              onChange={handleAvatarUploaded}
              onRemove={handleAvatarRemove}
            />
          </div>

          <div className="profile-info">
            <h1 className="profile-name">{displayName}</h1>
            {isBusiness && (
              <p className="profile-company">{form.companyName || "—"}</p>
            )}
            <span className="profile-trade">{form.primaryTrade || "—"}</span>

            <div
              className="completion"
              style={{ marginTop: 12, width: "100%", maxWidth: 420 }}
            >
              <div
                className="completion-track"
                style={{
                  width: "100%",
                  height: 10,
                  background: "#e5e7eb",
                  borderRadius: 999,
                  overflow: "hidden",
                }}
              >
                <div
                  className="completion-fill"
                  style={{
                    width: `${completion}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: completion === 100 ? "#16a34a" : "#3b82f6",
                    transition: "width 200ms ease, background-color 200ms ease",
                  }}
                />
              </div>
              <div
                className="completion-label"
                style={{ marginTop: 6, fontSize: 12, color: "#374151" }}
              >
                השלמת פרופיל: {completion}%
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                onClick={onToggleOpenForWork}
                disabled={togglingOpen}
                className="btn btn-outline btn-sm"
                title={
                  form.openForWork ? "כבה פתוח/ה לעבודה" : "הפעל פתוח/ה לעבודה"
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  borderColor: form.openForWork ? "#16a34a" : "#9ca3af",
                  color: form.openForWork ? "#16a34a" : "#374151",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "999px",
                    background: form.openForWork ? "#16a34a" : "#9ca3af",
                    boxShadow: form.openForWork
                      ? "0 0 0 3px rgba(22,163,74,0.25)"
                      : "none",
                  }}
                />
                <WorkOutlineIcon style={{ fontSize: 16 }} />
                {form.openForWork ? "פתוח/ה לעבודה" : "הפעל פתוח/ה לעבודה"}
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="profile-content">
        <AccountEmailSection />

        <form onSubmit={onSubmit}>
          <SubcontractorProfileForm
            form={form}
            updateField={updateField}
            isPrimaryTradeValid={isPrimaryTradeValid}
            primaryTradeError={primaryTradeError}
            primaryTradeTouched={primaryTradeTouched}
            setPrimaryTradeTouched={setPrimaryTradeTouched}
            saving={saveMut.isLoading}
            isBusiness={isBusiness}
            onSave={(p) => saveMut.mutateAsync(p)}
          />
        </form>
      </main>
    </div>
  );
}
