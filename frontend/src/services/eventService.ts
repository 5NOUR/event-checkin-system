import apiClient from "./apiClient";

export interface PublicEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  remainingCapacity: number;
  status: string;
  organizer: {
    name: string;
    email: string;
  };
}

export async function getPublicEvent(slug: string): Promise<PublicEvent> {
  const response = await apiClient.get(`/events/public/${slug}`);
  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || "حدث خطأ أثناء جلب الفعالية",
    );
  }
  return response.data.data;
}
