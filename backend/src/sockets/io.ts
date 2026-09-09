import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";

let io: SocketIOServer | null = null;

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return io;
}

export function initIO(server: HTTPServer): SocketIOServer {
  console.log("🔌 Initializing Socket.IO...");

  const socketIO = new SocketIOServer(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
      methods: ["GET", "POST"],
    },
    path: "/socket.io",
    // ✅ إضافة مسار صريح للتأكد
    serveClient: false,
    // ✅ ضبط إعدادات الـ ping
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ✅ تسجيل جميع الطلبات القادمة (للتصحيح)
  socketIO.engine.on("connection", (socket) => {
    console.log(`🔌 Engine connection established: ${socket.id}`);
  });

  // ✅ تسجيل أي خطأ في الـ engine
  socketIO.engine.on("error", (err) => {
    console.error("❌ Socket.IO engine error:", err);
  });

  // ✅ المصادقة: نسمح دائماً بالاتصال، لكن نحفظ حالة المصادقة
  socketIO.use((socket, next) => {
    const token = socket.handshake.auth.token;
    console.log(
      `🔍 Socket ${socket.id} - Token: ${token ? "present" : "missing"}`,
    );

    if (token) {
      try {
        const secret = process.env.JWT_SECRET || "default-secret-change-this";
        const decoded = jwt.verify(token, secret) as any;
        socket.data.user = decoded;
        socket.data.authenticated = true;
        console.log(`✅ Auth success: ${decoded.email} (${decoded.role})`);
      } catch (err) {
        console.log(
          `❌ Auth failed: ${err instanceof Error ? err.message : "Unknown"}`,
        );
        socket.data.authenticated = false;
        socket.data.user = null;
      }
    } else {
      console.log(`⚠️ No token provided`);
      socket.data.authenticated = false;
      socket.data.user = null;
    }
    next();
  });

  socketIO.on("connection", (socket) => {
    const user = socket.data.user;
    const isAuth = socket.data.authenticated;
    console.log(`✅ Client connected: ${socket.id} | Auth: ${isAuth}`);

    // انضمام إلى غرفة الفعالية
    socket.on("join-event", (eventId: string) => {
      if (!isAuth) {
        console.log(`⛔ Unauthorized join attempt from ${socket.id}`);
        return;
      }
      if (!eventId) return;
      const room = `event:${eventId}`;
      socket.join(room);
      console.log(`📌 Socket ${socket.id} joined room: ${room}`);
    });

    socket.on("leave-event", (eventId: string) => {
      if (!eventId) return;
      const room = `event:${eventId}`;
      socket.leave(room);
      console.log(`📌 Socket ${socket.id} left room: ${room}`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Socket disconnected: ${socket.id}`);
    });
  });

  io = socketIO;
  console.log("✅ Socket.IO initialized successfully");
  return socketIO;
}
