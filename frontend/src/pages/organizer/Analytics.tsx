import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import apiClient from "../../services/apiClient";
import EmptyState from "../../components/EmptyState";

interface AnalyticsData {
  totalRegistrations: number;
  pending: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  remainingCapacity: number;
  attendanceRate: number;
  hourlyActivity: { hour: number; count: number }[];
  recentCheckIns: {
    attendeeName: string;
    attendeeEmail: string;
    checkedInAt: string;
    checkedBy: string;
    method: string;
  }[];
}

export default function OrganizerAnalytics() {
  const { eventId } = useParams<{ eventId: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics", eventId],
    queryFn: async () => {
      const response = await apiClient.get(`/events/${eventId}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.data as AnalyticsData;
    },
    enabled: !!eventId && !!token,
  });

  const COLORS = ["#FBBF24", "#34D399", "#F87171", "#60A5FA"];

  const activityData =
    data?.hourlyActivity.map((item) => ({
      hour: `${item.hour.toString().padStart(2, "0")}:00`,
      count: item.count,
    })) || [];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-[#6B6B68]">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-600">{t("common.error")}</p>
        </div>
      </div>
    );
  }

  const pieData = [
    { name: "معلق", value: data.pending },
    { name: "مقبول", value: data.approved },
    { name: "مرفوض", value: data.rejected },
    { name: "مدخل", value: data.checkedIn },
  ].filter((item) => item.value > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* الرجوع */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/organizer/events/${eventId}`)}
          className="px-4 py-2 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
        >
          ← رجوع
        </button>
        <h1 className="text-2xl font-bold text-[#171717]">📊 التحليلات</h1>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[#171717]">
            {data.totalRegistrations}
          </p>
          <p className="text-xs text-[#6B6B68]">الإجمالي</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{data.pending}</p>
          <p className="text-xs text-[#6B6B68]">معلق</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{data.approved}</p>
          <p className="text-xs text-[#6B6B68]">مقبول</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{data.rejected}</p>
          <p className="text-xs text-[#6B6B68]">مرفوض</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{data.checkedIn}</p>
          <p className="text-xs text-[#6B6B68]">مدخل</p>
        </div>
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-[#B08D57]">
            {data.attendanceRate}%
          </p>
          <p className="text-xs text-[#6B6B68]">نسبة الحضور</p>
        </div>
      </div>

      {/* المخططات */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[#171717] mb-4">
            توزيع التسجيلات
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <EmptyState
                icon="📊"
                title="لا توجد بيانات"
                description="لا توجد تسجيلات لعرضها"
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => {
                    const safePercent = percent ?? 0;
                    return `${name}: ${(safePercent * 100).toFixed(0)}%`;
                  }}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white border border-[#E5E5E0] rounded-lg p-6">
          <h2 className="text-lg font-bold text-[#171717] mb-4">
            نشاط الدخول حسب الساعة
          </h2>
          {activityData.every((item) => item.count === 0) ? (
            <div className="flex items-center justify-center h-64">
              <EmptyState
                icon="⏰"
                title="لا يوجد نشاط"
                description="لم يتم تسجيل أي دخول بعد"
              />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#B08D57"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="عدد الدخول"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* آخر عمليات الدخول */}
      <div className="bg-white border border-[#E5E5E0] rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E5E5E0]">
          <h2 className="text-lg font-bold text-[#171717]">
            🕐 آخر عمليات الدخول
          </h2>
        </div>
        {data.recentCheckIns.length === 0 ? (
          <div className="px-6 py-8">
            <EmptyState
              icon="🚪"
              title="لا توجد عمليات دخول"
              description="لم يتم تسجيل أي دخول لهذه الفعالية بعد"
            />
          </div>
        ) : (
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
                    وقت الدخول
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    تم بواسطة
                  </th>
                  <th className="px-6 py-3 text-sm font-medium text-[#6B6B68]">
                    الطريقة
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.recentCheckIns.map((checkIn, index) => (
                  <tr
                    key={index}
                    className="border-b border-[#E5E5E0] last:border-0"
                  >
                    <td className="px-6 py-3 text-sm text-[#171717]">
                      {checkIn.attendeeName}
                    </td>
                    <td className="px-6 py-3 text-sm text-[#6B6B68]">
                      {checkIn.attendeeEmail}
                    </td>
                    <td className="px-6 py-3 text-sm text-[#6B6B68]">
                      {new Date(checkIn.checkedInAt).toLocaleString("ar-EG")}
                    </td>
                    <td className="px-6 py-3 text-sm text-[#6B6B68]">
                      {checkIn.checkedBy}
                    </td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          checkIn.method === "QR_SCAN"
                            ? "bg-green-100 text-green-700"
                            : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {checkIn.method === "QR_SCAN" ? "مسح QR" : "يدوي"}
                      </span>
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
