/**
 * green-shield.js — shared Green Shield schedule (single source of truth)
 * ========================================================================
 * One module, two consumers:
 *   - ESA.Calendar.js          (service calendar panel dots + detail strip)
 *   - ESA.MaintenanceChecklist.js (daily to-do card — highlighted GS focus)
 *
 * Parity contract with the REAL backend
 * (platform/src/lib/green-shield.ts — served by /api/green-shield):
 *   - Inspection DUE every weekday except Sunday
 *   - Rotating daily template by day-of-month (d % 3):
 *       0 -> Daily facilities walk        (5 checks, 4 required)
 *       1 -> Guest room mechanical sample (4 checks, 3 required)
 *       2 -> Kitchen / break & laundry    (3 checks, 2 required)
 *   - Rooms out of service (same ternary chain as the backend):
 *       d % 4 === 0 -> rooms 214 + 308 ; else d % 5 === 0 -> room 119
 *   - Backend parses dates with a 'T12:00:00' noon guard to stay
 *     timezone-stable — the frontend does the same here.
 */

export const GS_TEMPLATES = [
  {
    title: 'Daily facilities walk',
    checks: [
      { label: 'Lobby & corridor lighting', area: 'Public', required: true },
      { label: 'Ice machine / vending area', area: 'Public', required: true },
      { label: 'Pool / spa chemical log (if applicable)', area: 'Amenity', required: false },
      { label: 'Emergency exits clear', area: 'Life safety', required: true },
      { label: 'Fire extinguisher visual check (zone)', area: 'Life safety', required: true }
    ]
  },
  {
    title: 'Guest room mechanical sample',
    checks: [
      { label: 'HVAC filter status (sampled rooms)', area: 'HVAC', required: true },
      { label: 'Bathroom caulk / leak scan', area: 'Plumbing', required: true },
      { label: 'Smoke detector chirp / battery', area: 'Life safety', required: true },
      { label: 'Door hardware / latch', area: 'Rooms', required: false }
    ]
  },
  {
    title: 'Kitchen / break & laundry',
    checks: [
      { label: 'Washer / dryer lint & drain', area: 'Laundry', required: true },
      { label: 'Backflow / utility closet', area: 'Mechanical', required: true },
      { label: 'Pest monitoring stations', area: 'IPM', required: false }
    ]
  }
];

/**
 * Green Shield schedule for one calendar day — same ternary chain as
 * buildDay()/dWeekdayDue() in platform/src/lib/green-shield.ts.
 * @param {Date} date  a real Date object for the day in question
 */
export function gsForDate(date) {
  const d = date.getDate();
  const dow = date.getDay();
  const tpl = GS_TEMPLATES[d % GS_TEMPLATES.length];
  return {
    dow: dow,
    due: dow !== 0,
    template: tpl.title,
    checks: tpl.checks,
    requiredCount: tpl.checks.filter((c) => c.required).length,
    rooms: d % 4 === 0 ? ['214', '308'] : (d % 5 === 0 ? ['119'] : [])
  };
}

/**
 * Parse the checklist card's YYYY-MM-DD date string with the same
 * noon guard the backend uses, so local timezones cannot shift the day.
 * @param {string} isoDate  YYYY-MM-DD
 */
export function gsForIsoDate(isoDate) {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  return gsForDate(new Date(isoDate + 'T12:00:00'));
}
