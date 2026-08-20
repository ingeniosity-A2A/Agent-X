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

function iso(d: Date) {
  return d.toISOString().slice(0, 10);
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

/** In-memory checklist state keyed by date */
const dayState = new Map<string, GreenShieldDay>();

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
  const today = iso(new Date());
  for (const day of out) {
    if (day.date > today) day.due = dWeekdayDue(day.date);
    else day.due = !day.completed;
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
  const today = dateStr ?? iso(new Date());
  const day = getDay(today);
  const month = getMonthDays(
    new Date(today).getFullYear(),
    new Date(today).getMonth()
  );
  const completedDays = month.filter((d) => d.completed).length;
  const dueDays = month.filter((d) => d.due && !d.completed && d.date <= today).length;
  return {
    today: day,
    completedDays,
    dueDays,
    roomsOutOfService: day.roomsOutOfService,
  };
}
