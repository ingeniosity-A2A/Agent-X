/**
 * Green Shield inspection — calendar + daily maintenance checklists.
 */

export type ChecklistItem = {
  id: string;
  label: string;
  area: string;
  required: boolean;
  done: boolean;
};

export type GreenShieldDay = {
  date: string; // YYYY-MM-DD
  title: string;
  due: boolean;
  completed: boolean;
  roomsOutOfService: string[];
  checklist: ChecklistItem[];
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * Local-date formatting — NEVER toISOString() for day keys. toISOString
 * renders UTC, which shifts the calendar a day for operators west/east of
 * UTC (owner directive: the to-do card shows the CORRECT Green Shield for
 * TODAY — local). Same noon-guard spirit as the parity contract in
 * esa-exoskeleton/public/config/green-shield.js.
 */
function iso(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** The operator's local today (server-local clock). */
export function todayISO(): string {
  return iso(new Date());
}

function addDays(base: Date, n: number) {
  const x = new Date(base);
  x.setDate(x.getDate() + n);
  return x;
}

const TEMPLATES: { title: string; items: Omit<ChecklistItem, "id" | "done">[] }[] = [
  {
    title: "Daily facilities walk",
    items: [
      { label: "Lobby & corridor lighting", area: "Public", required: true },
      { label: "Ice machine / vending area", area: "Public", required: true },
      { label: "Pool / spa chemical log (if applicable)", area: "Amenity", required: false },
      { label: "Emergency exits clear", area: "Life safety", required: true },
      { label: "Fire extinguisher visual check (zone)", area: "Life safety", required: true },
    ],
  },
  {
    title: "Guest room mechanical sample",
    items: [
      { label: "HVAC filter status (sampled rooms)", area: "HVAC", required: true },
      { label: "Bathroom caulk / leak scan", area: "Plumbing", required: true },
      { label: "Smoke detector chirp / battery", area: "Life safety", required: true },
      { label: "Door hardware / latch", area: "Rooms", required: false },
    ],
  },
  {
    title: "Kitchen / break & laundry",
    items: [
      { label: "Washer / dryer lint & drain", area: "Laundry", required: true },
      { label: "Backflow / utility closet", area: "Mechanical", required: true },
      { label: "Pest monitoring stations", area: "IPM", required: false },
    ],
  },
];

/** In-memory checklist state keyed by date — globalThis-pinned so the
 * calendar GET and the toggle POST (separate route bundles in dev) share
 * one source of truth. */
type GreenShieldGlobal = { __avaGreenShield?: Map<string, GreenShieldDay> };
const gsGlobal = globalThis as GreenShieldGlobal;
if (!gsGlobal.__avaGreenShield) gsGlobal.__avaGreenShield = new Map();
const dayState = gsGlobal.__avaGreenShield;

function buildDay(dateStr: string, index: number): GreenShieldDay {
  const tpl = TEMPLATES[index % TEMPLATES.length];
  return {
    date: dateStr,
    title: tpl.title,
    due: true,
    completed: false,
    roomsOutOfService: index % 4 === 0 ? ["214", "308"] : index % 5 === 0 ? ["119"] : [],
    checklist: tpl.items.map((it, i) => ({
      ...it,
      id: `${dateStr}-${i}`,
      done: false,
    })),
  };
}

export function getMonthDays(year: number, month: number): GreenShieldDay[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const out: GreenShieldDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = iso(new Date(year, month, d));
    if (!dayState.has(dateStr)) {
      dayState.set(dateStr, buildDay(dateStr, d));
    }
    out.push(dayState.get(dateStr)!);
  }
  const today = todayISO();
  for (const day of out) {
    // Green Shield SOP contract: inspections are DUE every weekday except
    // Sunday; a completed day is no longer due. This now holds for past,
    // today AND future days (previously today/past ignored the Sunday
    // exemption — today on a Sunday showed "due").
    day.due = dWeekdayDue(day.date) && !day.completed;
  }
  return out;
}

function dWeekdayDue(dateStr: string) {
  const wd = new Date(dateStr + "T12:00:00").getDay();
  return wd !== 0;
}

export function getDay(dateStr: string): GreenShieldDay {
  if (!dayState.has(dateStr)) {
    const d = new Date(dateStr + "T12:00:00").getDate();
    dayState.set(dateStr, buildDay(dateStr, d));
  }
  return dayState.get(dateStr)!;
}

export function toggleChecklistItem(dateStr: string, itemId: string): GreenShieldDay {
  const day = getDay(dateStr);
  day.checklist = day.checklist.map((c) =>
    c.id === itemId ? { ...c, done: !c.done } : c
  );
  const required = day.checklist.filter((c) => c.required);
  day.completed =
    required.length > 0 && required.every((c) => c.done);
  dayState.set(dateStr, day);
  return day;
}

export function setRoomsOutOfService(dateStr: string, rooms: string[]): GreenShieldDay {
  const day = getDay(dateStr);
  day.roomsOutOfService = rooms;
  dayState.set(dateStr, day);
  return day;
}

export function greenShieldSummary(dateStr?: string) {
  const today = dateStr ?? todayISO();
  const day = getDay(today);
  // Noon guard on the parse too — bare "YYYY-MM-DD" parses as UTC midnight
  // and shifts the month parts on non-UTC servers.
  const noon = new Date(today + "T12:00:00");
  const month = getMonthDays(noon.getFullYear(), noon.getMonth());
  const completedDays = month.filter((d) => d.completed).length;
  const dueDays = month.filter((d) => d.due && !d.completed && d.date <= today).length;
  return {
    today: day,
    completedDays,
    dueDays,
    roomsOutOfService: day.roomsOutOfService,
  };
}
