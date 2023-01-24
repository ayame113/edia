export type Time = {
  type: "trackNumber";
  trackNumber: string | null;
} | {
  type: "outOfRoute";
} | {
  type: "pass";
} | {
  type: "stop";
  time: {
    hour: number;
    minute: number;
  };
  note: string[];
};

export interface TrainDetails {
  trainNumber?: string;
  trainName?: string;
  facilities: string[];
  calendar?: string;
  onboardSale: boolean;
}

export interface StationIndex {
  name: string;
  type: "arrival" | "departure" | "trackNumber";
}

/** 列車（停車駅データの配列。indexは`stations`と揃える。） */
export type Train = {
  /** 経由なし or 通過 or 停車 */
  type: "outOfRoute" | "pass" | "stop";
  /** 番線 */
  trackNumber: string | null;
  /** 到着時刻 */
  arrival: {
    hour: number;
    minute: number;
  } | undefined;
  /** 発車時刻 */
  departure: {
    hour: number;
    minute: number;
  } | undefined;
  /** 記事 */
  note: string[];
}[];

/** 駅データ */
export type Stations = {
  /** 駅名 */
  name: string;
  /** 次の駅との間隔（不明な場合は`Infinity`） */
  interval: number;
  /** 分岐元の駅のindex */
  branch: number | undefined;
}[];

/** 時刻表データの型定義 */
export interface Timetable {
  /** 駅リスト */
  stations: Stations;
  /** 列車リスト */
  trains: {
    /** 列車番号 */
    trainNumber?: string;
    /** 列車名 */
    trainName?: string;
    /** 列車設備 */
    facilities: string[];
    /** 運転日 */
    calendar?: string;
    /** 車内販売の有無 */
    onboardSale: boolean;
    /** 時刻表 */
    timetable: Train;
  }[];
}
