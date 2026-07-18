import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { config } from "@/config";
import { tokenStorage } from "@/lib/tokenStorage";
import { useAuthStore } from "@/store/authStore";

/**
 * Single JWT-authenticated Socket.IO connection, tied to auth state. Reconnects when
 * the authenticated user changes (e.g. after login). Exposes the socket + live status.
 */
export function useSocket(): { socket: Socket | null; connected: boolean } {
  const status = useAuthStore((s) => s.status);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const token = tokenStorage.getAccess();
    if (!token) return;

    const instance = io(config.apiUrl, {
      auth: { token },
      transports: ["websocket"],
    });
    socketRef.current = instance;
    setSocket(instance);

    instance.on("connect", () => setConnected(true));
    instance.on("disconnect", () => setConnected(false));

    return () => {
      instance.removeAllListeners();
      instance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [status]);

  return { socket, connected };
}
