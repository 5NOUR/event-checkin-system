import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lock, ArrowLeft, ShieldCheck } from "lucide-react";
import apiClient from "../services/apiClient";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";

export default function ChangePassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const response = await apiClient.post("/auth/change-password", data);
      return response.data;
    },
    onSuccess: (data) => {
      setMessage(data.message || t("changePassword.successMessage"));
      setError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // ✅ تسجيل الخروج وإعادة التوجيه
      setTimeout(async () => {
        try {
          await fetch(
            `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/auth/logout`,
            { method: "POST", credentials: "include" },
          );
        } catch {
          // ignore
        }
        localStorage.removeItem("user");
        localStorage.removeItem("selectedEventId");
        window.dispatchEvent(new Event("user-changed"));
        window.location.href = "/login";
      }, 2500);
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(error.response?.data?.error?.message || t("errors.tryAgain"));
      setMessage("");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 6) {
      setError(t("validation.weakPassword"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setError(t("validation.passwordsMismatch"));
      return;
    }

    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="min-h-screen bg-ink-50 py-12">
      <div className="container-page max-w-md">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" strokeWidth={1.75} />
            <span>{t("common.back")}</span>
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-gold-100 flex items-center justify-center">
              <ShieldCheck
                className="w-5 h-5 text-gold-600"
                strokeWidth={1.75}
              />
            </div>
            <h1 className="text-h2 font-semibold text-ink-900 tracking-tight">
              {t("changePassword.title")}
            </h1>
          </div>
          <p className="text-body-sm text-ink-600">
            {t("changePassword.subtitle")}
          </p>
        </div>

        {/* Card */}
        <Card padding="lg">
          {message && (
            <div className="mb-6 px-4 py-3 bg-success-100 border border-success-500/20 rounded-md">
              <p className="text-body-sm text-success-700">{message}</p>
            </div>
          )}
          {error && (
            <div className="mb-6 px-4 py-3 bg-danger-100 border border-danger-500/20 rounded-md">
              <p className="text-body-sm text-danger-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label={t("changePassword.currentPassword")}
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} strokeWidth={1.75} />}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <Input
              label={t("changePassword.newPassword")}
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} strokeWidth={1.75} />}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />

            <Input
              label={t("changePassword.confirmPassword")}
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} strokeWidth={1.75} />}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={mutation.isPending}
            >
              {t("changePassword.submit")}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
