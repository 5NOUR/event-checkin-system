import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { Resend } from "resend";

// ========== الأنواع ==========
export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ========== إعداد المزودين ==========
const EMAIL_PROVIDER = process.env.EMAIL_PROVIDER || "console";

let resendClient: Resend | null = null;
let etherealTransporter: Transporter | null = null;

// تهيئة Resend
if (EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY) {
  resendClient = new Resend(process.env.RESEND_API_KEY);
  console.log("📧 Email Service: Resend (Production) initialized");
}

// تهيئة Ethereal
async function getEtherealTransporter(): Promise<Transporter> {
  if (etherealTransporter) return etherealTransporter;

  const testAccount = await nodemailer.createTestAccount();
  etherealTransporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("📧 Email Service: Ethereal (Development) initialized");
  console.log(`   User: ${testAccount.user}`);
  console.log(`   Pass: ${testAccount.pass}`);

  return etherealTransporter;
}

// ========== دالة الإرسال الموحدة ==========
export async function sendEmail(options: EmailOptions): Promise<void> {
  const fromEmail = process.env.EMAIL_FROM || "noreply@eventcheck.local";
  const fromName = process.env.EMAIL_FROM_NAME || "EventCheck";

  try {
    // الوضع 1: Console (افتراضي في التطوير)
    if (EMAIL_PROVIDER === "console") {
      console.log("📧 ===== إرسال بريد إلكتروني (Console Mode) =====");
      console.log(`   إلى: ${options.to}`);
      console.log(`   الموضوع: ${options.subject}`);
      console.log(
        `   المحتوى: ${options.html.replace(/<[^>]+>/g, "").substring(0, 150)}...`,
      );
      console.log("📧 ============================================");
      return;
    }

    // الوضع 2: Ethereal (بريد وهمي حقيقي)
    if (EMAIL_PROVIDER === "ethereal") {
      const transporter = await getEtherealTransporter();
      const info = await transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]+>/g, ""),
      });

      console.log("📧 Email sent (Ethereal):", info.messageId);
      console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
      return;
    }

    // الوضع 3: Resend (بريد حقيقي في الإنتاج)
    if (EMAIL_PROVIDER === "resend" && resendClient) {
      const { data, error } = await resendClient.emails.send({
        from: `${fromName} <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });

      if (error) {
        console.error("❌ فشل إرسال البريد عبر Resend:", error);
        throw new Error(`Resend error: ${error.message}`);
      }

      console.log("📧 Email sent (Resend):", data?.id);
      return;
    }

    throw new Error(`مزود البريد غير مدعوم: ${EMAIL_PROVIDER}`);
  } catch (error) {
    console.error("❌ خطأ في إرسال البريد الإلكتروني:", error);
    // لا نرمي الخطأ حتى لا يفشل العمل الأساسي بسبب البريد
  }
}

// ========== قوالب البريد الإلكتروني ==========
export function createEmailTemplate(
  title: string,
  message: string,
  cta?: { text: string; url: string },
): string {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Tahoma', Arial, sans-serif; background: #f7f7f5; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; border: 1px solid #e5e5e0; padding: 30px; }
        .header { text-align: center; padding-bottom: 20px; border-bottom: 1px solid #e5e5e0; margin-bottom: 20px; }
        .logo { font-size: 24px; font-weight: bold; color: #171717; }
        .logo span { color: #b08d57; }
        h1 { color: #171717; font-size: 20px; margin-bottom: 15px; }
        p { color: #6b6b68; line-height: 1.6; }
        .cta { text-align: center; margin: 25px 0; }
        .cta a { display: inline-block; background: #b08d57; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { text-align: center; color: #6b6b68; font-size: 12px; padding-top: 20px; border-top: 1px solid #e5e5e0; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Event<span>Check</span></div>
        </div>
        <h1>${title}</h1>
        <p>${message}</p>
        ${cta ? `<div class="cta"><a href="${cta.url}">${cta.text}</a></div>` : ""}
        <div class="footer">
          <p>مع خالص التحية،<br/>فريق EventCheck</p>
          <p style="font-size: 11px;">هذا البريد أُرسل تلقائياً. يرجى عدم الرد عليه.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ========== قوالب محددة مسبقاً ==========

export function registrationConfirmationEmail(params: {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventUrl: string;
}) {
  return createEmailTemplate(
    `تأكيد تسجيلك في ${params.eventTitle}`,
    `
      مرحباً ${params.attendeeName}،<br/><br/>
      تم استلام طلب تسجيلك في فعالية "<strong>${params.eventTitle}</strong>".<br/>
      سيتم مراجعة طلبك من قبل المنظم وسيتم إعلامك بالنتيجة.<br/><br/>
      <strong>تفاصيل الفعالية:</strong><br/>
      📅 التاريخ: ${params.eventDate}<br/>
      📍 الموقع: ${params.eventLocation}<br/>
    `,
    { text: "عرض تفاصيل الفعالية", url: params.eventUrl },
  );
}

export function registrationApprovedEmail(params: {
  attendeeName: string;
  eventTitle: string;
  qrUrl: string;
}) {
  return createEmailTemplate(
    `تمت الموافقة على تسجيلك في ${params.eventTitle} 🎉`,
    `
      تهانينا ${params.attendeeName}!<br/><br/>
      تمت الموافقة على تسجيلك في فعالية "<strong>${params.eventTitle}</strong>".<br/>
      يمكنك الآن عرض رمز QR الخاص بك للدخول إلى الفعالية.<br/>
    `,
    { text: "عرض رمز QR", url: params.qrUrl },
  );
}

export function registrationRejectedEmail(params: {
  attendeeName: string;
  eventTitle: string;
}) {
  return createEmailTemplate(
    `نأسف، تم رفض تسجيلك في ${params.eventTitle}`,
    `
      عزيزنا ${params.attendeeName}،<br/><br/>
      نأسف لإبلاغك بأنه تم رفض طلب تسجيلك في فعالية "<strong>${params.eventTitle}</strong>".<br/>
      قد يكون السبب اكتمال السعة أو عدم استيفاء الشروط.<br/><br/>
      نتمنى لك التوفيق في فعاليات أخرى.
    `,
  );
}

export function waitlistPromotionEmail(params: {
  attendeeName: string;
  eventTitle: string;
  qrUrl: string;
}) {
  return createEmailTemplate(
    `تمت ترقيتك من قائمة الانتظار! 🎉`,
    `
      أخبار رائعة ${params.attendeeName}!<br/><br/>
      تم ترقيتك من قائمة الانتظار لفعالية "<strong>${params.eventTitle}</strong>".<br/>
      أصبح تسجيلك الآن مؤكداً، ويمكنك عرض رمز QR الخاص بك للدخول.<br/>
    `,
    { text: "عرض رمز QR", url: params.qrUrl },
  );
}

export function staffInvitationEmail(params: {
  staffName: string;
  eventTitle: string;
  tempPassword: string;
  loginUrl: string;
}) {
  return createEmailTemplate(
    `تم تعيينك كموظف تدقيق في ${params.eventTitle}`,
    `
      مرحباً ${params.staffName}،<br/><br/>
      تم تعيينك كموظف تدقيق في فعالية "<strong>${params.eventTitle}</strong>".<br/><br/>
      <strong>بيانات تسجيل الدخول:</strong><br/>
      🔐 كلمة المرور المؤقتة: <code>${params.tempPassword}</code><br/><br/>
      يرجى تغيير كلمة المرور بعد أول تسجيل دخول.
    `,
    { text: "تسجيل الدخول", url: params.loginUrl },
  );
}

export function passwordResetEmail(params: {
  userName: string;
  resetUrl: string;
}) {
  return createEmailTemplate(
    `إعادة تعيين كلمة المرور`,
    `
      مرحباً ${params.userName}،<br/><br/>
      لقد طلبت إعادة تعيين كلمة المرور. اضغط على الزر أدناه لإكمال العملية.<br/>
      الرابط صالح لمدة ساعة واحدة فقط.
    `,
    { text: "إعادة تعيين كلمة المرور", url: params.resetUrl },
  );
}
