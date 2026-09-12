import apiClient from "./apiClient";

// ========== المتحدثون (Speakers) ==========
export interface Speaker {
  id: string;
  eventId: string;
  name: string;
  title: string | null;
  bio: string | null;
  imageUrl: string | null;
  order: number;
}

export async function getSpeakers(eventId: string): Promise<Speaker[]> {
  const response = await apiClient.get(`/content/event/${eventId}/speakers`);
  return response.data.data;
}

export async function createSpeaker(
  eventId: string,
  data: Partial<Speaker>,
): Promise<Speaker> {
  const response = await apiClient.post(
    `/content/event/${eventId}/speakers`,
    data,
  );
  return response.data.data;
}

export async function updateSpeaker(
  id: string,
  data: Partial<Speaker>,
): Promise<Speaker> {
  const response = await apiClient.put(`/content/speakers/${id}`, data);
  return response.data.data;
}

export async function deleteSpeaker(id: string): Promise<void> {
  await apiClient.delete(`/content/speakers/${id}`);
}

// ========== الأجندة (Agenda) ==========
export interface AgendaItem {
  id: string;
  eventId: string;
  time: string;
  title: string;
  description: string | null;
  speakerId: string | null;
  speaker: Speaker | null;
  order: number;
}

export async function getAgendaItems(eventId: string): Promise<AgendaItem[]> {
  const response = await apiClient.get(`/content/event/${eventId}/agenda`);
  return response.data.data;
}

export async function createAgendaItem(
  eventId: string,
  data: Partial<AgendaItem>,
): Promise<AgendaItem> {
  const response = await apiClient.post(
    `/content/event/${eventId}/agenda`,
    data,
  );
  return response.data.data;
}

export async function updateAgendaItem(
  id: string,
  data: Partial<AgendaItem>,
): Promise<AgendaItem> {
  const response = await apiClient.put(`/content/agenda/${id}`, data);
  return response.data.data;
}

export async function deleteAgendaItem(id: string): Promise<void> {
  await apiClient.delete(`/content/agenda/${id}`);
}

// ========== الأسئلة الشائعة (FAQs) ==========
export interface Faq {
  id: string;
  eventId: string;
  question: string;
  answer: string;
  order: number;
}

export async function getFaqs(eventId: string): Promise<Faq[]> {
  const response = await apiClient.get(`/content/event/${eventId}/faqs`);
  return response.data.data;
}

export async function createFaq(
  eventId: string,
  data: Partial<Faq>,
): Promise<Faq> {
  const response = await apiClient.post(`/content/event/${eventId}/faqs`, data);
  return response.data.data;
}

export async function updateFaq(id: string, data: Partial<Faq>): Promise<Faq> {
  const response = await apiClient.put(`/content/faqs/${id}`, data);
  return response.data.data;
}

export async function deleteFaq(id: string): Promise<void> {
  await apiClient.delete(`/content/faqs/${id}`);
}

// ========== الشركاء (Sponsors) ==========
export interface Sponsor {
  id: string;
  eventId: string;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  tier: string | null;
  order: number;
}

export async function getSponsors(eventId: string): Promise<Sponsor[]> {
  const response = await apiClient.get(`/content/event/${eventId}/sponsors`);
  return response.data.data;
}

export async function createSponsor(
  eventId: string,
  data: Partial<Sponsor>,
): Promise<Sponsor> {
  const response = await apiClient.post(
    `/content/event/${eventId}/sponsors`,
    data,
  );
  return response.data.data;
}

export async function updateSponsor(
  id: string,
  data: Partial<Sponsor>,
): Promise<Sponsor> {
  const response = await apiClient.put(`/content/sponsors/${id}`, data);
  return response.data.data;
}

export async function deleteSponsor(id: string): Promise<void> {
  await apiClient.delete(`/content/sponsors/${id}`);
}

// ========== معرض الصور (Gallery) ==========
export interface GalleryImage {
  id: string;
  eventId: string;
  imageUrl: string;
  caption: string | null;
  order: number;
}

export async function getGalleryImages(
  eventId: string,
): Promise<GalleryImage[]> {
  const response = await apiClient.get(`/content/event/${eventId}/gallery`);
  return response.data.data;
}

export async function createGalleryImage(
  eventId: string,
  data: Partial<GalleryImage>,
): Promise<GalleryImage> {
  const response = await apiClient.post(
    `/content/event/${eventId}/gallery`,
    data,
  );
  return response.data.data;
}

export async function deleteGalleryImage(id: string): Promise<void> {
  await apiClient.delete(`/content/gallery/${id}`);
}

// ========== البوابات (Gates) ==========
export interface Gate {
  id: string;
  eventId: string;
  name: string;
  location: string | null;
  isActive: boolean;
  order: number;
  _count?: { checkIns: number };
}

export async function getGates(eventId: string): Promise<Gate[]> {
  const response = await apiClient.get(`/content/event/${eventId}/gates`);
  return response.data.data;
}

export async function createGate(
  eventId: string,
  data: Partial<Gate>,
): Promise<Gate> {
  const response = await apiClient.post(
    `/content/event/${eventId}/gates`,
    data,
  );
  return response.data.data;
}

export async function updateGate(
  id: string,
  data: Partial<Gate>,
): Promise<Gate> {
  const response = await apiClient.put(`/content/gates/${id}`, data);
  return response.data.data;
}

export async function deleteGate(id: string): Promise<void> {
  await apiClient.delete(`/content/gates/${id}`);
}

// ========== أنواع التذاكر (Ticket Types) ==========
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

export async function getTicketTypes(eventId: string): Promise<TicketType[]> {
  const response = await apiClient.get(
    `/content/event/${eventId}/ticket-types`,
  );
  return response.data.data;
}

export async function createTicketType(
  eventId: string,
  data: Partial<TicketType>,
): Promise<TicketType> {
  const response = await apiClient.post(
    `/content/event/${eventId}/ticket-types`,
    data,
  );
  return response.data.data;
}

export async function updateTicketType(
  id: string,
  data: Partial<TicketType>,
): Promise<TicketType> {
  const response = await apiClient.put(`/content/ticket-types/${id}`, data);
  return response.data.data;
}

export async function deleteTicketType(id: string): Promise<void> {
  await apiClient.delete(`/content/ticket-types/${id}`);
}
