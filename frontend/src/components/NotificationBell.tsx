import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  getUnreadCount,
  type Notification,
} from "../services/notificationService";

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} د`;
  if (hours < 24) return `قبل ${hours} س`;
  if (days < 7) return `قبل ${days} يوم`;
  return date.toLocaleDateString("ar-EG");
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Unread count
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  // Latest 10 notifications
  const { data, isLoading } = useQuery({
    queryKey: ["notifications-bell"],
    queryFn: () => getNotifications({ limit: 10, offset: 0 }),
    refetchInterval: 30000,
    enabled: isOpen,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-bell"] });
      queryClient.invalidateQueries({ queryKey: ["unread-count"] });
    },
  });

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications: Notification[] = data?.notifications || [];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center w-8 h-8 text-ink-600 hover:text-ink-900 rounded-md hover:bg-ink-100 transition-colors"
        aria-label="الإشعارات"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center bg-danger-500 text-white text-[10px] font-semibold rounded-full tabular-nums">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className="absolute end-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white border border-ink-200 rounded-lg shadow-lg overflow-hidden z-50 animate-scale-in origin-top-end"
          role="dialog"
          aria-label="الإشعارات"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-12 border-b border-ink-200">
            <div className="flex items-center gap-2">
              <h3 className="text-body font-semibold text-ink-900">
                الإشعارات
              </h3>
              {unreadCount > 0 && (
                <span className="text-caption text-ink-500 tabular-nums">
                  {unreadCount} جديد
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="inline-flex items-center gap-1 text-caption font-medium text-ink-600 hover:text-ink-900 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" strokeWidth={1.75} />
                تحديد الكل
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {isLoading ? (
              <div className="p-6 text-center text-body-sm text-ink-500">
                جاري التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 px-6 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-ink-100 flex items-center justify-center mb-3">
                  <Bell className="w-4 h-4 text-ink-500" strokeWidth={1.5} />
                </div>
                <p className="text-body-sm text-ink-600">لا توجد إشعارات</p>
              </div>
            ) : (
              <ul className="divide-y divide-ink-100">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={[
                      "group relative px-4 py-3 transition-colors",
                      !notification.isRead
                        ? "bg-info-100/30"
                        : "hover:bg-ink-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      {/* Unread dot */}
                      <span
                        className={[
                          "mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0",
                          !notification.isRead
                            ? "bg-info-500"
                            : "bg-transparent",
                        ].join(" ")}
                        aria-hidden="true"
                      />

                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-ink-900 leading-snug">
                          {notification.title}
                        </p>
                        <p className="mt-0.5 text-body-sm text-ink-600 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-caption text-ink-500 tabular-nums">
                          {getTimeAgo(notification.createdAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={() =>
                              markReadMutation.mutate(notification.id)
                            }
                            disabled={markReadMutation.isPending}
                            className="w-6 h-6 inline-flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors"
                            aria-label="تحديد كمقروء"
                          >
                            <CheckCheck
                              className="w-3.5 h-3.5"
                              strokeWidth={2}
                            />
                          </button>
                        )}
                        <button
                          onClick={() => deleteMutation.mutate(notification.id)}
                          disabled={deleteMutation.isPending}
                          className="w-6 h-6 inline-flex items-center justify-center text-ink-500 hover:text-danger-500 hover:bg-danger-100/50 rounded transition-colors"
                          aria-label="حذف"
                        >
                          <X className="w-3.5 h-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-ink-200">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center py-3 text-body-sm font-medium text-ink-700 hover:bg-ink-50 hover:text-ink-900 transition-colors"
            >
              عرض جميع الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
