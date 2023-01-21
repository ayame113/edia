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
  trainNumber: string | undefined;
  trainName: string | undefined;
  facilities: string[];
  calendar: string | undefined;
  onboardSale: boolean;
}

export interface StationIndex {
  name: string;
  type: "arrival" | "departure" | "trackNumber";
}

export type Train = {
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
}[];

export type Stations = {
  name: string;
  interval: number;
  branch: number | undefined;
}[];

export interface Timetable {
  stations: Stations;
  trains: {
    trainNumber: string | undefined;
    trainName: string | undefined;
    facilities: string[];
    calendar: string | undefined;
    onboardSale: boolean;
    timetable: Train;
  }[];
}
