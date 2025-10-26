import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL || "/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

let refreshTokenFunction:
  | (() => Promise<{ accessToken: string; refreshToken: string }>)
  | null = null;
let clearTokensFunction: (() => void) | null = null;

export const setAuthFunctions = (
  refreshFn: () => Promise<{ accessToken: string; refreshToken: string }>,
  clearFn: () => void
) => {
  refreshTokenFunction = refreshFn;
  clearTokensFunction = clearFn;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint = originalRequest.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint &&
      refreshTokenFunction &&
      clearTokensFunction
    ) {
      originalRequest._retry = true;

      try {
        const { accessToken } = await refreshTokenFunction();
        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearTokensFunction();
        
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    if (error.response) {
      console.error("API Error:", error.response.status, error.response.data);
    } else {
      console.error("Network error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;