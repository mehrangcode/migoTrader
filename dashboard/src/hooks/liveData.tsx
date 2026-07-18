import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Socket } from "socket.io-client";
import type { Signal } from "@/lib/api/types";
import { useSocket } from "./useSocket";

const MAX_LIVE_SIGNALS = 100;

interface LiveDataValue {
  socket: Socket | null;
  connected: boolean;
  liveSignals: Signal[];
}

const LiveDataContext = createContext<LiveDataValue>({
  socket: null,
  connected: false,
  liveSignals: [],
});

export function LiveDataProvider({ children }: { children: ReactNode }) {
  const { socket, connected } = useSocket();
  const [liveSignals, setLiveSignals] = useState<Signal[]>([]);

  useEffect(() => {
    if (!socket) return;

    const onNew = (signal: Signal) => {
      setLiveSignals((prev) => [signal, ...prev].slice(0, MAX_LIVE_SIGNALS));
    };

    const onResolved = (resolved: Signal) => {
      setLiveSignals((prev) => prev.map((s) => (s.id === resolved.id ? resolved : s)));
    };

    socket.on("signal:new", onNew);
    socket.on("signal:resolved", onResolved);

    return () => {
      socket.off("signal:new", onNew);
      socket.off("signal:resolved", onResolved);
    };
  }, [socket]);

  return (
    <LiveDataContext.Provider value={{ socket, connected, liveSignals }}>{children}</LiveDataContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLiveData(): LiveDataValue {
  return useContext(LiveDataContext);
}
