import React from "react";
import SectionShell from "./SectionShell.jsx";
import { EmojiEvents, CheckCircle, Schedule } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "../../../hooks/useToast.jsx";
import api from "../../../api/client";

const blankLicense = () => ({
  licenseNumber: "",
  registrationDate: "",
  status: "",
  authorityUrl: "",
  fileUrl: "",
  fileTitle: "",
  verified: false,
  verifiedAt: null,
  lastCheckedAt: null,
  matches: { license: false, registrationDate: false, status: false },
  registryName: undefined,
});

export default function ContractorLicenseSection({ form, updateField }) {
  const toast = useToast();
  const qc = useQueryClient();
  const isVerified = !!form.contractorLicense?.verified;
  const canVerify =
    !!form.contractorLicense?.licenseNumber &&
    !!form.contractorLicense?.registrationDate &&
    !!form.contractorLicense?.status;

  const verifyMut = useMutation({
    mutationFn: async () => {
      const lic = form.contractorLicense || {};
      const { data } = await api.post("/contractor-profiles/verify", {
        licenseNumber: String(lic.licenseNumber || "").trim(),
        registrationDate: String(lic.registrationDate || "").trim(),
        status: String(lic.status || "").trim(),
        authorityUrl: lic.authorityUrl || "",
        fileUrl: lic.fileUrl || "",
      });
      return data;
    },
    onSuccess: (data) => {
      if (data.verified) toast.success("הרישיון אומת בהצלחה ✔");
      else toast.error("האימות נכשל — בדוק/י את הפרטים ונסה/י שוב.");

      const lic = data.profileLicense || form.contractorLicense || {};
      for (const [k, v] of Object.entries(lic)) {
        updateField(`contractorLicense.${k}`, v);
      }
      qc.setQueryData(["myProfile"], (old) =>
        old ? { ...old, contractorLicense: lic } : old
      );
    },
    onError: (err) =>
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "האימות נכשל"
      ),
  });

  const deleteMut = useMutation({
    mutationFn: async () =>
      (await api.delete("/contractor-profiles/license")).data,
    onSuccess: () => {
      toast.success("הרישיון נמחק");
      const bl = blankLicense();
      for (const [k, v] of Object.entries(bl)) {
        updateField(`contractorLicense.${k}`, v);
      }
      qc.setQueryData(["myProfile"], (old) =>
        old ? { ...old, contractorLicense: bl } : old
      );
    },
    onError: (err) =>
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "מחיקה נכשלה"
      ),
  });

  const actions = isVerified ? (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => deleteMut.mutate()}
      disabled={deleteMut.isLoading}
      title="מחק רישיון מהפרופיל"
      style={{ color: "#b91c1c", borderColor: "#fca5a5" }}
    >
      {deleteMut.isLoading ? "מוחק..." : "מחק"}
    </button>
  ) : (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => verifyMut.mutate()}
      disabled={verifyMut.isLoading || !canVerify}
      title="אמת מול פנקס הקבלנים"
    >
      {verifyMut.isLoading ? "מאמת..." : "אימות רישיון"}
    </button>
  );

  return (
    <SectionShell
      icon={EmojiEvents}
      title="רישיון קבלן (gov.il)"
      actions={actions}
    >
      <div
        className={`certificate ${isVerified ? "verified" : ""}`}
        style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}
      >
        <div
          className="certificate-header"
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <span
            className={isVerified ? "verified-badge" : "pending-badge"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontWeight: 600,
              color: isVerified ? "#16a34a" : "#6b7280",
            }}
          >
            {isVerified ? (
              <>
                <CheckCircle style={{ fontSize: 16 }} /> מאומת
              </>
            ) : (
              <>
                <Schedule style={{ fontSize: 16 }} /> ממתין לאימות
              </>
            )}
          </span>

          {form.contractorLicense?.matches && (
            <span
              style={{ marginInlineStart: 12, fontSize: 12, color: "#374151" }}
            >
              התאמות: מס': {form.contractorLicense.matches.license ? "✓" : "✗"}{" "}
              · תאריך:{" "}
              {form.contractorLicense.matches.registrationDate ? "✓" : "✗"} ·
              סטטוס: {form.contractorLicense.matches.status ? "✓" : "✗"}
            </span>
          )}
        </div>

        <div
          className="certificate-details"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0,1fr))",
            gap: 12,
          }}
        >
          <div>
            <strong>מספר קבלן</strong>
            <input
              className="form-input"
              type="text"
              inputMode="numeric"
              placeholder="לדוגמה: 12345"
              value={form.contractorLicense?.licenseNumber || ""}
              onChange={(e) =>
                updateField(
                  "contractorLicense.licenseNumber",
                  e.target.value.replace(/\D+/g, "")
                )
              }
              disabled={isVerified}
              style={{ marginTop: 5 }}
            />
          </div>

          <div>
            <strong>תאריך רישום</strong>
            <input
              className="form-input"
              type="date"
              value={
                form.contractorLicense?.registrationDate
                  ? String(form.contractorLicense.registrationDate).slice(0, 10)
                  : ""
              }
              onChange={(e) =>
                updateField(
                  "contractorLicense.registrationDate",
                  e.target.value
                )
              }
              disabled={isVerified}
              style={{ marginTop: 5 }}
            />
          </div>

          <div>
            <strong>סטטוס</strong>
            <input
              className="form-input"
              type="text"
              placeholder="לדוגמה: רשום / פעיל / מושעה"
              value={form.contractorLicense?.status || ""}
              onChange={(e) =>
                updateField("contractorLicense.status", e.target.value)
              }
              disabled={isVerified}
              style={{ marginTop: 5 }}
            />
          </div>

          <div>
            <strong>קישור לרשות (gov.il)</strong>
            <input
              className="form-input"
              type="url"
              placeholder="https://www.gov.il/..."
              value={form.contractorLicense?.authorityUrl || ""}
              onChange={(e) =>
                updateField("contractorLicense.authorityUrl", e.target.value)
              }
              disabled={isVerified}
              style={{ marginTop: 5 }}
            />
          </div>

          <div>
            <strong>קובץ/הוכחה (אופציונלי)</strong>
            <input
              className="form-input"
              type="url"
              placeholder="https://..."
              value={form.contractorLicense?.fileUrl || ""}
              onChange={(e) =>
                updateField("contractorLicense.fileUrl", e.target.value)
              }
              disabled={isVerified}
              style={{ marginTop: 5 }}
            />
          </div>
        </div>

        {form.contractorLicense?.registryName && (
          <div style={{ marginTop: 10, fontSize: 12, color: "#374151" }}>
            שם ישות בפנקס:{" "}
            <strong>{form.contractorLicense.registryName}</strong>
          </div>
        )}
        {form.contractorLicense?.lastCheckedAt && (
          <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
            עודכן לאחרונה:{" "}
            {new Date(form.contractorLicense.lastCheckedAt).toLocaleString(
              "he-IL"
            )}
          </div>
        )}
      </div>
    </SectionShell>
  );
}
