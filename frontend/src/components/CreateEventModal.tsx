import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../services/apiClient";

// تعريف مخطط التحقق (Validation Schema)
const createEventSchema = z.object({
  title: z.string().min(3, "العنوان مطلوب (على الأقل 3 أحرف)"),
  description: z.string().min(10, "الوصف مطلوب (على الأقل 10 أحرف)"),
  location: z.string().min(3, "الموقع مطلوب"),
  date: z.string().min(1, "التاريخ مطلوب"),
  startTime: z.string().min(1, "وقت البدء مطلوب"),
  endTime: z.string().min(1, "وقت الانتهاء مطلوب"),
  capacity: z.number().min(1, "السعة يجب أن تكون أكبر من 0"),
});

type CreateEventFormData = z.infer<typeof createEventSchema>;

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateEventModal({
  isOpen,
  onClose,
}: CreateEventModalProps) {
  const [error, setError] = useState("");
  const queryClient = useQueryClient();
  const token = localStorage.getItem("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      capacity: 50,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateEventFormData) => {
      // تحويل البيانات إلى الصيغة المطلوبة من الخادم
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
      };
      const response = await apiClient.post("/events", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    },
    onSuccess: () => {
      // تحديث قائمة الفعاليات
      queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
      reset();
      setError("");
      onClose();
    },
    onError: (err: unknown) => {
      const error = err as {
        response?: { data?: { error?: { message?: string } } };
      };
      setError(
        error.response?.data?.error?.message || "حدث خطأ أثناء إنشاء الفعالية",
      );
    },
  });

  const onSubmit = (data: CreateEventFormData) => {
    mutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-lg border border-[#E5E5E0] shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
        {/* رأس النموذج */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#171717]">
            إنشاء فعالية جديدة
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B6B68] hover:text-[#171717] transition-colors text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* العنوان */}
          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">
              عنوان الفعالية *
            </label>
            <input
              {...register("title")}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              dir="auto"
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* الوصف */}
          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">
              الوصف *
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              dir="auto"
            />
            {errors.description && (
              <p className="text-red-600 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* الموقع */}
          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">
              الموقع *
            </label>
            <input
              {...register("location")}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              dir="auto"
            />
            {errors.location && (
              <p className="text-red-600 text-sm mt-1">
                {errors.location.message}
              </p>
            )}
          </div>

          {/* التاريخ والوقت */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-1">
                التاريخ *
              </label>
              <input
                type="date"
                {...register("date")}
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              />
              {errors.date && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-1">
                وقت البدء *
              </label>
              <input
                type="time"
                {...register("startTime")}
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              />
              {errors.startTime && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.startTime.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#171717] mb-1">
                وقت الانتهاء *
              </label>
              <input
                type="time"
                {...register("endTime")}
                className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
              />
              {errors.endTime && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.endTime.message}
                </p>
              )}
            </div>
          </div>

          {/* السعة */}
          <div>
            <label className="block text-sm font-medium text-[#171717] mb-1">
              السعة القصوى *
            </label>
            <input
              type="number"
              {...register("capacity", { valueAsNumber: true })}
              className="w-full px-4 py-2 border border-[#E5E5E0] rounded-md focus:outline-none focus:ring-2 focus:ring-[#B08D57]"
            />
            {errors.capacity && (
              <p className="text-red-600 text-sm mt-1">
                {errors.capacity.message}
              </p>
            )}
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-4 border-t border-[#E5E5E0]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-[#E5E5E0] rounded-md hover:bg-[#F7F7F5] transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-[#171717] text-white rounded-md hover:bg-[#2a2a2a] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "جاري الإنشاء..." : "إنشاء الفعالية"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
