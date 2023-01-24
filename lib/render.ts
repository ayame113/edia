/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import { Chart, registerables } from "https://esm.sh/chart.js@4.2.0";
import zoomPlugin from "https://esm.sh/chartjs-plugin-zoom@2.0.0?deps=chart.js@4.2.0";
import { colorCodeFromTrainName } from "./util.ts";
import { Timetable } from "./types.d.ts";

Chart.register(...registerables, zoomPlugin);

/**
 * 時刻表データをcanvasにダイヤグラムとしてレンダリングする
 * @param timetable 時刻表データ
 * @param source 出典を示す文字列
 * @returns ダイヤグラムがレンダリングされたcanvas
 */
export function renderTimetable(
  { stations, trains }: Timetable,
  source: string,
) {
  // グラフ上の高さは、上から順番になるように負の値にする
  let currentHeight = 0;
  const stationToHeight = stations.map(({ interval }) => {
    const graphInterval = interval === Infinity ? 1 : interval;
    return (currentHeight -= graphInterval) + graphInterval;
  });
  const heightToStation = Object.fromEntries(
    stationToHeight.map((height, i) => [height, i]),
  );

  const datasets = [];
  for (const [trainIndex, train] of trains.entries()) {
    const color = colorCodeFromTrainName(train);
    let trainArray: { x: number; y: number }[] = [];
    for (const [i, station] of train.timetable.entries()) {
      if (station.type === "outOfRoute") {
        if (trainArray.length) {
          datasets.push({
            label: trainIndex.toString(),
            data: trainArray,
            showLine: true,
            borderColor: color,
            backgroundColor: color,
            borderWidth: 2,
            pointRadius: 2,
          });
          trainArray = [];
        }
        continue;
      }
      if (station.arrival) {
        // 4時始まりにしたいので4時間分ずらす
        const timeIndex =
          (station.arrival.hour * 60 + station.arrival.minute + 20 * 60) %
          (24 * 60);
        trainArray.push({
          x: timeIndex,
          y: stationToHeight[i],
        });
      }
      if (
        station.departure &&
        // 停車時間0分の場合は着時刻の点のみ挿入する
        (station.departure.hour !== station.arrival?.hour ||
          station.departure.minute !== station.arrival?.minute)
      ) {
        const timeIndex =
          (station.departure.hour * 60 + station.departure.minute +
            20 * 60) %
          (24 * 60);
        trainArray.push({
          x: timeIndex,
          y: stationToHeight[i],
        });
      }
    }
    datasets.push({
      label: trainIndex.toString(),
      data: trainArray,
      showLine: true,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 2,
      pointRadius: 2,
    });
  }

  const el = document.createElement("canvas");
  new Chart(el, {
    type: "scatter",
    options: {
      animation: false,
      responsiveAnimationDuration: 0,
      scales: {
        x: {
          type: "linear",
          position: "top",
          ticks: {
            callback(v) {
              const time = +v + 4 * 60;
              const minute = `${Math.floor(time % 60)}`.padStart(2, "0");
              return `${Math.floor(time / 60)}:${minute}`;
            },
            stepSize: 10,
            autoSkip: true,
          },
        },
        y: {
          type: "linear",
          ticks: {
            callback(v) {
              return stations[heightToStation[v]]?.name ?? null;
            },
            stepSize: 1,
            autoSkip: false,
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
        subtitle: {
          display: true,
          text: [
            `Created by Edia on ${
              new Date().toLocaleDateString("en", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            } ◆この画像は非公式です。`,
            `出典：${source}`,
          ],
          position: "bottom",
          align: "end",
        },
        // @ts-expect-error: for wrong type
        zoom: {
          pan: {
            enabled: true,
            mode: "xy",
          },
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: "xy",
            scaleMode: "xy",
          },
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const station = stations[heightToStation[ctx.parsed.y]];
              const targetTrain = trains[+(ctx.dataset.label ?? "")];
              const { trackNumber = "", arrival, departure, note } =
                targetTrain.timetable[heightToStation[ctx.parsed.y]];

              const res = [];
              if (targetTrain.calendar) {
                res.push(`【${targetTrain.calendar}】`);
              }
              res.push(`${targetTrain.trainNumber} ${targetTrain.trainName}`);
              if (targetTrain.facilities.length) {
                res.push(...targetTrain.facilities);
              }
              let timeText = `${station.name} `;
              if (arrival) {
                timeText += `${arrival.hour}`.padStart(2, "0");
                timeText += ":";
                timeText += `${arrival.minute}`.padStart(2, "0");
                timeText += "着 ";
              }
              if (departure) {
                timeText += `${departure.hour}`.padStart(2, "0");
                timeText += ":";
                timeText += `${departure.minute}`.padStart(2, "0");
                timeText += "発 ";
              }
              if (trackNumber) {
                timeText += `（${trackNumber}番線）`;
              }
              res.push(timeText);
              if (note.length) {
                res.push(...note);
              }
              return res;
            },
          },
        },
      },
      responsive: true,
      maintainAspectRatio: false,
    },
    data: { datasets },
    plugins: [{
      id: "custom_canvas_background_color",
      beforeDraw(chart) {
        const ctx = chart.canvas.getContext("2d");
        if (!ctx) {
          return;
        }
        ctx.save();
        ctx.globalCompositeOperation = "destination-over";
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, chart.width, chart.height);
        ctx.restore();
      },
    }],
  });
  return el;
}
