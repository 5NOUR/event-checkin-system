import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (eventId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("⚠️ No token found, skipping socket");
      return;
    }

    const socket = io("http://localhost:5000", {
      auth: { token },
      path: "/socket.io", // ✅ مطابق للخادم
      transports: ["polling", "websocket"], // ✅ الترتيب مهم
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (isMounted.current) {
        setIsConnected(true);
        console.log("✅ Socket connected");
        if (eventId) {
          socket.emit("join-event", eventId);
        }
      }
    });

    socket.on("disconnect", () => {
      if (isMounted.current) {
        setIsConnected(false);
        console.log("❌ Socket disconnected");
      }
    });

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err.message);
    });

    // ✅ استقبال الأخطاء من الخادم
    socket.on("error", (err) => {
      console.error("❌ Socket error from server:", err);
    });

    return () => {
      isMounted.current = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId]);

  return { socketRef, isConnected };
};
