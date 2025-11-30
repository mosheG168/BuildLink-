import React from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/client";
import SubcontractorProfile from "./SubcontractorProfile";
import ContractorProfile from "./ContractorProfile";

export default function ProfileRouter() {
  const meQ = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/users/me")).data,
    retry: false,

    enabled: typeof window !== "undefined" && !!localStorage.getItem("token"),
  });

  const isAuthed =
    typeof window !== "undefined" && !!localStorage.getItem("token");
  if (!isAuthed) return <Navigate to="/login" replace />;

  if (meQ.isLoading) {
    return (
      <div className="container container--padding">
        <div className="skeleton-header" />
        <div className="skeleton-body" />
      </div>
    );
  }

  if (meQ.isError) return <Navigate to="/login" replace />;

  const isSub = !!meQ.data && !meQ.data.isBusiness;
  return isSub ? <SubcontractorProfile /> : <ContractorProfile />;
}
