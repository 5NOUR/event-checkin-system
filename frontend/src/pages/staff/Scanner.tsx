import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Html5Qrcode } from "html5-qrcode";
import apiClient from "../../services/apiClient";

interface ScanResult {
  success: boolean;
  message?: string;
  data?: {
    attendeeName: string;
    attendeeEmail: string;
    eventTitle: string;
    checkedInAt: string;
  };
  error?: {
    code: string;
    message: string;
    checkedInAt?: string;
  };
}

export default function StaffScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);

  // ✅ قراءة اسم المستخدم من localStorage مباشرة (بدون useEffect)
  const [userName] = useState(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.name || user.email || "موظف";
      } catch {
        return "موظف";
      }
    }
    return "موظف";
  });

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedToken = useRef<string>("");
  const isMounted = useRef<boolean>(true);
  const isScanningRef = useRef<boolean>(false);

  const safeStopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        isScanningRef.current = false;
      } catch {
        // نتجاهل الخطأ إذا كان الماسح متوقفاً بالفعل
      }
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (lastScannedToken.current === decodedText || !isMounted.current) {
      return;
    }
    lastScannedToken.current = decodedText;

    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.pause();
        isScanningRef.current = false;
      } catch {
        // نتجاهل
      }
    }
    setIsScanning(false);

    try {
      const token = localStorage.getItem("token");
      const eventSlug =
        localStorage.getItem("selectedEventId") || "tech-expo-2026";

      const eventResponse = await apiClient.get(`/events/public/${eventSlug}`);
      const actualEventId = eventResponse.data.data.id;

      const response = await apiClient.post(
        "/checkin/verify",
        { token: decodedText, eventId: actualEventId },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (isMounted.current) {
        setScanResult({
          success: true,
          data: response.data.data,
          message: response.data.message,
        });
      }
    } catch (error: unknown) {
      if (isMounted.current) {
        let errorMessage = "حدث خطأ غير معروف";
        let errorCode = "UNKNOWN";
        let checkedInAt: string | undefined;

        if (error && typeof error === "object" && "response" in error) {
          const err = error as {
            response?: {
              data?: {
                error?: {
                  code?: string;
                  message?: string;
                  checkedInAt?: string;
                };
              };
            };
          };
          errorMessage = err.response?.data?.error?.message || errorMessage;
          errorCode = err.response?.data?.error?.code || errorCode;
          checkedInAt = err.response?.data?.error?.checkedInAt;
        }

        setScanResult({
          success: false,
          error: { code: errorCode, message: errorMessage, checkedInAt },
        });
      }
    }
  };

  // ✅ دالة فارغة ولكن مع تعليق لتجنب تحذير no-empty
  const onScanError = () => {
    // هذا الخطأ طبيعي (عند عدم العثور على رمز)
    // لا نقوم بأي إجراء لتجنب تكرار الرسائل
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (!token || !user) {
      navigate("/login");
      return;
    }
    try {
      const userData = JSON.parse(user);
      if (!["STAFF", "ORGANIZER", "ADMIN"].includes(userData.role)) {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    isMounted.current = true;
    let mounted = true;

    const startScanner = async () => {
      try {
        if (scannerRef.current) {
          await safeStopScanner();
        }

        const html5QrCode = new Html5Qrcode("scanner-container");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          onScanSuccess,
          onScanError,
        );

        if (mounted && isMounted.current) {
          isScanningRef.current = true;
          setIsCameraReady(true);
        }
      } catch {
        if (mounted && isMounted.current) {
          setErrorMessage(
            "تعذر الوصول إلى الكاميرا. يرجى التأكد من منح الصلاحية.",
          );
        }
      }
    };

    startScanner();

    return () => {
      mounted = false;
      isMounted.current = false;
      safeStopScanner().then(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {
            // نتجاهل
          }
          scannerRef.current = null;
        }
      });
    };
  }, []);

  const restartScanner = async () => {
    setScanResult(null);
    setIsScanning(true);
    lastScannedToken.current = "";

    if (scannerRef.current && !isScanningRef.current) {
      try {
        await scannerRef.current.resume();
        isScanningRef.current = true;
      } catch {
        try {
          await safeStopScanner();
          if (scannerRef.current) {
            await scannerRef.current.start(
              { facingMode: "environment" },
              { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
              onScanSuccess,
              onScanError,
            );
            isScanningRef.current = true;
          }
        } catch {
          setErrorMessage("حدث خطأ في إعادة تشغيل الكاميرا");
        }
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedEventId");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] p-4">
      <div className="max-w-md mx-auto">
        {/* ترحيب */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-[#6B6B68]">مرحباً،</p>
            <h1 className="text-xl font-bold text-[#171717]">{userName}</h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm border border-[#E5E5E0] rounded-md hover:bg-[#171717] hover:text-white transition-colors"
          >
            {t("nav.logout")}
          </button>
        </div>

        {/* منطقة الكاميرا */}
        <div
          className="bg-black rounded-lg overflow-hidden shadow-lg relative"
          style={{ aspectRatio: "1/1" }}
        >
          <div id="scanner-container" className="w-full h-full"></div>

          {!isCameraReady && !errorMessage && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-white border-t-transparent mx-auto mb-3"></div>
                <p>جاري تهيئة الكاميرا...</p>
              </div>
            </div>
          )}

          {!isScanning && scanResult && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-4">
              <div className="text-white text-center">
                {scanResult.success ? (
                  <div className="space-y-2">
                    <div className="text-6xl mb-2">✅</div>
                    <p className="text-2xl font-bold text-green-400">
                      تم الدخول!
                    </p>
                    <p className="text-lg text-white">
                      {scanResult.data?.attendeeName}
                    </p>
                    <p className="text-sm text-gray-300">
                      {scanResult.data?.eventTitle}
                    </p>
                    <p className="text-xs text-gray-400">
                      {scanResult.data?.checkedInAt &&
                        new Date(
                          scanResult.data.checkedInAt,
                        ).toLocaleTimeString("ar-EG")}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-6xl mb-2">❌</div>
                    <p className="text-xl font-bold text-red-400">فشل الدخول</p>
                    <p className="text-white">{scanResult.error?.message}</p>
                    {scanResult.error?.checkedInAt && (
                      <p className="text-xs text-gray-400">
                        تم الدخول مسبقاً في:{" "}
                        {new Date(
                          scanResult.error.checkedInAt,
                        ).toLocaleTimeString("ar-EG")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          {!isScanning && (
            <button
              onClick={restartScanner}
              className="flex-1 px-6 py-4 bg-[#171717] text-white font-medium rounded-md text-lg hover:bg-[#2a2a2a] transition-colors"
            >
              مسح مرة أخرى
            </button>
          )}
          {isScanning && isCameraReady && (
            <div className="flex-1 text-center text-sm text-[#6B6B68] py-2">
              ⏳ وجه الكاميرا نحو رمز QR
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-white border border-[#E5E5E0] rounded-md text-sm text-[#6B6B68] space-y-1">
          <p className="font-medium text-[#171717]">📌 تعليمات:</p>
          <ul className="list-disc list-inside space-y-1 pr-4">
            <li>وجّه الكاميرا نحو رمز QR الخاص بالحضور.</li>
            <li>سيتم تسجيل الدخول تلقائياً عند مسح الرمز.</li>
            <li>تأكد من أن الحضور تمت الموافقة على تسجيله مسبقاً.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
