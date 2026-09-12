import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BarChart3,
  Users,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  Ticket,
  ClipboardList,
  ChevronDown,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import { useSocket } from "../../hooks/useSocket";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

// ============ Types ============
interface Registration {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  organization: string | null;
  jobTitle: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  registeredAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  ticketType: { name: string; color: string | null } | null;
  checkInToken: { token: string } | null;
  checkIn: { checkedInAt: string } | null;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedIn: number;
}

interface EventInfo {
  id: string;
  title: string;
  status: string;
}

// ============ Status Config ============
const STATUS_VARIANT: Record<
  Registration["status"],
  "warning" | "success" | "danger"
> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
};

const EVENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "REGISTRATION_CLOSED",
  "ONGOING",
  "COMPLETED",
  "CANCELLED",
] as const;

// ============ Component ============
export default function OrganizerEventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [statusOpen, setStatusOpen] = useState(false);

  // ========== Real-time ==========
  const { socketRef, isConnected } = useSocket(eventId);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    interface CheckInUpdateData {
      registrationId: string;
      attendeeName: string;
      eventId: string;
      checkedInAt: string;
    }

    const handleCheckInUpdate = (data: CheckInUpdateData) => {
      console.log("📡 Real-time check-in:", data);
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
    };

    socket.on("checkin-update", handleCheckInUpdate);
    return () => {
      socket.off("checkin-update", handleCheckInUpdate);
    };
  }, [socketRef, queryClient, eventId]);

  // ========== Fetch Event Info ==========
  const { data: eventInfo } = useQuery({
    queryKey: ["event-details", eventId],
    queryFn: async () => {
      const res = await apiClient.get(`/events/${eventId}`);
      return res.data.data as EventInfo;
    },
    enabled: !!eventId,
  });

  // ========== Fetch Registrations ==========
  const { data: registrationsData, isLoading } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/registrations/event/${eventId}`);
      return response.data.data as Registration[];
    },
    enabled: !!eventId,
  });

  // ========== Fetch Stats ==========
  const { data: statsData } = useQuery({
    queryKey: ["event-stats", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}/stats`);
      return response.data.data as Stats;
    },
    enabled: !!eventId,
  });

  // ========== Approve / Reject ==========
  const approveMutation = useMutation({
    mutationFn: (registrationId: string) =>
      apiClient.post(`/registrations/${registrationId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (registrationId: string) =>
      apiClient.post(`/registrations/${registrationId}/reject`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
    },
  });

  // ========== Change Status ==========
  const statusMutation = useMutation({
    mutationFn: (status: string) =>
      apiClient.patch(`/events/${eventId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-details", eventId] });
      setStatusOpen(false);
    },
  });

  // ========== Memo ==========
  const registrations = useMemo(
    () => registrationsData || [],
    [registrationsData],
  );

  // ========== Export CSV ==========
  const handleExportCsv = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/export/event/${eventId}/csv`,
        { credentials: "include" },
      );

      if (!response.ok) throw new Error("Export failed");

      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `participants_${new Date().toISOString().slice(0, 10)}.csv`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert(t("errors.tryAgain"));
    }
  };

  // ========== Loading ==========
  if (isLoading) {
    return (
      <div className="container-page py-12">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      {/* ========== Header ========== */}
      <header className="mb-8">
        <button
          onClick={() => navigate("/organizer")}
          className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors mb-4"
        >
          <ArrowRight
            className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
            strokeWidth={1.75}
          />
          <span>{t("eventDetails.backToEvents")}</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="label-overline mb-2">{t("eventDetails.label")}</p>
            <h1 className="heading-h1">{t("eventDetails.title")}</h1>
            {eventInfo && (
              <p className="mt-1.5 text-body-sm text-ink-600">
                {eventInfo.title}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live Status */}
            <Badge variant={isConnected ? "success" : "danger"} size="md" dot>
              {isConnected
                ? t("eventDetails.liveConnected")
                : t("eventDetails.offline")}
            </Badge>

            {/* ✅ Event Status Dropdown */}
            {eventInfo && (
              <div className="relative">
                <button
                  onClick={() => setStatusOpen(!statusOpen)}
                  disabled={statusMutation.isPending}
                  className="inline-flex items-center gap-2 h-6 px-2 text-caption font-semibold uppercase tracking-wider rounded-sm border border-ink-200 bg-white text-ink-700 hover:border-ink-300 transition-colors disabled:opacity-50"
                >
                  <span>{t(`status.${eventInfo.status}`)}</span>
                  <ChevronDown
                    className="w-3 h-3 text-ink-500"
                    strokeWidth={2}
                  />
                </button>

                {statusOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setStatusOpen(false)}
                    />
                    {/* Menu */}
                    <div className="absolute end-0 top-full mt-1 w-48 bg-white border border-ink-200 rounded-md shadow-lg z-50 py-1 animate-scale-in origin-top-end">
                      {EVENT_STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => statusMutation.mutate(s)}
                          disabled={s === eventInfo.status}
                          className={[
                            "w-full text-start px-3 py-2 text-body-sm transition-colors",
                            s === eventInfo.status
                              ? "bg-ink-50 text-ink-400 cursor-not-allowed font-medium"
                              : "text-ink-700 hover:bg-ink-50",
                          ].join(" ")}
                        >
                          {t(`status.${s}`)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-6">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<BarChart3 size={14} strokeWidth={1.75} />}
            onClick={() => navigate(`/organizer/events/${eventId}/analytics`)}
          >
            {t("eventDetails.analytics")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Users size={14} strokeWidth={1.75} />}
            onClick={() => navigate(`/organizer/events/${eventId}/staff`)}
          >
            {t("eventDetails.staff")}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<FileText size={14} strokeWidth={1.75} />}
            onClick={() => navigate(`/organizer/events/${eventId}/content`)}
          >
            {t("eventDetails.content")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download size={14} strokeWidth={1.75} />}
            onClick={handleExportCsv}
          >
            {t("eventDetails.exportCsv")}
          </Button>
        </div>
      </header>

      {/* ========== Stats ========== */}
      {statsData && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label={t("statsLabels.total")} value={statsData.total} />
          <StatCard
            label={t("statsLabels.pending")}
            value={statsData.pending}
            variant="warning"
          />
          <StatCard
            label={t("statsLabels.approved")}
            value={statsData.approved}
            variant="success"
          />
          <StatCard
            label={t("statsLabels.rejected")}
            value={statsData.rejected}
            variant="danger"
          />
          <StatCard
            label={t("statsLabels.checkedIn")}
            value={statsData.checkedIn}
            variant="info"
          />
        </div>
      )}

      {/* ========== Registrations Table ========== */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-ink-200">
          <CardHeader
            title={t("eventDetails.registrationsList")}
            description={t("eventDetails.registrationsCount", {
              count: registrations.length,
            })}
          />
        </div>

        {registrations.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title={t("eventDetails.noRegistrationsTitle")}
            description={t("eventDetails.noRegistrationsDescription")}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-ink-50 border-b border-ink-200">
                <tr>
                  <Th>{t("eventDetails.table.name")}</Th>
                  <Th>{t("eventDetails.table.email")}</Th>
                  <Th>{t("eventDetails.table.ticketType")}</Th>
                  <Th>{t("eventDetails.table.status")}</Th>
                  <Th>{t("eventDetails.table.actions")}</Th>
                  <Th>{t("eventDetails.table.qr")}</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {registrations.map((reg) => (
                  <RegistrationRow
                    key={reg.id}
                    registration={reg}
                    onApprove={() => approveMutation.mutate(reg.id)}
                    onReject={() => rejectMutation.mutate(reg.id)}
                    isApproving={
                      approveMutation.isPending &&
                      approveMutation.variables === reg.id
                    }
                    isRejecting={
                      rejectMutation.isPending &&
                      rejectMutation.variables === reg.id
                    }
                    t={t}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ============================================
// Stat Card
// ============================================
function StatCard({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "success" | "warning" | "danger" | "info";
}) {
  const colorMap: Record<string, string> = {
    default: "text-ink-900",
    success: "text-success-700",
    warning: "text-warning-700",
    danger: "text-danger-700",
    info: "text-info-700",
  };

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-4">
      <p className="text-caption uppercase tracking-wider font-semibold text-ink-500 mb-1.5">
        {label}
      </p>
      <p
        className={[
          "text-h2 font-semibold tabular-nums tracking-tight",
          colorMap[variant],
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

// ============================================
// Table Header
// ============================================
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-start text-caption font-semibold uppercase tracking-wider text-ink-500">
      {children}
    </th>
  );
}

// ============================================
// Registration Row
// ============================================
function RegistrationRow({
  registration: reg,
  onApprove,
  onReject,
  isApproving,
  isRejecting,
  t,
}: {
  registration: Registration;
  onApprove: () => void;
  onReject: () => void;
  isApproving: boolean;
  isRejecting: boolean;
  t: (key: string) => string;
}) {
  return (
    <tr className="hover:bg-ink-50/50 transition-colors">
      <td className="px-6 py-4">
        <p className="text-body-sm font-medium text-ink-900">{reg.fullName}</p>
        {reg.organization && (
          <p className="text-caption text-ink-500 mt-0.5">{reg.organization}</p>
        )}
      </td>

      <td className="px-6 py-4">
        <p className="text-body-sm text-ink-700" dir="ltr">
          {reg.email}
        </p>
      </td>

      {/* ✅ Ticket Type - Fixed */}
      <td className="px-6 py-4">
        {reg.ticketType ? (
          <span
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-caption font-medium rounded-sm border"
            style={{
              backgroundColor: `${reg.ticketType.color || "#B08D57"}15`,
              borderColor: `${reg.ticketType.color || "#B08D57"}40`,
              color: reg.ticketType.color || "#B08D57",
            }}
          >
            <Ticket size={11} strokeWidth={2} />
            {reg.ticketType.name}
          </span>
        ) : (
          <span className="text-caption text-ink-400">—</span>
        )}
      </td>

      <td className="px-6 py-4">
        <Badge variant={STATUS_VARIANT[reg.status]} size="sm">
          {t(`status.${reg.status}`)}
        </Badge>
      </td>

      <td className="px-6 py-4">
        {reg.status === "PENDING" ? (
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              loading={isApproving}
              onClick={onApprove}
              leftIcon={<CheckCircle2 size={13} strokeWidth={2} />}
            >
              {t("eventDetails.approve")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              loading={isRejecting}
              onClick={onReject}
              leftIcon={<XCircle size={13} strokeWidth={2} />}
            >
              {t("eventDetails.reject")}
            </Button>
          </div>
        ) : (
          <span className="text-caption text-ink-400">—</span>
        )}
      </td>

      <td className="px-6 py-4">
        {reg.checkInToken ? (
          <div className="flex flex-col gap-1">
            <code className="text-[11px] text-ink-600 bg-ink-100 px-2 py-1 rounded-sm font-mono tabular-nums">
              {reg.checkInToken.token.slice(0, 8)}...
            </code>
            {reg.checkIn ? (
              <span className="inline-flex items-center gap-1 text-caption text-success-700">
                <CheckCircle2 size={11} strokeWidth={2} />
                {new Date(reg.checkIn.checkedInAt).toLocaleTimeString("ar-EG", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-caption text-ink-500">
                <Clock size={11} strokeWidth={2} />
                {t("eventDetails.notCheckedIn")}
              </span>
            )}
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 text-caption text-ink-400">
            <QrCode size={12} strokeWidth={1.75} />
            {t("eventDetails.noQr")}
          </span>
        )}
      </td>
    </tr>
  );
}
