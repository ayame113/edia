/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import { getTimetable } from "./timetable.ts";
import { renderTimetable } from "./render.ts";

export function render(table: NodeListOf<HTMLElement>) {
  const timetable = getTimetable(table);
  return renderTimetable(timetable);
}

export { getTimetable } from "./timetable.ts";
export { renderTimetable } from "./render.ts";
export type { Timetable } from "./types.d.ts";
