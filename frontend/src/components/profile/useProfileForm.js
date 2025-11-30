import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/client";
import {
  getMyContractorProfile,
  upsertMyContractorProfile,
} from "../../api/contractorProfile";
import { useToast } from "../../hooks/useToast";
import { ROLES, isContractor, isSubcontractor } from "@shared/roles";
import { deleteAvatar } from "../../api/uploads";

const isPlainObject = (v) => v && typeof v === "object" && !Array.isArray(v);
const fb = (v, d = "") => (v == null || v === "" ? d : v);
const pruneAndTrim = (obj) => {
  const visit = (v) => {
    if (Array.isArray(v)) {
      const arr = v.map(visit).filter((x) => !(x === "" || x == null));
      return arr.length ? arr : undefined;
    }
    if (isPlainObject(v)) {
      const out = {};
      for (const k of Object.keys(v)) {
        const nv = visit(v[k]);
        if (nv !== undefined) out[k] = nv;
      }
      return Object.keys(out).length ? out : undefined;
    }
    if (typeof v === "string") return v.trim();
    return v;
  };
  return visit(obj);
};

const emptyLicense = () => ({
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

const initialProfileFromMe = (me) => ({
  displayName: fb(
    me?.displayName,
    `${fb(me?.name?.first)} ${fb(me?.name?.last)}`.trim()
  ),
  profilePhotoUrl: fb(me?.profilePhotoUrl, ""),
  companyName: fb(me?.companyName, ""),
  primaryTrade: fb(me?.primaryTrade, ""),
  otherTrades: Array.isArray(me?.otherTrades)
    ? me.otherTrades
    : me?.otherTrades
      ? String(me.otherTrades)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  skills: Array.isArray(me?.skills) ? me.skills : [],
  jobTypes: Array.isArray(me?.jobTypes) ? me.jobTypes : [],
  services: Array.isArray(me?.services) ? me.services : [],
  coverageAreas: Array.isArray(me?.coverageAreas)
    ? me.coverageAreas
    : me?.coverageAreas
      ? String(me.coverageAreas)
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  address: {
    country: fb(me?.address?.country, me?.country, "IL"),
    city: fb(me?.address?.city, me?.city, ""),
    street: fb(me?.address?.street, me?.street, ""),
    houseNumber:
      me?.address?.houseNumber != null
        ? String(me.address.houseNumber)
        : me?.houseNumber != null
          ? String(me.houseNumber)
          : "",
    zip:
      me?.address?.zip != null
        ? String(me.address.zip)
        : me?.zip != null
          ? String(me.zip)
          : "",
    googleMapsUrl: fb(me?.address?.googleMapsUrl, ""),
  },
  contractorLicense: me?.contractorLicense
    ? { ...emptyLicense(), ...me.contractorLicense }
    : null,
  subLicense: {
    fileUrl: fb(me?.subLicense?.fileUrl, ""),
    fileTitle: fb(me?.subLicense?.fileTitle, ""),
    authorityUrl: fb(me?.subLicense?.authorityUrl, ""),
  },
  portfolio: Array.isArray(me?.portfolio)
    ? me.portfolio.map((item) => ({
        ...item,
        description: item.description || "",
      }))
    : [],
  documents: Array.isArray(me?.documents) ? me.documents : [],

  contact: {
    phone: fb(me?.contact?.phone, me?.phone, ""),
    email: fb(me?.contact?.email, me?.email, ""),
    website: fb(me?.contact?.website, me?.website, ""),
    socials: {
      instagram: fb(
        me?.contact?.socials?.instagram,
        me?.socials?.instagram,
        ""
      ),
      linkedin: fb(me?.contact?.socials?.linkedin, me?.socials?.linkedin, ""),
      facebook: fb(me?.contact?.socials?.facebook, me?.socials?.facebook, ""),
      tiktok: fb(me?.contact?.socials?.tiktok, me?.socials?.tiktok, ""),
    },
  },
  isVerified: !!me?.isVerified,
});

const deepMergeMissing = (target, fallback) => {
  const out = structuredClone(target ?? {});
  const walk = (t, f) => {
    if (!isPlainObject(f)) return;
    for (const k of Object.keys(f)) {
      const tv = t?.[k];
      const fv = f[k];
      const isMissing =
        tv === undefined ||
        tv === null ||
        (typeof tv === "string" && tv.trim() === "") ||
        (Array.isArray(tv) && tv.length === 0) ||
        (isPlainObject(tv) && Object.keys(tv).length === 0);
      if (isMissing) t[k] = isPlainObject(fv) ? structuredClone(fv) : fv;
      else if (isPlainObject(tv) && isPlainObject(fv)) walk(tv, fv);
    }
  };
  walk(out, fallback ?? {});
  return out;
};

const normalizeBeforeSave = (payload, role) => {
  const clone = structuredClone(payload ?? {});

  if (isSubcontractor(role)) {
    if (!clone.subLicense?.fileUrl) {
      delete clone.subLicense;
    } else {
      clone.subLicense = pruneAndTrim({
        fileUrl: clone.subLicense.fileUrl,
        fileTitle: clone.subLicense.fileTitle || "",
        authorityUrl: clone.subLicense.authorityUrl || "",
      });
    }
    delete clone.contractorLicense;
  } else {
    // Contractors: keep full gov.il triad; drop subLicense
    const lic = clone.contractorLicense;
    const hasCore =
      !!lic?.licenseNumber && !!lic?.registrationDate && !!lic?.status;
    if (!hasCore) {
      delete clone.contractorLicense;
    } else {
      clone.contractorLicense = pruneAndTrim({
        licenseNumber: String(lic.licenseNumber || "").trim(),
        registrationDate: String(lic.registrationDate || "").slice(0, 10),
        status: String(lic.status || "").trim(),
        authorityUrl: lic.authorityUrl || "",
        fileUrl: lic.fileUrl || "",
        fileTitle: lic.fileTitle || "",
      });
    }
    delete clone.subLicense;
  }

  return pruneAndTrim(clone) ?? {};
};

const computeCompletion = (p, role) => {
  const profile = p && typeof p === "object" ? p : {};
  const hasLicenseCore =
    !!profile.contractorLicense?.licenseNumber &&
    !!profile.contractorLicense?.registrationDate &&
    !!profile.contractorLicense?.status;
  const hasLicense = isSubcontractor(role)
    ? !!profile.subLicense?.fileUrl
    : hasLicenseCore;

  const base = [
    !!profile.displayName,
    !!profile.primaryTrade,
    !!profile.contact?.email,
    !!profile.address?.city,
    hasLicense,
    !!profile.profilePhotoUrl,
  ];
  const subOnly = [
    (profile.skills?.length || 0) > 0,
    (profile.services?.length || 0) > 0,
    (profile.portfolio?.length || 0) > 0,
  ];
  const all = isSubcontractor(role) ? [...base, ...subOnly] : base;
  const filled = all.filter(Boolean).length;
  return Math.round((filled / all.length) * 100);
};

export function useProfileForm() {
  const toast = useToast();
  const qc = useQueryClient();
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
    retry: false,
  });
  const profileQ = useQuery({
    queryKey: ["myProfile"],
    queryFn: getMyContractorProfile,
    retry: false,
  });

  const role = meQ.data?.role ?? ROLES.CONTRACTOR;
  const isSub = isSubcontractor(role);
  const isContractorRole = isContractor(role);
  const isBusiness = !!meQ.data?.isBusiness;
  const [form, setForm] = React.useState(null);

  React.useEffect(() => {
    if (!meQ.data && !profileQ.data) return;

    const fromMe = meQ.data ? initialProfileFromMe(meQ.data) : null;

    if (profileQ.data) {
      let p = structuredClone(profileQ.data);
      if (
        p.contractorLicense &&
        Object.keys(p.contractorLicense).length === 0
      ) {
        p.contractorLicense = null;
      }
      if (!p.subLicense) {
        p.subLicense = { fileUrl: "", fileTitle: "", authorityUrl: "" };
      }
      if (Array.isArray(p.portfolio)) {
        p.portfolio = p.portfolio.map((item) => ({
          ...item,
          description: item.description || "",
        }));
      }
      if (fromMe) p = deepMergeMissing(p, fromMe);
      setForm(p);
      return;
    }

    if (fromMe) {
      setForm(fromMe);
      if (fromMe.primaryTrade && fromMe.displayName && !profileQ.isLoading) {
        saveMut.mutate(fromMe);
      }
    }
  }, [meQ.data, profileQ.data, profileQ.isLoading]);

  const saveMut = useMutation({
    mutationFn: async (payload0) => {
      const normalized = normalizeBeforeSave(payload0, role);
      return upsertMyContractorProfile(normalized);
    },
    onSuccess: (data) => {
      const normalizedData = {
        ...data,
        portfolio: Array.isArray(data.portfolio)
          ? data.portfolio.map((item) => ({
              ...item,
              description: item.description || "",
            }))
          : data.portfolio,
      };

      qc.setQueryData(["myProfile"], normalizedData);
      setForm(normalizedData);
      toast.success("נשמר בהצלחה");
    },

    onError: (err) =>
      toast.error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "שמירה נכשלה"
      ),
  });

  const displayName =
    fb(
      form?.displayName,
      `${fb(meQ.data?.name?.first)} ${fb(meQ.data?.name?.last)}`.trim()
    ) || "—";

  const [primaryTradeTouched, setPrimaryTradeTouched] = React.useState(false);
  const primaryTradeValue = String(form?.primaryTrade || "");
  const primaryTradeTrimmed = primaryTradeValue.trim();
  const primaryTradeError = !primaryTradeTrimmed
    ? "Primary trade is required"
    : primaryTradeTrimmed.length < 2
      ? "Primary trade must be at least 2 characters"
      : primaryTradeTrimmed.length > 60
        ? "Primary trade must be at most 60 characters"
        : "";
  const isPrimaryTradeValid = primaryTradeError === "";
  const completion = React.useMemo(
    () => computeCompletion(form ?? {}, role),
    [form, role]
  );

  const prevCompletionRef = React.useRef(completion);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const key = `profileCompletionCelebrated-${role}`;
    const already = window.localStorage.getItem(key) === "1";
    const prev = prevCompletionRef.current;

    if (completion === 100 && prev < 100 && !already) {
      toast.success("הפרופיל שלך הושלם 100% 🎉");
      window.localStorage.setItem(key, "1");
    }

    prevCompletionRef.current = completion;
  }, [completion, role, toast]);

  const updateField = (path, value) => {
    setForm((prev) => {
      const clone = structuredClone(prev || {});
      const parts = path.split(".");
      const last = parts.pop();
      let target = clone;
      for (const p of parts) {
        target[p] = target[p] ?? {};
        target = target[p];
      }
      target[last] = value;
      return clone;
    });
  };

  const handleAvatarUploaded = async (url) => {
    if (!url) return;
    const next = { ...(form || {}), profilePhotoUrl: url };
    setForm(next);
    if (!isPrimaryTradeValid) return;
    try {
      await saveMut.mutateAsync(next);
    } catch {}
  };

  const handleAvatarRemove = async () => {
    try {
      await deleteAvatar();
      setForm((prev) => ({ ...(prev || {}), profilePhotoUrl: "" }));
      toast.success("תמונת הפרופיל הוסרה");
    } catch {
      toast.error("הסרת תמונה נכשלה");
    }
  };

  const loading = meQ.isLoading || profileQ.isLoading || !form;

  return {
    role,
    isSub,
    isContractorRole,
    isBusiness,
    form,
    setForm,
    loading,
    isPrimaryTradeValid,
    primaryTradeError,
    primaryTradeTouched,
    setPrimaryTradeTouched,
    completion,
    displayName,
    saveMut,
    updateField,
    handleAvatarUploaded,
    handleAvatarRemove,
  };
}
