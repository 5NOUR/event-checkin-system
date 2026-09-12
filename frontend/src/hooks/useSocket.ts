import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

export const useSocket = (eventId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // ✅ التحقق من وجود user في localStorage
    const userData = localStorage.getItem("user");
    if (!userData) {
      console.log("⚠️ No user found, skipping socket connection");
      return;
    }

    // ✅ استخراج SOCKET_URL من VITE_API_URL
    // Socket.IO يتصل بالجذر (بدون /api/v1)
    const API_URL =
      import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
    const SOCKET_URL = API_URL.replace("/api/v1", "");

    console.log("🔌 Connecting to socket:", SOCKET_URL);

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      transports: ["polling", "websocket"],
      withCredentials: true, // ✅ إلزامي للإنتاج (Cross-Origin Cookies)
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (isMounted.current) {
        setIsConnected(true);
        console.log("✅ Socket connected:", socket.id);

        if (eventId) {
          socket.emit("join-event", eventId);
          console.log(`📌 Joined event room: ${eventId}`);
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

    socket.on("error", (err) => {
      console.error("❌ Socket error from server:", err);
    });

    return () => {
      isMounted.current = false;

      if (eventId && socketRef.current) {
        socketRef.current.emit("leave-event", eventId);
      }

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [eventId]);

  return { socketRef, isConnected };
};
