import { Request, Response } from "express";
import { PrismaClient, EventStatus, Role } from "@prisma/client";
import * as eventService from "../services/eventService";
import {
  createEventSchema,
  updateEventSchema,
} from "../validators/event.validator";
import { logAudit } from "../services/auditService";

const prisma = new PrismaClient();

// ============================================
// 📌 مسارات المنظم (ORGANIZER / ADMIN)
// ============================================

// 1. إنشاء فعالية
export async function createEvent(req: Request, res: Response) {
  try {
    // التحقق من صحة البيانات المدخلة
    const validationResult = createEventSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "بيانات غير صحيحة",
          details: validationResult.error.issues,
        },
      });
    }

    const data = validationResult.data;
    const organizerId = req.user!.userId;

    // ✅ تحويل null إلى undefined
    const event = await eventService.createEvent({
      title: data.title,
      description: data.description,
      location: data.location,
      date: new Date(data.date),
      startTime: data.startTime,
      endTime: data.endTime,
      capacity: data.capacity,
      registrationDeadline: data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : undefined,
      coverImageUrl: data.coverImageUrl || undefined, // ✅ null → undefined
      organizerId,
    });

    // ✅ تسجيل Audit Log
    await logAudit({
      userId: organizerId,
      action: "EVENT_CREATED",
      details: { eventId: event.id, title: event.title },
      ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("خطأ في إنشاء الفعالية:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء إنشاء الفعالية",
      },
    });
  }
}

// 2. جلب قائمة الفعاليات (للمنظم)
export async function getEvents(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const events = await eventService.getEventsByOrganizer(userId);

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("خطأ في جلب الفعاليات:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب الفعاليات",
      },
    });
  }
}

// 3. جلب تفاصيل فعالية
export async function getEventById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const result = await eventService.getEventById(
      String(id),
      userId,
      userRole,
    );

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في جلب تفاصيل الفعالية:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب تفاصيل الفعالية",
      },
    });
  }
}

// 4. تحديث فعالية
export async function updateEvent(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const validationResult = updateEventSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "بيانات غير صحيحة",
          details: validationResult.error.issues,
        },
      });
    }

    const result = await eventService.updateEvent(
      String(id),
      userId,
      userRole,
      validationResult.data,
    );

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في تحديث الفعالية:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تحديث الفعالية",
      },
    });
  }
}

// 5. تغيير حالة الفعالية
export async function updateEventStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (!status || !Object.values(EventStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: {
          code: "INVALID_STATUS",
          message: "حالة غير صالحة",
        },
      });
    }

    const result = await eventService.updateEventStatus(
      String(id),
      userId,
      userRole,
      status as EventStatus,
    );

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: result.error },
      });
    }

    // ✅ تسجيل تغيير الحالة
    await logAudit({
      userId,
      action:
        status === "PUBLISHED"
          ? "EVENT_PUBLISHED"
          : status === "CANCELLED"
            ? "EVENT_CANCELLED"
            : "EVENT_STATUS_CHANGED",
      details: { eventId: id, newStatus: status },
      ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, data: result.data });
  } catch (error) {
    console.error("خطأ في تغيير حالة الفعالية:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تغيير حالة الفعالية",
      },
    });
  }
}

// 6. جلب إحصائيات الفعالية
export async function getEventStats(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await eventService.getEventStats(String(id), userId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في جلب إحصائيات الفعالية:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب الإحصائيات",
      },
    });
  }
}

// 7. جلب تحليلات متقدمة للفعالية
export async function getEventAnalytics(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const result = await eventService.getEventAnalytics(String(id), userId);

    if (!result.success) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: result.error,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في جلب تحليلات الفعالية:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب التحليلات",
      },
    });
  }
}

// ============================================
// 📌 مسارات الموظف (STAFF)
// ============================================

// 8. جلب فعاليات الموظف (المسندة إليه)
export async function getStaffEvents(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;

    const events = await prisma.event.findMany({
      where: {
        staff: {
          some: {
            staffId: userId,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
      },
      orderBy: { title: "asc" },
    });

    return res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("خطأ في جلب فعاليات الموظف:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب الفعاليات",
      },
    });
  }
}

// ============================================
// 📌 مسارات عامة (بدون مصادقة)
// ============================================

// 9. جلب تفاصيل فعالية عامة (بدون مصادقة) باستخدام slug
// 6. جلب تفاصيل فعالية عامة (بدون مصادقة) باستخدام slug
export async function getPublicEventBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: {
          code: "MISSING_SLUG",
          message: "رابط الفعالية مطلوب",
        },
      });
    }

    const result = await eventService.getPublicEventBySlug(String(slug));

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: "NOT_FOUND",
          message: result.error || "الفعالية غير موجودة",
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: result.data,
    });
  } catch (error) {
    console.error("خطأ في جلب الفعالية العامة:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء جلب تفاصيل الفعالية",
      },
    });
  }
}
// 9. جلب قائمة الفعاليات المنشورة (عام)

// 9. جلب قائمة الفعاليات المنشورة (عام - بدون مصادقة)
export async function getPublicEvents(req: Request, res: Response) {
  try {
    const events = await prisma.event.findMany({
      where: {
        status: {
          in: ["PUBLISHED", "ONGOING"],
        },
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImageUrl: true,
        date: true,
        location: true,
        capacity: true,
        _count: {
          select: { registrations: true },
        },
      },
      orderBy: { date: "asc" },
    });

    // حساب السعة المتبقية
    const eventsWithCapacity = events.map((event) => ({
      ...event,
      remainingCapacity: event.capacity - event._count.registrations,
    }));

    return res.status(200).json({
      success: true,
      data: eventsWithCapacity,
    });
  } catch (error) {
    console.error("خطأ في جلب قائمة الفعاليات العامة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء جلب الفعاليات" },
    });
  }
}
