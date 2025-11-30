import React from "react";
import SectionShell from "./SectionShell.jsx";
import {
  CameraAlt,
  Delete,
  CloudUpload,
  InsertDriveFile,
  Edit,
  Save,
} from "@mui/icons-material";
import { Fade } from "@mui/material";
import { useToast } from "../../../hooks/useToast.jsx";
import { uploadSubLicense as uploadPortfolioFile } from "../../../api/uploads";

export default function PortfolioSection({ form, updateField, onSave }) {
  const toast = useToast();
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const fileRef = React.useRef(null);
  const [editing, setEditing] = React.useState(false);

  const handleSave = () => {
    onSave?.(form);
    setEditing(false);
  };

  const handleFilesSelected = async (fileList) => {
    if (!fileList || !fileList.length) return;
    setErr("");
    setUploading(true);
    try {
      const files = Array.from(fileList);
      const added = [];
      for (const file of files) {
        const { url } = await uploadPortfolioFile(file);
        if (!url) continue;
        added.push({
          url,
          caption: file.name.replace(/\.[^.]+$/, ""),
          description: "",
        });
      }
      if (added.length) {
        const nextPortfolio = [...(form.portfolio || []), ...added];
        const nextForm = { ...form, portfolio: nextPortfolio };
        updateField("portfolio", nextPortfolio);

        try {
          await onSave?.(nextForm);
        } catch {}

        toast.success("הקבצים נוספו לתיק העבודות ✔");
      }
    } catch (e) {
      setErr(
        e?.response?.data?.error ||
          e?.message ||
          "העלאת הקבצים לתיק העבודות נכשלה"
      );
      toast.error("העלאת הקבצים לתיק העבודות נכשלה");
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e) => {
    if (!editing) return;
    handleFilesSelected(e.target.files);
  };

  const removeItem = async (i) => {
    const nextPortfolio = (form.portfolio || []).filter((_, idx) => idx !== i);
    const nextForm = { ...form, portfolio: nextPortfolio };
    updateField("portfolio", nextPortfolio);

    try {
      await onSave?.(nextForm);
    } catch {}

    toast.success("הפריט נמחק מתיק העבודות");
  };

  const updateItem = (i, field, value) => {
    const nextPortfolio = [...(form.portfolio || [])];
    nextPortfolio[i] = { ...(nextPortfolio[i] || {}), [field]: value };
    updateField("portfolio", nextPortfolio);
  };

  const actions = (
    <div
      className="section-actions"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
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

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={() => editing && fileRef.current?.click()}
        title="העלה קבצים לתיק העבודות"
        disabled={!editing || uploading}
      >
        <CloudUpload style={{ fontSize: 16, marginLeft: 4 }} /> העלאת קבצים
      </button>
    </div>
  );

  return (
    <SectionShell icon={CameraAlt} title="תיק עבודות" actions={actions}>
      <input
        ref={fileRef}
        type="file"
        multiple
        accept=".pdf,image/*"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
      {uploading && (
        <p style={{ marginBottom: 8, color: "#374151" }}>מעלה קבצים…</p>
      )}
      {!!err && <p style={{ marginBottom: 8, color: "#d32f2f" }}>{err}</p>}

      <div className="portfolio-grid">
        {Array.isArray(form.portfolio) && form.portfolio.length ? (
          form.portfolio.map((item, index) => (
            <div key={index} className="portfolio-item">
              <div className="portfolio-image">
                {item.url ? (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="פתח קובץ"
                  >
                    <img
                      src={item.url}
                      alt={item.caption || "Portfolio item"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </a>
                ) : (
                  <CameraAlt style={{ fontSize: 40 }} />
                )}
              </div>
              <div className="portfolio-caption">
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <InsertDriveFile style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    פריט #{index + 1}
                  </span>
                </div>

                {/* כותרת */}
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <label className="form-label">כותרת</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="כותרת העבודה"
                    value={item.caption || ""}
                    onChange={(e) =>
                      updateItem(index, "caption", e.target.value)
                    }
                    disabled={!editing}
                  />
                </div>

                {/* תיאור */}
                <div className="form-row" style={{ marginBottom: 8 }}>
                  <label className="form-label">תיאור</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="תיאור קצר של העבודה (אופציונלי)"
                    value={item.description || ""}
                    onChange={(e) =>
                      updateItem(index, "description", e.target.value)
                    }
                    disabled={!editing}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => editing && removeItem(index)}
                  disabled={!editing}
                >
                  <Delete style={{ fontSize: 16 }} /> מחק
                </button>
              </div>
            </div>
          ))
        ) : (
          <p style={{ color: "#6b7280", gridColumn: "1 / -1" }}>
            לא הוספו עבודות עדיין. אפשר להעלות קבצים מתיקיית המחשב שלך.
          </p>
        )}
      </div>
    </SectionShell>
  );
}
