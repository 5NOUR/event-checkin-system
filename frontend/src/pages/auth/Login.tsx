import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Mail, Lock, ArrowLeft } from "lucide-react";
import apiClient from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await apiClient.post("/auth/login", data);
      return response.data;
    },
    onSuccess: (data) => {
      if (!data.data?.user) {
        setServerError(t("errors.unexpectedError"));
        return;
      }

      localStorage.setItem("user", JSON.stringify(data.data.user));
      window.dispatchEvent(new Event("user-changed"));

      const role = data.data.user.role;
      if (role === "ADMIN" || role === "ORGANIZER") {
        window.location.href = "/organizer";
      } else if (role === "STAFF") {
        window.location.href = "/staff/scan";
      } else {
        window.location.href = "/";
      }
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      setServerError(
        err.response?.data?.error?.message || t("auth.invalidCredentials"),
      );
    },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError("");
    mutation.mutate(data);
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
              {t("auth.login.title")}
            </h1>
            <p className="mt-2 text-body-sm text-ink-600">
              {t("auth.login.subtitle")}
            </p>
          </div>

          {serverError && (
            <div className="mb-6 px-4 py-3 bg-danger-100 border border-danger-500/20 rounded-md">
              <p className="text-body-sm text-danger-700">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label={t("auth.email")}
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={16} strokeWidth={1.75} />}
              error={errors.email ? t("validation.emailInvalid") : undefined}
              autoComplete="email"
              dir="ltr"
              required
              {...register("email")}
            />

            <Input
              label={t("auth.password")}
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock size={16} strokeWidth={1.75} />}
              error={errors.password ? t("validation.required") : undefined}
              autoComplete="current-password"
              required
              {...register("password")}
            />

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-body-sm text-ink-600 hover:text-ink-900 transition-colors"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={mutation.isPending}
              rightIcon={
                <ArrowLeft
                  className="w-4 h-4 rtl:rotate-180"
                  strokeWidth={1.75}
                />
              }
            >
              {t("auth.login.submit")}
            </Button>
          </form>
        </div>

        {/* Demo Hint */}
        <div className="mt-6 p-4 bg-ink-100 border border-ink-200 rounded-md">
          <p className="text-caption text-ink-600 text-center leading-relaxed">
            <span className="font-semibold text-ink-700">
              {t("auth.demoAccounts")}:
            </span>
            <br />
            {t("auth.demoOrganizer")}: organizer@example.com |{" "}
            {t("auth.demoStaff")}: staff@example.com
            <br />
            {t("auth.password")}: password123
          </p>
        </div>
      </div>
    </div>
  );
}
