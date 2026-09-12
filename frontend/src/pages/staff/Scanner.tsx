import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import {
  Camera,
  CameraOff,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  DoorOpen,
  Ticket,
  ScanLine,
  RotateCcw,
  User as UserIcon,
} from "lucide-react";
import apiClient from "../../services/apiClient";
import {
  getStaffEvents,
  type StaffEvent,
} from "../../services/staffEventsService";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoader } from "../../components/ui/Spinner";

interface ScanResult {
  success: boolean;
  message?: string;
  data?: {
    attendeeName: string;
    attendeeEmail: string;
    eventTitle: string;
    checkedInAt: string;
    gateName: string | null;
  };
  error?: {
    code: string;
    message: string;
    checkedInAt?: string;
  };
}

interface Gate {
  id: string;
  name: string;
}

export default function StaffScanner() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [selectedEventSlug, setSelectedEventSlug] = useState("");
  const [selectedGateId, setSelectedGateId] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const hasSetDefaultEvent = useRef(false);

  const [userName] = useState(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.name || user.email;
      } catch {
        return "";
      }
    }
    return "";
  });

  const {
    data: staffEvents,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery({
    queryKey: ["staff-events"],
    queryFn: getStaffEvents,
    retry: 1,
  });

  const { data: gates } = useQuery({
    queryKey: ["gates", selectedEventSlug],
    queryFn: async () => {
      if (!selectedEventSlug) return [] as Gate[];
      const eventResponse = await apiClient.get(
        `/events/public/${selectedEventSlug}`,
      );
      const eventId = eventResponse.data.data.id;
      const response = await apiClient.get(`/checkin/gates/${eventId}`);
      return response.data.data as Gate[];
    },
    enabled: !!selectedEventSlug,
  });

  useEffect(() => {
    if (
      staffEvents &&
      staffEvents.length > 0 &&
      !selectedEventSlug &&
      !hasSetDefaultEvent.current
    ) {
      setSelectedEventSlug(staffEvents[0].slug);
      hasSetDefaultEvent.current = true;
    }
  }, [staffEvents, selectedEventSlug]);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      navigate("/login");
      return;
    }
    try {
      const user = JSON.parse(userData);
      if (!["STAFF", "ORGANIZER", "ADMIN"].includes(user.role)) {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = useCallback(async () => {
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
  }, [navigate]);

  if (eventsLoading) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <PageLoader label={t("scanner.loadingEvents")} />
      </div>
    );
  }

  if (eventsError || !staffEvents) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-md w-full">
          <EmptyState
            icon={AlertTriangle}
            title={t("scanner.errorLoadingEvents")}
            description={t("scanner.errorLoadingEventsDescription")}
            action={{
              label: t("scanner.backToLogin"),
              onClick: () => navigate("/login"),
            }}
          />
        </Card>
      </div>
    );
  }

  if (staffEvents.length === 0) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center px-4">
        <Card padding="lg" className="max-w-md w-full">
          <EmptyState
            icon={DoorOpen}
            title={t("scanner.noEventsTitle")}
            description={t("scanner.noEventsDescription")}
            action={{
              label: t("scanner.logoutAction"),
              onClick: handleLogout,
            }}
          />
        </Card>
      </div>
    );
  }

  if (!selectedEventSlug) {
    return (
      <div className="min-h-screen bg-ink-950 flex items-center justify-center">
        <PageLoader label={t("common.loading")} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-950 text-white">
      <header className="sticky top-0 z-30 bg-ink-950/95 backdrop-blur border-b border-white/8">
        <div className="container-page">
          <div className="flex items-center justify-between h-14 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-md bg-gold-500/15 flex items-center justify-center flex-shrink-0">
                <ScanLine
                  className="w-4 h-4 text-gold-500"
                  strokeWidth={1.75}
                />
              </div>
              <div className="min-w-0">
                <p className="text-micro uppercase tracking-wider font-semibold text-ink-500 leading-tight">
                  {t("scanner.staffLabel")}
                </p>
                <p className="text-body-sm font-medium text-white leading-tight truncate">
                  {userName}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-8 h-8 inline-flex items-center justify-center text-ink-400 hover:text-white hover:bg-white/10 rounded-md transition-colors"
              aria-label={t("scanner.logout")}
            >
              <LogOut className="w-4 h-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main className="container-page py-5 max-w-lg">
        <div className="space-y-3 mb-5">
          <SelectField
            label={t("scanner.event")}
            value={selectedEventSlug}
            onChange={(value) => {
              setSelectedEventSlug(value);
              setSelectedGateId("");
            }}
            icon={<Ticket size={14} strokeWidth={1.75} />}
          >
            {staffEvents.map((event: StaffEvent) => (
              <option key={event.id} value={event.slug}>
                {event.title}
              </option>
            ))}
          </SelectField>

          {gates && gates.length > 0 && (
            <SelectField
              label={t("scanner.gate")}
              value={selectedGateId}
              onChange={setSelectedGateId}
              icon={<DoorOpen size={14} strokeWidth={1.75} />}
            >
              <option value="">{t("scanner.noGate")}</option>
              {gates.map((gate) => (
                <option key={gate.id} value={gate.id}>
                  {gate.name}
                </option>
              ))}
            </SelectField>
          )}
        </div>

        <ScannerView
          eventSlug={selectedEventSlug}
          gateId={selectedGateId}
          scanResult={scanResult}
          setScanResult={setScanResult}
          isScanning={isScanning}
          setIsScanning={setIsScanning}
        />
      </main>
    </div>
  );
}

// ============================================
// SCANNER VIEW
// ============================================
function ScannerView({
  eventSlug,
  gateId,
  scanResult,
  setScanResult,
  isScanning,
  setIsScanning,
}: {
  eventSlug: string;
  gateId: string;
  scanResult: ScanResult | null;
  setScanResult: (result: ScanResult | null) => void;
  isScanning: boolean;
  setIsScanning: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedToken = useRef("");
  const isMounted = useRef(true);
  const isScanningRef = useRef(false);

  const eventSlugRef = useRef(eventSlug);
  const gateIdRef = useRef(gateId);

  useEffect(() => {
    eventSlugRef.current = eventSlug;
  }, [eventSlug]);

  useEffect(() => {
    gateIdRef.current = gateId;
  }, [gateId]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {
        // ignore
      }
      isScanningRef.current = false;
    }
  }, []);

  const handleScan = useCallback(
    async (decodedText: string) => {
      if (lastScannedToken.current === decodedText) return;
      lastScannedToken.current = decodedText;

      if (scannerRef.current && isScanningRef.current) {
        try {
          await scannerRef.current.pause();
          isScanningRef.current = false;
        } catch {
          // ignore
        }
      }
      setIsScanning(false);

      try {
        const currentSlug = eventSlugRef.current;
        if (!currentSlug) {
          throw new Error(t("errors.unexpectedError"));
        }

        const eventResponse = await apiClient.get(
          `/events/public/${currentSlug}`,
        );
        const actualEventId = eventResponse.data.data.id;

        const response = await apiClient.post("/checkin/verify", {
          token: decodedText,
          eventId: actualEventId,
          gateId: gateIdRef.current || undefined,
        });

        if (isMounted.current) {
          setScanResult({
            success: true,
            data: response.data.data,
            message: response.data.message,
          });
        }
      } catch (error: unknown) {
        if (isMounted.current) {
          let errMsg = t("errors.unexpectedError");
          let errCode = "UNKNOWN";
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
            errMsg = err.response?.data?.error?.message || errMsg;
            errCode = err.response?.data?.error?.code || errCode;
            checkedInAt = err.response?.data?.error?.checkedInAt;
          }

          setScanResult({
            success: false,
            error: { code: errCode, message: errMsg, checkedInAt },
          });
        }
      }
    },
    [setScanResult, setIsScanning, t],
  );

  useEffect(() => {
    isMounted.current = true;
    let mounted = true;

    const initScanner = async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      if (!mounted) return;

      try {
        const html5QrCode = new Html5Qrcode("scanner-container");
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1.0,
          },
          (text) => handleScan(text),
          () => {
            // ignore
          },
        );

        if (mounted && isMounted.current) {
          isScanningRef.current = true;
          setIsCameraReady(true);
          setErrorMessage("");
        }
      } catch (error) {
        console.error("Camera error:", error);
        if (mounted && isMounted.current) {
          setErrorMessage(t("scanner.cameraError"));
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      isMounted.current = false;
      stopScanner().then(() => {
        if (scannerRef.current) {
          try {
            scannerRef.current.clear();
          } catch {
            // ignore
          }
          scannerRef.current = null;
        }
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const restartScanner = useCallback(async () => {
    setScanResult(null);
    setIsScanning(true);
    lastScannedToken.current = "";

    if (scannerRef.current && !isScanningRef.current) {
      try {
        await scannerRef.current.resume();
        isScanningRef.current = true;
      } catch {
        try {
          await stopScanner();
          if (scannerRef.current) {
            await scannerRef.current.start(
              { facingMode: "environment" },
              {
                fps: 15,
                qrbox: { width: 240, height: 240 },
                aspectRatio: 1.0,
              },
              (text) => handleScan(text),
              () => {},
            );
            isScanningRef.current = true;
          }
        } catch {
          setErrorMessage(t("errors.unexpectedError"));
        }
      }
    }
  }, [handleScan, setScanResult, setIsScanning, stopScanner, t]);

  return (
    <div className="relative">
      <div
        className="relative aspect-square rounded-xl overflow-hidden bg-ink-900 border border-white/8"
        style={{ isolation: "isolate" }}
      >
        <div
          id="scanner-container"
          className="w-full h-full [&_video]:object-cover [&_video]:w-full [&_video]:h-full"
        />

        {!isCameraReady && !errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/70 backdrop-blur-sm">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-gold-500/30 border-t-gold-500 animate-spin mx-auto" />
                <Camera
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-gold-500"
                  strokeWidth={1.5}
                />
              </div>
              <p className="mt-4 text-body-sm text-ink-300">
                {t("scanner.initializingCamera")}
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/90 p-6">
            <div className="text-center max-w-xs">
              <div className="w-12 h-12 rounded-full bg-danger-500/15 flex items-center justify-center mx-auto mb-3">
                <CameraOff
                  className="w-5 h-5 text-danger-500"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-body-sm text-white">{errorMessage}</p>
            </div>
          </div>
        )}

        {isCameraReady && isScanning && !errorMessage && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%]">
              <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-gold-500 rounded-tl-md" />
              <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-gold-500 rounded-tr-md" />
              <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-gold-500 rounded-bl-md" />
              <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-gold-500 rounded-br-md" />
              <div className="absolute inset-x-2 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-gold-500 to-transparent animate-pulse" />
            </div>
          </div>
        )}
      </div>

      {!isScanning && scanResult && (
        <ResultPanel result={scanResult} onRestart={restartScanner} />
      )}

      {isScanning && isCameraReady && (
        <div className="mt-5 flex items-center justify-center gap-2 text-body-sm text-ink-400">
          <div className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
          <span>{t("scanner.scanInstruction")}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Select Field
// ============================================
function SelectField({
  label,
  value,
  onChange,
  icon,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-micro uppercase tracking-wider font-semibold text-ink-500 mb-1.5">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute inset-y-0 start-0 flex items-center ps-3 text-ink-500 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full h-11 ps-9 pe-3 rounded-md border border-white/10 bg-white/5 text-body text-white appearance-none focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500/30 cursor-pointer"
        >
          {children}
        </select>
      </div>
    </div>
  );
}

// ============================================
// Result Panel
// ============================================
function ResultPanel({
  result,
  onRestart,
}: {
  result: ScanResult;
  onRestart: () => void;
}) {
  const { t } = useTranslation();

  if (result.success && result.data) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm rounded-xl animate-fade-in">
        <div className="w-full max-w-sm">
          <div className="flex justify-center mb-5">
            <div className="w-20 h-20 rounded-full bg-success-500/15 flex items-center justify-center">
              <CheckCircle2
                className="w-10 h-10 text-success-500"
                strokeWidth={1.5}
              />
            </div>
          </div>

          <div className="text-center mb-6">
            <p className="text-h3 font-semibold text-white mb-1">
              {t("scanner.result.successTitle")}
            </p>
            <p className="text-body-sm text-success-500 font-medium">
              {t("scanner.result.successSubtitle")}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-lg p-4 mb-5 space-y-3">
            <ResultRow
              icon={<UserIcon size={14} strokeWidth={1.75} />}
              label={t("scanner.result.attendeeName")}
              value={result.data.attendeeName}
            />
            <ResultRow
              icon={<Ticket size={14} strokeWidth={1.75} />}
              label={t("scanner.result.eventName")}
              value={result.data.eventTitle}
            />
            {result.data.gateName && (
              <ResultRow
                icon={<DoorOpen size={14} strokeWidth={1.75} />}
                label={t("scanner.result.gateName")}
                value={result.data.gateName}
              />
            )}
            <ResultRow
              icon={<Clock size={14} strokeWidth={1.75} />}
              label={t("scanner.result.time")}
              value={new Date(result.data.checkedInAt).toLocaleTimeString(
                "ar-EG",
                { hour: "2-digit", minute: "2-digit" },
              )}
            />
          </div>

          <Button
            variant="accent"
            size="lg"
            fullWidth
            onClick={onRestart}
            leftIcon={<RotateCcw size={16} strokeWidth={2} />}
          >
            {t("scanner.result.scanAnother")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-ink-950/95 backdrop-blur-sm rounded-xl animate-fade-in">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <div className="w-20 h-20 rounded-full bg-danger-500/15 flex items-center justify-center">
            {result.error?.code === "ALREADY_CHECKED_IN" ? (
              <Clock className="w-10 h-10 text-warning-500" strokeWidth={1.5} />
            ) : (
              <XCircle
                className="w-10 h-10 text-danger-500"
                strokeWidth={1.5}
              />
            )}
          </div>
        </div>

        <div className="text-center mb-6">
          <p className="text-h3 font-semibold text-white mb-1">
            {result.error?.code === "ALREADY_CHECKED_IN"
              ? t("scanner.result.alreadyCheckedInTitle")
              : t("scanner.result.failedTitle")}
          </p>
          <p className="text-body-sm text-ink-300 max-w-xs mx-auto">
            {result.error?.message}
          </p>
        </div>

        {result.error?.checkedInAt && (
          <div className="bg-warning-500/10 border border-warning-500/20 rounded-lg p-3 mb-5">
            <div className="flex items-center gap-2">
              <Clock
                className="w-3.5 h-3.5 text-warning-500 flex-shrink-0"
                strokeWidth={2}
              />
              <p className="text-caption text-warning-500">
                {t("scanner.result.previousCheckIn")}:{" "}
                <span className="font-semibold tabular-nums">
                  {new Date(result.error.checkedInAt).toLocaleTimeString(
                    "ar-EG",
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </span>
              </p>
            </div>
          </div>
        )}

        <Button
          variant="secondary"
          size="lg"
          fullWidth
          onClick={onRestart}
          leftIcon={<RotateCcw size={16} strokeWidth={2} />}
          className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
        >
          {t("scanner.result.scanAgain")}
        </Button>
      </div>
    </div>
  );
}

function ResultRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-ink-400 min-w-0">
        <span className="flex-shrink-0">{icon}</span>
        <span className="text-caption">{label}</span>
      </div>
      <span className="text-body-sm font-medium text-white text-end truncate">
        {value}
      </span>
    </div>
  );
}
