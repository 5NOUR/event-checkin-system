import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowRight,
  UserPlus,
  Users,
  Power,
  PowerOff,
  Mail,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

interface StaffMember {
  id: string;
  staffId: string;
  eventId: string;
  isActive: boolean;
  assignedAt: string;
  staff: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  };
}

const addStaffSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

type AddStaffFormData = z.infer<typeof addStaffSchema>;

export default function StaffManagement() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddStaffFormData>({
    resolver: zodResolver(addStaffSchema),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["staff", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/staff/event/${eventId}`);
      return response.data.data as StaffMember[];
    },
    enabled: !!eventId,
  });

  const addMutation = useMutation({
    mutationFn: (payload: AddStaffFormData) =>
      apiClient.post(`/staff/event/${eventId}`, payload),
    onSuccess: () => {
      setSuccessMessage(t("staff.successMessage"));
      setServerError("");
      reset();
      queryClient.invalidateQueries({ queryKey: ["staff", eventId] });
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      setServerError(
        err.response?.data?.error?.message || t("errors.serverError"),
      );
      setSuccessMessage("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (staffId: string) =>
      apiClient.delete(`/staff/event/${eventId}/staff/${staffId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", eventId] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: (staffId: string) =>
      apiClient.patch(
        `/staff/event/${eventId}/staff/${staffId}/reactivate`,
        {},
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", eventId] });
    },
  });

  const onSubmit = (formData: AddStaffFormData) => {
    setServerError("");
    setSuccessMessage("");
    addMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="container-page py-12">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  const staffList = data || [];
  const activeCount = staffList.filter(
    (s) => s.isActive && s.staff.isActive,
  ).length;

  return (
    <div className="container-page py-8 md:py-12 max-w-4xl">
      <header className="mb-8">
        <button
          onClick={() => navigate(`/organizer/events/${eventId}`)}
          className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors mb-4"
        >
          <ArrowRight
            className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
            strokeWidth={1.75}
          />
          <span>{t("staff.backToDetails")}</span>
        </button>

        <p className="label-overline mb-2">{t("staff.label")}</p>
        <h1 className="heading-h1">{t("staff.title")}</h1>
        <p className="mt-1.5 text-body-sm text-ink-600">
          {t("staff.subtitle")}
        </p>
      </header>

      <Card padding="lg" className="mb-8">
        <div className="flex items-center gap-2.5 mb-5">
          <UserPlus className="w-4 h-4 text-gold-500" strokeWidth={1.75} />
          <h2 className="text-h3 font-semibold text-ink-900 tracking-tight">
            {t("staff.addStaff")}
          </h2>
        </div>

        {successMessage && (
          <Banner
            variant="success"
            icon={<CheckCircle2 size={16} strokeWidth={2} />}
            text={successMessage}
          />
        )}

        {serverError && (
          <Banner
            variant="danger"
            icon={<AlertTriangle size={16} strokeWidth={2} />}
            text={serverError}
          />
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label={t("staff.email")}
            type="email"
            placeholder={t("staff.emailPlaceholder")}
            leftIcon={<Mail size={16} strokeWidth={1.75} />}
            required
            dir="ltr"
            error={errors.email ? t("validation.emailInvalid") : undefined}
            hint={t("staff.emailHint")}
            {...register("email")}
          />

          <Input
            label={t("staff.name")}
            placeholder={t("staff.namePlaceholder")}
            error={errors.name?.message}
            hint={t("staff.nameHint")}
            {...register("name")}
          />

          <Button
            type="submit"
            variant="accent"
            loading={addMutation.isPending}
            leftIcon={<UserPlus size={16} strokeWidth={2} />}
          >
            {t("staff.submit")}
          </Button>
        </form>
      </Card>

      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Users className="w-4 h-4 text-gold-500" strokeWidth={1.75} />
            <h2 className="text-h3 font-semibold text-ink-900 tracking-tight">
              {t("staff.currentTeam")}
            </h2>
          </div>
          <span className="text-caption text-ink-500 tabular-nums">
            {t("staff.activeCount", { count: activeCount })} /{" "}
            {staffList.length}
          </span>
        </div>

        {staffList.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t("staff.noStaffTitle")}
            description={t("staff.noStaffDescription")}
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {staffList.map((staff) => (
              <StaffRow
                key={staff.id}
                staff={staff}
                onRemove={() => {
                  if (
                    window.confirm(
                      t("staff.confirmDeactivate", {
                        name: staff.staff.name,
                      }),
                    )
                  ) {
                    removeMutation.mutate(staff.staffId);
                  }
                }}
                onReactivate={() => reactivateMutation.mutate(staff.staffId)}
                isRemoving={
                  removeMutation.isPending &&
                  removeMutation.variables === staff.staffId
                }
                isReactivating={
                  reactivateMutation.isPending &&
                  reactivateMutation.variables === staff.staffId
                }
                t={t}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

// ============================================
// Staff Row
// ============================================
function StaffRow({
  staff,
  onRemove,
  onReactivate,
  isRemoving,
  isReactivating,
  t,
}: {
  staff: StaffMember;
  onRemove: () => void;
  onReactivate: () => void;
  isRemoving: boolean;
  isReactivating: boolean;
  t: (key: string, options?: Record<string, unknown>) => string;
}) {
  const isActive = staff.isActive && staff.staff.isActive;
  const initial = staff.staff.name.charAt(0).toUpperCase();

  return (
    <li className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={[
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
            isActive ? "bg-gold-100 text-gold-600" : "bg-ink-100 text-ink-500",
          ].join(" ")}
        >
          <span className="text-body font-semibold">{initial}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-body font-medium text-ink-900 truncate">
              {staff.staff.name}
            </p>
            {isActive ? (
              <Badge variant="success" size="sm" dot>
                {t("staff.active")}
              </Badge>
            ) : (
              <Badge variant="default" size="sm">
                {t("staff.inactive")}
              </Badge>
            )}
          </div>
          <p className="text-caption text-ink-500 truncate mt-0.5" dir="ltr">
            {staff.staff.email}
          </p>
          <p className="text-caption text-ink-400 mt-0.5 tabular-nums">
            {t("staff.assignedAt")}:{" "}
            {new Date(staff.assignedAt).toLocaleDateString("ar-EG", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      <div className="flex-shrink-0">
        {isActive ? (
          <Button
            variant="ghost"
            size="sm"
            loading={isRemoving}
            onClick={onRemove}
            leftIcon={<PowerOff size={14} strokeWidth={1.75} />}
            className="!text-danger-600 hover:!bg-danger-100"
          >
            {t("staff.deactivate")}
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            loading={isReactivating}
            onClick={onReactivate}
            leftIcon={<Power size={14} strokeWidth={1.75} />}
          >
            {t("staff.reactivate")}
          </Button>
        )}
      </div>
    </li>
  );
}

// ============================================
// Banner
// ============================================
function Banner({
  variant,
  icon,
  text,
}: {
  variant: "success" | "danger";
  icon: React.ReactNode;
  text: string;
}) {
  const styles = {
    success: "bg-success-100 border-success-500/20 text-success-700",
    danger: "bg-danger-100 border-danger-500/20 text-danger-700",
  };

  return (
    <div
      className={`mb-4 px-4 py-3 border rounded-md flex items-center gap-2.5 ${styles[variant]}`}
      role="alert"
    >
      {icon}
      <span className="text-body-sm font-medium">{text}</span>
    </div>
  );
}
