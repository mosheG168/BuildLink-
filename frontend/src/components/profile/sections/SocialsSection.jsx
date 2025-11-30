import React from "react";
import SectionShell from "./SectionShell.jsx";
import {
  Instagram,
  Facebook,
  LinkedIn,
  VideoLibrary,
  Edit,
  Save,
} from "@mui/icons-material";
import { Fade } from "@mui/material";

export default function SocialsSection({ form, updateField, onSave }) {
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
    <SectionShell icon={Instagram} title="רשתות חברתיות" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        <div className="form-row">
          <label className="form-label">
            <Instagram style={{ fontSize: 18, marginLeft: 5 }} /> Instagram
          </label>
          <input
            className="form-input"
            type="url"
            placeholder="https://instagram.com/..."
            value={form.contact?.socials?.instagram || ""}
            onChange={(e) =>
              updateField("contact.socials.instagram", e.target.value)
            }
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <Facebook style={{ fontSize: 18, marginLeft: 5 }} /> Facebook
          </label>
          <input
            className="form-input"
            type="url"
            placeholder="https://facebook.com/..."
            value={form.contact?.socials?.facebook || ""}
            onChange={(e) =>
              updateField("contact.socials.facebook", e.target.value)
            }
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <LinkedIn style={{ fontSize: 18, marginLeft: 5 }} /> LinkedIn
          </label>
          <input
            className="form-input"
            type="url"
            placeholder="https://linkedin.com/in/..."
            value={form.contact?.socials?.linkedin || ""}
            onChange={(e) =>
              updateField("contact.socials.linkedin", e.target.value)
            }
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">
            <VideoLibrary style={{ fontSize: 18, marginLeft: 5 }} /> TikTok
          </label>
          <input
            className="form-input"
            type="url"
            placeholder="https://tiktok.com/@..."
            value={form.contact?.socials?.tiktok || ""}
            onChange={(e) =>
              updateField("contact.socials.tiktok", e.target.value)
            }
            disabled={!editing}
          />
        </div>
      </div>
    </SectionShell>
  );
}
