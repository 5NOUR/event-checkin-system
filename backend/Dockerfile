# استخدم إصدار Node.js 22 (متوافق مع إصدارك)
FROM node:22-alpine

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# نسخ ملفات package.json أولاً (للاستفادة من الكاش في إعادة البناء)
COPY package*.json ./

# تثبيت الاعتماديات
RUN npm install

# نسخ باقي الملفات
COPY . .

# فتح منفذ الخادم
EXPOSE 5000

# الأمر الافتراضي (سنستخدم npm run dev للتطوير)
CMD ["npm", "run", "dev"]