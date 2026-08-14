"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SendEmailButtons } from "./SendEmailButtons";

type ChecklistItem = {
  id: string;
  label: string;
  area: string;
  required: boolean;
  done: boolean;
};

type GreenDay = {
  date: string;
  title: string;
  due: boolean;
  completed: boolean;
  roomsOutOfService: string[];
  checklist: ChecklistItem[];
};

function monthLabel(year: number, month: number) {
  return new Date(year, month, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function GreenShieldPanel() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [days, setDays] = useState<GreenDay[]>([]);
  const [selected, setSelected] = useState<string>(
    now.toISOString().slice(0, 10)
  );
  const [day, setDay] = useState<GreenDay | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMonth = useCallback(async () => {
    const res = await fetch(`/api/green-shield?year=${year}&month=${month}`);
    const data = await res.json();
    setDays(data.days ?? []);
  }, [year, month]);

  const loadDay = useCallback(async (date: string) => {
    const res = await fetch(`/api/green-shield?date=${date}`);
    const data = await res.json();
    setDay(data.day ?? null);
  }, []);

  useEffect(() => {
    loadMonth().catch(() => setError("Calendar load failed"));
  }, [loadMonth]);

  useEffect(() => {
    loadDay(selected).catch(() => setError("Checklist load failed"));
  }, [selected, loadDay]);

  const firstWeekday = useMemo(() => {
    return new Date(year, month, 1).getDay();
  }, [year, month]);

  async function toggle(itemId: string) {
    const res = await fetch("/api/green-shield", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle", date: selected, itemId }),
    });
    const data = await res.json();
    if (data.day) {
      setDay(data.day);
      loadMonth();
    }
  }

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <section className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] p-4 lg:col-span-5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-emerald-400">
              Green Shield
            </p>
            <h2 className="text-base font-semibold">{monthLabel(year, month)}</h2>
          </div>
          <div className="flex gap-1">
            <button type="button" onClick={prevMonth} className="rounded-lg border border-[#2a2a3a] px-2 py-1 text-xs">‹</button>
            <button type="button" onClick={nextMonth} className="rounded-lg border border-[#2a2a3a] px-2 py-1 text-xs">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-[#666]">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {days.map((d) => {
            const dom = Number(d.date.slice(8, 10));
            const isSel = d.date === selected;
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => setSelected(d.date)}
                className={`aspect-square rounded-lg text-xs ${
                  isSel
                    ? "bg-emerald-500/30 ring-1 ring-emerald-400"
                    : d.completed
                      ? "bg-emerald-500/15 text-emerald-300"
                      : d.due
                        ? "bg-amber-500/10 text-amber-100"
                        : "text-[#888] hover:bg-[#1a1a24]"
                }`}
              >
                {dom}
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[#666]">
          <span className="text-emerald-300">● Complete</span>
          <span className="text-amber-200">● Due</span>
          <span>● Selected</span>
        </div>
      </section>

      <section className="rounded-2xl border border-[#1e1e2e] bg-[#12121a] lg:col-span-7">
        {error && <p className="px-4 pt-3 text-xs text-red-300">{error}</p>}
        {day ? (
          <>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#1e1e2e] px-4 py-3">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-emerald-400">
                  Checklist due {day.date}
                </p>
                <h3 className="text-base font-semibold">{day.title}</h3>
                <p className="text-xs text-[#888]">
                  {day.completed
                    ? "Green Shield complete for this day"
                    : "Maintenance checkup in progress"}
                </p>
              </div>
              <SendEmailButtons
                aloneContext={{
                  type: "green_shield_checklist",
                  id: day.date,
                  title: day.title,
                  completed: day.completed,
                  checklist: day.checklist,
                  roomsOutOfService: day.roomsOutOfService,
                }}
              />
            </div>

            <ul className="space-y-2 px-4 py-3">
              {day.checklist.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-[#1e1e2e] bg-[#0a0a0f] px-3 py-2.5"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggle(item.id)}
                    className="mt-1 h-4 w-4 accent-emerald-500"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${item.done ? "text-[#888] line-through" : "text-[#e8e8ed]"}`}>
                      {item.label}
                      {item.required && (
                        <span className="ml-1 text-[10px] text-amber-400">required</span>
                      )}
                    </p>
                    <p className="text-[11px] text-[#555]">{item.area}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-[#1e1e2e] px-4 py-3">
              <p className="text-[10px] uppercase tracking-wide text-[#555]">Out of service rooms</p>
              <p className="mt-1 text-sm text-[#ccc]">
                {day.roomsOutOfService.length
                  ? day.roomsOutOfService.map((r) => `Room ${r}`).join(" · ")
                  : "None"}
              </p>
            </div>
          </>
        ) : (
          <p className="p-8 text-center text-sm text-[#666]">Select a day</p>
        )}
      </section>
    </div>
  );
}
