import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BarChart3,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  DoorOpen,
  CalendarX,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../services/apiClient";
import { Card, CardHeader } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

// ============ Types ============
interface AnalyticsData {
  totalRegistrations: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  remainingCapacity: number;
  attendanceRate: number;
  hourlyActivity: { hour: number; count: number }[];
  gateActivity?: { gateName: string; count: number }[];
  ticketTypeStats?: { name: string; color: string | null; count: number }[];
  recentCheckIns: {
    attendeeName: string;
    attendeeEmail: string;
    checkedInAt: string;
    checkedBy: string;
    method: string;
  }[];
}

const PIE_COLORS = ["#CA8A04", "#16A34A", "#DC2626", "#3B82F6"];
const GOLD = "#B08D57";

export default function OrganizerAnalytics() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}/analytics`);
      return response.data.data as AnalyticsData;
    },
    enabled: !!eventId,
  });

  // ========== Memo ==========
  const pieData = useMemo(
    () =>
      data
        ? [
            { name: t("statsLabels.pending"), value: data.pending },
            { name: t("statsLabels.approved"), value: data.approved },
            { name: t("statsLabels.rejected"), value: data.rejected },
            { name: t("statsLabels.checkedIn"), value: data.checkedIn },
          ].filter((item) => item.value > 0)
        : [],
    [data, t],
  );

  const activityData = useMemo(
    () =>
      data?.hourlyActivity.map((item) => ({
        hour: `${String(item.hour).padStart(2, "0")}:00`,
        count: item.count,
      })) || [],
    [data],
  );

  // ========== Loading ==========
  if (isLoading) {
    return (
      <div className="container-page py-12">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  // ========== Error ==========
  if (error || !data) {
    return (
      <div className="container-page py-12">
        <Card padding="lg">
          <EmptyState
            icon={CalendarX}
            title={t("eventsList.errorTitle")}
            description={t("eventsList.errorDescription")}
          />
        </Card>
      </div>
    );
  }

  const hasData = data.totalRegistrations > 0;

  return (
    <div className="container-page py-8 md:py-12">
      {/* ========== Header ========== */}
      <header className="mb-8">
        <button
          onClick={() => navigate(`/organizer/events/${eventId}`)}
          className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors mb-4"
        >
          <ArrowRight
            className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
            strokeWidth={1.75}
          />
          <span>{t("analytics.backToDetails")}</span>
        </button>

        <p className="label-overline mb-2">{t("analytics.label")}</p>
        <h1 className="heading-h1">{t("analytics.title")}</h1>
        <p className="mt-1.5 text-body-sm text-ink-600">
          {t("analytics.subtitle")}
        </p>
      </header>

      {/* ========== KPI Cards ========== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <KpiCard
          label={t("statsLabels.total")}
          value={data.totalRegistrations}
          icon={<Users size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label={t("statsLabels.pending")}
          value={data.pending}
          variant="warning"
          icon={<Clock size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label={t("statsLabels.approved")}
          value={data.approved}
          variant="success"
          icon={<CheckCircle2 size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label={t("statsLabels.rejected")}
          value={data.rejected}
          variant="danger"
          icon={<XCircle size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label={t("statsLabels.checkedIn")}
          value={data.checkedIn}
          variant="info"
          icon={<DoorOpen size={16} strokeWidth={1.75} />}
        />
        <KpiCard
          label={t("statsLabels.attendanceRate")}
          value={`${data.attendanceRate}%`}
          variant="gold"
          icon={<TrendingUp size={16} strokeWidth={1.75} />}
        />
      </div>

      {/* ========== No Data ========== */}
      {!hasData ? (
        <Card padding="lg">
          <EmptyState
            icon={BarChart3}
            title={t("analytics.noDataTitle")}
            description={t("analytics.noDataDescription")}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Distribution */}
            <Card padding="lg">
              <CardHeader
                title={t("analytics.statusDistribution")}
                description={t("analytics.statusDistributionSubtitle")}
              />
              {pieData.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <EmptyState
                    icon={BarChart3}
                    title={t("common.noData")}
                    compact
                  />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      innerRadius={50}
                      dataKey="value"
                      strokeWidth={2}
                      stroke="#FFFFFF"
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid #E5E5E0",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "inherit",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>

            {/* Hourly Activity */}
            <Card padding="lg">
              <CardHeader
                title={t("analytics.checkInActivity")}
                description={t("analytics.checkInActivitySubtitle")}
              />
              {activityData.every((item) => item.count === 0) ? (
                <div className="flex items-center justify-center h-64">
                  <EmptyState
                    icon={Clock}
                    title={t("analytics.noActivityTitle")}
                    description={t("analytics.noActivityDescription")}
                    compact
                  />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={activityData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E5E0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 11, fill: "#737373" }}
                      stroke="#D4D4D4"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#737373" }}
                      stroke="#D4D4D4"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid #E5E5E0",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "inherit",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke={GOLD}
                      strokeWidth={2}
                      dot={{ r: 3, fill: GOLD }}
                      activeDot={{ r: 5, fill: GOLD }}
                      name={t("statsLabels.checkedIn")}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gate Activity */}
            {data.gateActivity && data.gateActivity.length > 0 && (
              <Card padding="lg">
                <CardHeader
                  title={t("analytics.gateActivity")}
                  description={t("analytics.gateActivitySubtitle")}
                />
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.gateActivity}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#E5E5E0"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="gateName"
                      tick={{ fontSize: 11, fill: "#737373" }}
                      stroke="#D4D4D4"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: "#737373" }}
                      stroke="#D4D4D4"
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid #E5E5E0",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "inherit",
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill={GOLD}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={60}
                      name={t("statsLabels.checkedIn")}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Ticket Type Distribution */}
            {data.ticketTypeStats && data.ticketTypeStats.length > 0 && (
              <Card padding="lg">
                <CardHeader
                  title={t("analytics.ticketTypeDistribution")}
                  description={t("analytics.ticketTypeDistributionSubtitle")}
                />
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.ticketTypeStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={90}
                      innerRadius={50}
                      dataKey="count"
                      strokeWidth={2}
                      stroke="#FFFFFF"
                    >
                      {data.ticketTypeStats.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.color || PIE_COLORS[index % PIE_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#FFFFFF",
                        border: "1px solid #E5E5E0",
                        borderRadius: "6px",
                        fontSize: "13px",
                        fontFamily: "inherit",
                      }}
                    />
                    <Legend
                      wrapperStyle={{
                        fontSize: "12px",
                        fontFamily: "inherit",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            )}
          </div>

          {/* Recent Check-ins */}
          <Card padding="none">
            <div className="px-6 py-5 border-b border-ink-200">
              <CardHeader
                title={t("analytics.recentCheckIns")}
                description={t("analytics.recentCheckInsSubtitle")}
              />
            </div>

            {data.recentCheckIns.length === 0 ? (
              <EmptyState
                icon={DoorOpen}
                title={t("analytics.noCheckInsTitle")}
                description={t("analytics.noCheckInsDescription")}
                compact
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-ink-50 border-b border-ink-200">
                    <tr>
                      <Th>{t("analytics.table.name")}</Th>
                      <Th>{t("analytics.table.email")}</Th>
                      <Th>{t("analytics.table.time")}</Th>
                      <Th>{t("analytics.table.by")}</Th>
                      <Th>{t("analytics.table.method")}</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {data.recentCheckIns.map((checkIn, index) => (
                      <tr
                        key={index}
                        className="hover:bg-ink-50/50 transition-colors"
                      >
                        <td className="px-6 py-3">
                          <p className="text-body-sm font-medium text-ink-900">
                            {checkIn.attendeeName}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-body-sm text-ink-600" dir="ltr">
                            {checkIn.attendeeEmail}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-body-sm text-ink-700 tabular-nums">
                            {new Date(checkIn.checkedInAt).toLocaleString(
                              "ar-EG",
                              {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <p className="text-body-sm text-ink-600">
                            {checkIn.checkedBy}
                          </p>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={[
                              "inline-flex items-center px-2 py-0.5 text-caption font-medium rounded-sm border",
                              checkIn.method === "QR_SCAN"
                                ? "bg-success-100 text-success-700 border-success-500/20"
                                : "bg-info-100 text-info-700 border-info-500/20",
                            ].join(" ")}
                          >
                            {checkIn.method === "QR_SCAN"
                              ? t("analytics.methodQr")
                              : t("analytics.methodManual")}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

// ============ KPI Card ============
function KpiCard({
  label,
  value,
  variant = "default",
  icon,
}: {
  label: string;
  value: number | string;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "gold";
  icon: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    default: "text-ink-900",
    success: "text-success-700",
    warning: "text-warning-700",
    danger: "text-danger-700",
    info: "text-info-700",
    gold: "text-gold-600",
  };

  const iconBgMap: Record<string, string> = {
    default: "bg-ink-100",
    success: "bg-success-100",
    warning: "bg-warning-100",
    danger: "bg-danger-100",
    info: "bg-info-100",
    gold: "bg-gold-100",
  };

  return (
    <div className="bg-white border border-ink-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-caption uppercase tracking-wider font-semibold text-ink-500">
          {label}
        </p>
        <span
          className={[
            "w-7 h-7 rounded-md flex items-center justify-center",
            iconBgMap[variant],
          ].join(" ")}
        >
          <span className={colorMap[variant]}>{icon}</span>
        </span>
      </div>
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

// ============ Table Header ============
function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-3 text-start text-caption font-semibold uppercase tracking-wider text-ink-500">
      {children}
    </th>
  );
}
