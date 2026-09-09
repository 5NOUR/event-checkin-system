import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

// استيراد الصفحات
import PublicEventPage from "./pages/PublicEventPage";
import Login from "./pages/auth/Login";
import OrganizerDashboard from "./pages/organizer/Dashboard";
import OrganizerEventDetails from "./pages/organizer/EventDetails";
import OrganizerAnalytics from "./pages/organizer/Analytics";
import StaffManagement from "./pages/organizer/StaffManagement";
import QrDisplay from "./pages/public/QrDisplay";
import StaffScanner from "./pages/staff/Scanner";

// استيراد المكونات
import Navbar from "./components/Navbar";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function LanguageController() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <LanguageController />
        <div className="min-h-screen bg-[#F7F7F5]">
          {/* شريط التنقل في الأعلى */}
          <Navbar />

          {/* المحتوى */}
          <div className="pt-6">
            <Routes>
              <Route path="/" element={<PublicEventPage />} />
              <Route path="/event/:slug" element={<PublicEventPage />} />
              <Route path="/qr/:token" element={<QrDisplay />} />
              <Route path="/login" element={<Login />} />
              <Route path="/organizer" element={<OrganizerDashboard />} />
              <Route
                path="/organizer/events/:eventId"
                element={<OrganizerEventDetails />}
              />
              <Route
                path="/organizer/events/:eventId/analytics"
                element={<OrganizerAnalytics />}
              />
              <Route
                path="/organizer/events/:eventId/staff"
                element={<StaffManagement />}
              />
              <Route path="/staff/scan" element={<StaffScanner />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
