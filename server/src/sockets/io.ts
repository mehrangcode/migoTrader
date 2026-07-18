import { Server as HttpServer } from "http";
import { DefaultEventsMap, Server } from "socket.io";
import { appConfig } from "../config";
import { AuthenticatedUser } from "../modules/auth/auth.middleware";
import { verifyAccessToken } from "../modules/auth/tokens";

interface SocketData {
  user: AuthenticatedUser;
}

export type AppSocketServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketData>;

export function createSocketServer(httpServer: HttpServer): AppSocketServer {
  const io: AppSocketServer = new Server(httpServer, {
    cors: { origin: appConfig.cors.origin },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token ?? socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      next(new Error("Missing auth token"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, email: payload.email, role: payload.role };
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`[socket] connected: ${socket.id} (user ${socket.data.user.email})`);

    socket.on("disconnect", () => {
      console.log(`[socket] disconnected: ${socket.id}`);
    });
  });

  return io;
}
