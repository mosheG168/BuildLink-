import api from "./client";

export async function getMe() {
  const { data } = await api.get("/users/me");

  return {
    id: data.id || data._id,
    role: data.role,
    email: data.email,
    isBusiness: data.isBusiness,
    name: data.name,
    image: data.image,
    address: data.address,
  };
}
