import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, MapPin, Users, ArrowRight, CalendarX } from "lucide-react";
import { getPublicEvents, type EventSummary } from "../services/eventService";
import { Card } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Spinner";

export default function EventsList() {
  const { t } = useTranslation();

  const {
    data: events,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-events"],
    queryFn: getPublicEvents,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <div className="container-page py-20">
          <PageLoader label={t("common.loading")} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-ink-50">
        <div className="container-page py-20">
          <Card padding="lg">
            <EmptyState
              icon={CalendarX}
              title={t("eventsList.errorTitle")}
              description={t("eventsList.errorDescription")}
            />
          </Card>
        </div>
      </div>
    );
  }

  const eventsList = events || [];

  return (
    <div className="min-h-screen bg-ink-50">
      <section className="border-b border-ink-200 bg-white">
        <div className="container-page py-16 md:py-24 text-center">
          <p className="label-overline mb-4">{t("eventsList.label")}</p>
          <h1 className="heading-display max-w-3xl mx-auto">
            {t("eventsList.title")}
          </h1>
          <p className="mt-4 text-body-lg text-ink-600 max-w-xl mx-auto">
            {t("eventsList.subtitle")}
          </p>
        </div>
      </section>

      <section className="container-page py-12 md:py-16">
        {eventsList.length === 0 ? (
          <Card padding="lg">
            <EmptyState
              icon={CalendarX}
              title={t("eventsList.noEventsTitle")}
              description={t("eventsList.noEventsDescription")}
            />
          </Card>
        ) : (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="heading-h2">
                {t("eventsList.count", { count: eventsList.length })}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsList.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function EventCard({ event }: { event: EventSummary }) {
  const { t } = useTranslation();

  const formattedDate = new Date(event.date).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const registrations = event._count?.registrations || 0;
  const capacityPercent =
    event.capacity > 0
      ? Math.min(100, Math.round((registrations / event.capacity) * 100))
      : 0;

  const isAlmostFull = capacityPercent >= 80;

  return (
    <Link to={`/event/${event.slug}`} className="block group">
      <Card interactive padding="none" className="h-full flex flex-col">
        <div className="aspect-[16/10] bg-ink-100 overflow-hidden rounded-t-lg">
          {event.coverImageUrl ? (
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-ink-100 to-ink-200">
              <Calendar className="w-12 h-12 text-ink-400" strokeWidth={1.25} />
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col p-5">
          <h3 className="text-h4 font-semibold text-ink-900 leading-snug line-clamp-2 mb-3">
            {event.title}
          </h3>

          <p className="text-body-sm text-ink-600 line-clamp-2 leading-relaxed mb-4">
            {event.description}
          </p>

          <div className="space-y-2 mb-5">
            <div className="flex items-center gap-2 text-caption text-ink-600">
              <Calendar
                size={13}
                strokeWidth={1.75}
                className="flex-shrink-0"
              />
              <span className="tabular-nums">{formattedDate}</span>
            </div>
            {event.location && (
              <div className="flex items-center gap-2 text-caption text-ink-600">
                <MapPin
                  size={13}
                  strokeWidth={1.75}
                  className="flex-shrink-0"
                />
                <span className="line-clamp-1">{event.location}</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-4 border-t border-ink-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-caption text-ink-600">
                <Users size={12} strokeWidth={1.75} />
                <span className="tabular-nums">{event.remainingCapacity}</span>
              </div>
              {isAlmostFull && (
                <Badge variant="warning" size="sm">
                  {t("eventsList.limitedCapacity")}
                </Badge>
              )}
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

            <div className="flex items-center justify-between mt-4">
              <span className="text-caption text-ink-500 tabular-nums">
                {registrations} / {event.capacity}
              </span>
              <span className="inline-flex items-center gap-1 text-body-sm font-medium text-gold-500 group-hover:gap-2 transition-all">
                {t("eventsList.viewDetails")}
                <ArrowRight
                  size={14}
                  strokeWidth={2}
                  className="rtl:rotate-180"
                />
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
