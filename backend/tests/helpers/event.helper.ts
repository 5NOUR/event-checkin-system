import { PrismaClient, EventStatus } from "@prisma/client";

const prisma = new PrismaClient();

export async function createTestEvent(
  organizerId: string,
  overrides: any = {},
) {
  return prisma.event.create({
    data: {
      title: overrides.title || "Test Event",
      slug: overrides.slug || `test-event-${Date.now()}`,
      description: "Test event description",
      location: "Test Location",
      date: new Date("2026-12-01"),
      startTime: "09:00",
      endTime: "17:00",
      capacity: overrides.capacity || 100,
      status: overrides.status || EventStatus.PUBLISHED,
      organizerId,
      ...overrides,
    },
  });
}
