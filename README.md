# 🎫 Event Check-in System

نظام متكامل لإدارة الفعاليات والتسجيل والتحقق من الدخول باستخدام QR Code، مبني بتقنيات حديثة وقابل للنشر في بيئة إنتاجية.

[![Node.js](https://img.shields.io/badge/Node.js-22.x-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB.svg)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ المميزات

- 🔐 **نظام أدوار متكامل**: Admin، Organizer، Staff مع صلاحيات مختلفة.
- 📅 **إدارة الفعاليات**: إنشاء، تعديل، نشر، إلغاء مع التحكم بالسعة.
- 📝 **تسجيل الحضور**: صفحة عامة للتسجيل مع التحقق من السعة ومنع التكرار.
- ✅ **الموافقة والرفض**: إدارة التسجيلات مع توليد رمز QR فوري عند الموافقة.
- 📱 **ماسح QR**: مسح ضوئي عبر الكاميرا من المتصفح (يدعم الهواتف والحواسيب).
- 📊 **تحليلات**: رسوم بيانية وإحصائيات لحظية عن التسجيلات والدخول.
- 🔔 **إشعارات فورية**: تنبيهات داخل التطبيق عند حدوث أحداث مهمة.
- 📥 **تصدير CSV**: تصدير بيانات المشاركين بسهولة.
- 🌐 **دعم اللغة العربية**: واجهة كاملة بالعربية مع دعم RTL.
- 🛡️ **أمان متكامل**: Rate Limiting، Helmet، JWT، RBAC.

---

## 🛠️ التقنيات المستخدمة

### الخادم (Backend)

| التقنية            | الإصدار | الغرض               |
| :----------------- | :------ | :------------------ |
| Node.js            | 22.x    | بيئة التشغيل        |
| Express            | 4.x     | إطار الخادم         |
| TypeScript         | 5.x     | لغة البرمجة         |
| Prisma             | 6.x     | ORM وقاعدة البيانات |
| PostgreSQL         | 16.x    | قاعدة البيانات      |
| Socket.IO          | 4.x     | التحديثات اللحظية   |
| JWT                | -       | المصادقة            |
| Bcrypt             | -       | تشفير كلمات المرور  |
| Helmet             | -       | أمان الرؤوس         |
| express-rate-limit | -       | منع الهجمات         |

### الواجهة الأمامية (Frontend)

| التقنية        | الإصدار | الغرض           |
| :------------- | :------ | :-------------- |
| React          | 18.x    | إطار الواجهة    |
| Vite           | 5.x     | بناء المشروع    |
| TypeScript     | 5.x     | لغة البرمجة     |
| Tailwind CSS   | 3.x     | التصميم         |
| React Router   | 6.x     | التنقل          |
| TanStack Query | 5.x     | إدارة الحالة    |
| Recharts       | 2.x     | الرسوم البيانية |
| i18next        | -       | الترجمة         |
| html5-qrcode   | -       | الماسح الضوئي   |

### البنية التحتية

- Docker & Docker Compose
- PostgreSQL في حاوية

---

## 📋 متطلبات التشغيل

- Node.js (v20 أو أحدث)
- Docker Desktop
- Git
- npm أو yarn

---

## 🚀 البدء السريع

### 1. استنساخ المشروع

```bash
git clone <repository-url>
cd event-checkin-system
```
