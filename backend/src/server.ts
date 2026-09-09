import http from "http";
import app from "./app";
import { initIO } from "./sockets/io";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// ✅ تأكد أن initIO تُستدعى قبل listen
const io = initIO(server);

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔌 Socket.IO ready on path /socket.io`);
});

export { io };
