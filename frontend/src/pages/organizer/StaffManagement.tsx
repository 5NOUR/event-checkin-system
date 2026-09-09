import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import apiClient from "../../services/apiClient";

interface StaffMember {
  id: string;
  staffId: string;
  eventId: string;
  isActive: boolean;
  assignedAt: string;
  staff: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  };
}

export default function StaffManagement() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  // حالة النموذج
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // جلب قائمة الموظفين
  const { data, isLoading } = useQuery({
    queryKey: ["staff", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/staff/event/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as StaffMember[];
    },
    enabled: !!eventId && !!token,
  });

  // إضافة موظف
  const addMutation = useMutation({
    mutationFn: async (payload: { email: string; name: string }) => {
      const response = await apiClient.post(
        `/staff/event/${eventId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      setSuccess("تم إضافة الموظف بنجاح");
      setError("");
      setEmail("");
      setName("");
      queryClient.invalidateQueries({ queryKey: ["staff", eventId] });
      setTimeout(() => setSuccess(""), 3000);
    },
    onError: (err: unknown) => {
      const errorDetails = err as {
        response?: {
          data?: {
            error?: {
              message?: string;
            };
          };
        };
      };

      setError(
        errorDetails.response?.data?.error?.message ||
          "حدث خطأ في إضافة الموظف",
      );
      setSuccess("");
    },
  });

  // إزالة موظف (تعطيل)
  const removeMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await apiClient.delete(
        `/staff/event/${eventId}/staff/${staffId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", eventId] });
    },
  });

  // إعادة تفعيل موظف
  const reactivateMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const response = await apiClient.patch(
        `/staff/event/${eventId}/staff/${staffId}/reactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff", eventId] });
    },
  });

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("البريد الإلكتروني مطلوب");
      return;
    }
    addMutation.mutate({ email, name });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <p className="text-[#6B6B68]">{t("common.loading")}</p>
      </div>
    );
  }

  const staffList = data || [];

  return (
    <div className="min-h-screen bg-[#F7F7F5] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(`/organizer/events/${eventId}`)}
            className="px-4 py-2 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
          >
            ← رجوع
          </button>
          <h1 className="text-3xl font-bold text-[#171717]">
            👥 إدارة الموظفين
          </h1>
        </div>

        {/* نموذج الإضافة */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6 mb-8">
          <h2 className="text-lg font-bold text-[#171717] mb-4">
            إضافة موظف جديد
          </h2>
          <form onSubmit={handleAddStaff} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm">
                {success}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-1">
                البريد الإلكتروني *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-1">
                الاسم (اختياري)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
                placeholder="سيتم استخدام البريد كاسم افتراضي"
              />
            </div>
            <button
              type="submit"
              disabled={addMutation.isPending}
              className="px-6 py-2 bg-[#171717] text-white rounded-md hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
            >
              {addMutation.isPending ? "جاري الإضافة..." : "إضافة موظف"}
            </button>
          </form>
        </div>

        {/* قائمة الموظفين */}
        <div className="bg-white border border-[#E5E5E0] rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-[#E5E5E0]">
            <h2 className="text-lg font-bold text-[#171717]">
              الموظفون الحاليون
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F7F7F5]">
                <tr className="text-right">
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    الاسم
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    البريد
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    الحالة
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    تاريخ التعيين
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => (
                  <tr
                    key={staff.id}
                    className="border-b border-[#E5E5E0] last:border-0"
                  >
                    <td className="px-6 py-3 text-sm text-[#171717]">
                      {staff.staff.name}
                    </td>
                    <td className="px-6 py-3 text-sm text-[#6B6B68]">
                      {staff.staff.email}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          staff.isActive && staff.staff.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {staff.isActive && staff.staff.isActive
                          ? "نشط"
                          : "غير نشط"}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-[#6B6B68]">
                      {new Date(staff.assignedAt).toLocaleDateString("ar-EG")}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      {staff.isActive && staff.staff.isActive ? (
                        <button
                          onClick={() => {
                            if (
                              window.confirm(
                                "هل أنت متأكد من تعطيل هذا الموظف؟",
                              )
                            ) {
                              removeMutation.mutate(staff.staffId);
                            }
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                          disabled={removeMutation.isPending}
                        >
                          تعطيل
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            reactivateMutation.mutate(staff.staffId);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          disabled={reactivateMutation.isPending}
                        >
                          إعادة تفعيل
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {staffList.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-8 text-center text-[#6B6B68]"
                    >
                      لا يوجد موظفون معينون لهذه الفعالية
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
