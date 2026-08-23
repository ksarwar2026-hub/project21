'use client'

import { useEffect, useMemo, useRef, useState } from "react";

function getRemaining(endTime) {
  const remaining = Math.max(0, new Date(endTime).getTime() - Date.now());
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { remaining, days, hours, minutes, seconds };
}

function pad(value) {
  return String(value).padStart(2, "0");
}

export default function CampaignCountdown({ endsAt, onExpire, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(() => getRemaining(endsAt));
  const expiredRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      const nextTimeLeft = getRemaining(endsAt);
      setTimeLeft(nextTimeLeft);

      if (nextTimeLeft.remaining <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        onExpire?.();
      }
    };

    tick();
    const timer = setInterval(tick, 1000);

    return () => clearInterval(timer);
  }, [endsAt, onExpire]);

  const parts = useMemo(
    () => [
      ["Days", timeLeft.days],
      ["Hrs", timeLeft.hours],
      ["Min", timeLeft.minutes],
      ["Sec", timeLeft.seconds],
    ],
    [timeLeft]
  );

  return (
    <div className={compact ? "flex items-center gap-1.5" : "flex flex-wrap items-center gap-2"}>
      {parts.map(([label, value]) => (
        <div
          key={label}
          className={
            compact
              ? "min-w-9 rounded-md border border-[#D7E5BB] bg-white/85 px-1.5 py-1 text-center"
              : "min-w-14 rounded-xl border border-[#D7E5BB] bg-white px-2.5 py-2 text-center shadow-sm"
          }
        >
          <p className={compact ? "text-[11px] font-semibold text-[#1E372B]" : "text-sm font-semibold text-[#1E372B]"}>
            {pad(value)}
          </p>
          <p className={compact ? "text-[8px] font-semibold uppercase text-[#6E776F]" : "text-[10px] font-semibold uppercase text-[#6E776F]"}>
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}
