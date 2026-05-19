import axios from "axios";

export const API_BASE_URL = import.meta.env?.VITE_API_URL || "https://lmssfe-production.up.railway.app";

const API = axios.create({
  baseURL: API_BASE_URL,
});

/** Don't send Bearer on public auth routes: invalid/expired JWT would make SimpleJWT fail before AllowAny views run. */
function shouldAttachAuthToken(url) {
  if (!url || typeof url !== "string") return true;
  const path = url.split("?")[0];
  return !(
    path.includes("auth/login") ||
    path.includes("auth/register") ||
    path.includes("auth/forgot-password") ||
    path.includes("auth/reset-password")
  );
}

API.interceptors.request.use((req) => {
  if (!shouldAttachAuthToken(req.url)) {
    return req;
  }
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;
