import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ========== المتحدثون (Speakers) ==========

// جلب جميع المتحدثين لفعالية
export async function getSpeakers(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    // ✅ تحويل eventId إلى string
    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const speakers = await prisma.speaker.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({ success: true, data: speakers });
  } catch (error) {
    console.error("خطأ في جلب المتحدثين:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء جلب المتحدثين" },
    });
  }
}

// إضافة متحدث جديد
export async function createSpeaker(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { name, title, bio, imageUrl, order } = req.body;

    // ✅ تحويل eventId إلى string
    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const speaker = await prisma.speaker.create({
      data: {
        eventId: String(eventId),
        name,
        title,
        bio,
        imageUrl,
        order: order || 0,
      },
    });

    return res.status(201).json({ success: true, data: speaker });
  } catch (error) {
    console.error("خطأ في إنشاء متحدث:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء إنشاء المتحدث" },
    });
  }
}

// تحديث متحدث
export async function updateSpeaker(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;
    const { name, title, bio, imageUrl, order } = req.body;

    // ✅ تحويل id إلى string مع include event
    const speaker = await prisma.speaker.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!speaker || speaker.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.speaker.update({
      where: { id: String(id) },
      data: { name, title, bio, imageUrl, order },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في تحديث المتحدث:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء تحديث المتحدث" },
    });
  }
}

// حذف متحدث
export async function deleteSpeaker(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    // ✅ تحويل id إلى string مع include event
    const speaker = await prisma.speaker.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!speaker || speaker.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    await prisma.speaker.delete({ where: { id: String(id) } });

    return res.status(200).json({ success: true, message: "تم حذف المتحدث" });
  } catch (error) {
    console.error("خطأ في حذف المتحدث:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء حذف المتحدث" },
    });
  }
}

// ========== فقرات الأجندة (Agenda Items) ==========

// جلب جميع فقرات الأجندة لفعالية
export async function getAgendaItems(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    // ✅ تحويل eventId إلى string
    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const agendaItems = await prisma.agendaItem.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
      include: { speaker: true },
    });

    return res.status(200).json({ success: true, data: agendaItems });
  } catch (error) {
    console.error("خطأ في جلب فقرات الأجندة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء جلب الأجندة" },
    });
  }
}

// إضافة فقرة أجندة جديدة
export async function createAgendaItem(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { time, title, description, speakerId, order } = req.body;

    // ✅ تحويل eventId إلى string
    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const agendaItem = await prisma.agendaItem.create({
      data: {
        eventId: String(eventId),
        time,
        title,
        description,
        speakerId: speakerId || null,
        order: order || 0,
      },
      include: { speaker: true },
    });

    return res.status(201).json({ success: true, data: agendaItem });
  } catch (error) {
    console.error("خطأ في إنشاء فقرة أجندة:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء إنشاء فقرة الأجندة",
      },
    });
  }
}

// تحديث فقرة أجندة
export async function updateAgendaItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;
    const { time, title, description, speakerId, order } = req.body;

    // ✅ تحويل id إلى string مع include event
    const agendaItem = await prisma.agendaItem.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!agendaItem || agendaItem.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.agendaItem.update({
      where: { id: String(id) },
      data: { time, title, description, speakerId: speakerId || null, order },
      include: { speaker: true },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في تحديث فقرة الأجندة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء تحديث الأجندة" },
    });
  }
}

// حذف فقرة أجندة
export async function deleteAgendaItem(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    // ✅ تحويل id إلى string مع include event
    const agendaItem = await prisma.agendaItem.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!agendaItem || agendaItem.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    await prisma.agendaItem.delete({ where: { id: String(id) } });

    return res.status(200).json({ success: true, message: "تم حذف الفقرة" });
  } catch (error) {
    console.error("خطأ في حذف فقرة الأجندة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء حذف الفقرة" },
    });
  }
}
// ========== الأسئلة الشائعة (FAQs) ==========

export async function getFaqs(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const faqs = await prisma.faq.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    console.error("خطأ في جلب الأسئلة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function createFaq(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { question, answer, order } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const faq = await prisma.faq.create({
      data: { eventId: String(eventId), question, answer, order: order || 0 },
    });

    return res.status(201).json({ success: true, data: faq });
  } catch (error) {
    console.error("خطأ في إنشاء سؤال:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function updateFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;
    const { question, answer, order } = req.body;

    const faq = await prisma.faq.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!faq || faq.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.faq.update({
      where: { id: String(id) },
      data: { question, answer, order },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في تحديث السؤال:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function deleteFaq(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const faq = await prisma.faq.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!faq || faq.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    await prisma.faq.delete({ where: { id: String(id) } });
    return res.status(200).json({ success: true, message: "تم الحذف" });
  } catch (error) {
    console.error("خطأ في حذف السؤال:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

// ========== الشركاء (Sponsors) ==========

export async function getSponsors(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const sponsors = await prisma.sponsor.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({ success: true, data: sponsors });
  } catch (error) {
    console.error("خطأ في جلب الشركاء:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function createSponsor(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { name, logoUrl, websiteUrl, tier, order } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const sponsor = await prisma.sponsor.create({
      data: {
        eventId: String(eventId),
        name,
        logoUrl,
        websiteUrl,
        tier,
        order: order || 0,
      },
    });

    return res.status(201).json({ success: true, data: sponsor });
  } catch (error) {
    console.error("خطأ في إنشاء شريك:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function updateSponsor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;
    const { name, logoUrl, websiteUrl, tier, order } = req.body;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!sponsor || sponsor.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.sponsor.update({
      where: { id: String(id) },
      data: { name, logoUrl, websiteUrl, tier, order },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في تحديث الشريك:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function deleteSponsor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const sponsor = await prisma.sponsor.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!sponsor || sponsor.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    await prisma.sponsor.delete({ where: { id: String(id) } });
    return res.status(200).json({ success: true, message: "تم الحذف" });
  } catch (error) {
    console.error("خطأ في حذف الشريك:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

// ========== معرض الصور (Gallery) ==========

export async function getGalleryImages(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const images = await prisma.galleryImage.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({ success: true, data: images });
  } catch (error) {
    console.error("خطأ في جلب الصور:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function createGalleryImage(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { imageUrl, caption, order } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const image = await prisma.galleryImage.create({
      data: { eventId: String(eventId), imageUrl, caption, order: order || 0 },
    });

    return res.status(201).json({ success: true, data: image });
  } catch (error) {
    console.error("خطأ في إنشاء صورة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function deleteGalleryImage(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const image = await prisma.galleryImage.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!image || image.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    await prisma.galleryImage.delete({ where: { id: String(id) } });
    return res.status(200).json({ success: true, message: "تم الحذف" });
  } catch (error) {
    console.error("خطأ في حذف الصورة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}
// ========== البوابات (Gates) ==========

export async function getGates(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const gates = await prisma.gate.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { checkIns: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: gates });
  } catch (error) {
    console.error("خطأ في جلب البوابات:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء جلب البوابات" },
    });
  }
}

export async function createGate(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { name, location, order } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const gate = await prisma.gate.create({
      data: {
        eventId: String(eventId),
        name,
        location,
        order: order || 0,
      },
    });

    return res.status(201).json({ success: true, data: gate });
  } catch (error) {
    console.error("خطأ في إنشاء البوابة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء إنشاء البوابة" },
    });
  }
}

export async function updateGate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;
    const { name, location, isActive, order } = req.body;

    const gate = await prisma.gate.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!gate || gate.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.gate.update({
      where: { id: String(id) },
      data: { name, location, isActive, order },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في تحديث البوابة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء تحديث البوابة" },
    });
  }
}

export async function deleteGate(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const gate = await prisma.gate.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!gate || gate.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    await prisma.gate.delete({ where: { id: String(id) } });

    return res.status(200).json({ success: true, message: "تم حذف البوابة" });
  } catch (error) {
    console.error("خطأ في حذف البوابة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ أثناء حذف البوابة" },
    });
  }
}

// جلب البوابات المتاحة للموظف الحالي (للماسح)
export async function getStaffGates(req: Request, res: Response) {
  try {
    const userId = req.user!.userId;
    const { eventId } = req.params;

    // جلب البوابات النشطة للفعالية
    const gates = await prisma.gate.findMany({
      where: {
        eventId: String(eventId),
        isActive: true,
      },
      orderBy: { order: "asc" },
    });

    return res.status(200).json({ success: true, data: gates });
  } catch (error) {
    console.error("خطأ في جلب بوابات الموظف:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}
// ========== أنواع التذاكر (Ticket Types) ==========

export async function getTicketTypes(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const ticketTypes = await prisma.ticketType.findMany({
      where: { eventId: String(eventId) },
      orderBy: { order: "asc" },
      include: {
        _count: {
          select: { registrations: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: ticketTypes });
  } catch (error) {
    console.error("خطأ في جلب أنواع التذاكر:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function createTicketType(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;
    const { name, description, color, capacity, price, order } = req.body;

    const event = await prisma.event.findUnique({
      where: { id: String(eventId) },
      select: { organizerId: true },
    });

    if (!event || event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    if (!name) {
      return res.status(400).json({
        success: false,
        error: { code: "MISSING_NAME", message: "اسم النوع مطلوب" },
      });
    }

    const ticketType = await prisma.ticketType.create({
      data: {
        eventId: String(eventId),
        name,
        description,
        color: color || "#B08D57",
        capacity: capacity ? Number(capacity) : null,
        price: price ? Number(price) : null,
        order: order || 0,
      },
    });

    return res.status(201).json({ success: true, data: ticketType });
  } catch (error) {
    console.error("خطأ في إنشاء نوع التذكرة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function updateTicketType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;
    const { name, description, color, capacity, price, isActive, order } =
      req.body;

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!ticketType || ticketType.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.ticketType.update({
      where: { id: String(id) },
      data: {
        name,
        description,
        color,
        capacity:
          capacity !== undefined
            ? capacity
              ? Number(capacity)
              : null
            : undefined,
        price: price !== undefined ? (price ? Number(price) : null) : undefined,
        isActive,
        order,
      },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في تحديث نوع التذكرة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

export async function deleteTicketType(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const organizerId = req.user!.userId;

    const ticketType = await prisma.ticketType.findUnique({
      where: { id: String(id) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!ticketType || ticketType.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    // التحقق من عدم وجود تسجيلات مرتبطة
    const regCount = await prisma.registration.count({
      where: { ticketTypeId: String(id) },
    });

    if (regCount > 0) {
      // نعطله بدلاً من حذفه
      await prisma.ticketType.update({
        where: { id: String(id) },
        data: { isActive: false },
      });
      return res.status(200).json({
        success: true,
        message: "تم تعطيل النوع (يوجد تسجيلات مرتبطة به)",
      });
    }

    await prisma.ticketType.delete({ where: { id: String(id) } });
    return res.status(200).json({ success: true, message: "تم حذف النوع" });
  } catch (error) {
    console.error("خطأ في حذف نوع التذكرة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}

// ربط/فصل نوع تذكرة ببوابة
export async function setGateTicketTypes(req: Request, res: Response) {
  try {
    const { gateId } = req.params;
    const organizerId = req.user!.userId;
    const { ticketTypeIds } = req.body; // array of strings

    const gate = await prisma.gate.findUnique({
      where: { id: String(gateId) },
      include: { event: { select: { organizerId: true } } },
    });

    if (!gate || gate.event.organizerId !== organizerId) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "ليس لديك صلاحية" },
      });
    }

    const updated = await prisma.gate.update({
      where: { id: String(gateId) },
      data: {
        allowedTicketTypes: {
          set: ticketTypeIds.map((id: string) => ({ id })),
        },
      },
      include: { allowedTicketTypes: true },
    });

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("خطأ في ربط الأنواع بالبوابة:", error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: "حدث خطأ" },
    });
  }
}
