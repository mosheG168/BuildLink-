import React from "react";
import { CheckCircle } from "@mui/icons-material";
import "../styles/Profile.css";
import AvatarUpload from "../avatar/AvatarUpload";
import ContractorProfileForm from "./forms/ContractorProfileForm";
import { useProfileForm } from "./useProfileForm";
import AccountEmailSection from "./sections/AccountEmailSection.jsx";

export default function ContractorProfile() {
  const {
    isBusiness,
    form,
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

  const handleSectionSave = (nextForm) => {
    const payload = nextForm || form;
    saveMut.mutate(payload);
  };

  const isLicenseVerified = !!form.contractorLicense?.verified;

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

            <div className="profile-stats">
              <div className="stat">
                <span className="stat-value">
                  {isLicenseVerified ? <CheckCircle /> : "—"}
                </span>
                <span className="stat-label">מאומת</span>
              </div>
            </div>
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
          </div>
        </div>
      </header>
      <main className="profile-content">
        <AccountEmailSection />

        <form onSubmit={onSubmit}>
          <ContractorProfileForm
            form={form}
            updateField={updateField}
            isPrimaryTradeValid={isPrimaryTradeValid}
            primaryTradeError={primaryTradeError}
            primaryTradeTouched={primaryTradeTouched}
            setPrimaryTradeTouched={setPrimaryTradeTouched}
            saving={saveMut.isLoading}
            isBusiness={isBusiness}
            onSave={handleSectionSave}
          />
        </form>
      </main>
    </div>
  );
}
