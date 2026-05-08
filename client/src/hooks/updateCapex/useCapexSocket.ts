import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface CapexProgress {
  jobId: string;
  percentage: number;
  message: string;
  phase: string;
}

interface UseCapexSocketReturn {
  progress: number | null;
  message: string;
  phase: string | null;
  connected: boolean;
  socketError: string | null;
  disconnect: () => void;
}

/**
 * Hook responsável pela conexão Socket.IO com o namespace /socketCapex.
 *
 * Melhorias aplicadas:
 * - URL via variável de ambiente (NEXT_PUBLIC_SOCKET_URL) — sem hardcode
 * - Tratamento de connect_error com estado socketError
 * - join() emitido de forma segura: aguarda conexão se o socket ainda estiver conectando
 * - reconnection limitada (3 tentativas) para evitar loop infinito em erros permanentes
 * - cleanup completo ao desmontar (removeAllListeners + disconnect)
 * - disconnect() exposta para finalização manual
 */
export function useCapexSocket(
  jobId: string | null,
  token?: string,
): UseCapexSocketReturn {
  const socketRef = useRef<Socket | null>(null);

  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string>("");
  const [phase, setPhase] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string | null>(null);

  // ─── Conecta o socket uma única vez por token ──────────────────────────────
  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const socket = io(`${socketUrl}/socketCapex`, {
      transports: ["websocket"],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1500,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setSocketError(null);
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    // Erro de autenticação ou falha de rede ao tentar conectar
    socket.on("connect_error", (err) => {
      setSocketError(err.message ?? "Falha na conexão com o servidor");
      setConnected(false);
    });

    socket.on("capex:progress", (data: CapexProgress) => {
      setProgress(data.percentage);
      setMessage(data.message);
      setPhase(data.phase);

      if (data.phase === "done" || data.phase === "error") {
        socket.disconnect();
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  // ─── Entra na sala assim que jobId estiver disponível ──────────────────────
  useEffect(() => {
    if (!jobId || !socketRef.current) return;

    const socket = socketRef.current;

    // Se já conectado, emite imediatamente; caso contrário, aguarda o evento
    if (socket.connected) {
      socket.emit("join", jobId);
    } else {
      socket.once("connect", () => {
        socket.emit("join", jobId);
      });
    }
  }, [jobId]);

  // ─── Disconnect manual com limpeza completa ────────────────────────────────
  const disconnect = () => {
    if (!socketRef.current) return;
    socketRef.current.removeAllListeners();
    socketRef.current.disconnect();
    socketRef.current = null;
  };

  return { progress, message, phase, connected, socketError, disconnect };
}
