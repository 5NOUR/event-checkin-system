import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ✅ قائمة النقاط التي لا يجب أن تُفعّل الـ refresh logic
const AUTH_ENDPOINTS_TO_SKIP = [
  "/auth/login",
  "/auth/refresh",
  "/auth/logout",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isAuthEndpoint(url?: string): boolean {
  if (!url) return false;
  return AUTH_ENDPOINTS_TO_SKIP.some((endpoint) => url.includes(endpoint));
}

// ✅ لا نضيف أي هيدرز إضافية هنا (لتجنب مشاكل CORS)
// الـ Cookies تُرسل تلقائياً بفضل withCredentials: true

// متتبع refresh
let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

function subscribeTokenRefresh(callback: (success: boolean) => void) {
  refreshSubscribers.push(callback);
}

function onRefreshComplete(success: boolean) {
  refreshSubscribers.forEach((callback) => callback(success));
  refreshSubscribers = [];
}

// ✅ Interceptor للردود
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    const status = error.response?.status;
    const url = originalRequest?.url || "";

    // إذا كان الطلب من نقاط المصادقة → لا تحاول refresh
    if (isAuthEndpoint(url)) {
      return Promise.reject(error);
    }

    // إذا كان الخطأ ليس 401 → لا تحاول refresh
    if (status !== 401) {
      return Promise.reject(error);
    }

    // إذا حاولنا refresh مسبقاً → خروج
    if (originalRequest._retry) {
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    // إذا كان هناك refresh جارٍ → انتظره
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh((success: boolean) => {
          if (success) {
            resolve(apiClient(originalRequest));
          } else {
            reject(error);
          }
        });
      });
    }

    // بدء refresh
    isRefreshing = true;

    try {
      await apiClient.post("/auth/refresh");
      isRefreshing = false;
      onRefreshComplete(true);
      return apiClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      onRefreshComplete(false);
      localStorage.removeItem("user");
      window.location.href = "/login";
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;
