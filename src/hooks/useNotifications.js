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

const BASE_INTERVAL = 15000;
const MAX_INTERVAL = 120000;

export const useNotifications = () => {
  const [waitingCount, setWaitingCount] = useState(0);
  const prevCount = useRef(0);
  const failures = useRef(0);
  const timerRef = useRef(null);

  const fetchCount = useCallback(async () => {
    try {
      const res = await api.get("/tenant/conversations/waiting-count");
      const count = res.data.data.count || 0;
      if (count > prevCount.current) {
        playNotificationSound();
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("💬 Novo atendimento", {
            body: `${count} conversa${count > 1 ? "s" : ""} aguardando atendimento`,
            icon: "/favicon.ico",
          });
        }
      }
      prevCount.current = count;
      setWaitingCount(count);
      failures.current = 0;
    } catch {
      failures.current = Math.min(failures.current + 1, 4);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      await fetchCount();
      if (cancelled) return;
      const delay = Math.min(BASE_INTERVAL * 2 ** failures.current, MAX_INTERVAL);
      timerRef.current = setTimeout(tick, delay);
    };
    tick();
    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchCount]);

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return "unsupported";
    if (Notification.permission === "granted") return "granted";
    try {
      return await Notification.requestPermission();
    } catch {
      return "denied";
    }
  }, []);

  return { waitingCount, requestPermission };
};
