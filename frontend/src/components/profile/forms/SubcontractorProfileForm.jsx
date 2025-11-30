import React from "react";
import {
  BasicDetailsSection,
  SkillsServicesSection,
  CoverageAreasSection,
  AddressSection,
  SubLicenseSection,
  PortfolioSection,
  ContactSection,
  SocialsSection,
} from "../sections";

export default function SubcontractorProfileForm({
  form,
  updateField,
  isPrimaryTradeValid,
  primaryTradeError,
  primaryTradeTouched,
  setPrimaryTradeTouched,
  saving = false,
  isBusiness = false,
  onSave,
}) {
  return (
    <div className="content-grid">
      <div className="main-column">
        <BasicDetailsSection
          form={form}
          updateField={updateField}
          isBusiness={isBusiness}
          isPrimaryTradeValid={isPrimaryTradeValid}
          primaryTradeError={primaryTradeError}
          primaryTradeTouched={primaryTradeTouched}
          setPrimaryTradeTouched={setPrimaryTradeTouched}
          idPrefix="sub"
          onSave={onSave}
        />

        <SkillsServicesSection
          form={form}
          updateField={updateField}
          onSave={onSave}
        />
        <CoverageAreasSection
          form={form}
          updateField={updateField}
          onSave={onSave}
        />
        <AddressSection form={form} updateField={updateField} onSave={onSave} />
        <SubLicenseSection
          form={form}
          updateField={updateField}
          isPrimaryTradeValid={isPrimaryTradeValid}
          setPrimaryTradeTouched={setPrimaryTradeTouched}
          onSave={onSave}
          saving={saving}
        />
        <PortfolioSection
          form={form}
          updateField={updateField}
          onSave={onSave}
        />
      </div>

      <aside className="sidebar">
        <ContactSection form={form} updateField={updateField} onSave={onSave} />
        <SocialsSection form={form} updateField={updateField} onSave={onSave} />
      </aside>
    </div>
  );
}
