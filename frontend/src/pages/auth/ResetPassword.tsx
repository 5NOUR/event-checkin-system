import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Lock, ArrowLeft } from "lucide-react";
import apiClient from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function ResetPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const t = searchParams.get("token");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t) setToken(t);
    else setError(t || "");
  }, [searchParams]);

  const mutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await apiClient.post("/auth/reset-password", data);
      return response.data;
    },
    onSuccess: () => {
      setMessage(t("resetPassword.successMessage"));
      setError("");
      setTimeout(() => navigate("/login"), 3000);
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
    if (password.length < 6) {
      setError(t("validation.weakPassword"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("validation.passwordsMismatch"));
      return;
    }
    if (!token) {
      setError(t("resetPassword.invalidToken"));
      return;
    }
    mutation.mutate({ token, newPassword: password });
  };

  return (
    <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link
            to="/"
            className="inline-block text-h3 font-semibold tracking-tight text-ink-900"
          >
            Event<span className="text-gold-500">Check</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white border border-ink-200 rounded-lg p-8">
          <div className="mb-8">
            <h1 className="text-h2 font-semibold text-ink-900 tracking-tight">
              {t("resetPassword.title")}
            </h1>
            <p className="mt-2 text-body-sm text-ink-600">
              {t("resetPassword.subtitle")}
            </p>
          </div>

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
              label={t("resetPassword.newPassword")}
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} strokeWidth={1.75} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />

            <Input
              label={t("resetPassword.confirmPassword")}
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
              disabled={!token}
              rightIcon={
                <ArrowLeft
                  className="w-4 h-4 rtl:rotate-180"
                  strokeWidth={1.75}
                />
              }
            >
              {t("resetPassword.submit")}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-body-sm text-ink-600 hover:text-ink-900 transition-colors"
            >
              {t("forgotPassword.backToLogin")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
