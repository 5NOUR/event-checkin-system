import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { X, CalendarDays, MapPin, Users, ImageIcon } from "lucide-react";
import apiClient from "../services/apiClient";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Textarea } from "./ui/Textarea";

const createEventSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  location: z.string().min(3).max(300),
  date: z.string().min(1),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/),
  capacity: z.number().int().positive().max(1000000),
  coverImageUrl: z.string().url().optional().or(z.literal("")),
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
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEventFormData>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "17:00",
      capacity: 50,
      coverImageUrl: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateEventFormData) => {
      const payload = {
        ...data,
        date: new Date(data.date).toISOString(),
        coverImageUrl: data.coverImageUrl || undefined,
      };
      const response = await apiClient.post("/events", payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizer-events"] });
      reset();
      setServerError("");
      onClose();
    },
    onError: (error: unknown) => {
      const err = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      setServerError(
        err.response?.data?.error?.message || t("errors.serverError"),
      );
    },
  });

  const onSubmit = (data: CreateEventFormData) => {
    setServerError("");
    mutation.mutate(data);
  };

  const handleClose = () => {
    if (mutation.isPending) return;
    setServerError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-lg border border-ink-200 shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-6 border-b border-ink-200">
          <div>
            <h2 className="text-h2 font-semibold text-ink-900 tracking-tight">
              {t("events.createEvent.title")}
            </h2>
            <p className="mt-1 text-body-sm text-ink-600">
              {t("events.createEvent.subtitle")}
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={mutation.isPending}
            className="w-8 h-8 -mt-1 -me-1 inline-flex items-center justify-center text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors disabled:opacity-50"
            aria-label={t("common.close")}
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
          {serverError && (
            <div className="px-4 py-3 bg-danger-100 border border-danger-500/20 rounded-md">
              <p className="text-body-sm text-danger-700">{serverError}</p>
            </div>
          )}

          <Input
            label={t("events.createEvent.eventTitle")}
            placeholder={t("events.createEvent.eventTitlePlaceholder")}
            required
            error={
              errors.title ? t("validation.minLength", { min: 3 }) : undefined
            }
            {...register("title")}
          />

          <Textarea
            label={t("events.createEvent.description")}
            placeholder={t("events.createEvent.descriptionPlaceholder")}
            rows={4}
            required
            error={
              errors.description
                ? t("validation.minLength", { min: 10 })
                : undefined
            }
            hint={t("events.createEvent.descriptionHint")}
            {...register("description")}
          />

          <Input
            label={t("events.createEvent.location")}
            placeholder={t("events.createEvent.locationPlaceholder")}
            leftIcon={<MapPin size={16} strokeWidth={1.75} />}
            required
            error={
              errors.location
                ? t("validation.minLength", { min: 3 })
                : undefined
            }
            {...register("location")}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label={t("events.createEvent.date")}
              type="date"
              leftIcon={<CalendarDays size={16} strokeWidth={1.75} />}
              required
              error={errors.date ? t("validation.required") : undefined}
              {...register("date")}
            />
            <Input
              label={t("events.createEvent.startTime")}
              type="time"
              required
              error={errors.startTime ? t("validation.required") : undefined}
              {...register("startTime")}
            />
            <Input
              label={t("events.createEvent.endTime")}
              type="time"
              required
              error={errors.endTime ? t("validation.required") : undefined}
              {...register("endTime")}
            />
          </div>

          <Input
            label={t("events.createEvent.capacity")}
            type="number"
            placeholder={t("events.createEvent.capacityPlaceholder")}
            leftIcon={<Users size={16} strokeWidth={1.75} />}
            required
            error={errors.capacity ? t("validation.positive") : undefined}
            hint={t("events.createEvent.capacityHint")}
            {...register("capacity", { valueAsNumber: true })}
          />

          {/* ✅ Cover Image URL */}
          <Input
            label={t("events.createEvent.coverImage")}
            type="url"
            placeholder={t("events.createEvent.coverImagePlaceholder")}
            leftIcon={<ImageIcon size={16} strokeWidth={1.75} />}
            error={
              errors.coverImageUrl ? t("validation.urlInvalid") : undefined
            }
            hint={t("events.createEvent.coverImageHint")}
            dir="ltr"
            {...register("coverImageUrl")}
          />

          {/* Footer */}
          <div className="flex gap-3 pt-4 border-t border-ink-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={mutation.isPending}
              fullWidth
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="accent"
              loading={mutation.isPending}
              fullWidth
            >
              {t("events.createEvent.submit")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
