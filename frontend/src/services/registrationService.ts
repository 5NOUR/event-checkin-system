import apiClient from "./apiClient";

export interface RegistrationInput {
  eventSlug: string;
  fullName: string;
  email: string;
  phone?: string;
  organization?: string;
  jobTitle?: string;
}

export async function registerAttendee(data: RegistrationInput) {
  const response = await apiClient.post("/registrations", data);
  return response.data;
}
