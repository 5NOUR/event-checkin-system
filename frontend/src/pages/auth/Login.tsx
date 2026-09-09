import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import apiClient from "../../services/apiClient";

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiClient.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      // تخزين التوكن والمستخدم في localStorage
      localStorage.setItem("token", data.data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
      navigate("/organizer");
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        err.response?.data?.error?.message || t("auth.invalidCredentials"),
      );
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    mutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4">
      <div className="bg-white rounded-lg border border-[#E5E5E0] p-8 max-w-md w-full shadow-sm">
        <h1 className="text-3xl font-bold text-[#171717] mb-6 text-center">
          {t("auth.login")}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">
              {t("auth.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">
              {t("auth.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full px-8 py-3 bg-[#171717] text-white font-medium rounded-md hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? t("common.loading") : t("auth.login")}
          </button>
        </form>
      </div>
    </div>
  );
}
