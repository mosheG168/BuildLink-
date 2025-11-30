import React from "react";
import {
  BasicDetailsSection,
  CoverageAreasSection,
  AddressSection,
  ContractorLicenseSection,
  PortfolioSection,
  ContactSection,
  SocialsSection,
} from "../sections";

export default function ContractorProfileForm({
  form,
  updateField,
  isPrimaryTradeValid,
  primaryTradeError,
  primaryTradeTouched,
  setPrimaryTradeTouched,
  saving,
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
          idPrefix="con"
          onSave={onSave}
        />

        <CoverageAreasSection
          form={form}
          updateField={updateField}
          onSave={onSave}
        />
        <AddressSection form={form} updateField={updateField} onSave={onSave} />
        <ContractorLicenseSection form={form} updateField={updateField} />
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
