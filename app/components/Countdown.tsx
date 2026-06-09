"use client";
import { useState, useEffect } from "react";

interface Props {
  endAt: string;
}

export default function Countdown({ endAt }: Props) {
  const [timeLeft, setTimeLeft] = useState("");
  const [urgent, setUrgent] = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = new Date(endAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Auction ended");
        setUrgent(false);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setUrgent(diff < 3600000); // red under 1 hour
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endAt]);

  return (
    <span className={urgent ? "text-red-400 font-bold" : "text-gray-300 font-semibold"}>
      {timeLeft || "..."}
    </span>
  );
}
