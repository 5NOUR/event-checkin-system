import { Request, Response } from "express";
import {
  exportEventRegistrations,
  ExportResult,
} from "../services/exportService";
import { createObjectCsvStringifier } from "csv-writer";
import { logAudit } from "../services/auditService";

export async function exportCsv(req: Request, res: Response) {
  try {
    const { eventId } = req.params;
    const organizerId = req.user!.userId;

    const result: ExportResult = await exportEventRegistrations(
      String(eventId),
      organizerId,
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

    if (!result.data) {
      return res.status(500).json({
        success: false,
        error: {
          code: "NO_DATA",
          message: "لا توجد بيانات لتصديرها",
        },
      });
    }

    const { records, eventTitle } = result.data;

    // إنشاء كاتب CSV
    const csvWriter = createObjectCsvStringifier({
      header: [
        { id: "الاسم الكامل", title: "الاسم الكامل" },
        { id: "البريد الإلكتروني", title: "البريد الإلكتروني" },
        { id: "رقم الهاتف", title: "رقم الهاتف" },
        { id: "الجهة / الجامعة", title: "الجهة / الجامعة" },
        { id: "المسمى الوظيفي", title: "المسمى الوظيفي" },
        { id: "حالة التسجيل", title: "حالة التسجيل" },
        { id: "وقت التسجيل", title: "وقت التسجيل" },
        { id: "حالة الدخول", title: "حالة الدخول" },
        { id: "وقت الدخول", title: "وقت الدخول" },
      ],
    });

    // ✅ إضافة BOM (U+FEFF) لضمان التعرف على UTF-8 بشكل صحيح في Excel
    const BOM = "\uFEFF";
    const csvString =
      BOM + csvWriter.getHeaderString() + csvWriter.stringifyRecords(records);

    // اسم الملف (بسيط لتجنب مشاكل الترميز في الرأس)
    const fileName = `participants_${eventId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.csv`;

    // تعيين رؤوس الاستجابة
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    );
    res.setHeader("Content-Length", Buffer.byteLength(csvString, "utf8"));
    // ✅ تسجيل التصدير
    await logAudit({
      userId: organizerId,
      action: "EXPORT_GENERATED",
      details: {
        eventId,
        eventTitle: result.data.eventTitle,
        recordCount: result.data.records.length,
      },
      ipAddress: req.ip,
    });

    return res.status(200).send(csvString);
  } catch (error) {
    console.error("خطأ في تصدير CSV:", error);
    return res.status(500).json({
      success: false,
      error: {
        code: "SERVER_ERROR",
        message: "حدث خطأ أثناء تصدير البيانات",
      },
    });
  }
}
