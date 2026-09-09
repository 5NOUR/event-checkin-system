import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import NotificationBell from "./NotificationBell";
import { useState } from "react";

// تعريف نوع المستخدم البسيط
interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // ✅ قراءة المستخدم من localStorage مباشرة عند التهيئة (بدون useEffect)
  const [user] = useState<User | null>(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedEventId");
    navigate("/login");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  // إذا كان المستخدم غير مسجل دخول، نعرض Navbar بسيط (للصفحة العامة)
  if (!user) {
    return (
      <nav className="bg-white border-b border-[#E5E5E0] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-bold text-[#171717] tracking-tight"
          >
            Event<span className="text-[#B08D57]">Check</span>
          </Link>
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
          >
            {i18n.language === "ar" ? "English" : "العربية"}
          </button>
        </div>
      </nav>
    );
  }

  const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";
  const isStaff = user.role === "STAFF";

  return (
    <nav className="bg-white border-b border-[#E5E5E0] px-4 py-3 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* اليسار: اسم التطبيق + روابط سريعة */}
        <div className="flex items-center gap-6">
          <Link
            to={isOrganizer ? "/organizer" : isStaff ? "/staff/scan" : "/"}
            className="text-xl font-bold text-[#171717] tracking-tight"
          >
            Event<span className="text-[#B08D57]">Check</span>
          </Link>

          {isOrganizer && (
            <div className="hidden md:flex items-center gap-4 text-sm">
              <Link
                to="/organizer"
                className={`px-3 py-1 rounded-md transition-colors ${
                  location.pathname === "/organizer"
                    ? "bg-[#171717] text-white"
                    : "text-[#6B6B68] hover:bg-[#F7F7F5]"
                }`}
              >
                لوحة التحكم
              </Link>
            </div>
          )}
        </div>

        {/* اليمين: الإشعارات، اللغة، الخروج */}
        <div className="flex items-center gap-3">
          {/* زر اللغة */}
          <button
            onClick={toggleLanguage}
            className="px-3 py-1 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
          >
            {i18n.language === "ar" ? "English" : "العربية"}
          </button>

          {/* الإشعارات (للمنظم والموظف) */}
          <NotificationBell />

          {/* اسم المستخدم (اختياري) */}
          <span className="hidden md:block text-sm text-[#6B6B68]">
            {user.name || user.email}
          </span>

          {/* زر الخروج */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
          >
            {t("nav.logout")}
          </button>
        </div>
      </div>

      {/* قائمة منسدلة للجوال (اختياري) */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 pt-3 border-t border-[#E5E5E0] flex flex-col gap-2">
          {isOrganizer && (
            <Link
              to="/organizer"
              className="px-3 py-2 text-sm rounded-md hover:bg-[#F7F7F5]"
              onClick={() => setIsMenuOpen(false)}
            >
              لوحة التحكم
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
