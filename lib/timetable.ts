/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />

import {
  getRowType,
  iterate,
  parseTime,
  parseTrackNumber,
  timeDiff,
} from "./util.ts";
import type {
  StationIndex,
  Stations,
  Time,
  Train,
  TrainDetails,
} from "./types.d.ts";

/** HTMLから時刻表を生成する */
export function getTimetable(table: NodeListOf<HTMLElement>) {
  const rawTable = domToRawTable(table);
  const { stationIndex, rawTimetable, trainDetails } = rawTableToTimetable(
    rawTable,
  );
  const { rawTrains, rawStations } = removeDuplicateStation({
    stationIndex,
    rawTimetable,
  });
  const { stationWithInterval } = getStationInterval({
    rawTrains,
    rawStations,
  });
  const { trains, stations } = formatStationOrder({
    stationWithInterval,
    rawTrains,
  });

  return {
    stations,
    trains: trains.map((timetable, i) => ({
      timetable,
      ...trainDetails[i],
    })),
  };
}

/** HTMLの表からデータを文字列の配列として抜き出す */
export function domToRawTable(table: NodeListOf<HTMLElement>) {
  const res: (string | undefined)[][][] = [];
  for (const tr of iterate(table)) {
    const column: (string | undefined)[][] = [];
    for (const td of iterate(tr.children)) {
      const cell: (string | undefined)[] = [];
      for (const child of iterate(td.childNodes)) {
        if (child.nodeName.toLowerCase() === "img") {
          cell.push((child as HTMLImageElement).alt);
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

/** 時刻表の2次元配列を列車単位に整理 */
export function rawTableToTimetable(
  rawTable: Readonly<(string | undefined)[][][]>,
) {
  const timetable: Time[][] = Array.from(
    { length: rawTable[0].length },
    () => [],
  );
  const trains: TrainDetails[] = Array.from(
    { length: rawTable[0].length },
    () => ({
      trainNumber: undefined,
      trainName: undefined,
      facilities: [],
      calendar: undefined,
      onboardSale: false,
    }),
  );
  const stationIndex: StationIndex[] = [];

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

/** 連続する駅を統合（高崎-着の行を高崎-発の行を統合） */
export function removeDuplicateStation(
  { rawTimetable, stationIndex }: {
    rawTimetable: Time[][];
    stationIndex: StationIndex[];
  },
) {
  const stations: {
    name: string;
    originalIndex: {
      i: number;
      type: "arrival" | "departure" | "trackNumber";
    }[];
  }[] = [];
  for (const [i, station] of stationIndex.entries()) {
    if (stations.at(-1)?.name !== station.name) {
      stations.push({
        name: station.name,
        originalIndex: [],
      });
    }
    stations.at(-1)?.originalIndex.push({ i, type: station.type });
  }
  const rawTrains: Train[] = rawTimetable.map((train) => {
    return stations.map(({ name, originalIndex }) => {
      const res: Train[number] = {
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

/** 駅同士の間隔を時刻表から取得 */
export function getStationInterval(
  { rawTrains, rawStations }: { rawTrains: Train[]; rawStations: string[] },
) {
  const stationWithInterval = rawStations.map((name) => ({
    name,
    nextStopToMinTime: new Map<number, number>(),
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
        const { nextStopToMinTime } = stationWithInterval[i];
        const minTime = Math.min(
          nextStopToMinTime.get(j) ?? Infinity,
          time,
        );
        nextStopToMinTime.set(j, minTime);
        break;
      }
    }
  }
  return { stationWithInterval };
}

/** 足りない分岐駅を挿入して駅の並びをダイヤグラム用に修正 */
export function formatStationOrder(
  { stationWithInterval, rawTrains }: {
    stationWithInterval: {
      name: string;
      nextStopToMinTime: Map<number, number>;
    }[];
    rawTrains: Train[];
  },
) {
  interface TempStationOrder {
    name: string;
    interval: number;
    oldIndex: number;
    branchTo?: TempStationOrder;
  }
  const newStations = stationWithInterval
    .map(({ name, nextStopToMinTime }, i) => ({
      target: {
        name,
        interval: nextStopToMinTime.get(i + 1) ?? Infinity,
        // indexで指定すると挿入前後で位置が変わってしまうので、参照で保存
        branchTo: undefined as TempStationOrder | undefined,
        oldIndex: i,
      },
      /** この駅の前に挿入したい駅 */
      beforeInsert: [] as TempStationOrder[],
      /** この駅の後に挿入したい駅 */
      afterInsert: [] as TempStationOrder[],
    }));

  for (
    const [i, { name, nextStopToMinTime }] of stationWithInterval.entries()
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
        if (name === stationWithInterval[nextStop].name) {
          // 既に挿入済みの場合は何もしない、分岐関連付けのみ
          newStations[nextStop].target.branchTo = newStations[i].target;
        } else {
          if (
            !stationWithInterval[nextStop - 1].nextStopToMinTime.has(nextStop)
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
        if (name === stationWithInterval[nextStop].name) {
          newStations[i].target.branchTo = newStations[nextStop].target;
        } else {
          // 越後湯沢-上毛高原対策
          // 上越新幹線 越後湯沢の発時刻の位置がおかしい
          // 合流駅の1つ手前の駅（＝上毛高原）を見て、駅名が同じ（＝越後湯沢）なら挿入しない
          if (name === stationWithInterval[nextStop - 1].name) {
            // 何もしない、分岐関連付けのみ
            newStations[i].target.branchTo = newStations[nextStop - 1].target;
          } else {
            newStations[i].target.interval = minTime;
            newStations[i].afterInsert.push({
              name: stationWithInterval[nextStop].name,
              interval: Infinity,
              branchTo: newStations[nextStop].target,
              oldIndex: nextStop,
            });
          }
        }
      }
    }
  }

  const formattedStations: TempStationOrder[] = [];
  for (const { beforeInsert, target, afterInsert } of newStations) {
    formattedStations.push(...beforeInsert);
    formattedStations.push(target);
    formattedStations.push(...afterInsert);
  }
  const stations: Stations = formattedStations.map(
    ({ name, interval, branchTo }) => {
      const branch = branchTo ? formattedStations.indexOf(branchTo) : -1;
      return {
        name,
        interval,
        branch: branch === -1 ? undefined : branch,
      };
    },
  );

  // 駅を挿入した分列車の時刻表もずらす
  const newTrains = rawTrains.map((timatable, ___i) => {
    const newTimetable: Train = stations
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
    let preStop: { name: string; i: number } | null = null;
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
