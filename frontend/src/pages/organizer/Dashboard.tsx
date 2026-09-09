import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import apiClient from "../../services/apiClient";
import CreateEventModal from "../../components/CreateEventModal";
import EmptyState from "../../components/EmptyState";

interface Event {
  id: string;
  title: string;
  slug: string;
  status: string;
  date: string;
  _count: { registrations: number };
}

export default function OrganizerDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // التحقق من وجود توكن
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // جلب قائمة الفعاليات
  const { data, isLoading, error } = useQuery({
    queryKey: ["organizer-events"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      const response = await apiClient.get("/events", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as Event[];
    },
  });

  // حالة التحميل
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-[#6B6B68]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{t("common.error")}</p>
        </div>
      </div>
    );
  }

  const events = data || [];

  // حالة عدم وجود فعاليات
  if (events.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#171717]">لوحة التحكم</h1>
          <p className="text-[#6B6B68]">
            مرحباً بك! ابدأ بإنشاء فعاليتك الأولى.
          </p>
        </div>
        <EmptyState
          icon="📅"
          title="لا توجد فعاليات بعد"
          description="قم بإنشاء فعاليتك الأولى لتتمكن من إدارة التسجيلات والتحقق من الدخول."
          action={{
            label: "إنشاء فعالية جديدة",
            onClick: () => setIsModalOpen(true),
          }}
        />
        <CreateEventModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* الرأس */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#171717]">لوحة التحكم</h1>
          <p className="text-[#6B6B68]">
            إدارة فعالياتك وجميع التسجيلات الخاصة بها.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-3 bg-[#171717] text-white text-sm font-medium rounded-md hover:bg-[#2a2a2a] transition-colors shadow-sm whitespace-nowrap"
        >
          + إنشاء فعالية جديدة
        </button>
      </div>

      {/* شبكة الفعاليات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const statusColors: Record<string, string> = {
            PUBLISHED: "bg-green-100 text-green-700",
            DRAFT: "bg-gray-100 text-gray-700",
            REGISTRATION_CLOSED: "bg-yellow-100 text-yellow-700",
            ONGOING: "bg-blue-100 text-blue-700",
            COMPLETED: "bg-purple-100 text-purple-700",
            CANCELLED: "bg-red-100 text-red-700",
          };
          const statusLabels: Record<string, string> = {
            PUBLISHED: "منشور",
            DRAFT: "مسودة",
            REGISTRATION_CLOSED: "التسجيل مغلق",
            ONGOING: "قائم الآن",
            COMPLETED: "منتهي",
            CANCELLED: "ملغي",
          };

          return (
            <div
              key={event.id}
              onClick={() => navigate(`/organizer/events/${event.id}`)}
              className="bg-white border border-[#E5E5E0] rounded-lg p-6 cursor-pointer hover:shadow-md transition-all hover:border-[#B08D57] group"
            >
              <div className="flex items-start justify-between mb-3">
                <h2 className="text-xl font-bold text-[#171717] group-hover:text-[#B08D57] transition-colors">
                  {event.title}
                </h2>
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${
                    statusColors[event.status] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  {statusLabels[event.status] || event.status}
                </span>
              </div>

              <p className="text-sm text-[#6B6B68] mb-4">
                {new Date(event.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E0]">
                <span className="text-sm text-[#6B6B68]">
                  {event._count.registrations} تسجيل
                </span>
                <span className="text-sm font-medium text-[#B08D57]">
                  عرض التفاصيل →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* نموذج إنشاء الفعالية */}
      <CreateEventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
