import { Request } from "express";
import path from "path";

// التحقق من أمان اسم الملف
export function sanitizeFilename(filename: string): string {
  // إزالة المسارات
  let safe = path.basename(filename);
  // إزالة الأحرف الخطيرة
  safe = safe.replace(/[^a-zA-Z0-9._-]/g, "_");
  // الحد من الطول
  if (safe.length > 200) {
    const ext = path.extname(safe);
    safe = safe.slice(0, 200 - ext.length) + ext;
  }
  return safe;
}

// التحقق من نوع الملف (Magic Number check)
export function isAllowedImageType(
  mimetype: string,
  extension: string,
): boolean {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const allowedExts = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

  return (
    allowedMimes.includes(mimetype.toLowerCase()) &&
    allowedExts.includes(extension.toLowerCase())
  );
}

// توليد اسم ملف فريد
export function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}_${random}${ext}`;
}
