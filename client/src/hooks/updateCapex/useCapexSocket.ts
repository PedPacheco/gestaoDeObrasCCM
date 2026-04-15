import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Progress {
  jobId: string;
  percentage: number;
  message: string;
  phase: string;
}

export function useCapexSocket(jobId: string | null, token?: string) {
  const socketRef = useRef<Socket | null>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [connected, setConnected] = useState(false);
  const [phase, setPhase] = useState<string | null>(null);

  // 🔌 conecta UMA vez só
  useEffect(() => {
    const socket = io("http://localhost:8080/socketCapex", {
      transports: ["websocket"],
      auth: { token },
      reconnection: false,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("capex:progress", (data: Progress) => {
      setProgress(data.percentage);
      setMessage(data.message);
      setPhase(data.phase); // 🔥 novo

      if (data.phase === "done" || data.phase === "error") {
        socket.disconnect();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  // 🎯 entra no room quando jobId mudar
  useEffect(() => {
    if (!jobId || !socketRef.current) return;

    socketRef.current.emit("join", jobId);
  }, [jobId]);

  const disconnect = () => {
    if (!socketRef.current) return;

    socketRef.current.removeAllListeners(); // 🔥 limpa tudo
    socketRef.current.disconnect();
    socketRef.current = null;
  };

  return {
    progress,
    message,
    phase,
    connected,
    disconnect,
  };
}
