import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState, useEffect } from "react";
import { Globe, LogOut, Menu, X, KeyRound } from "lucide-react";
import NotificationBell from "./NotificationBell";

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
  const [user, setUser] = useState<User | null>(null);

  // ✅ مراقبة تغييرات localStorage
  useEffect(() => {
    const loadUser = () => {
      const userData = localStorage.getItem("user");
      if (userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("user-changed", loadUser);

    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("user-changed", loadUser);
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/auth/logout`,
        { method: "POST", credentials: "include" },
      );
    } catch {
      // ignore
    }
    localStorage.removeItem("user");
    localStorage.removeItem("selectedEventId");
    window.dispatchEvent(new Event("user-changed"));
    navigate("/login");
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    i18n.changeLanguage(newLang);
    document.dir = newLang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = newLang;
  };

  // ============ Public Navbar ============
  if (!user) {
    return (
      <header className="border-b border-ink-200 bg-white sticky top-0 z-40">
        <div className="container-page">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="text-h4 font-semibold tracking-tight text-ink-900"
            >
              Event<span className="text-gold-500">Check</span>
            </Link>

            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-body-sm text-ink-700 hover:text-ink-900 rounded-md hover:bg-ink-100 transition-colors"
              aria-label={t("nav.language")}
            >
              <Globe className="w-4 h-4" strokeWidth={1.75} />
              <span>{i18n.language === "ar" ? "EN" : "عربي"}</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  // ============ Authenticated Navbar ============
  const isOrganizer = user.role === "ORGANIZER" || user.role === "ADMIN";
  const isStaff = user.role === "STAFF";
  const homeLink = isOrganizer ? "/organizer" : isStaff ? "/staff/scan" : "/";

  const roleLabel =
    user.role === "ADMIN"
      ? t("nav.roles.admin")
      : user.role === "ORGANIZER"
        ? t("nav.roles.organizer")
        : t("nav.roles.staff");

  return (
    <header className="border-b border-ink-200 bg-white sticky top-0 z-40">
      <div className="container-page">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Logo + Quick Links */}
          <div className="flex items-center gap-6 min-w-0">
            <Link
              to={homeLink}
              className="text-h4 font-semibold tracking-tight text-ink-900 flex-shrink-0"
            >
              Event<span className="text-gold-500">Check</span>
            </Link>

            {isOrganizer && (
              <nav className="hidden md:flex items-center gap-1">
                <Link
                  to="/organizer"
                  className={[
                    "h-8 px-3 inline-flex items-center rounded-md text-body-sm font-medium transition-colors",
                    location.pathname === "/organizer"
                      ? "bg-ink-100 text-ink-900"
                      : "text-ink-600 hover:text-ink-900 hover:bg-ink-50",
                  ].join(" ")}
                >
                  {t("nav.dashboard")}
                </Link>
                <Link
                  to="/notifications"
                  className={[
                    "h-8 px-3 inline-flex items-center rounded-md text-body-sm font-medium transition-colors",
                    location.pathname === "/notifications"
                      ? "bg-ink-100 text-ink-900"
                      : "text-ink-600 hover:text-ink-900 hover:bg-ink-50",
                  ].join(" ")}
                >
                  {t("nav.notifications")}
                </Link>
              </nav>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 text-body-sm text-ink-600 hover:text-ink-900 rounded-md hover:bg-ink-100 transition-colors"
              aria-label={t("nav.language")}
            >
              <Globe className="w-4 h-4" strokeWidth={1.75} />
              <span className="hidden sm:inline">
                {i18n.language === "ar" ? "EN" : "عربي"}
              </span>
            </button>

            <NotificationBell />

            {/* Change Password */}
            <Link
              to="/change-password"
              className="hidden md:inline-flex items-center justify-center w-8 h-8 text-ink-500 hover:text-ink-900 hover:bg-ink-100 rounded-md transition-colors"
              aria-label={t("nav.changePassword")}
              title={t("nav.changePassword")}
            >
              <KeyRound className="w-4 h-4" strokeWidth={1.75} />
            </Link>

            {/* User Info */}
            <div className="hidden lg:flex items-center gap-2 ms-2 ps-3 border-s border-ink-200">
              <div className="text-end">
                <p className="text-body-sm font-medium text-ink-900 leading-tight">
                  {user.name || user.email}
                </p>
                <p className="text-micro uppercase tracking-wider text-ink-500 leading-tight mt-0.5">
                  {roleLabel}
                </p>
              </div>
            </div>

            {/* Logout (desktop) */}
            <button
              onClick={handleLogout}
              className="hidden md:inline-flex items-center justify-center w-8 h-8 text-ink-500 hover:text-danger-500 rounded-md hover:bg-danger-100/50 transition-colors"
              aria-label={t("nav.logout")}
              title={t("nav.logout")}
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center w-8 h-8 text-ink-700 hover:bg-ink-100 rounded-md transition-colors"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="w-4 h-4" strokeWidth={1.75} />
              ) : (
                <Menu className="w-4 h-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-ink-200 bg-white animate-fade-in">
          <div className="container-page py-3 space-y-1">
            {isOrganizer && (
              <>
                <Link
                  to="/organizer"
                  onClick={() => setIsMenuOpen(false)}
                  className="block h-10 px-3 leading-10 rounded-md text-body-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  {t("nav.dashboard")}
                </Link>
                <Link
                  to="/notifications"
                  onClick={() => setIsMenuOpen(false)}
                  className="block h-10 px-3 leading-10 rounded-md text-body-sm font-medium text-ink-700 hover:bg-ink-50"
                >
                  {t("nav.notifications")}
                </Link>
              </>
            )}
            <Link
              to="/change-password"
              onClick={() => setIsMenuOpen(false)}
              className="block h-10 px-3 leading-10 rounded-md text-body-sm font-medium text-ink-700 hover:bg-ink-50"
            >
              {t("nav.changePassword")}
            </Link>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                handleLogout();
              }}
              className="w-full text-start h-10 px-3 rounded-md text-body-sm font-medium text-danger-500 hover:bg-danger-100/50 transition-colors"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
