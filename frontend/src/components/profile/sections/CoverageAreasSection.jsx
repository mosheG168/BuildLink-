import React from "react";
import SectionShell from "./SectionShell.jsx";
import { LocationOn, Edit, Save } from "@mui/icons-material";
import { Fade } from "@mui/material";
import { AREAS_IL } from "../../constants/profileOptions";

const isIL = (country) => /il|israel|ישראל/i.test(String(country || ""));

export default function CoverageAreasSection({ form, updateField, onSave }) {
  const [draft, setDraft] = React.useState("");
  const [editing, setEditing] = React.useState(false);

  const coverageAreas = Array.isArray(form.coverageAreas)
    ? form.coverageAreas
    : [];

  const addCoverage = (raw) => {
    if (!raw) return;
    const parts = Array.isArray(raw) ? raw : String(raw).split(",");
    const cleaned = parts.map((s) => String(s || "").trim()).filter(Boolean);
    if (!cleaned.length) return;
    const set = new Set([...coverageAreas, ...cleaned]);
    updateField("coverageAreas", Array.from(set));
  };

  const handleCoverageSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions || []).map(
      (o) => o.value
    );
    addCoverage(selected);
  };

  const addCoverageFromDraft = () => {
    addCoverage(draft);
    setDraft("");
  };

  const removeCoverage = (index) => {
    const next = [...coverageAreas];
    next.splice(index, 1);
    updateField("coverageAreas", next);
  };

  const handleSave = () => {
    onSave?.(form);
    setEditing(false);
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
    <SectionShell icon={LocationOn} title="אזורי כיסוי" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        <div className="form-row" style={{ gridColumn: "1 / -1" }}>
          {isIL(form.address?.country) && (
            <select
              className="form-input"
              multiple
              size={8}
              onChange={handleCoverageSelect}
              style={{ marginBottom: 8 }}
              aria-label="בחר/י אזורים כלליים בישראל (ניתן לבחור כמה)"
              disabled={!editing}
            >
              {AREAS_IL.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          )}

          {coverageAreas.length > 0 && (
            <div className="tags" style={{ marginBottom: 8 }}>
              {coverageAreas.map((s, i) => (
                <span
                  key={i}
                  className="tag tag-green"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {s}
                  <button
                    type="button"
                    aria-label="remove"
                    onClick={() => removeCoverage(i)}
                    disabled={!editing}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: editing ? "pointer" : "default",
                    }}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="form-input"
              type="text"
              placeholder="הוספת אזור (Enter או פסיק)"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addCoverageFromDraft();
                }
              }}
              disabled={!editing}
            />
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={addCoverageFromDraft}
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
