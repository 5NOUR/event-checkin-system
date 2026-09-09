import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import apiClient from "../../services/apiClient";
import { useSocket } from "../../hooks/useSocket";
import EmptyState from "../../components/EmptyState";

// أنواع البيانات
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

export default function OrganizerEventDetails() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  // ✅ استخدام Socket.IO للتحديثات اللحظية
  const { socketRef, isConnected } = useSocket(eventId);

  // جلب التسجيلات
  const {
    data: registrationsData,
    isLoading: registrationsLoading,
    error: registrationsError,
  } = useQuery({
    queryKey: ["registrations", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/registrations/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as Registration[];
    },
    enabled: !!eventId && !!token,
  });

  // جلب الإحصائيات
  const { data: statsData } = useQuery({
    queryKey: ["event-stats", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as Stats;
    },
    enabled: !!eventId && !!token,
  });

  // ✅ الاستماع للتحديثات اللحظية
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleCheckInUpdate = (data: unknown) => {
      console.log("📡 Real-time check-in received:", data);
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
    };

    socket.on("checkin-update", handleCheckInUpdate);

    return () => {
      socket.off("checkin-update", handleCheckInUpdate);
    };
  }, [socketRef, queryClient, eventId]);

  // ✅ التصدير إلى CSV
  const handleExportCsv = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/export/event/${eventId}/csv`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("فشل في تصدير البيانات");
      }

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
      console.error("خطأ في التصدير:", error);
      alert("حدث خطأ أثناء تصدير البيانات");
    }
  };

  // ✅ الموافقة على تسجيل
  const approveMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await apiClient.post(
        `/registrations/${registrationId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
    },
  });

  // ✅ رفض تسجيل
  const rejectMutation = useMutation({
    mutationFn: async (registrationId: string) => {
      const response = await apiClient.post(
        `/registrations/${registrationId}/reject`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations", eventId] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", eventId] });
    },
  });

  // حالة التحميل
  if (registrationsLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-[#6B6B68]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  // حالة الخطأ
  if (registrationsError) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{t("common.error")}</p>
        </div>
      </div>
    );
  }

  const registrations = registrationsData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* رأس الصفحة مع الأزرار */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <button
          onClick={() => navigate("/organizer")}
          className="px-4 py-2 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
        >
          ← رجوع
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-[#171717] flex-1">
          تفاصيل الفعالية
        </h1>

        {/* ✅ حالة الاتصال اللحظي */}
        <span
          className={`text-sm px-3 py-1 rounded-full ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
        >
          {isConnected ? "🟢 مباشر" : "🔴 غير متصل"}
        </span>

        <button
          onClick={() => navigate(`/organizer/events/${eventId}/analytics`)}
          className="px-4 py-2 text-sm bg-[#B08D57] text-white rounded-md hover:bg-[#9a7a4a] transition-colors"
        >
          📊 تحليلات
        </button>

        <button
          onClick={() => navigate(`/organizer/events/${eventId}/staff`)}
          className="px-4 py-2 text-sm bg-[#6B6B68] text-white rounded-md hover:bg-[#555] transition-colors"
        >
          👥 إدارة الموظفين
        </button>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          📥 تصدير CSV
        </button>
      </div>

      {/* ✅ الإحصائيات */}
      {statsData && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-[#171717]">
              {statsData.total}
            </p>
            <p className="text-sm text-[#6B6B68]">الإجمالي</p>
          </div>
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">
              {statsData.pending}
            </p>
            <p className="text-sm text-[#6B6B68]">معلق</p>
          </div>
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {statsData.approved}
            </p>
            <p className="text-sm text-[#6B6B68]">مقبول</p>
          </div>
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-red-600">
              {statsData.rejected}
            </p>
            <p className="text-sm text-[#6B6B68]">مرفوض</p>
          </div>
          <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {statsData.checkedIn}
            </p>
            <p className="text-sm text-[#6B6B68]">مُدخل</p>
          </div>
        </div>
      )}

      {/* ✅ جدول التسجيلات */}
      <div className="bg-white border border-[#E5E5E0] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E0] bg-[#F7F7F5]">
          <h2 className="text-lg font-bold text-[#171717]">
            📋 قائمة التسجيلات
          </h2>
        </div>

        {registrations.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              icon="📋"
              title="لا توجد تسجيلات"
              description="لم يقم أي شخص بالتسجيل في هذه الفعالية بعد. شارك الرابط العام للفعالية لجذب الحضور."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F7F5] border-b border-[#E5E5E0]">
                <tr className="text-right">
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68] text-right">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68] text-right">
                    البريد
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68] text-right">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68] text-right">
                    الإجراءات
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68] text-right">
                    رمز QR
                  </th>
                </tr>
              </thead>
              <tbody>
                {registrations.map((reg) => (
                  <tr
                    key={reg.id}
                    className="border-b border-[#E5E5E0] last:border-0 hover:bg-[#F7F7F5] transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-[#171717]">
                      {reg.fullName}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#6B6B68]">
                      {reg.email}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          reg.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : reg.status === "APPROVED"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {reg.status === "PENDING" && "معلق"}
                        {reg.status === "APPROVED" && "مقبول"}
                        {reg.status === "REJECTED" && "مرفوض"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {reg.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => approveMutation.mutate(reg.id)}
                            disabled={approveMutation.isPending}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                          >
                            قبول
                          </button>
                          <button
                            onClick={() => rejectMutation.mutate(reg.id)}
                            disabled={rejectMutation.isPending}
                            className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            رفض
                          </button>
                        </div>
                      )}
                      {(reg.status === "APPROVED" ||
                        reg.status === "REJECTED") && (
                        <span className="text-xs text-[#6B6B68]">
                          {reg.status === "APPROVED" &&
                            reg.approvedAt &&
                            `تمت الموافقة ${new Date(reg.approvedAt).toLocaleDateString("ar-EG")}`}
                          {reg.status === "REJECTED" &&
                            reg.rejectedAt &&
                            `تم الرفض ${new Date(reg.rejectedAt).toLocaleDateString("ar-EG")}`}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {reg.checkInToken ? (
                        <div className="flex flex-col items-start">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {reg.checkInToken.token.slice(0, 8)}...
                          </code>
                          <span className="text-xs text-[#6B6B68] mt-1">
                            {reg.checkIn
                              ? `✅ دخل في ${new Date(reg.checkIn.checkedInAt).toLocaleTimeString("ar-EG")}`
                              : "⏳ لم يدخل بعد"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#6B6B68]">لا يوجد</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
