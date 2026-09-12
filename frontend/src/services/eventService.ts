import apiClient from "./apiClient";

// ========== الأنواع ==========
export interface Speaker {
  id: string;
  name: string;
  title: string | null;
  bio: string | null;
  imageUrl: string | null;
  order: number;
}

export interface AgendaItem {
  id: string;
  time: string;
  title: string;
  description: string | null;
  speaker: Speaker | null;
  order: number;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export interface Sponsor {
  id: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string | null;
  order: number;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
  order: number;
}

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
  speakers: Speaker[];
  agendaItems: AgendaItem[];
  faqs: Faq[];
  sponsors: Sponsor[];
  galleryImages: GalleryImage[];
  ticketTypes: TicketType[];
}
export interface TicketType {
  id: string;
  eventId: string;
  name: string;
  description: string | null;
  color: string | null;
  capacity: number | null;
  price: number | null;
  isActive: boolean;
  order: number;
  _count?: { registrations: number };
}
// ========== الدوال ==========
export async function getPublicEvent(slug: string): Promise<PublicEvent> {
  const response = await apiClient.get(`/events/public/${slug}`);
  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || "حدث خطأ أثناء جلب الفعالية",
    );
  }
  return response.data.data;
}

// قائمة الفعاليات العامة (للصفحة الرئيسية)
export interface EventSummary {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverImageUrl: string | null;
  date: string;
  location: string;
  capacity: number;
  remainingCapacity: number;
  _count: { registrations: number };
}

export async function getPublicEvents(): Promise<EventSummary[]> {
  const response = await apiClient.get("/events/public");
  if (!response.data.success) {
    throw new Error(
      response.data.error?.message || "حدث خطأ أثناء جلب الفعاليات",
    );
  }
  return response.data.data;
}
