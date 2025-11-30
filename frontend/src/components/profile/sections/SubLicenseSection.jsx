import React from "react";
import SectionShell from "./SectionShell.jsx";
import { InsertDriveFile, CloudUpload, Close } from "@mui/icons-material";
import { uploadSubLicense, deleteSubLicense } from "../../../api/uploads";
import { useToast } from "../../../hooks/useToast.jsx";

export default function SubLicenseSection({
  form,
  updateField,
  isPrimaryTradeValid,
  setPrimaryTradeTouched,
  onSave,
  saving = false,
}) {
  const toast = useToast();
  const sl = form?.subLicense ?? {
    fileUrl: "",
    fileTitle: "",
    authorityUrl: "",
  };
  const [uploading, setUploading] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [titleDraft, setTitleDraft] = React.useState(sl.fileTitle || "");
  const [locked, setLocked] = React.useState(!!sl.fileTitle);
  const fileRef = React.useRef(null);

  React.useEffect(() => {
    if (!form?.subLicense)
      updateField("subLicense", {
        fileUrl: "",
        fileTitle: "",
        authorityUrl: "",
      });
    setTitleDraft(form?.subLicense?.fileTitle || "");
    setLocked(!!form?.subLicense?.fileTitle);
  }, [form?.subLicense?.fileTitle]);

  const handleSelected = async (file) => {
    if (!file) return;
    setErr("");
    setUploading(true);
    try {
      const { url } = await uploadSubLicense(file);
      if (!url) throw new Error("Upload succeeded but no URL returned");
      updateField("subLicense.fileUrl", url);
      updateField("subLicense.fileTitle", "");
      setTitleDraft("");
      setLocked(false);
      if (!isPrimaryTradeValid)
        toast.success("הקובץ הועלה. השלם/י 'מקצוע ראשי' ואז שמור/י.");
      else toast.success("הקובץ הועלה. הוסף/י כותרת ולחץ/י שמור ✔");
    } catch (e) {
      setErr(e?.response?.data?.error || e?.message || "העלאת הקובץ נכשלה");
      toast.error("העלאת הקובץ נכשלה");
    } finally {
      setUploading(false);
    }
  };

  const onInput = (e) => handleSelected(e.target.files?.[0]);
  const onDrop = (e) => {
    e.preventDefault();
    handleSelected(e.dataTransfer?.files?.[0]);
  };

  const clearFile = async () => {
    try {
      await deleteSubLicense();
    } catch {}
    updateField("subLicense.fileUrl", "");
    updateField("subLicense.fileTitle", "");
    setTitleDraft("");
    setLocked(false);
    toast.success("הקובץ הוסר");
  };

  const saveTitle = async () => {
    if (!isPrimaryTradeValid) {
      toast.error("נא להשלים 'מקצוע ראשי' לפני שמירה");
      setPrimaryTradeTouched?.(true);
      return;
    }
    const next = structuredClone(form);
    next.subLicense = {
      ...(next.subLicense || {}),
      fileTitle: String(titleDraft || "").trim(),
    };
    try {
      await onSave?.(next);
      setLocked(true);
      toast.success("הכותרת נשמרה ✔");
    } catch {}
  };

  return (
    <SectionShell icon={InsertDriveFile} title="רישיון/הסמכה">
      <div
        className="certificate"
        style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}
      >
        <div style={{ marginBottom: 8, color: "#374151" }}>
          העלה/י מסמך המאשר רישיון או הסמכה (PDF או תמונה).
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          onChange={onInput}
          style={{ display: "none" }}
        />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileRef.current?.click();
            }
          }}
          style={{
            border: "2px dashed #9ca3af",
            borderRadius: 10,
            padding: 20,
            textAlign: "center",
            background: "#f9fafb",
            cursor: "pointer",
            transition: "background 150ms ease",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <CloudUpload />
            <strong>גרור/י ושחרר/י קובץ כאן</strong>
          </div>
          <div style={{ marginTop: 6, color: "#6b7280" }}>
            או לחצו/י לבחירה מהמכשיר · PDF או תמונה
          </div>
          {uploading && <div style={{ marginTop: 8 }}>מעלה קובץ…</div>}
          {!!err && <div style={{ marginTop: 8, color: "#d32f2f" }}>{err}</div>}
        </div>

        {sl.fileUrl && (
          <>
            <div
              style={{
                marginTop: 12,
                padding: 10,
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <InsertDriveFile />
                <span style={{ color: "#374151", fontWeight: 600 }}>
                  {sl.fileTitle || "מסמך הועלה"}
                </span>
                <a
                  href={sl.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ textDecoration: "none" }}
                  title="תצוגה"
                >
                  תצוגה
                </a>
                <a
                  href={sl.fileUrl}
                  download
                  className="btn btn-outline btn-sm"
                  style={{ textDecoration: "none" }}
                  title="הורדה"
                >
                  הורדה
                </a>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={clearFile}
                title="הסר קובץ"
              >
                <Close style={{ fontSize: 16 }} />
              </button>
            </div>

            <div style={{ marginTop: 10 }}>
              <label className="form-label">כותרת המסמך</label>
              <div
                style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
              >
                <input
                  className="form-input"
                  type="text"
                  placeholder="למשל: רישיון חשמלאי מוסמך"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  disabled={locked}
                  style={{ flex: 1 }}
                />
                {!locked && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={saveTitle}
                    disabled={saving || !String(titleDraft).trim()}
                  >
                    {saving ? "שומר..." : "שמור כותרת"}
                  </button>
                )}
              </div>
              {!locked && (
                <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
                  הכותרת תינעל לאחר שמירה.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </SectionShell>
  );
}
