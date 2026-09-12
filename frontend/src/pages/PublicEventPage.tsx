import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Mic,
  HelpCircle,
  Handshake,
  Camera,
  CheckCircle2,
  AlertTriangle,
  CalendarPlus,
  Send,
  Ticket as TicketIcon,
} from "lucide-react";
import {
  getPublicEvent,
  type PublicEvent,
  type TicketType,
} from "../services/eventService";
import {
  registerAttendee,
  type RegistrationInput,
} from "../services/registrationService";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Spinner";

function generateICS(event: PublicEvent): string {
  const startDate = new Date(
    `${event.date.split("T")[0]}T${event.startTime}:00`,
  );
  const endDate = new Date(`${event.date.split("T")[0]}T${event.endTime}:00`);

  const formatDate = (date: Date) =>
    date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventCheck//Event//AR",
    "BEGIN:VEVENT",
    `UID:${event.id}@eventcheck`,
    `DTSTAMP:${formatDate(new Date())}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.description}`,
    `LOCATION:${event.location}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

function downloadICS(event: PublicEvent) {
  const ics = generateICS(event);
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.slug}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function PublicEventPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const eventSlug = slug || "";
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState("");
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery<PublicEvent>({
    queryKey: ["event", eventSlug],
    queryFn: () => getPublicEvent(eventSlug),
    enabled: !!eventSlug,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationInput>();

  const mutation = useMutation({
    mutationFn: registerAttendee,
    onSuccess: () => {
      setRegistrationSuccess(true);
      reset();
      setSelectedTicketTypeId("");
      refetch();
      setTimeout(() => setRegistrationSuccess(false), 8000);
    },
  });

  const onSubmit = (data: RegistrationInput) => {
    mutation.mutate({
      ...data,
      eventSlug,
      ticketTypeId: selectedTicketTypeId || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-md w-full">
          <EmptyState
            icon={AlertTriangle}
            title={t("publicEvent.notFoundTitle")}
            description={t("publicEvent.notFoundDescription")}
          />
        </Card>
      </div>
    );
  }

  const canRegister =
    event.status !== "CANCELLED" && event.status !== "COMPLETED";
  const isFull = event.remainingCapacity <= 0;
  const hasTicketTypes = event.ticketTypes && event.ticketTypes.length > 0;
  const ticketTypeRequired = hasTicketTypes && !selectedTicketTypeId;

  const registeredCount = event.capacity - event.remainingCapacity;
  const capacityPercent = Math.min(
    100,
    Math.round((registeredCount / event.capacity) * 100),
  );

  return (
    <div className="min-h-screen bg-ink-50">
      <HeroSection event={event} t={t} />

      <div className="container-page py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
          <div className="lg:col-span-2 space-y-14">
            <Section title={t("publicEvent.aboutEvent")} t={t}>
              <p className="text-body-lg text-ink-700 leading-loose whitespace-pre-line">
                {event.description}
              </p>
            </Section>

            {event.speakers && event.speakers.length > 0 && (
              <Section
                title={t("publicEvent.speakers")}
                icon={<Mic size={18} strokeWidth={1.75} />}
                t={t}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.speakers.map((speaker) => (
                    <div
                      key={speaker.id}
                      className="bg-white border border-ink-200 rounded-lg p-5"
                    >
                      <div className="flex items-start gap-4">
                        {speaker.imageUrl ? (
                          <img
                            src={speaker.imageUrl}
                            alt={speaker.name}
                            className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-h3 font-semibold text-gold-600">
                              {speaker.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-h4 font-semibold text-ink-900 leading-snug">
                            {speaker.name}
                          </h4>
                          {speaker.title && (
                            <p className="text-body-sm text-gold-600 font-medium mt-0.5">
                              {speaker.title}
                            </p>
                          )}
                          {speaker.bio && (
                            <p className="text-body-sm text-ink-600 mt-2 line-clamp-3 leading-relaxed">
                              {speaker.bio}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {event.agendaItems && event.agendaItems.length > 0 && (
              <Section
                title={t("publicEvent.agenda")}
                icon={<Calendar size={18} strokeWidth={1.75} />}
                t={t}
              >
                <div className="border border-ink-200 rounded-lg overflow-hidden bg-white divide-y divide-ink-100">
                  {event.agendaItems.map((item) => (
                    <div key={item.id} className="p-5">
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="sm:w-32 flex-shrink-0">
                          <span className="inline-block text-caption font-semibold tabular-nums text-gold-600 bg-gold-100/50 px-2 py-1 rounded-sm">
                            {item.time}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-h4 font-semibold text-ink-900 leading-snug">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-body-sm text-ink-600 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                          )}
                          {item.speaker && (
                            <div className="flex items-center gap-2 mt-3">
                              <span className="text-caption text-ink-600">
                                {item.speaker.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {event.galleryImages && event.galleryImages.length > 0 && (
              <Section
                title={t("publicEvent.gallery")}
                icon={<Camera size={18} strokeWidth={1.75} />}
                t={t}
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {event.galleryImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden border border-ink-200 group"
                    >
                      <img
                        src={image.imageUrl}
                        alt={image.caption || ""}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {image.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/80 to-transparent p-3">
                          <p className="text-caption text-white font-medium">
                            {image.caption}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {event.location && (
              <Section
                title={t("publicEvent.location")}
                icon={<MapPin size={18} strokeWidth={1.75} />}
                t={t}
              >
                <div className="rounded-lg overflow-hidden border border-ink-200 bg-white">
                  <iframe
                    title="Location"
                    width="100%"
                    height="320"
                    frameBorder="0"
                    scrolling="no"
                    src="https://www.openstreetmap.org/export/embed.html?bbox=30.0%2C31.0%2C32.0%2C32.0&layer=mapnik&marker=31.0%2C31.0"
                  />
                  <div className="px-4 py-3 border-t border-ink-200 bg-ink-50">
                    <p className="text-body-sm text-ink-700 text-center">
                      {event.location}
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {event.sponsors && event.sponsors.length > 0 && (
              <Section
                title={t("publicEvent.sponsors")}
                icon={<Handshake size={18} strokeWidth={1.75} />}
                t={t}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {event.sponsors.map((sponsor) => (
                    <a
                      key={sponsor.id}
                      href={sponsor.websiteUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-ink-200 rounded-lg p-4 flex flex-col items-center justify-center h-28 hover:border-ink-300 transition-colors"
                    >
                      {sponsor.logoUrl ? (
                        <img
                          src={sponsor.logoUrl}
                          alt={sponsor.name}
                          className="max-h-12 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-body-sm font-semibold text-ink-900 text-center">
                          {sponsor.name}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </Section>
            )}

            {event.faqs && event.faqs.length > 0 && (
              <Section
                title={t("publicEvent.faqs")}
                icon={<HelpCircle size={18} strokeWidth={1.75} />}
                t={t}
              >
                <div className="space-y-2">
                  {event.faqs.map((faq) => (
                    <details
                      key={faq.id}
                      className="group bg-white border border-ink-200 rounded-lg"
                    >
                      <summary className="px-5 py-4 cursor-pointer flex items-center justify-between gap-3 list-none hover:bg-ink-50/50 transition-colors rounded-lg">
                        <span className="text-body font-medium text-ink-900">
                          {faq.question}
                        </span>
                        <Plus
                          size={16}
                          strokeWidth={2}
                          className="text-ink-500 group-open:rotate-45 transition-transform duration-200 flex-shrink-0"
                        />
                      </summary>
                      <div className="px-5 py-4 border-t border-ink-100 text-body-sm text-ink-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column: Registration */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24" id="register">
              <Card padding="lg" className="shadow-sm">
                <div className="mb-6">
                  <p className="label-overline mb-2">
                    {t("publicEvent.registration.label")}
                  </p>
                  <h2 className="text-h3 font-semibold text-ink-900 tracking-tight">
                    {t("publicEvent.registration.title")}
                  </h2>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between text-caption mb-2">
                    <span className="text-ink-600">
                      {t("publicEvent.registration.capacity")}
                    </span>
                    <span className="font-semibold tabular-nums text-ink-900">
                      {registeredCount} / {event.capacity}
                    </span>
                  </div>
                  <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
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
                  <p className="text-caption text-ink-500 mt-2">
                    {isFull
                      ? t("publicEvent.registration.capacityFull")
                      : t("publicEvent.registration.remainingSeats", {
                          count: event.remainingCapacity,
                        })}
                  </p>
                </div>

                {registrationSuccess && !mutation.data?.waitlisted && (
                  <MessageBanner
                    variant="success"
                    icon={<CheckCircle2 size={16} strokeWidth={2} />}
                    title={t("publicEvent.registration.successTitle")}
                    description={t(
                      "publicEvent.registration.successDescription",
                    )}
                  />
                )}

                {mutation.data?.waitlisted && (
                  <MessageBanner
                    variant="info"
                    icon={<Clock size={16} strokeWidth={2} />}
                    title={t("publicEvent.registration.waitlistTitle")}
                    description={
                      mutation.data.message ||
                      t("publicEvent.registration.waitlistDescription")
                    }
                  />
                )}

                {mutation.isError && (
                  <MessageBanner
                    variant="danger"
                    icon={<AlertTriangle size={16} strokeWidth={2} />}
                    title={t("publicEvent.registration.errorTitle")}
                    description={
                      mutation.error?.message || t("errors.unexpectedError")
                    }
                  />
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {hasTicketTypes && (
                    <div>
                      <label className="block text-body-sm font-medium text-ink-900 mb-2">
                        {t("publicEvent.registration.ticketType")}
                        <span className="text-danger-500 ms-0.5">*</span>
                      </label>
                      <div className="space-y-2">
                        {event.ticketTypes.map((tt) => (
                          <TicketTypeOption
                            key={tt.id}
                            ticketType={tt}
                            selected={selectedTicketTypeId === tt.id}
                            onSelect={() => setSelectedTicketTypeId(tt.id)}
                            t={t}
                          />
                        ))}
                      </div>
                      {ticketTypeRequired && (
                        <p className="mt-1.5 text-caption text-danger-500">
                          {t("publicEvent.registration.ticketTypeRequired")}
                        </p>
                      )}
                    </div>
                  )}

                  <Input
                    label={t("publicEvent.registration.fullName")}
                    placeholder={t(
                      "publicEvent.registration.fullNamePlaceholder",
                    )}
                    required
                    error={
                      errors.fullName ? t("validation.required") : undefined
                    }
                    {...register("fullName", {
                      required: true,
                      minLength: 3,
                    })}
                  />

                  <Input
                    label={t("publicEvent.registration.email")}
                    type="email"
                    placeholder={t("publicEvent.registration.emailPlaceholder")}
                    required
                    dir="ltr"
                    error={
                      errors.email ? t("validation.emailInvalid") : undefined
                    }
                    {...register("email", { required: true })}
                  />

                  <Input
                    label={t("publicEvent.registration.phone")}
                    placeholder={t("publicEvent.registration.phonePlaceholder")}
                    dir="ltr"
                    {...register("phone")}
                  />

                  <Input
                    label={t("publicEvent.registration.organization")}
                    placeholder={t(
                      "publicEvent.registration.organizationPlaceholder",
                    )}
                    {...register("organization")}
                  />

                  <Input
                    label={t("publicEvent.registration.jobTitle")}
                    placeholder={t(
                      "publicEvent.registration.jobTitlePlaceholder",
                    )}
                    {...register("jobTitle")}
                  />

                  <Button
                    type="submit"
                    variant="accent"
                    size="lg"
                    fullWidth
                    loading={mutation.isPending}
                    disabled={ticketTypeRequired || !canRegister}
                    rightIcon={<Send size={15} strokeWidth={2} />}
                  >
                    {!canRegister
                      ? t("publicEvent.registration.submitClosed")
                      : isFull
                        ? t("publicEvent.registration.submitWaitlist")
                        : t("publicEvent.registration.submit")}
                  </Button>
                </form>

                <p className="mt-4 text-caption text-ink-500 text-center leading-relaxed">
                  {t("publicEvent.registration.termsNote")}
                </p>
              </Card>

              <div className="mt-4 px-5 py-4 bg-white border border-ink-200 rounded-lg">
                <p className="label-overline mb-1">
                  {t("publicEvent.registration.organizerLabel")}
                </p>
                <p className="text-body-sm font-medium text-ink-900">
                  {event.organizer.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Hero Section
// ============================================
function HeroSection({
  event,
  t,
}: {
  event: PublicEvent;
  t: (key: string) => string;
}) {
  const formattedDate = new Date(event.date).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const statusVariant: Record<
    string,
    "success" | "info" | "warning" | "default" | "danger"
  > = {
    PUBLISHED: "success",
    ONGOING: "info",
    REGISTRATION_CLOSED: "warning",
    COMPLETED: "default",
    CANCELLED: "danger",
  };

  return (
    <section className="relative bg-ink-950 text-white overflow-hidden">
      {event.coverImageUrl && (
        <div className="absolute inset-0">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/85 to-ink-950/50" />
        </div>
      )}

      <div className="relative container-page py-16 md:py-24">
        <div className="mb-6">
          <Badge variant={statusVariant[event.status] || "default"} dot>
            {t(`publicEvent.statusLabels.${event.status}`)}
          </Badge>
        </div>

        <h1 className="text-display sm:text-display-lg md:text-display-xl font-semibold tracking-tight max-w-4xl leading-[1.05] text-white">
          {event.title}
        </h1>

        <p className="mt-6 text-body-lg md:text-[17px] text-ink-300 max-w-3xl leading-relaxed line-clamp-2">
          {event.description}
        </p>

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4">
          <InfoPill
            icon={<Calendar size={16} strokeWidth={1.75} />}
            label={formattedDate}
          />
          <InfoPill
            icon={<Clock size={16} strokeWidth={1.75} />}
            label={`${event.startTime} — ${event.endTime}`}
          />
          {event.location && (
            <InfoPill
              icon={<MapPin size={16} strokeWidth={1.75} />}
              label={event.location}
            />
          )}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <a href="#register">
            <Button
              variant="accent"
              size="lg"
              leftIcon={<TicketIcon size={16} strokeWidth={2} />}
            >
              {t("publicEvent.registerNow")}
            </Button>
          </a>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => downloadICS(event)}
            leftIcon={<CalendarPlus size={16} strokeWidth={2} />}
            className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20 hover:!border-white/30"
          >
            {t("publicEvent.addToCalendar")}
          </Button>
        </div>
      </div>
    </section>
  );
}

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  t: (key: string) => string;
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5 mb-5">
        {icon && <span className="text-gold-500">{icon}</span>}
        <h2 className="text-h2 font-semibold text-ink-900 tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2.5 text-body-sm text-ink-300">
      <span className="text-ink-400">{icon}</span>
      <span className="tabular-nums">{label}</span>
    </div>
  );
}

function TicketTypeOption({
  ticketType,
  selected,
  onSelect,
}: {
  ticketType: TicketType;
  selected: boolean;
  onSelect: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: (key: string, options?: any) => string;
}) {
  const remaining = ticketType.capacity
    ? ticketType.capacity - (ticketType._count?.registrations || 0)
    : null;
  const isFull = remaining !== null && remaining <= 0;

  return (
    <label
      className={[
        "flex items-center gap-3 p-3 border rounded-md transition-colors",
        isFull
          ? "border-ink-200 bg-ink-50 opacity-60 cursor-not-allowed"
          : selected
            ? "border-gold-500 bg-gold-100/30 cursor-pointer"
            : "border-ink-200 hover:border-ink-300 hover:bg-ink-50 cursor-pointer",
      ].join(" ")}
    >
      <input
        type="radio"
        name="ticketType"
        checked={selected}
        onChange={onSelect}
        disabled={isFull}
        className="sr-only"
      />
      <span
        className={[
          "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors",
          selected ? "border-gold-500" : "border-ink-300",
        ].join(" ")}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-gold-500" />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {ticketType.color && (
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: ticketType.color }}
            />
          )}
          <span className="text-body-sm font-medium text-ink-900 truncate">
            {ticketType.name}
          </span>
        </div>
        {ticketType.description && (
          <p className="text-caption text-ink-500 mt-0.5 truncate">
            {ticketType.description}
          </p>
        )}
      </div>
      {remaining !== null && (
        <span
          className={[
            "text-caption font-medium tabular-nums flex-shrink-0",
            isFull ? "text-danger-500" : "text-ink-600",
          ].join(" ")}
        >
          {isFull ? "مكتمل" : `${remaining} متبقي`}
        </span>
      )}
    </label>
  );
}

function MessageBanner({
  variant,
  icon,
  title,
  description,
}: {
  variant: "success" | "danger" | "info" | "warning";
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  const styles = {
    success: "bg-success-100 border-success-500/20 text-success-700",
    danger: "bg-danger-100 border-danger-500/20 text-danger-700",
    info: "bg-info-100 border-info-500/20 text-info-700",
    warning: "bg-warning-100 border-warning-500/20 text-warning-700",
  };

  return (
    <div
      className={`mb-4 p-4 border rounded-md flex items-start gap-3 ${styles[variant]}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-semibold">{title}</p>
        <p className="text-caption mt-0.5 opacity-90 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
