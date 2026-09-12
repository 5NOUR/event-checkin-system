import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MapPin,
  Home,
  Ticket,
  User as UserIcon,
  Mail,
  Clock,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import { Button } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

interface QrData {
  registrationId: string;
  fullName: string;
  email: string;
  event: {
    id: string;
    title: string;
    slug: string;
    date: string;
    location: string;
    status: string;
  };
  checkedIn: boolean;
  checkedInAt: string | null;
}

export default function QrDisplay() {
  const { token } = useParams<{ token: string }>();
  const { t } = useTranslation();

  const { data, isLoading, error } = useQuery({
    queryKey: ["qr", token],
    queryFn: async () => {
      const response = await apiClient.get(`/registrations/qr/${token}`);
      return response.data.data as QrData;
    },
    retry: 1,
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4 py-12">
        <Card padding="lg" className="max-w-md w-full">
          <EmptyState
            icon={AlertTriangle}
            title={t("qr.invalidTitle")}
            description={t("qr.invalidDescription")}
            action={{
              label: t("qr.backHome"),
              onClick: () => {
                window.location.href = "/";
              },
            }}
          />
        </Card>
      </div>
    );
  }

  const formattedDate = new Date(data.event.date).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const checkedInTime = data.checkedInAt
    ? new Date(data.checkedInAt).toLocaleString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "short",
      })
    : "";

  return (
    <div className="min-h-screen bg-ink-50 py-8 md:py-12">
      <div className="container-page max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors"
          >
            <Home className="w-4 h-4" strokeWidth={1.75} />
            <span>{t("qr.home")}</span>
          </Link>
          <span className="text-h4 font-semibold tracking-tight text-ink-900">
            Event<span className="text-gold-500">Check</span>
          </span>
        </div>

        {data.checkedIn ? (
          <div className="mb-6 px-4 py-3 bg-success-100 border border-success-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle2
              className="w-5 h-5 text-success-700 flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="text-body-sm font-semibold text-success-700">
                {t("qr.checkedInTitle")}
              </p>
              <p className="text-caption text-success-700/90 mt-0.5">
                {t("qr.checkedInAt", { time: checkedInTime })}
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 px-4 py-3 bg-info-100 border border-info-500/20 rounded-lg flex items-start gap-3">
            <Ticket
              className="w-5 h-5 text-info-700 flex-shrink-0 mt-0.5"
              strokeWidth={2}
            />
            <div>
              <p className="text-body-sm font-semibold text-info-700">
                {t("qr.notCheckedInTitle")}
              </p>
              <p className="text-caption text-info-700/90 mt-0.5">
                {t("qr.notCheckedInSubtitle")}
              </p>
            </div>
          </div>
        )}

        <Card padding="lg">
          <div className="text-center pb-6 border-b border-ink-200">
            <Badge variant="accent" size="md">
              {t("qr.ticketLabel")}
            </Badge>
            <h1 className="mt-4 text-h2 font-semibold text-ink-900 tracking-tight leading-tight">
              {data.event.title}
            </h1>
          </div>

          <div className="py-8 flex justify-center">
            <div className="bg-white p-6 rounded-lg border-2 border-dashed border-ink-200">
              <QRCodeSVG
                value={token || ""}
                size={220}
                level="H"
                marginSize={0}
                bgColor="#FFFFFF"
                fgColor="#171717"
              />
            </div>
          </div>

          <div className="border-t border-ink-200 pt-6 space-y-3">
            <InfoRow
              icon={<UserIcon size={14} strokeWidth={1.75} />}
              label={t("qr.attendeeName")}
              value={data.fullName}
            />
            <InfoRow
              icon={<Mail size={14} strokeWidth={1.75} />}
              label={t("qr.attendeeEmail")}
              value={data.email}
              dir="ltr"
            />
          </div>

          <div className="border-t border-ink-200 pt-6 mt-6 space-y-3">
            <InfoRow
              icon={<Calendar size={14} strokeWidth={1.75} />}
              label={t("qr.eventDate")}
              value={formattedDate}
            />
            <InfoRow
              icon={<MapPin size={14} strokeWidth={1.75} />}
              label={t("qr.eventLocation")}
              value={data.event.location}
            />
          </div>
        </Card>

        {!data.checkedIn && (
          <Card padding="md" className="mt-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center flex-shrink-0">
                <Ticket className="w-3.5 h-3.5 text-gold-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-body-sm font-medium text-ink-900">
                  {t("qr.instructionsTitle")}
                </p>
                <ul className="mt-1.5 space-y-1 text-caption text-ink-600">
                  <li>• {t("qr.instructions.keepInPhone")}</li>
                  <li>• {t("qr.instructions.doNotShare")}</li>
                  <li>• {t("qr.instructions.showAtGate")}</li>
                </ul>
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 text-center">
          <Link to={`/event/${data.event.slug}`}>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Clock size={14} strokeWidth={1.75} />}
            >
              {t("qr.viewEventDetails")}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
  dir,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-2 text-ink-500 min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-caption">{label}</span>
      </div>
      <span
        className="text-body-sm font-medium text-ink-900 text-end truncate"
        dir={dir}
      >
        {value}
      </span>
    </div>
  );
}
