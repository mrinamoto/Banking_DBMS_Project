import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("bank_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("bank_token")) {
      localStorage.removeItem("bank_token");
      localStorage.removeItem("bank_user");
      window.dispatchEvent(new Event("bank:unauthorized"));
    }
    return Promise.reject(error);
  }
);

export function messageFrom(error) {
  if (error.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (!error.response) return "Unable to reach the banking service. Check your connection and try again.";
  return error.response.data?.message || "Unable to complete the request.";
}

export default api;
