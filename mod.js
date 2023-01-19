// @ts-check
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

// const { Chart, registerables } = await import("https://esm.sh/chart.js@3.2.0");
// const { default: zoomPlugin } = await import(
//   "https://esm.sh/chartjs-plugin-zoom@2.0.0?deps=chart.js@3.2.0"
// );

import { Chart, registerables } from "https://esm.sh/chart.js@3.2.0";
import zoomPlugin from "https://esm.sh/chartjs-plugin-zoom@2.0.0?deps=chart.js@3.2.0";

Chart.register(...registerables, zoomPlugin);

/** @type {NodeListOf<HTMLElement>} */
const table = document.querySelectorAll(".paper_table tr");
const rawTable = domToRawTable(table);
const { stationIndex, rawTimetable, trainDetails } = rawTableToTimetable(
  rawTable,
);
const { rawTrains, rawStations } = removeDuplicateStation({
  stationIndex,
  rawTimetable,
});
const { stationWithinterval } = getStationInterval({ rawTrains, rawStations });
const { trains, stations } = formatStationOrder({
  stationWithinterval,
  rawTrains,
});
const timetable = getTimetable({ trains, stations, trainDetails });

document.querySelector(".__diagram__extension__result__")?.remove();
const el = renderTimetable(timetable);
el.classList.add("__diagram__extension__result__");
document.querySelector(".paper_table_title")
  ?.insertAdjacentElement("afterend", el);

/** @param {NodeListOf<HTMLElement>} table */
function domToRawTable(table) {
  const res = [];
  for (const tr of iterate(table)) {
    const column = [];
    for (const td of iterate(tr.children)) {
      /** @type {(string|undefined)[]} */
      const cell = [];
      for (const child of iterate(td.childNodes)) {
        if (child.nodeName.toLowerCase() === "img") {
          cell.push((/**@type{HTMLImageElement}*/ (child)).alt);
        } else {
          const text = child.textContent?.trim();
          if (text) {
            cell.push(text);
          }
        }
      }
      column.push(cell);
    }
    res.push(column);
  }
  return res;
}

/** @param {Readonly<(string|undefined)[][][]>} rawTable */
function rawTableToTimetable(rawTable) {
  /**@type {Timetable[]}*/
  const timetable = Array.from({ length: rawTable[0].length }, () => []);
  /**@type {TrainDetails[]}*/
  const trains = Array.from({ length: rawTable[0].length }, () => ({
    /**@type {string|undefined}*/
    trainNumber: undefined,
    /**@type {string|undefined}*/
    trainName: undefined,
    /**@type {string[]}*/
    facilities: [],
    /**@type {string|undefined}*/
    calendar: undefined,
    /**@type {boolean}*/
    onboardSale: false,
  }));
  /** @type {StationIndex[]} */
  const stationIndex = [];

  for (const row of rawTable) {
    const [[title], [subTitle]] = row;
    const lineType = getRowType(title, subTitle);

    if (lineType === "trackNumber") {
      stationIndex.push({
        name: (title ?? "").replace(/番線$/, ""),
        type: "trackNumber",
      });
    } else if ("departure" === lineType || "arrival" === lineType) {
      stationIndex.push({
        name: title ?? "",
        type: lineType,
      });
    }

    for (const [i, column] of row.entries()) {
      if (i < 2) { // "東京" "着" の列はスキップ
        continue;
      }
      if (lineType === "trainNumber") {
        trains[i].trainNumber = column[0];
      } else if (lineType === "trainName") {
        trains[i].trainName = column.join(" ");
      } else if (lineType === "facilities") {
        for (const data of column) {
          if (data) {
            trains[i].facilities.push(data);
          }
        }
      } else if (lineType === "calendar") {
        trains[i].calendar = column.join(" ");
      } else if (lineType === "onboardSale") {
        trains[i].onboardSale = column[0] === "○";
      } else if (lineType === "trackNumber") {
        timetable[i].push(parseTrackNumber(column[0]));
      } else if (lineType === "departure" || lineType === "arrival") {
        timetable[i].push(parseTime(...column));
      }
    }
  }
  return {
    trainDetails: trains.slice(2), // "東京" "着" の列は削除
    rawTimetable: timetable.slice(2), // "東京" "着" の列は削除
    stationIndex,
  };
}

/**
 * 連続する駅を統合（高崎-着の行を高崎-発の行を統合）
 * @param {Object} param0
 * @param {Timetable[]} param0.rawTimetable
 * @param {StationIndex[]} param0.stationIndex
 */
function removeDuplicateStation({ rawTimetable, stationIndex }) {
  /** @type {{name: string; originalIndex: {i: number; type: "arrival"|"departure"|"trackNumber" }[]}[]} */
  const stations = [];
  for (const [i, station] of stationIndex.entries()) {
    if (stations.at(-1)?.name !== station.name) {
      stations.push({
        name: station.name,
        originalIndex: [],
      });
    }
    stations.at(-1)?.originalIndex.push({ i, type: station.type });
  }
  /** @type {Train[]} */
  const rawTrains = rawTimetable.map((train) => {
    return stations.map(({ name, originalIndex }) => {
      /** @type {Train[number]} */
      const res = {
        name,
        type: "outOfRoute", // デフォルト値
        trackNumber: null,
        arrival: undefined,
        departure: undefined,
        note: [],
      };
      for (const { i, type } of originalIndex) {
        const station = train[i];
        if (station.type === "pass") {
          res.type = "pass";
        } else if (station.type === "stop") {
          res.type = "stop";
          if (type === "arrival") {
            res.arrival = station.time;
          } else if (type === "departure") {
            res.departure = station.time;
          }
          res.note.push(...station.note);
        } else if (station.type === "trackNumber") {
          res.trackNumber = station.trackNumber;
        }
      }
      return res;
    });
  });
  return {
    rawTrains,
    rawStations: stations.map(({ name }) => name),
  };
}

/** @param {{ rawTrains: Train[]; rawStations: string[]; }} param0 */
function getStationInterval({ rawTrains, rawStations }) {
  const stationWithinterval = rawStations.map((name) => ({
    name,
    /** @type {Map<number, number>} */
    nextStopToMinTime: new Map(),
  }));
  for (const train of rawTrains) {
    for (let i = 0; i < train.length - 1; i++) {
      // 経由なし の場合はスキップ
      if (train[i].type !== "pass" && train[i].type !== "stop") {
        continue;
      }
      // i+1駅から順番に見て、隣の駅がどこか調べる
      for (let j = i + 1; j < train.length; j++) {
        // 経由なし の場合はスキップ
        if (train[j].type !== "pass" && train[j].type !== "stop") {
          continue;
        }

        const preStop = train[i];
        const nextStop = train[j];
        const preTime = preStop.departure ?? preStop.arrival;
        const nextTime = nextStop.arrival ?? nextStop.departure;
        const time = preTime && nextTime
          ? timeDiff(preTime, nextTime)
          : Infinity;

        // i駅からj駅までの最小運転時分を計算
        const { nextStopToMinTime } = stationWithinterval[i];
        const minTime = Math.min(
          nextStopToMinTime.get(j) ?? Infinity,
          time,
        );
        nextStopToMinTime.set(j, minTime);
        break;
      }
    }
  }
  return { stationWithinterval };
}

/**
 * @param {Object} param0
 * @param {{ name: string; nextStopToMinTime: Map<number, number>; }[]} param0.stationWithinterval
 * @param {Train[]} param0.rawTrains
 */
function formatStationOrder({ stationWithinterval, rawTrains }) {
  /** @typedef {{name: string; interval: number; oldIndex: number; branchTo?: TempStationOrder;}} TempStationOrder */
  const newStations = stationWithinterval
    .map(({ name, nextStopToMinTime }, i) => ({
      target: {
        name,
        interval: nextStopToMinTime.get(i + 1) ?? Infinity,
        /** @type {TempStationOrder | undefined} */
        branchTo: undefined, // indexで指定すると挿入前後で位置が変わってしまうので、参照で保存
        oldIndex: i,
      },
      /** @type {TempStationOrder[]} この駅の前に挿入したい駅 */
      beforeInsert: [],
      /** @type {TempStationOrder[]} この駅の後に挿入したい駅 */
      afterInsert: [],
    }));

  for (
    const [i, { name, nextStopToMinTime }] of stationWithinterval.entries()
  ) {
    if (nextStopToMinTime.has(i + 1)) {
      for (const [nextStop, minTime] of nextStopToMinTime) {
        if (nextStop === i + 1) {
          continue;
        }
        // 分岐元の駅
        // 上菅谷   900
        // 南酒出   ||
        // 常陸鴻巣 905 ↖ここに上菅谷を挿入
        if (name === stationWithinterval[nextStop].name) {
          // 既に挿入済みの場合は何もしない、分岐関連付けのみ
          newStations[nextStop].target.branchTo = newStations[i].target;
        } else {
          if (
            !stationWithinterval[nextStop - 1].nextStopToMinTime.has(nextStop)
          ) {
            newStations[nextStop].beforeInsert.unshift({
              name,
              interval: minTime,
              branchTo: newStations[i].target,
              oldIndex: i,
            });
          } else {
            // 分岐の次の駅が合流駅のパターン
            // 例：湘南ライナー（羽沢線経由）戸塚-武蔵小杉
            // 例：武蔵野線 西浦和-大宮-武蔵浦和 の大宮を経由しないルート
            // 例：リゾートしらかみ（奥羽本線）東能代-弘前
            // ただし、羽沢線は挿入せず無視したい
            // →所要時間が**10分**以下 or 分岐元の駅を全列車通過する場合は挿入せず、無視する
            // （リゾートしらかみは10分以上、戸塚は全列車通過のため）
            // 武蔵野線については、西浦和-大宮-武蔵浦和/西浦和-武蔵浦和の駅順にしたい
            if (minTime < 10) {
              // newStations[nextStop].beforeInsert.unshift(
              //   {
              //     name: stationWithinterval[nextStop].name,
              //     interval: Infinity,
              //   }, // 武蔵浦和
              //   { name, interval: minTime, originalIndex: i }, // 西浦和
              // );
              // 今のところ無視でいいかも
            }
          }
        }
      }
    } else {
      // 合流前の駅
      // 常陸鴻巣 800 ↙ここに上菅谷を挿入
      // 南酒出   ||
      // 上菅谷   805
      for (const [nextStop, minTime] of nextStopToMinTime) {
        if (name === stationWithinterval[nextStop].name) {
          newStations[i].target.branchTo = newStations[nextStop].target;
        } else {
          // 越後湯沢-上毛高原対策
          // 上越新幹線 越後湯沢の発時刻の位置がおかしい
          // 合流駅の1つ手前の駅（＝上毛高原）を見て、駅名が同じ（＝越後湯沢）なら挿入しない
          if (name === stationWithinterval[nextStop - 1].name) {
            // 何もしない、分岐関連付けのみ
            newStations[i].target.branchTo = newStations[nextStop - 1].target;
          } else {
            newStations[i].target.interval = minTime;
            newStations[i].afterInsert.push({
              name: stationWithinterval[nextStop].name,
              interval: Infinity,
              branchTo: newStations[nextStop].target,
              oldIndex: nextStop,
            });
          }
        }
      }
    }
  }

  /** @type {TempStationOrder[]} */
  const formattedStations = [];
  for (const { beforeInsert, target, afterInsert } of newStations) {
    formattedStations.push(...beforeInsert);
    formattedStations.push(target);
    formattedStations.push(...afterInsert);
  }
  const stations = formattedStations.map(({ name, interval, branchTo }) => {
    const branch = branchTo ? formattedStations.indexOf(branchTo) : -1;
    return {
      name,
      interval,
      branch: branch === -1 ? undefined : branch,
    };
  });

  console.log(formattedStations, stations);

  // 駅を挿入した分列車の時刻表もずらす
  const newTrains = rawTrains.map((timatable, ___i) => {
    /** @type {Train} */
    const newTimetable = stations
      .map((station, i) => {
        if (station.branch === undefined) {
          return timatable[formattedStations[i].oldIndex];
        }
        // 分岐駅の分岐側の通らない方には時刻を挿入しない
        // 例：常陸太田行（支線列車）は、郡山側の上菅谷に時刻を入れる必要なし
        // TODO: 当駅が始発終着の場合を処理する（成田）
        if (station.branch < i) { // 分岐の場合
          for (let j = station.branch + 1; j < i; j++) {
            // 分岐元（station.branch駅）～i駅の間が全てoutOfRouteであれば、i駅側を通ると判定
            if (stations[j].branch) { // 関係ない時刻を見てしまい判定の邪魔なので除外
              continue;
            }
            const { type } = timatable[formattedStations[j].oldIndex];
            if (type === "pass" || type === "stop") {
              return {
                name: timatable[formattedStations[i].oldIndex].name,
                type: "outOfRoute",
                trackNumber: null,
                arrival: undefined,
                departure: undefined,
                note: [],
              };
            }
          }
        } else { // 合流の場合
          for (let j = i + 1; j < station.branch; j++) {
            if (stations[j].branch) {
              continue;
            }
            const { type } = timatable[formattedStations[j].oldIndex];
            if (type === "pass" || type === "stop") {
              return {
                name: timatable[formattedStations[i].oldIndex].name,
                type: "outOfRoute",
                trackNumber: null,
                arrival: undefined,
                departure: undefined,
                note: [],
              };
            }
          }
        }
        return timatable[formattedStations[i].oldIndex];
      });

    // 高崎   着  800
    // 越後湯沢発  ||
    // 高崎   発  805
    // の時の高崎の着発時刻をそれぞれに入れる
    /** @type {{name: string; i: number}|null} */
    let preStop = null;
    for (const [i, station] of newTimetable.entries()) {
      if (station.type !== "stop") {
        continue;
      }
      if (!preStop) {
        preStop = { name: stations[i].name, i };
        continue;
      }
      if (stations[i].name === preStop.name) { // 同じ駅名の停車駅に連続して止まる時
        newTimetable[preStop.i].departure ??= station.departure;
        station.departure ??= newTimetable[preStop.i].departure;
        newTimetable[preStop.i].arrival ??= station.arrival;
        station.arrival ??= newTimetable[preStop.i].arrival;
      }
      preStop = { name: stations[i].name, i };
    }
    return newTimetable;
  });
  return {
    trains: newTrains,
    stations,
  };
}

/**
 * @param {{trains:  Train[]; stations: Stations; trainDetails: TrainDetails[];}} param0
 */
function getTimetable({ trains, stations, trainDetails }) {
  return {
    stations,
    trains: trains.map((timetable, i) => ({
      timetable,
      ...trainDetails[i],
    })),
  };
}

/**
 * @param {ReturnType<getTimetable>} param0
 */
function renderTimetable({ stations, trains }) {
  console.log({ stations, trains });
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
    /** @type {{x: number; y: number}[]} */
    let trainArray = [];
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

  console.log(datasets);

  const el = document.createElement("canvas");
  new Chart(el, {
    type: "scatter",
    options: {
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

///////////////////////////

/**
 * @param {string | undefined} title
 * @param {string | undefined} subTitle
 * @returns {"trainNumber"|"trainName"|"facilities"|"calendar"|"onboardSale"|"trackNumber"|"departure"|"arrival"|"unknown"}
 */
function getRowType(title, subTitle) {
  if (title === "列車番号") {
    return "trainNumber";
  } else if (title === "列車名") {
    return "trainName";
  } else if (title === "設備") {
    return "facilities";
  } else if (title === "運転日") {
    return "calendar";
  } else if (title === "車内販売") {
    return "onboardSale";
  } else if (title?.endsWith("番線")) {
    return "trackNumber";
  } else if (subTitle === "発") {
    return "departure";
  } else if (subTitle === "着") {
    return "arrival";
  } else {
    return "unknown";
  }
}

/**
 * @param {(string|undefined)[]} args
 * @returns {Time}
 */
function parseTime(...args) {
  const [text, ...note] = args;
  if (!text) {
    return { type: "outOfRoute" };
  }
  if (text === "レ") {
    return { type: "pass" };
  }
  if (text === "||") {
    return { type: "outOfRoute" };
  }
  if (text === "┐") {
    return { type: "outOfRoute" };
  }
  if (text === "┐") {
    return { type: "outOfRoute" };
  }
  if (text === "＝") {
    return { type: "outOfRoute" };
  }
  if (/[0-9]{4}/.test(text)) {
    return {
      type: "stop",
      time: {
        hour: +text.slice(0, 2),
        minute: +text.slice(2, 4),
      },
      note: /** @type {string[]} */ (note.filter((v) => v)),
    };
  }
  return { type: "outOfRoute" };
}

/**
 * @param {string|undefined} text
 * @returns {{type: "trackNumber"; trackNumber: string|null;}}
 */
function parseTrackNumber(text) {
  if (text === "↓") {
    return {
      type: "trackNumber",
      trackNumber: null,
    };
  }
  if (!text) {
    return {
      type: "trackNumber",
      trackNumber: null,
    };
  }
  return {
    type: "trackNumber",
    trackNumber: text
      .replace(/^\(/, "")
      .replace(/\)$/, ""),
  };
}

/**
 * 時刻の差を分で返す
 * @param {{ hour: number; minute: number; }} pre
 * @param {{ hour: number; minute: number; }} next
 */
function timeDiff(pre, next) {
  const nextTime = next.hour * 60 + next.minute;
  const prevTime = pre.hour * 60 + pre.minute;
  const res = (nextTime - prevTime) % (60 * 24);
  if (res < 0) {
    return (60 * 24) + res;
  }
  return res;
}

/** @param {TrainDetails} param0 */
function colorCodeFromTrainName({ trainName = "", calendar = "", facilities }) {
  if (calendar.startsWith("時変")) {
    return "darkgray";
  }
  if (calendar.startsWith("◆")) {
    return "darkgray";
  }
  if (trainName.startsWith("普通")) {
    if (trainName.startsWith("普通 むさしの")) {
      return "darkorange";
    }
    if (trainName.startsWith("普通 しもうさ")) {
      return "darkmagenta";
    }
    if (facilities.some((facility) => facility.includes("グリーン車自由席"))) {
      return "darkblue";
    } else {
      return "cadetblue";
    }
  }
  const colorMap = [
    ["普通", "darkblue"],
    ["快速 アクティ", "darkgoldenrod"],
    ["快速 ラビット", "darkgoldenrod"],
    ["快速 アーバン", "darkgoldenrod"],
    ["快速", "dodgerblue"],
    ["通勤快速", "slateblue"],
    ["中央特快", "blue"],
    ["通勤特別快速", "red"],
    ["青梅特快", "green"],
    ["特別快速", "darkorange"],
    ["超快速", "darkorange"],
    ["ホームライナー", "darkorange"],
    ["急行", "seagreen"],
    ["特急", "red"],
    ["寝台特急", "palevioletred"],
    ["新幹線", "red"],
    ["はやぶさ", "forestgreen"],
    ["はやて", "limegreen"],
    ["やまびこ", "mediumseagreen"],
    ["なすの", "lightgreen"],
    ["こまち", "deeppink"],
    ["つばさ", "darkmagenta"],
    ["とき", "orangered"],
    ["たにがわ", "darksalmon"],
    ["かがやき", "blue"],
    ["はくたか", "mediumslateblue"],
    ["あさま", "lightsteelblue"],
    ["つるぎ", "lightsteelblue"],
    ["のぞみ", "darkorange"],
    ["ひかり", "olive"],
    ["こだま", "cornflowerblue"],
    ["みずほ", "coral"],
    ["さくら", "hotpink"],
    ["バス", "blueviolet"],
  ];

  for (const [type, color] of colorMap) {
    if (trainName.startsWith(type)) {
      return color;
    }
  }
  return "black"; // デフォルト値
}

/** @type {<T>(arrayLike: ArrayLike<T>) => Generator<T, void, unknown>} */
function* iterate(arrayLike) {
  for (let i = 0; i < arrayLike.length; i++) {
    yield arrayLike[i];
  }
}

/** @typedef {{
 *    type: "trackNumber";
 *    trackNumber: string | null;
 *  } | {
 *    type: "outOfRoute";
 *  } | {
 *    type: "pass";
 *  } | {
 *    type: "stop";
 *    time: {
 *        hour: number;
 *        minute: number;
 *    };
 *    note: string[];
 * }} Time */

/** @typedef {{
 *   trainNumber: string | undefined;
 *   trainName: string | undefined;
 *   facilities: string[];
 *   calendar: string | undefined;
 *   onboardSale: boolean;
 * }} TrainDetails
 */

/** @typedef {Time[]} Timetable */
/** @typedef {({ name: string; type: "arrival"|"departure"|"trackNumber"; })} StationIndex */

/** @typedef {{
        name: string;
        type: "outOfRoute" | "pass" | "stop";
        trackNumber: string | null;
        arrival: {
            hour: number;
            minute: number;
        } | undefined;
        departure: {
            hour: number;
            minute: number;
        } | undefined;
        note: string[];
    }[]} Train */

/** @typedef {{
    name: string;
    interval: number;
    branch: number | undefined;
}[]} Stations */
