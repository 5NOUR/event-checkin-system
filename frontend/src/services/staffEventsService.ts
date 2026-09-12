import apiClient from "./apiClient";

export interface StaffEvent {
  id: string;
  title: string;
  slug: string;
}

export async function getStaffEvents(): Promise<StaffEvent[]> {
  const response = await apiClient.get("/events/staff");
  return response.data.data;
}
