import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

let audioCtx = null;

const playNotificationSound = () => {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.setValueAtTime(660, audioCtx.currentTime + 0.1);
    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + 0.4,
    );
    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.4);
  } catch {}
};

export const useNotifications = () => {
  const [waitingCount, setWaitingCount] = useState(0);
  const prevCount = useRef(0);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get("/tenant/conversations/waiting-count");
      const count = res.data.data.count || 0;
      if (count > prevCount.current) {
        playNotificationSound();
        if (Notification.permission === "granted") {
          new Notification("💬 Novo atendimento", {
            body: `${count} conversa${count > 1 ? "s" : ""} aguardando atendimento`,
            icon: "/favicon.ico",
          });
        }
      }
      prevCount.current = count;
      setWaitingCount(count);
    } catch {}
  }, []);

  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  return { waitingCount };
};
