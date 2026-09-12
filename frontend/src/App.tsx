import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useEffect, lazy, Suspense } from "react";

// المكونات الأساسية
import Navbar from "./components/Navbar";
import { PageLoader } from "./components/ui/Spinner";

// ✅ Lazy Loading للصفحات
const PublicEventPage = lazy(() => import("./pages/PublicEventPage"));
const EventsList = lazy(() => import("./pages/EventsList"));
const Login = lazy(() => import("./pages/auth/Login"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const OrganizerDashboard = lazy(() => import("./pages/organizer/Dashboard"));
const OrganizerEventDetails = lazy(
  () => import("./pages/organizer/EventDetails"),
);
const OrganizerAnalytics = lazy(() => import("./pages/organizer/Analytics"));
const StaffManagement = lazy(() => import("./pages/organizer/StaffManagement"));
const EventContent = lazy(() => import("./pages/organizer/EventContent"));
const StaffScanner = lazy(() => import("./pages/staff/Scanner"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const QrDisplay = lazy(() => import("./pages/public/QrDisplay"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
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
        <div className="min-h-screen bg-ink-50">
          <Navbar />
          <Suspense fallback={<PageLoader label="جاري التحميل..." />}>
            <Routes>
              <Route path="/" element={<EventsList />} />
              <Route path="/event/:slug" element={<PublicEventPage />} />
              <Route path="/qr/:token" element={<QrDisplay />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/change-password" element={<ChangePassword />} />
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
              <Route
                path="/organizer/events/:eventId/content"
                element={<EventContent />}
              />
              <Route path="/staff/scan" element={<StaffScanner />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
