import type { Time, TrainDetails } from "./types.d.ts";

export function getRowType(
  title: string | undefined,
  subTitle: string | undefined,
) {
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

export function parseTime(...args: (string | undefined)[]): Time {
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
      note: note.filter((v) => v) as string[],
    };
  }
  return { type: "outOfRoute" };
}

export function parseTrackNumber(text: string | undefined) {
  if (text === "↓") {
    return {
      type: "trackNumber",
      trackNumber: null,
    } as const;
  }
  if (!text) {
    return {
      type: "trackNumber",
      trackNumber: null,
    } as const;
  }
  return {
    type: "trackNumber",
    trackNumber: text
      .replace(/^\(/, "")
      .replace(/\)$/, ""),
  } as const;
}

/** 時刻の差を分で返す */
export function timeDiff(
  pre: { hour: number; minute: number },
  next: { hour: number; minute: number },
) {
  const nextTime = next.hour * 60 + next.minute;
  const prevTime = pre.hour * 60 + pre.minute;
  const res = (nextTime - prevTime) % (60 * 24);
  if (res < 0) {
    return (60 * 24) + res;
  }
  return res;
}

export function colorCodeFromTrainName(
  { trainName = "", calendar = "", facilities }: TrainDetails,
) {
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

export function* iterate<T>(arrayLike: ArrayLike<T>) {
  for (let i = 0; i < arrayLike.length; i++) {
    yield arrayLike[i];
  }
}
