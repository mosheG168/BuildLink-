import React from "react";
import SectionShell from "./SectionShell.jsx";
import { Build, Edit, Save } from "@mui/icons-material";
import { Fade } from "@mui/material";
import {
  SKILL_OPTIONS,
  SERVICE_OPTIONS,
  JOBTYPE_OPTIONS,
} from "../../constants/profileOptions";

function useDraft() {
  const [v, setV] = React.useState("");
  const clear = () => setV("");
  return { v, setV, clear };
}
const filterOpts = (opts, used, q) =>
  (opts || [])
    .filter((o) => o.toLowerCase().includes(String(q || "").toLowerCase()))
    .filter((o) => !(used || []).includes(o))
    .slice(0, 6);

const Chips = ({ items, colorClass, onRemove, disabled }) =>
  items?.length ? (
    <div className="tags" style={{ marginBottom: 8 }}>
      {items.map((s, i) => (
        <span
          key={i}
          className={`tag ${colorClass}`}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {s}
          <button
            type="button"
            aria-label="remove"
            onClick={() => onRemove(i)}
            disabled={disabled}
            style={{
              border: "none",
              background: "transparent",
              cursor: disabled ? "default" : "pointer",
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  ) : null;

export default function SkillsServicesSection({ form, updateField, onSave }) {
  const skills = useDraft(),
    services = useDraft(),
    jobs = useDraft();
  const [editing, setEditing] = React.useState(false);

  const addTag = (field, value) => {
    const v = String(value || "").trim();
    if (!v) return;
    const next = Array.from(new Set([...(form[field] || []), v]));
    updateField(field, next);
  };
  const removeTag = (field, index) => {
    const next = [...(form[field] || [])];
    next.splice(index, 1);
    updateField(field, next);
  };

  const handleKeyDown = (e, field, draftState) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const parts = String(draftState.v || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      parts.forEach((p) => addTag(field, p));
      draftState.clear();
    }
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
    <SectionShell icon={Build} title="כישורים ושירותים" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        {/* Skills */}
        <div className="form-row">
          <label className="form-label">כישורים</label>
          <Chips
            items={form.skills}
            colorClass="tag-blue"
            onRemove={(i) => removeTag("skills", i)}
            disabled={!editing}
          />
          <input
            className="form-input"
            type="text"
            placeholder="הקלד/י להוספת כישור (Enter או פסיק)"
            value={skills.v}
            onChange={(e) => skills.setV(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "skills", skills)}
            disabled={!editing}
          />
          {editing && skills.v && (
            <div
              className="suggestions"
              style={{
                marginTop: 6,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {filterOpts(SKILL_OPTIONS, form.skills, skills.v).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="tag tag-gray"
                  onClick={() => {
                    addTag("skills", opt);
                    skills.clear();
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Services */}
        <div className="form-row">
          <label className="form-label">שירותים</label>
          <Chips
            items={form.services}
            colorClass="tag-orange"
            onRemove={(i) => removeTag("services", i)}
            disabled={!editing}
          />
          <input
            className="form-input"
            type="text"
            placeholder="הקלד/י להוספת שירות (Enter או פסיק)"
            value={services.v}
            onChange={(e) => services.setV(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "services", services)}
            disabled={!editing}
          />
          {editing && services.v && (
            <div
              className="suggestions"
              style={{
                marginTop: 6,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {filterOpts(SERVICE_OPTIONS, form.services, services.v).map(
                (opt) => (
                  <button
                    key={opt}
                    type="button"
                    className="tag tag-gray"
                    onClick={() => {
                      addTag("services", opt);
                      services.clear();
                    }}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
          )}
        </div>

        {/* Job types */}
        <div className="form-row">
          <label className="form-label">סוגי עבודה</label>
          <Chips
            items={form.jobTypes}
            colorClass="tag-purple"
            onRemove={(i) => removeTag("jobTypes", i)}
            disabled={!editing}
          />
          <input
            className="form-input"
            type="text"
            placeholder="הקלד/י להוספת סוג עבודה (Enter או פסיק)"
            value={jobs.v}
            onChange={(e) => jobs.setV(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, "jobTypes", jobs)}
            disabled={!editing}
          />
          {editing && jobs.v && (
            <div
              className="suggestions"
              style={{
                marginTop: 6,
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {filterOpts(JOBTYPE_OPTIONS, form.jobTypes, jobs.v).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className="tag tag-gray"
                  onClick={() => {
                    addTag("jobTypes", opt);
                    jobs.clear();
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionShell>
  );
}
