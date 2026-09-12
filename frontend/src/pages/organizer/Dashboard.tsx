import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Plus,
  MapPin,
  Users,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import CreateEventModal from "../../components/CreateEventModal";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

interface Event {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string;
  location: string;
  capacity: number;
  _count: { registrations: number };
}

const STATUS_VARIANT: Record<
  string,
  "default" | "success" | "warning" | "danger" | "info" | "accent"
> = {
  PUBLISHED: "success",
  DRAFT: "default",
  REGISTRATION_CLOSED: "warning",
  ONGOING: "info",
  COMPLETED: "default",
  CANCELLED: "danger",
};

export default function OrganizerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // ========== Auth Guard ==========
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    try {
      const user = JSON.parse(userData);
      if (user.role === "STAFF") {
        navigate("/staff/scan");
        return;
      }
      if (user.role !== "ORGANIZER" && user.role !== "ADMIN") {
        navigate("/");
        return;
      }
    } catch {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }, [navigate]);

  // ========== Fetch Events ==========
  const { data, isLoading, error } = useQuery({
    queryKey: ["organizer-events"],
    queryFn: async () => {
      const response = await apiClient.get("/events");
      return response.data.data as Event[];
    },
  });

  const events = useMemo(() => data || [], [data]);

  // ========== Aggregated Stats ==========
  const stats = useMemo(() => {
    const totalEvents = events.length;
    const activeEvents = events.filter(
      (e) => e.status === "PUBLISHED" || e.status === "ONGOING",
    ).length;
    const totalRegistrations = events.reduce(
      (sum, e) => sum + (e._count?.registrations || 0),
      0,
    );
    const totalCapacity = events.reduce((sum, e) => sum + e.capacity, 0);
    const attendanceRate =
      totalCapacity > 0
        ? Math.round((totalRegistrations / totalCapacity) * 100)
        : 0;

    return { totalEvents, activeEvents, totalRegistrations, attendanceRate };
  }, [events]);

  // ========== Loading ==========
  if (isLoading) {
    return (
      <div className="container-page py-12">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  // ========== Error ==========
  if (error) {
    return (
      <div className="container-page py-12">
        <Card padding="lg">
          <div className="text-center py-8">
            <h2 className="text-h3 font-semibold text-ink-900 mb-2">
              {t("eventsList.errorTitle")}
            </h2>
            <p className="text-body-sm text-ink-600">
              {t("eventsList.errorDescription")}
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-page py-8 md:py-12">
      {/* ========== Header ========== */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <p className="label-overline mb-2">{t("dashboard.label")}</p>
          <h1 className="heading-h1">{t("dashboard.title")}</h1>
          <p className="mt-1.5 text-body-sm text-ink-600">
            {t("dashboard.subtitle")}
          </p>
        </div>
        <Button
          variant="accent"
          size="md"
          leftIcon={<Plus size={16} strokeWidth={2} />}
          onClick={() => setIsModalOpen(true)}
          className="flex-shrink-0"
        >
          {t("dashboard.newEvent")}
        </Button>
      </header>

      {/* ========== Stats ========== */}
      {events.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard
            label={t("stats.totalEvents")}
            value={stats.totalEvents}
            icon={<Calendar size={16} strokeWidth={1.75} />}
          />
          <StatCard
            label={t("stats.activeEvents")}
            value={stats.activeEvents}
            icon={<TrendingUp size={16} strokeWidth={1.75} />}
          />
          <StatCard
            label={t("stats.totalRegistrations")}
            value={stats.totalRegistrations}
            icon={<Users size={16} strokeWidth={1.75} />}
          />
          <StatCard
            label={t("stats.attendanceRate")}
            value={`${stats.attendanceRate}%`}
            icon={<CheckCircle2 size={16} strokeWidth={1.75} />}
          />
        </div>
      )}

      {/* ========== Events Grid ========== */}
      {events.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={Calendar}
            title={t("dashboard.noEventsTitle")}
            description={t("dashboard.noEventsDescription")}
            action={{
              label: t("dashboard.createFirstEvent"),
              onClick: () => setIsModalOpen(true),
            }}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onClick={() => navigate(`/organizer/events/${event.id}`)}
            />
          ))}
        </div>
      )}

      {/* ========== Modal ========== */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}

// ============================================
// Stat Card
// ============================================
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-ink-200 rounded-lg p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-caption uppercase tracking-wider font-semibold text-ink-500">
          {label}
        </p>
        <span className="text-ink-400">{icon}</span>
      </div>
      <p className="text-h2 font-semibold tabular-nums tracking-tight text-ink-900">
        {value}
      </p>
    </div>
  );
}

// ============================================
// Event Card
// ============================================
function EventCard({ event, onClick }: { event: Event; onClick: () => void }) {
  const { t } = useTranslation();

  const registrations = event._count?.registrations || 0;
  const capacityPercent =
    event.capacity > 0
      ? Math.min(100, Math.round((registrations / event.capacity) * 100))
      : 0;

  const formattedDate = new Date(event.date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card interactive padding="none" onClick={onClick}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-h4 font-semibold text-ink-900 leading-snug line-clamp-2 flex-1">
            {event.title}
          </h3>
          <Badge variant={STATUS_VARIANT[event.status] || "default"} size="sm">
            {t(`status.${event.status}`)}
          </Badge>
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex items-center gap-2 text-body-sm text-ink-600">
            <Calendar size={14} strokeWidth={1.75} className="flex-shrink-0" />
            <span className="tabular-nums">{formattedDate}</span>
          </div>
          {event.location && (
            <div className="flex items-center gap-2 text-body-sm text-ink-600">
              <MapPin size={14} strokeWidth={1.75} className="flex-shrink-0" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-caption text-ink-500 uppercase tracking-wider font-semibold">
              {t("events.registrations")}
            </span>
            <span className="text-body-sm font-medium tabular-nums text-ink-900">
              {registrations}
              <span className="text-ink-400 font-normal">
                {" "}
                / {event.capacity}
              </span>
            </span>
          </div>
          <div className="h-1 bg-ink-100 rounded-full overflow-hidden">
            <div
              className={[
                "h-full rounded-full transition-all duration-500",
                capacityPercent >= 90
                  ? "bg-danger-500"
                  : capacityPercent >= 70
                    ? "bg-warning-500"
                    : "bg-gold-500",
              ].join(" ")}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
