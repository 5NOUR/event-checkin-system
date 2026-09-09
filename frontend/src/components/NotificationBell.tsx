import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification,
} from "../services/notificationService";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function NotificationBell() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // جلب الإشعارات
  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(10, 0),
    refetchInterval: 30000, // تحديث كل 30 ثانية
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications: Notification[] = data?.notifications || [];

  // تحديد إشعار كمقروء
  const markReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // تحديد الكل كمقروء
  const markAllReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // حذف إشعار
  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  // إغلاق القائمة عند النقر خارجها
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "الآن";
    if (minutes < 60) return `${minutes} دقيقة`;
    if (hours < 24) return `${hours} ساعة`;
    return `${days} يوم`;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-[#171717] hover:bg-[#F7F7F5] rounded-full transition-colors"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E5E5E0] rounded-lg shadow-lg z-50 max-h-[500px] flex flex-col">
          {/* رأس القائمة */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5E0]">
            <h3 className="font-bold text-[#171717]">الإشعارات</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                className="text-sm text-[#6B6B68] hover:text-[#171717] transition-colors"
                disabled={markAllReadMutation.isPending}
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {/* قائمة الإشعارات */}
          <div className="overflow-y-auto flex-1">
            {isLoading ? (
              <div className="p-4 text-center text-[#6B6B68]">
                {t("common.loading")}
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-[#6B6B68]">
                <p className="text-4xl mb-2">🔔</p>
                <p>لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-[#F7F7F5] hover:bg-[#F7F7F5] transition-colors ${
                    !notification.isRead ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#171717]">
                        {notification.title}
                      </p>
                      <p className="text-sm text-[#6B6B68] truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#6B6B68] mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      {!notification.isRead && (
                        <button
                          onClick={() =>
                            markReadMutation.mutate(notification.id)
                          }
                          className="text-xs text-blue-600 hover:text-blue-800"
                          disabled={markReadMutation.isPending}
                        >
                          قراءة
                        </button>
                      )}
                      <button
                        onClick={() => deleteMutation.mutate(notification.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                        disabled={deleteMutation.isPending}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* رابط "عرض الكل" */}
          <div className="px-4 py-2 border-t border-[#E5E5E0] text-center">
            <Link
              to="/notifications"
              className="text-sm text-[#6B6B68] hover:text-[#171717] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              عرض جميع الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
