import React from "react";
import SectionShell from "./SectionShell.jsx";
import { Person, Edit, Save } from "@mui/icons-material";
import { Fade } from "@mui/material";
import { useToast } from "../../../hooks/useToast.jsx";

export default function BasicDetailsSection({
  form,
  updateField,
  isBusiness = false,
  isPrimaryTradeValid,
  primaryTradeError,
  primaryTradeTouched,
  setPrimaryTradeTouched,
  idPrefix = "profile",
  onSave,
}) {
  const toast = useToast();
  const [editing, setEditing] = React.useState(false);
  const [otherDraft, setOtherDraft] = React.useState("");

  const handleSave = () => {
    if (!isPrimaryTradeValid) {
      setPrimaryTradeTouched?.(true);
      return;
    }
    onSave?.(form);
    setEditing(false);
  };

  const otherTrades = Array.isArray(form.otherTrades) ? form.otherTrades : [];

  const addOtherTrade = () => {
    const value = String(otherDraft || "").trim();
    if (!value) return;
    if (otherTrades.includes(value)) {
      setOtherDraft("");
      return;
    }
    const next = [...otherTrades, value];
    updateField("otherTrades", next);
    setOtherDraft("");
  };

  const removeOtherTrade = (index) => {
    const next = otherTrades.filter((_, i) => i !== index);
    const nextForm = { ...form, otherTrades: next };

    updateField("otherTrades", next);

    try {
      onSave?.(nextForm);
    } catch {}

    toast.success("מקצוע נוסף הוסר");
  };

  const actions = (
    <div
      className="section-actions"
      style={{
        position: "relative",
        width: 40,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Fade in={!editing} timeout={200} unmountOnExit>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setEditing(true)}
          title="ערוך"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Edit fontSize="small" />
        </button>
      </Fade>

      <Fade in={editing} timeout={200} unmountOnExit>
        <button
          type="button"
          className="icon-btn"
          onClick={handleSave}
          title="שמור שינויים"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Save fontSize="small" />
        </button>
      </Fade>
    </div>
  );

  return (
    <SectionShell icon={Person} title="פרטים בסיסיים" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        <div className="form-row">
          <label className="form-label">שם לתצוגה</label>
          <input
            className="form-input"
            type="text"
            value={form.displayName || ""}
            onChange={(e) => updateField("displayName", e.target.value)}
            disabled={!editing}
          />
        </div>

        {isBusiness && (
          <div className="form-row">
            <label className="form-label">שם חברה</label>
            <input
              className="form-input"
              type="text"
              value={form.companyName || ""}
              onChange={(e) => updateField("companyName", e.target.value)}
              disabled={!editing}
            />
          </div>
        )}

        <div className="form-row">
          <label className="form-label" htmlFor={`${idPrefix}-primaryTrade`}>
            מקצוע ראשי
          </label>
          <input
            id={`${idPrefix}-primaryTrade`}
            className="form-input"
            type="text"
            value={form.primaryTrade || ""}
            onChange={(e) => updateField("primaryTrade", e.target.value)}
            onBlur={() => setPrimaryTradeTouched(true)}
            required
            minLength={2}
            maxLength={60}
            aria-invalid={!isPrimaryTradeValid}
            aria-describedby={`${idPrefix}-primaryTrade-error`}
            disabled={!editing}
          />
          {primaryTradeTouched && !!primaryTradeError && (
            <div
              id={`${idPrefix}-primaryTrade-error`}
              style={{ color: "#d32f2f", fontSize: "0.875rem", marginTop: 4 }}
              role="alert"
            >
              {primaryTradeError}
            </div>
          )}
        </div>

        <div className="form-row">
          <label className="form-label">מקצועות נוספים</label>

          {otherTrades.length > 0 && (
            <div className="tags" style={{ marginBottom: 8 }}>
              {otherTrades.map((s, i) => (
                <span
                  key={i}
                  className="tag tag-gray"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {s}
                  {editing && (
                    <button
                      type="button"
                      aria-label="remove"
                      onClick={() => removeOtherTrade(i)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                      }}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="form-input"
              type="text"
              placeholder="הקלד/י מקצוע נוסף ולחץ/י 'הוסף'"
              value={otherDraft}
              onChange={(e) => setOtherDraft(e.target.value)}
              disabled={!editing}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addOtherTrade}
              disabled={!editing}
            >
              הוסף
            </button>
          </div>
        </div>
      </div>
    </SectionShell>
  );
}
