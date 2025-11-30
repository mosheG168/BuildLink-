import React from "react";
import SectionShell from "./SectionShell.jsx";
import { Home, Edit, Save } from "@mui/icons-material";
import { Fade } from "@mui/material";

export default function AddressSection({ form, updateField, onSave }) {
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
    <SectionShell icon={Home} title="כתובת" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        <div className="form-row">
          <label className="form-label">רחוב</label>
          <input
            className="form-input"
            type="text"
            value={form.address?.street || ""}
            onChange={(e) => updateField("address.street", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">מספר בית</label>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            pattern="^\d{1,4}$"
            placeholder="1–4 ספרות"
            value={form.address?.houseNumber || ""}
            onChange={(e) => updateField("address.houseNumber", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">עיר</label>
          <input
            className="form-input"
            type="text"
            value={form.address?.city || ""}
            onChange={(e) => updateField("address.city", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">מיקוד</label>
          <input
            className="form-input"
            type="text"
            inputMode="numeric"
            pattern="^\d{5,7}$"
            placeholder="5–7 ספרות"
            value={form.address?.zip || ""}
            onChange={(e) => updateField("address.zip", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">מדינה</label>
          <input
            className="form-input"
            type="text"
            value={form.address?.country || "IL"}
            onChange={(e) => updateField("address.country", e.target.value)}
            disabled={!editing}
          />
        </div>

        <div className="form-row">
          <label className="form-label">Google Maps (URL)</label>
          <input
            className="form-input"
            type="url"
            placeholder="https://maps.google.com/..."
            value={form.address?.googleMapsUrl || ""}
            onChange={(e) =>
              updateField("address.googleMapsUrl", e.target.value)
            }
            disabled={!editing}
          />
        </div>
      </div>
    </SectionShell>
  );
}
