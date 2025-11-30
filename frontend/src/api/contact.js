import api from "./client";

export async function sendContactMessage({ name, email, message }) {
  const payload = {
    name: String(name || "").trim(),
    email: String(email || "").trim(),
    message: String(message || "").trim(),
  };
  const { data } = await api.post("/contact", payload);
  return data;
}
