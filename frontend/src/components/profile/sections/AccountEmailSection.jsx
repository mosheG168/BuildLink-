import React from "react";
import { Email, Edit, Save } from "@mui/icons-material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Fade } from "@mui/material";

import SectionShell from "./SectionShell.jsx";
import { useMe } from "../../../hooks/useMe";
import { useToast } from "../../../hooks/useToast";
import { updateAccountEmail } from "../../../api/users";

export default function AccountEmailSection() {
  const toast = useToast();
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [email, setEmail] = React.useState(me?.email || "");
  const [editing, setEditing] = React.useState(false);

  React.useEffect(() => {
    if (me?.email && !editing) {
      setEmail(me.email);
    }
  }, [me?.email, editing]);

  const mut = useMutation({
    mutationFn: (value) => updateAccountEmail(value),
    onSuccess: () => {
      toast.success("אימייל החשבון עודכן בהצלחה");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err) => {
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        "לא ניתן לעדכן את אימייל החשבון";
      toast.error(msg);
    },
  });

  const handleSave = () => {
    const value = String(email || "").trim();
    if (!value) {
      toast.error("נא להזין אימייל");
      return;
    }

    const current = String(me?.email || "").trim();
    if (value === current) {
      toast.info("לא בוצע שינוי באימייל");
      setEditing(false);
      return;
    }

    mut.mutate(value);
  };

  const isBusy = mut.isLoading;

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
          disabled={isBusy}
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
          title="שמור אימייל"
          disabled={isBusy}
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
    <SectionShell icon={Email} title="אימייל חשבון (התחברות)" actions={actions}>
      <div className={`form-grid ${editing ? "" : "form-grid--readonly"}`}>
        <div className="form-row">
          <label className="form-label">
            <Email style={{ fontSize: 18, marginLeft: 5 }} /> אימייל התחברות
          </label>
          <input
            className="form-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={!editing || isBusy}
          />
        </div>
      </div>
    </SectionShell>
  );
}
