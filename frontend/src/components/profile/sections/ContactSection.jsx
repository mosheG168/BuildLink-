import React from "react";
import SectionShell from "./SectionShell.jsx";
import { Phone, Email, Language, Edit, Save } from "@mui/icons-material";
import { Fade } from "@mui/material";

export default function ContactSection({ form, updateField, onSave }) {
  const [editing, setEditing] = React.useState(false);

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
    <SectionShell icon={Phone} title="פרטי התקשרות" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        <div className="form-row">
          <label className="form-label">
            <Phone style={{ fontSize: 18, marginLeft: 5 }} /> טלפון
          </label>
          <input
            className="form-input"
            type="tel"
            value={form.contact?.phone || ""}
            onChange={(e) => updateField("contact.phone", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Email style={{ fontSize: 18, marginLeft: 5 }} /> אימייל ליצירת קשר
          </label>
          <input
            className="form-input"
            type="email"
            value={form.contact?.email || ""}
            onChange={(e) => updateField("contact.email", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Language style={{ fontSize: 18, marginLeft: 5 }} /> אתר
          </label>
          <input
            className="form-input"
            type="url"
            placeholder="https://..."
            value={form.contact?.website || ""}
            onChange={(e) => updateField("contact.website", e.target.value)}
            disabled={!editing}
          />
        </div>
      </div>
    </SectionShell>
  );
}
