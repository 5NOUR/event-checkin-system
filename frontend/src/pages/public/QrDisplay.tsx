import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import apiClient from "../../services/apiClient";

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

  // جلب بيانات رمز QR
  const { data, isLoading, error } = useQuery({
    queryKey: ["qr", token],
    queryFn: async () => {
      const response = await apiClient.get(`/registrations/qr/${token}`);
      return response.data.data as QrData;
    },
    retry: 1,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <p className="text-[#6B6B68]">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4">
        <div className="bg-white rounded-lg border border-[#E5E5E0] p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-[#171717] mb-2">
            رمز غير صالح
          </h1>
          <p className="text-[#6B6B68]">
            هذا الرمز غير صحيح أو منتهي الصلاحية. يرجى التواصل مع المنظم.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 bg-[#171717] text-white rounded-md hover:bg-[#2a2a2a] transition-colors"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  // إذا تم الدخول بالفعل
  if (data.checkedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4">
        <div className="bg-white rounded-lg border border-[#E5E5E0] p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-[#171717] mb-2">
            تم الدخول بالفعل
          </h1>
          <p className="text-[#6B6B68]">
            تم تسجيل دخولك إلى فعالية "{data.event.title}" في تمام الساعة:
          </p>
          <p className="text-xl font-bold text-[#171717] mt-2">
            {data.checkedInAt
              ? new Date(data.checkedInAt).toLocaleString("ar-EG")
              : "غير معروف"}
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-6 py-3 bg-[#171717] text-white rounded-md hover:bg-[#2a2a2a] transition-colors"
          >
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4 py-8">
      <div className="bg-white rounded-lg border border-[#E5E5E0] p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <QRCodeSVG
            value={token || ""}
            size={200}
            className="mx-auto"
            level="H" // مستوى تصحيح الأخطاء العالي
            includeMargin={true}
          />
        </div>

        <h1 className="text-2xl font-bold text-[#171717] mb-2">
          {data.fullName}
        </h1>

        <p className="text-[#6B6B68] mb-4">{data.email}</p>

        <div className="border-t border-[#E5E5E0] pt-4 mb-4">
          <p className="text-sm text-[#6B6B68]">الفعالية</p>
          <p className="text-lg font-medium text-[#171717]">
            {data.event.title}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[#6B6B68]">التاريخ</p>
            <p className="font-medium text-[#171717]">
              {new Date(data.event.date).toLocaleDateString("ar-EG")}
            </p>
          </div>
          <div>
            <p className="text-[#6B6B68]">الموقع</p>
            <p className="font-medium text-[#171717]">{data.event.location}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700">
            ✅ رمز QR صالح
            {data.event.status === "ONGOING" && " - الفعالية قائمة الآن"}
          </p>
          <p className="text-xs text-green-600 mt-1">
            استخدم هذا الرمز عند وصولك إلى الفعالية
          </p>
        </div>

        <Link
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-[#171717] text-white rounded-md hover:bg-[#2a2a2a] transition-colors text-sm"
        >
          العودة إلى الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
