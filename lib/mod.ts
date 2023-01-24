/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import { getTimetable } from "./timetable.ts";
import { renderTimetable } from "./render.ts";

/**
 * Chart.jsを利用してダイヤグラムを生成します。
 *
 * ## 時刻表データが入ったHTMLからダイヤグラムを生成する
 *
 * ```ts
 * import { generateDiagram } from "https://deno.land/x/edia@$MODULE_VERSION/lib/mod.ts";
 *
 * const table = document.querySelector(".paper_table"); // tableタグを指定
 * const el = await generateDiagram(table as HTMLTableElement);
 * document.body.insertAdjacentElement("afterbegin", el);
 * ```
 *
 * ## 時刻表データからダイヤグラムを生成する
 *
 * ```ts
 * import { renderTimetable } from "https://deno.land/x/edia@$MODULE_VERSION/lib/mod.ts";
 *
 * const el = await renderTimetable(
 *   {
 *     stations: [
 *        // 駅データ
 *     ],
 *     trains: [
 *       {
 *         trainNumber: "9735M",
 *         facilities: [],
 *         onboardSale: false,
 *         timetable: [
 *           // 時刻表データ
 *         ],
 *       },
 *       // ... 列車データ
 *     ]
 *   },
 *   "https://...", // 出典を示すURL
 * );
 * document.body.insertAdjacentElement("afterbegin", el);
 * ```
 *
 * ## 時刻表データが入ったHTMLから時刻表データを取り出す
 *
 * ```ts
 * import { getTimetable } from "https://deno.land/x/edia@$MODULE_VERSION/lib/mod.ts";
 *
 * const table = document.querySelector(".paper_table"); // tableタグを指定
 * const data = await getTimetable(table as HTMLTableElement);
 * console.log(data);
 * ```
 *
 * @module
 */

/**
 * 時刻表データが入ったHTMLを基にダイヤグラムが描画されたHTML要素を生成する
 * @param 時刻表のデータが入ったtable要素
 * @returns ダイヤグラムがレンダリングされたcanvas
 */
export function generateDiagram(table: HTMLTableElement) {
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
export type { StationIndex, Timetable, Train } from "./types.d.ts";
