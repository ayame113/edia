/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import { getTimetable } from "./timetable.ts";
import { renderTimetable } from "./render.ts";

export function render(table: NodeListOf<HTMLElement>) {
  const timetable = getTimetable(table);
  const wrapper = document.createElement("div");
  wrapper.append(renderTimetable(timetable, location.href));
  Object.assign(wrapper.style, {
    height: "90vh",
    border: "1px solid black",
    margin: "32px 0",
  });
  return wrapper;
}

export { getTimetable } from "./timetable.ts";
export { renderTimetable } from "./render.ts";
export type { Timetable } from "./types.d.ts";
