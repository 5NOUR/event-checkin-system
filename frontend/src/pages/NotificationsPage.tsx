import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  Bell,
  BellOff,
  CheckCheck,
  Trash2,
  FileText,
  UserPlus,
  Calendar,
  RefreshCw,
  Settings,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
  type GetNotificationsParams,
} from "../services/notificationService";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageLoader } from "../components/ui/Spinner";
import type { TFunction } from "i18next";

type NotificationTypeIcon = typeof Bell;

const TYPE_CONFIG: Record<
  string,
  {
    icon: NotificationTypeIcon;
    labelKey: string;
    colorClass: string;
  }
> = {
  registration: {
    icon: FileText,
    labelKey: "notifications.types.registration",
    colorClass: "text-info-700 bg-info-100",
  },
  approval: {
    icon: CheckCircle2,
    labelKey: "notifications.types.approval",
    colorClass: "text-success-700 bg-success-100",
  },
  rejection: {
    icon: XCircle,
    labelKey: "notifications.types.rejection",
    colorClass: "text-danger-700 bg-danger-100",
  },
  waitlist_promotion: {
    icon: RefreshCw,
    labelKey: "notifications.types.waitlist_promotion",
    colorClass: "text-gold-700 bg-gold-100",
  },
  reminder: {
    icon: Clock,
    labelKey: "notifications.types.reminder",
    colorClass: "text-warning-700 bg-warning-100",
  },
  system: {
    icon: Settings,
    labelKey: "notifications.types.system",
    colorClass: "text-ink-700 bg-ink-100",
  },
  event_update: {
    icon: Calendar,
    labelKey: "notifications.types.event_update",
    colorClass: "text-info-700 bg-info-100",
  },
  staff_assignment: {
    icon: UserPlus,
    labelKey: "notifications.types.staff_assignment",
    colorClass: "text-gold-700 bg-gold-100",
  },
};

const DEFAULT_TYPE_CONFIG = {
  icon: Bell,
  labelKey: "notifications.title",
  colorClass: "text-ink-700 bg-ink-100",
};

function formatTimeAgo(
  dateString: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _t: TFunction<"translation", undefined>,
): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} د`;
  if (hours < 24) return `قبل ${hours} س`;
  if (days < 7) return `قبل ${days} ي`;
  return date.toLocaleDateString("ar-EG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filterType, setFilterType] = useState("");
  const [filterRead, setFilterRead] = useState("");

  const buildQueryParams = (): GetNotificationsParams => {
    const params: GetNotificationsParams = { limit: 50, offset: 0 };
    if (filterType) params.type = filterType;
    if (filterRead === "read") params.isRead = true;
    if (filterRead === "unread") params.isRead = false;
    return params;
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["notifications", filterType, filterRead],
    queryFn: () => getNotifications(buildQueryParams()),
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
    },
  });

  if (isLoading) {
    return (
      <div className="container-page py-12">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-page py-12">
        <Card padding="lg">
          <EmptyState
            icon={AlertCircle}
            title={t("errors.serverError")}
            description={t("errors.tryAgain")}
          />
        </Card>
      </div>
    );
  }

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="container-page py-8 md:py-12 max-w-4xl">
      <header className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-body-sm text-ink-600 hover:text-ink-900 transition-colors mb-4"
        >
          <ArrowRight
            className="w-4 h-4 rtl:rotate-0 ltr:rotate-180"
            strokeWidth={1.75}
          />
          <span>{t("common.back")}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p className="label-overline mb-2">{t("notifications.title")}</p>
            <div className="flex items-center gap-3">
              <h1 className="heading-h1">{t("notifications.allTitle")}</h1>
              {unreadCount > 0 && (
                <Badge variant="danger" size="md">
                  {t("notifications.unreadCount", { count: unreadCount })}
                </Badge>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              loading={markAllReadMutation.isPending}
              leftIcon={<CheckCheck size={14} strokeWidth={2} />}
            >
              {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
      </header>

      <Card padding="md" className="mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-body-sm font-medium text-ink-700">
              {t("notifications.filterType")}:
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-9 px-3 rounded-md border border-ink-200 bg-white text-body-sm focus:outline-none focus:border-ink-900 cursor-pointer"
            >
              <option value="">{t("notifications.filterAll")}</option>
              <option value="registration">
                {t("notifications.typeOptions.registration")}
              </option>
              <option value="approval">
                {t("notifications.typeOptions.approval")}
              </option>
              <option value="rejection">
                {t("notifications.typeOptions.rejection")}
              </option>
              <option value="waitlist_promotion">
                {t("notifications.typeOptions.waitlist_promotion")}
              </option>
              <option value="reminder">
                {t("notifications.typeOptions.reminder")}
              </option>
              <option value="system">
                {t("notifications.typeOptions.system")}
              </option>
              <option value="event_update">
                {t("notifications.typeOptions.event_update")}
              </option>
              <option value="staff_assignment">
                {t("notifications.typeOptions.staff_assignment")}
              </option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-body-sm font-medium text-ink-700">
              {t("notifications.filterStatus")}:
            </label>
            <select
              value={filterRead}
              onChange={(e) => setFilterRead(e.target.value)}
              className="h-9 px-3 rounded-md border border-ink-200 bg-white text-body-sm focus:outline-none focus:border-ink-900 cursor-pointer"
            >
              <option value="">{t("notifications.filterAll")}</option>
              <option value="unread">{t("notifications.filterUnread")}</option>
              <option value="read">{t("notifications.filterRead")}</option>
            </select>
          </div>

          <div className="ms-auto text-caption text-ink-500 tabular-nums">
            {t("notifications.count", { count: notifications.length })}
          </div>
        </div>
      </Card>

      {notifications.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={BellOff}
            title={t("notifications.noNotifications")}
            description={
              filterType || filterRead
                ? t("notifications.noMatchingNotifications")
                : t("notifications.noNotificationsDescription")
            }
          />
        </Card>
      ) : (
        <Card padding="none">
          <ul className="divide-y divide-ink-100">
            {notifications.map((notification: Notification) => {
              const config =
                TYPE_CONFIG[notification.type] || DEFAULT_TYPE_CONFIG;
              const Icon = config.icon;

              return (
                <li
                  key={notification.id}
                  className={[
                    "group relative px-5 py-4 transition-colors",
                    !notification.isRead
                      ? "bg-info-100/20"
                      : "hover:bg-ink-50/50",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={[
                        "w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0",
                        config.colorClass,
                      ].join(" ")}
                    >
                      <Icon className="w-4 h-4" strokeWidth={1.75} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-body font-medium text-ink-900">
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span
                                className="w-1.5 h-1.5 rounded-full bg-info-500 flex-shrink-0"
                                aria-label="unread"
                              />
                            )}
                            <Badge
                              variant="default"
                              size="sm"
                              className="!text-micro !normal-case"
                            >
                              {t(config.labelKey)}
                            </Badge>
                          </div>
                          <p className="mt-1 text-body-sm text-ink-600 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="mt-1.5 text-caption text-ink-500 tabular-nums">
                            {formatTimeAgo(notification.createdAt, t)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() =>
                                markReadMutation.mutate(notification.id)
                              }
                              disabled={markReadMutation.isPending}
                              className="w-7 h-7 inline-flex items-center justify-center text-ink-500 hover:text-success-700 hover:bg-success-100 rounded-md transition-colors disabled:opacity-50"
                              aria-label={t("notifications.markRead")}
                              title={t("notifications.markRead")}
                            >
                              <CheckCheck
                                className="w-3.5 h-3.5"
                                strokeWidth={2}
                              />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(t("common.confirmDelete"))) {
                                deleteMutation.mutate(notification.id);
                              }
                            }}
                            disabled={deleteMutation.isPending}
                            className="w-7 h-7 inline-flex items-center justify-center text-ink-500 hover:text-danger-600 hover:bg-danger-100 rounded-md transition-colors disabled:opacity-50"
                            aria-label={t("common.delete")}
                            title={t("common.delete")}
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}
    </div>
  );
}
