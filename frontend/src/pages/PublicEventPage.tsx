import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import { getPublicEvent } from "../services/eventService";
import {
  registerAttendee,
  type RegistrationInput,
} from "../services/registrationService";
import { useState } from "react";

export default function PublicEventPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const eventSlug = slug || "tech-expo-2026";
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RegistrationInput>();

  const {
    data: event,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["event", eventSlug],
    queryFn: () => getPublicEvent(eventSlug),
  });

  const mutation = useMutation({
    mutationFn: registerAttendee,
    onSuccess: () => {
      setRegistrationSuccess(true);
      reset();
      refetch();
      setTimeout(() => setRegistrationSuccess(false), 5000);
    },
  });

  const onSubmit = (data: RegistrationInput) => {
    mutation.mutate({ ...data, eventSlug });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5]">
        <p className="text-[#6B6B68]">{t("common.loading")}</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F7F5] px-4">
        <div className="bg-white rounded-lg border border-[#E5E5E0] p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-[#171717] mb-2">
            الفعالية غير موجودة
          </h1>
          <p className="text-[#6B6B68]">
            عذراً، لم نتمكن من العثور على الفعالية المطلوبة.
          </p>
        </div>
      </div>
    );
  }

  const canRegister =
    event.status !== "CANCELLED" &&
    event.status !== "COMPLETED" &&
    event.remainingCapacity > 0;

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      {/* صورة الغلاف (إذا وجدت) */}
      {event.coverImageUrl && (
        <div className="w-full h-64 md:h-96 overflow-hidden">
          <img
            src={event.coverImageUrl}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="bg-white rounded-lg border border-[#E5E5E0] p-6 md:p-8 shadow-sm">
          {/* العنوان */}
          <h1 className="text-3xl md:text-5xl font-bold text-[#171717] mb-4">
            {event.title}
          </h1>

          {/* الوصف */}
          <p className="text-lg text-[#6B6B68] mb-6 leading-relaxed">
            {event.description}
          </p>

          {/* المعلومات */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-[#F7F7F5] rounded-lg">
            <div>
              <p className="text-xs text-[#6B6B68]">التاريخ</p>
              <p className="text-sm font-medium text-[#171717]">
                {new Date(event.date).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B6B68]">الوقت</p>
              <p className="text-sm font-medium text-[#171717]">
                {event.startTime} - {event.endTime}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B6B68]">الموقع</p>
              <p className="text-sm font-medium text-[#171717]">
                {event.location}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#6B6B68]">السعة المتبقية</p>
              <p className="text-sm font-medium text-[#171717]">
                {event.remainingCapacity} / {event.capacity}
              </p>
            </div>
          </div>

          {/* حالة الفعالية */}
          <div className="mb-6">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === "PUBLISHED"
                  ? "bg-green-100 text-green-700"
                  : event.status === "ONGOING"
                    ? "bg-blue-100 text-blue-700"
                    : event.status === "REGISTRATION_CLOSED"
                      ? "bg-yellow-100 text-yellow-700"
                      : event.status === "COMPLETED"
                        ? "bg-gray-100 text-gray-700"
                        : event.status === "CANCELLED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
              }`}
            >
              {t(`event.${event.status.toLowerCase()}`)}
            </span>
          </div>

          {/* نموذج التسجيل */}
          <div className="border-t border-[#E5E5E0] pt-6">
            <h2 className="text-2xl font-bold text-[#171717] mb-4">
              {t("registration.title")}
            </h2>

            {registrationSuccess && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
                ✅ {mutation.data?.message || t("common.success")}
              </div>
            )}

            {mutation.isError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
                ❌ {mutation.error?.message || t("common.error")}
              </div>
            )}

            {!canRegister ? (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
                ⚠️ {t("registration.capacityFull")}
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1">
                      {t("registration.fullName")} *
                    </label>
                    <input
                      {...register("fullName", {
                        required: true,
                        minLength: 3,
                      })}
                      className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
                      dir="auto"
                    />
                    {errors.fullName && (
                      <p className="text-red-600 text-sm mt-1">
                        {t("registration.fullName")} مطلوب (3 أحرف)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1">
                      {t("registration.email")} *
                    </label>
                    <input
                      type="email"
                      {...register("email", { required: true })}
                      className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
                      dir="auto"
                    />
                    {errors.email && (
                      <p className="text-red-600 text-sm mt-1">
                        {t("registration.email")} غير صحيح
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1">
                      {t("registration.phone")}
                    </label>
                    <input
                      {...register("phone")}
                      className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
                      dir="auto"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#171717] mb-1">
                      {t("registration.organization")}
                    </label>
                    <input
                      {...register("organization")}
                      className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
                      dir="auto"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#171717] mb-1">
                    {t("registration.jobTitle")}
                  </label>
                  <input
                    {...register("jobTitle")}
                    className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
                    dir="auto"
                  />
                </div>

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="w-full px-8 py-3 bg-[#B08D57] text-white font-medium rounded-md hover:bg-[#9a7a4a] transition-colors disabled:opacity-50"
                >
                  {mutation.isPending
                    ? t("common.loading")
                    : t("registration.submit")}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
