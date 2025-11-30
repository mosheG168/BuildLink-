import api from "./client";

export async function uploadAvatar(file) {
  const form = new FormData();
  form.append("avatar", file);
  const { data } = await api.post("/uploads/me/avatar", form);
  return { url: data?.url || "" };
}

export async function deleteAvatar() {
  await api.delete("/uploads/me/avatar");
}

export async function uploadSubLicense(file, title = "") {
  const form = new FormData();
  form.append("sub_license", file);
  if (title) form.append("title", title);
  const { data } = await api.post("/uploads/me/sub_license", form);
  return { url: data?.url || "" };
}

export async function deleteSubLicense() {
  await api.delete("/uploads/me/sub_license");
}
