// deno-fmt-ignore-file
// deno-lint-ignore-file
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
function parseTime(...args) {
    const [text, ...note] = args;
    if (!text) {
        return {
            type: "outOfRoute"
        };
    }
    if (text === "レ") {
        return {
            type: "pass"
        };
    }
    if (text === "||") {
        return {
            type: "outOfRoute"
        };
    }
    if (text === "┐") {
        return {
            type: "outOfRoute"
        };
    }
    if (text === "┐") {
        return {
            type: "outOfRoute"
        };
    }
    if (text === "＝") {
        return {
            type: "outOfRoute"
        };
    }
    if (/[0-9]{4}/.test(text)) {
        return {
            type: "stop",
            time: {
                hour: +text.slice(0, 2),
                minute: +text.slice(2, 4)
            },
            note: note.filter((v)=>v)
        };
    }
    return {
        type: "outOfRoute"
    };
}
function parseTrackNumber(text) {
    if (text === "↓") {
        return {
            type: "trackNumber",
            trackNumber: null
        };
    }
    if (!text) {
        return {
            type: "trackNumber",
            trackNumber: null
        };
    }
    return {
        type: "trackNumber",
        trackNumber: text.replace(/^\(/, "").replace(/\)$/, "")
    };
}
function timeDiff(pre, next) {
    const nextTime = next.hour * 60 + next.minute;
    const prevTime = pre.hour * 60 + pre.minute;
    const res = (nextTime - prevTime) % (60 * 24);
    if (res < 0) {
        return 60 * 24 + res;
    }
    return res;
}
function colorCodeFromTrainName({ trainName ="" , calendar ="" , facilities  }) {
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
        if (facilities.some((facility)=>facility.includes("グリーン車自由席"))) {
            return "darkblue";
        } else {
            return "cadetblue";
        }
    }
    const colorMap = [
        [
            "普通",
            "darkblue"
        ],
        [
            "快速 アクティ",
            "darkgoldenrod"
        ],
        [
            "快速 ラビット",
            "darkgoldenrod"
        ],
        [
            "快速 アーバン",
            "darkgoldenrod"
        ],
        [
            "快速",
            "dodgerblue"
        ],
        [
            "通勤快速",
            "slateblue"
        ],
        [
            "中央特快",
            "blue"
        ],
        [
            "通勤特別快速",
            "red"
        ],
        [
            "青梅特快",
            "green"
        ],
        [
            "特別快速",
            "darkorange"
        ],
        [
            "超快速",
            "darkorange"
        ],
        [
            "ホームライナー",
            "darkorange"
        ],
        [
            "急行",
            "seagreen"
        ],
        [
            "特急",
            "red"
        ],
        [
            "寝台特急",
            "palevioletred"
        ],
        [
            "新幹線",
            "red"
        ],
        [
            "はやぶさ",
            "forestgreen"
        ],
        [
            "はやて",
            "limegreen"
        ],
        [
            "やまびこ",
            "mediumseagreen"
        ],
        [
            "なすの",
            "lightgreen"
        ],
        [
            "こまち",
            "deeppink"
        ],
        [
            "つばさ",
            "darkmagenta"
        ],
        [
            "とき",
            "orangered"
        ],
        [
            "たにがわ",
            "darksalmon"
        ],
        [
            "かがやき",
            "blue"
        ],
        [
            "はくたか",
            "mediumslateblue"
        ],
        [
            "あさま",
            "lightsteelblue"
        ],
        [
            "つるぎ",
            "lightsteelblue"
        ],
        [
            "のぞみ",
            "darkorange"
        ],
        [
            "ひかり",
            "olive"
        ],
        [
            "こだま",
            "cornflowerblue"
        ],
        [
            "みずほ",
            "coral"
        ],
        [
            "さくら",
            "hotpink"
        ],
        [
            "バス",
            "blueviolet"
        ]
    ];
    for (const [type, color] of colorMap){
        if (trainName.startsWith(type)) {
            return color;
        }
    }
    return "black";
}
function* iterate(arrayLike) {
    for(let i = 0; i < arrayLike.length; i++){
        yield arrayLike[i];
    }
}
function getTimetable(table) {
    const rawTable = domToRawTable(table);
    const { stationIndex , rawTimetable , trainDetails  } = rawTableToTimetable(rawTable);
    const { rawTrains , rawStations  } = removeDuplicateStation({
        stationIndex,
        rawTimetable
    });
    const { stationWithInterval  } = getStationInterval({
        rawTrains,
        rawStations
    });
    const { trains , stations  } = formatStationOrder({
        stationWithInterval,
        rawTrains
    });
    return {
        stations,
        trains: trains.map((timetable, i)=>({
                timetable,
                ...trainDetails[i]
            }))
    };
}
function domToRawTable(table) {
    const res = [];
    for (const tr of iterate(table)){
        const column = [];
        for (const td of iterate(tr.children)){
            const cell = [];
            for (const child of iterate(td.childNodes)){
                if (child.nodeName.toLowerCase() === "img") {
                    cell.push(child.alt);
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
function rawTableToTimetable(rawTable) {
    const timetable = Array.from({
        length: rawTable[0].length
    }, ()=>[]);
    const trains = Array.from({
        length: rawTable[0].length
    }, ()=>({
            trainNumber: undefined,
            trainName: undefined,
            facilities: [],
            calendar: undefined,
            onboardSale: false
        }));
    const stationIndex = [];
    for (const row of rawTable){
        const [[title], [subTitle]] = row;
        const lineType = getRowType(title, subTitle);
        if (lineType === "trackNumber") {
            stationIndex.push({
                name: (title ?? "").replace(/番線$/, ""),
                type: "trackNumber"
            });
        } else if ("departure" === lineType || "arrival" === lineType) {
            stationIndex.push({
                name: title ?? "",
                type: lineType
            });
        }
        for (const [i, column] of row.entries()){
            if (i < 2) {
                continue;
            }
            if (lineType === "trainNumber") {
                trains[i].trainNumber = column[0];
            } else if (lineType === "trainName") {
                trains[i].trainName = column.join(" ");
            } else if (lineType === "facilities") {
                for (const data of column){
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
        trainDetails: trains.slice(2),
        rawTimetable: timetable.slice(2),
        stationIndex
    };
}
function removeDuplicateStation({ rawTimetable , stationIndex  }) {
    const stations = [];
    for (const [i, station] of stationIndex.entries()){
        if (stations.at(-1)?.name !== station.name) {
            stations.push({
                name: station.name,
                originalIndex: []
            });
        }
        stations.at(-1)?.originalIndex.push({
            i,
            type: station.type
        });
    }
    const rawTrains = rawTimetable.map((train)=>{
        return stations.map(({ name , originalIndex  })=>{
            const res = {
                name,
                type: "outOfRoute",
                trackNumber: null,
                arrival: undefined,
                departure: undefined,
                note: []
            };
            for (const { i , type  } of originalIndex){
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
        rawStations: stations.map(({ name  })=>name)
    };
}
function getStationInterval({ rawTrains , rawStations  }) {
    const stationWithInterval = rawStations.map((name)=>({
            name,
            nextStopToMinTime: new Map()
        }));
    for (const train of rawTrains){
        for(let i = 0; i < train.length - 1; i++){
            if (train[i].type !== "pass" && train[i].type !== "stop") {
                continue;
            }
            for(let j = i + 1; j < train.length; j++){
                if (train[j].type !== "pass" && train[j].type !== "stop") {
                    continue;
                }
                const preStop = train[i];
                const nextStop = train[j];
                const preTime = preStop.departure ?? preStop.arrival;
                const nextTime = nextStop.arrival ?? nextStop.departure;
                const time = preTime && nextTime ? timeDiff(preTime, nextTime) : Infinity;
                const { nextStopToMinTime  } = stationWithInterval[i];
                const minTime = Math.min(nextStopToMinTime.get(j) ?? Infinity, time);
                nextStopToMinTime.set(j, minTime);
                break;
            }
        }
    }
    return {
        stationWithInterval
    };
}
function formatStationOrder({ stationWithInterval , rawTrains  }) {
    const newStations = stationWithInterval.map(({ name , nextStopToMinTime  }, i)=>({
            target: {
                name,
                interval: nextStopToMinTime.get(i + 1) ?? Infinity,
                branchTo: undefined,
                oldIndex: i
            },
            beforeInsert: [],
            afterInsert: []
        }));
    for (const [i, { name , nextStopToMinTime  }] of stationWithInterval.entries()){
        if (nextStopToMinTime.has(i + 1)) {
            for (const [nextStop, minTime] of nextStopToMinTime){
                if (nextStop === i + 1) {
                    continue;
                }
                if (name === stationWithInterval[nextStop].name) {
                    newStations[nextStop].target.branchTo = newStations[i].target;
                } else {
                    if (!stationWithInterval[nextStop - 1].nextStopToMinTime.has(nextStop)) {
                        newStations[nextStop].beforeInsert.unshift({
                            name,
                            interval: minTime,
                            branchTo: newStations[i].target,
                            oldIndex: i
                        });
                    } else {
                        if (minTime < 10) {}
                    }
                }
            }
        } else {
            for (const [nextStop1, minTime1] of nextStopToMinTime){
                if (name === stationWithInterval[nextStop1].name) {
                    newStations[i].target.branchTo = newStations[nextStop1].target;
                } else {
                    if (name === stationWithInterval[nextStop1 - 1].name) {
                        newStations[i].target.branchTo = newStations[nextStop1 - 1].target;
                    } else {
                        newStations[i].target.interval = minTime1;
                        newStations[i].afterInsert.push({
                            name: stationWithInterval[nextStop1].name,
                            interval: Infinity,
                            branchTo: newStations[nextStop1].target,
                            oldIndex: nextStop1
                        });
                    }
                }
            }
        }
    }
    const formattedStations = [];
    for (const { beforeInsert , target , afterInsert  } of newStations){
        formattedStations.push(...beforeInsert);
        formattedStations.push(target);
        formattedStations.push(...afterInsert);
    }
    const stations = formattedStations.map(({ name , interval , branchTo  })=>{
        const branch = branchTo ? formattedStations.indexOf(branchTo) : -1;
        return {
            name,
            interval,
            branch: branch === -1 ? undefined : branch
        };
    });
    const newTrains = rawTrains.map((timatable, ___i)=>{
        const newTimetable = stations.map((station, i)=>{
            if (station.branch === undefined) {
                return timatable[formattedStations[i].oldIndex];
            }
            if (station.branch < i) {
                for(let j = station.branch + 1; j < i; j++){
                    if (stations[j].branch) {
                        continue;
                    }
                    const { type  } = timatable[formattedStations[j].oldIndex];
                    if (type === "pass" || type === "stop") {
                        return {
                            name: timatable[formattedStations[i].oldIndex].name,
                            type: "outOfRoute",
                            trackNumber: null,
                            arrival: undefined,
                            departure: undefined,
                            note: []
                        };
                    }
                }
            } else {
                for(let j1 = i + 1; j1 < station.branch; j1++){
                    if (stations[j1].branch) {
                        continue;
                    }
                    const { type: type1  } = timatable[formattedStations[j1].oldIndex];
                    if (type1 === "pass" || type1 === "stop") {
                        return {
                            name: timatable[formattedStations[i].oldIndex].name,
                            type: "outOfRoute",
                            trackNumber: null,
                            arrival: undefined,
                            departure: undefined,
                            note: []
                        };
                    }
                }
            }
            return timatable[formattedStations[i].oldIndex];
        });
        let preStop = null;
        for (const [i, station] of newTimetable.entries()){
            if (station.type !== "stop") {
                continue;
            }
            if (!preStop) {
                preStop = {
                    name: stations[i].name,
                    i
                };
                continue;
            }
            if (stations[i].name === preStop.name) {
                newTimetable[preStop.i].departure ??= station.departure;
                station.departure ??= newTimetable[preStop.i].departure;
                newTimetable[preStop.i].arrival ??= station.arrival;
                station.arrival ??= newTimetable[preStop.i].arrival;
            }
            preStop = {
                name: stations[i].name,
                i
            };
        }
        return newTimetable;
    });
    return {
        trains: newTrains,
        stations
    };
}
var vn = function() {
    return typeof window > "u" ? function(n) {
        return n();
    } : window.requestAnimationFrame;
}();
function Mn(n, t, e) {
    let i = e || ((a)=>Array.prototype.slice.call(a)), s = !1, o = [];
    return function(...a) {
        o = i(a), s || (s = !0, vn.call(window, ()=>{
            s = !1, n.apply(t, o);
        }));
    };
}
function wi(n, t) {
    let e;
    return function() {
        return t ? (clearTimeout(e), e = setTimeout(n, t)) : n(), t;
    };
}
var Be = (n)=>n === "start" ? "left" : n === "end" ? "right" : "center", $ = (n, t, e)=>n === "start" ? t : n === "end" ? e : (t + e) / 2, ki = (n, t, e)=>n === "right" ? e : n === "center" ? (t + e) / 2 : t;
function it() {}
var Si = function() {
    let n = 0;
    return function() {
        return n++;
    };
}();
function D(n) {
    return n === null || typeof n > "u";
}
function E(n) {
    if (Array.isArray && Array.isArray(n)) return !0;
    let t = Object.prototype.toString.call(n);
    return t.substr(0, 7) === "[object" && t.substr(-6) === "Array]";
}
function A(n) {
    return n !== null && Object.prototype.toString.call(n) === "[object Object]";
}
var V = (n)=>(typeof n == "number" || n instanceof Number) && isFinite(+n);
function q(n, t) {
    return V(n) ? n : t;
}
function S(n, t) {
    return typeof n > "u" ? t : n;
}
var Pi = (n, t)=>typeof n == "string" && n.endsWith("%") ? parseFloat(n) / 100 : n / t, Re = (n, t)=>typeof n == "string" && n.endsWith("%") ? parseFloat(n) / 100 * t : +n;
function R(n, t, e) {
    if (n && typeof n.call == "function") return n.apply(e, t);
}
function T(n, t, e, i) {
    let s, o, a;
    if (E(n)) if (o = n.length, i) for(s = o - 1; s >= 0; s--)t.call(e, n[s], s);
    else for(s = 0; s < o; s++)t.call(e, n[s], s);
    else if (A(n)) for(a = Object.keys(n), o = a.length, s = 0; s < o; s++)t.call(e, n[a[s]], a[s]);
}
function oe(n, t) {
    let e, i, s, o;
    if (!n || !t || n.length !== t.length) return !1;
    for(e = 0, i = n.length; e < i; ++e)if (s = n[e], o = t[e], s.datasetIndex !== o.datasetIndex || s.index !== o.index) return !1;
    return !0;
}
function Fe(n) {
    if (E(n)) return n.map(Fe);
    if (A(n)) {
        let t = Object.create(null), e = Object.keys(n), i = e.length, s = 0;
        for(; s < i; ++s)t[e[s]] = Fe(n[e[s]]);
        return t;
    }
    return n;
}
function Di(n) {
    return [
        "__proto__",
        "prototype",
        "constructor"
    ].indexOf(n) === -1;
}
function mo(n, t, e, i) {
    if (!Di(n)) return;
    let s = t[n], o = e[n];
    A(s) && A(o) ? Rt(s, o, i) : t[n] = Fe(o);
}
function Rt(n, t, e) {
    let i = E(t) ? t : [
        t
    ], s = i.length;
    if (!A(n)) return n;
    e = e || {};
    let o = e.merger || mo;
    for(let a = 0; a < s; ++a){
        if (t = i[a], !A(t)) continue;
        let r = Object.keys(t);
        for(let l = 0, c = r.length; l < c; ++l)o(r[l], n, t, e);
    }
    return n;
}
function It(n, t) {
    return Rt(n, t, {
        merger: bo
    });
}
function bo(n, t, e) {
    if (!Di(n)) return;
    let i = t[n], s = e[n];
    A(i) && A(s) ? It(i, s) : Object.prototype.hasOwnProperty.call(t, n) || (t[n] = Fe(s));
}
var xo = "", _o = ".";
function di(n, t) {
    let e = n.indexOf(_o, t);
    return e === -1 ? n.length : e;
}
function lt(n, t) {
    if (t === xo) return n;
    let e = 0, i = di(t, e);
    for(; n && i > e;)n = n[t.substr(e, i - e)], e = i + 1, i = di(t, e);
    return n;
}
function Ve(n) {
    return n.charAt(0).toUpperCase() + n.slice(1);
}
var nt = (n)=>typeof n < "u", wt = (n)=>typeof n == "function", Ci = (n, t)=>{
    if (n.size !== t.size) return !1;
    for (let e of n)if (!t.has(e)) return !1;
    return !0;
}, W = Math.PI, L = 2 * W, yo = L + W, Ee = Number.POSITIVE_INFINITY, vo = W / 180, B = W / 2, te = W / 4, ui = W * 2 / 3, G = Math.log10, rt = Math.sign;
function wn(n) {
    let t = Math.pow(10, Math.floor(G(n))), e = n / t;
    return (e <= 1 ? 1 : e <= 2 ? 2 : e <= 5 ? 5 : 10) * t;
}
function Oi(n) {
    let t = [], e = Math.sqrt(n), i;
    for(i = 1; i < e; i++)n % i === 0 && (t.push(i), t.push(n / i));
    return e === (e | 0) && t.push(e), t.sort((s, o)=>s - o).pop(), t;
}
function St(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}
function ae(n, t, e) {
    return Math.abs(n - t) < e;
}
function Ai(n, t) {
    let e = Math.round(n);
    return e - t <= n && e + t >= n;
}
function kn(n, t, e) {
    let i, s, o;
    for(i = 0, s = n.length; i < s; i++)o = n[i][e], isNaN(o) || (t.min = Math.min(t.min, o), t.max = Math.max(t.max, o));
}
function st(n) {
    return n * (W / 180);
}
function We(n) {
    return n * (180 / W);
}
function Ti(n) {
    if (!V(n)) return;
    let t = 1, e = 0;
    for(; Math.round(n * t) / t !== n;)t *= 10, e++;
    return e;
}
function Li(n, t) {
    let e = t.x - n.x, i = t.y - n.y, s = Math.sqrt(e * e + i * i), o = Math.atan2(i, e);
    return o < -.5 * W && (o += L), {
        angle: o,
        distance: s
    };
}
function ze(n, t) {
    return Math.sqrt(Math.pow(t.x - n.x, 2) + Math.pow(t.y - n.y, 2));
}
function Mo(n, t) {
    return (n - t + yo) % L - W;
}
function J(n) {
    return (n % L + L) % L;
}
function re(n, t, e) {
    let i = J(n), s = J(t), o = J(e), a = J(s - i), r = J(o - i), l = J(i - s), c = J(i - o);
    return i === s || i === o || a > r && l < c;
}
function U(n, t, e) {
    return Math.max(t, Math.min(e, n));
}
function Ri(n) {
    return U(n, -32768, 32767);
}
var Ce = (n)=>n === 0 || n === 1, fi = (n, t, e)=>-(Math.pow(2, 10 * (n -= 1)) * Math.sin((n - t) * L / e)), hi = (n, t, e)=>Math.pow(2, -10 * n) * Math.sin((n - t) * L / e) + 1, Lt = {
    linear: (n)=>n,
    easeInQuad: (n)=>n * n,
    easeOutQuad: (n)=>-n * (n - 2),
    easeInOutQuad: (n)=>(n /= .5) < 1 ? .5 * n * n : -.5 * (--n * (n - 2) - 1),
    easeInCubic: (n)=>n * n * n,
    easeOutCubic: (n)=>(n -= 1) * n * n + 1,
    easeInOutCubic: (n)=>(n /= .5) < 1 ? .5 * n * n * n : .5 * ((n -= 2) * n * n + 2),
    easeInQuart: (n)=>n * n * n * n,
    easeOutQuart: (n)=>-((n -= 1) * n * n * n - 1),
    easeInOutQuart: (n)=>(n /= .5) < 1 ? .5 * n * n * n * n : -.5 * ((n -= 2) * n * n * n - 2),
    easeInQuint: (n)=>n * n * n * n * n,
    easeOutQuint: (n)=>(n -= 1) * n * n * n * n + 1,
    easeInOutQuint: (n)=>(n /= .5) < 1 ? .5 * n * n * n * n * n : .5 * ((n -= 2) * n * n * n * n + 2),
    easeInSine: (n)=>-Math.cos(n * B) + 1,
    easeOutSine: (n)=>Math.sin(n * B),
    easeInOutSine: (n)=>-.5 * (Math.cos(W * n) - 1),
    easeInExpo: (n)=>n === 0 ? 0 : Math.pow(2, 10 * (n - 1)),
    easeOutExpo: (n)=>n === 1 ? 1 : -Math.pow(2, -10 * n) + 1,
    easeInOutExpo: (n)=>Ce(n) ? n : n < .5 ? .5 * Math.pow(2, 10 * (n * 2 - 1)) : .5 * (-Math.pow(2, -10 * (n * 2 - 1)) + 2),
    easeInCirc: (n)=>n >= 1 ? n : -(Math.sqrt(1 - n * n) - 1),
    easeOutCirc: (n)=>Math.sqrt(1 - (n -= 1) * n),
    easeInOutCirc: (n)=>(n /= .5) < 1 ? -.5 * (Math.sqrt(1 - n * n) - 1) : .5 * (Math.sqrt(1 - (n -= 2) * n) + 1),
    easeInElastic: (n)=>Ce(n) ? n : fi(n, .075, .3),
    easeOutElastic: (n)=>Ce(n) ? n : hi(n, .075, .3),
    easeInOutElastic (n) {
        return Ce(n) ? n : n < .5 ? .5 * fi(n * 2, .1125, .45) : .5 + .5 * hi(n * 2 - 1, .1125, .45);
    },
    easeInBack (n) {
        return n * n * ((1.70158 + 1) * n - 1.70158);
    },
    easeOutBack (n) {
        return (n -= 1) * n * ((1.70158 + 1) * n + 1.70158) + 1;
    },
    easeInOutBack (n) {
        let t = 1.70158;
        return (n /= .5) < 1 ? .5 * (n * n * (((t *= 1.525) + 1) * n - t)) : .5 * ((n -= 2) * n * (((t *= 1.525) + 1) * n + t) + 2);
    },
    easeInBounce: (n)=>1 - Lt.easeOutBounce(1 - n),
    easeOutBounce (n) {
        return n < 1 / 2.75 ? 7.5625 * n * n : n < 2 / 2.75 ? 7.5625 * (n -= 1.5 / 2.75) * n + .75 : n < 2.5 / 2.75 ? 7.5625 * (n -= 2.25 / 2.75) * n + .9375 : 7.5625 * (n -= 2.625 / 2.75) * n + .984375;
    },
    easeInOutBounce: (n)=>n < .5 ? Lt.easeInBounce(n * 2) * .5 : Lt.easeOutBounce(n * 2 - 1) * .5 + .5
};
var Q = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15
}, _n = "0123456789ABCDEF", wo = (n)=>_n[n & 15], ko = (n)=>_n[(n & 240) >> 4] + _n[n & 15], Oe = (n)=>(n & 240) >> 4 === (n & 15);
function So(n) {
    return Oe(n.r) && Oe(n.g) && Oe(n.b) && Oe(n.a);
}
function Po(n) {
    var t = n.length, e;
    return n[0] === "#" && (t === 4 || t === 5 ? e = {
        r: 255 & Q[n[1]] * 17,
        g: 255 & Q[n[2]] * 17,
        b: 255 & Q[n[3]] * 17,
        a: t === 5 ? Q[n[4]] * 17 : 255
    } : (t === 7 || t === 9) && (e = {
        r: Q[n[1]] << 4 | Q[n[2]],
        g: Q[n[3]] << 4 | Q[n[4]],
        b: Q[n[5]] << 4 | Q[n[6]],
        a: t === 9 ? Q[n[7]] << 4 | Q[n[8]] : 255
    })), e;
}
function Do(n) {
    var t = So(n) ? wo : ko;
    return n && "#" + t(n.r) + t(n.g) + t(n.b) + (n.a < 255 ? t(n.a) : "");
}
function le(n) {
    return n + .5 | 0;
}
var He = (n, t, e)=>Math.max(Math.min(n, e), t);
function ee(n) {
    return He(le(n * 2.55), 0, 255);
}
function ie(n) {
    return He(le(n * 255), 0, 255);
}
function Sn(n) {
    return He(le(n / 2.55) / 100, 0, 1);
}
function gi(n) {
    return He(le(n * 100), 0, 100);
}
var Co = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
function Oo(n) {
    let t = Co.exec(n), e = 255, i, s, o;
    if (t) {
        if (t[7] !== i) {
            let a = +t[7];
            e = 255 & (t[8] ? ee(a) : a * 255);
        }
        return i = +t[1], s = +t[3], o = +t[5], i = 255 & (t[2] ? ee(i) : i), s = 255 & (t[4] ? ee(s) : s), o = 255 & (t[6] ? ee(o) : o), {
            r: i,
            g: s,
            b: o,
            a: e
        };
    }
}
function Ao(n) {
    return n && (n.a < 255 ? `rgba(${n.r}, ${n.g}, ${n.b}, ${Sn(n.a)})` : `rgb(${n.r}, ${n.g}, ${n.b})`);
}
var To = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
function Fi(n, t, e) {
    let i = t * Math.min(e, 1 - e), s = (o, a = (o + n / 30) % 12)=>e - i * Math.max(Math.min(a - 3, 9 - a, 1), -1);
    return [
        s(0),
        s(8),
        s(4)
    ];
}
function Lo(n, t, e) {
    let i = (s, o = (s + n / 60) % 6)=>e - e * t * Math.max(Math.min(o, 4 - o, 1), 0);
    return [
        i(5),
        i(3),
        i(1)
    ];
}
function Ro(n, t, e) {
    let i = Fi(n, 1, .5), s;
    for(t + e > 1 && (s = 1 / (t + e), t *= s, e *= s), s = 0; s < 3; s++)i[s] *= 1 - t - e, i[s] += t;
    return i;
}
function Pn(n) {
    let e = n.r / 255, i = n.g / 255, s = n.b / 255, o = Math.max(e, i, s), a = Math.min(e, i, s), r = (o + a) / 2, l, c, d;
    return o !== a && (d = o - a, c = r > .5 ? d / (2 - o - a) : d / (o + a), l = o === e ? (i - s) / d + (i < s ? 6 : 0) : o === i ? (s - e) / d + 2 : (e - i) / d + 4, l = l * 60 + .5), [
        l | 0,
        c || 0,
        r
    ];
}
function Dn(n, t, e, i) {
    return (Array.isArray(t) ? n(t[0], t[1], t[2]) : n(t, e, i)).map(ie);
}
function Cn(n, t, e) {
    return Dn(Fi, n, t, e);
}
function Fo(n, t, e) {
    return Dn(Ro, n, t, e);
}
function Eo(n, t, e) {
    return Dn(Lo, n, t, e);
}
function Ei(n) {
    return (n % 360 + 360) % 360;
}
function zo(n) {
    let t = To.exec(n), e = 255, i;
    if (!t) return;
    t[5] !== i && (e = t[6] ? ee(+t[5]) : ie(+t[5]));
    let s = Ei(+t[2]), o = +t[3] / 100, a = +t[4] / 100;
    return t[1] === "hwb" ? i = Fo(s, o, a) : t[1] === "hsv" ? i = Eo(s, o, a) : i = Cn(s, o, a), {
        r: i[0],
        g: i[1],
        b: i[2],
        a: e
    };
}
function Io(n, t) {
    var e = Pn(n);
    e[0] = Ei(e[0] + t), e = Cn(e), n.r = e[0], n.g = e[1], n.b = e[2];
}
function Bo(n) {
    if (!n) return;
    let t = Pn(n), e = t[0], i = gi(t[1]), s = gi(t[2]);
    return n.a < 255 ? `hsla(${e}, ${i}%, ${s}%, ${Sn(n.a)})` : `hsl(${e}, ${i}%, ${s}%)`;
}
var pi = {
    x: "dark",
    Z: "light",
    Y: "re",
    X: "blu",
    W: "gr",
    V: "medium",
    U: "slate",
    A: "ee",
    T: "ol",
    S: "or",
    B: "ra",
    C: "lateg",
    D: "ights",
    R: "in",
    Q: "turquois",
    E: "hi",
    P: "ro",
    O: "al",
    N: "le",
    M: "de",
    L: "yello",
    F: "en",
    K: "ch",
    G: "arks",
    H: "ea",
    I: "ightg",
    J: "wh"
}, mi = {
    OiceXe: "f0f8ff",
    antiquewEte: "faebd7",
    aqua: "ffff",
    aquamarRe: "7fffd4",
    azuY: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "0",
    blanKedOmond: "ffebcd",
    Xe: "ff",
    XeviTet: "8a2be2",
    bPwn: "a52a2a",
    burlywood: "deb887",
    caMtXe: "5f9ea0",
    KartYuse: "7fff00",
    KocTate: "d2691e",
    cSO: "ff7f50",
    cSnflowerXe: "6495ed",
    cSnsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "ffff",
    xXe: "8b",
    xcyan: "8b8b",
    xgTMnPd: "b8860b",
    xWay: "a9a9a9",
    xgYF: "6400",
    xgYy: "a9a9a9",
    xkhaki: "bdb76b",
    xmagFta: "8b008b",
    xTivegYF: "556b2f",
    xSange: "ff8c00",
    xScEd: "9932cc",
    xYd: "8b0000",
    xsOmon: "e9967a",
    xsHgYF: "8fbc8f",
    xUXe: "483d8b",
    xUWay: "2f4f4f",
    xUgYy: "2f4f4f",
    xQe: "ced1",
    xviTet: "9400d3",
    dAppRk: "ff1493",
    dApskyXe: "bfff",
    dimWay: "696969",
    dimgYy: "696969",
    dodgerXe: "1e90ff",
    fiYbrick: "b22222",
    flSOwEte: "fffaf0",
    foYstWAn: "228b22",
    fuKsia: "ff00ff",
    gaRsbSo: "dcdcdc",
    ghostwEte: "f8f8ff",
    gTd: "ffd700",
    gTMnPd: "daa520",
    Way: "808080",
    gYF: "8000",
    gYFLw: "adff2f",
    gYy: "808080",
    honeyMw: "f0fff0",
    hotpRk: "ff69b4",
    RdianYd: "cd5c5c",
    Rdigo: "4b0082",
    ivSy: "fffff0",
    khaki: "f0e68c",
    lavFMr: "e6e6fa",
    lavFMrXsh: "fff0f5",
    lawngYF: "7cfc00",
    NmoncEffon: "fffacd",
    ZXe: "add8e6",
    ZcSO: "f08080",
    Zcyan: "e0ffff",
    ZgTMnPdLw: "fafad2",
    ZWay: "d3d3d3",
    ZgYF: "90ee90",
    ZgYy: "d3d3d3",
    ZpRk: "ffb6c1",
    ZsOmon: "ffa07a",
    ZsHgYF: "20b2aa",
    ZskyXe: "87cefa",
    ZUWay: "778899",
    ZUgYy: "778899",
    ZstAlXe: "b0c4de",
    ZLw: "ffffe0",
    lime: "ff00",
    limegYF: "32cd32",
    lRF: "faf0e6",
    magFta: "ff00ff",
    maPon: "800000",
    VaquamarRe: "66cdaa",
    VXe: "cd",
    VScEd: "ba55d3",
    VpurpN: "9370db",
    VsHgYF: "3cb371",
    VUXe: "7b68ee",
    VsprRggYF: "fa9a",
    VQe: "48d1cc",
    VviTetYd: "c71585",
    midnightXe: "191970",
    mRtcYam: "f5fffa",
    mistyPse: "ffe4e1",
    moccasR: "ffe4b5",
    navajowEte: "ffdead",
    navy: "80",
    Tdlace: "fdf5e6",
    Tive: "808000",
    TivedBb: "6b8e23",
    Sange: "ffa500",
    SangeYd: "ff4500",
    ScEd: "da70d6",
    pOegTMnPd: "eee8aa",
    pOegYF: "98fb98",
    pOeQe: "afeeee",
    pOeviTetYd: "db7093",
    papayawEp: "ffefd5",
    pHKpuff: "ffdab9",
    peru: "cd853f",
    pRk: "ffc0cb",
    plum: "dda0dd",
    powMrXe: "b0e0e6",
    purpN: "800080",
    YbeccapurpN: "663399",
    Yd: "ff0000",
    Psybrown: "bc8f8f",
    PyOXe: "4169e1",
    saddNbPwn: "8b4513",
    sOmon: "fa8072",
    sandybPwn: "f4a460",
    sHgYF: "2e8b57",
    sHshell: "fff5ee",
    siFna: "a0522d",
    silver: "c0c0c0",
    skyXe: "87ceeb",
    UXe: "6a5acd",
    UWay: "708090",
    UgYy: "708090",
    snow: "fffafa",
    sprRggYF: "ff7f",
    stAlXe: "4682b4",
    tan: "d2b48c",
    teO: "8080",
    tEstN: "d8bfd8",
    tomato: "ff6347",
    Qe: "40e0d0",
    viTet: "ee82ee",
    JHt: "f5deb3",
    wEte: "ffffff",
    wEtesmoke: "f5f5f5",
    Lw: "ffff00",
    LwgYF: "9acd32"
};
function Vo() {
    let n = {}, t = Object.keys(mi), e = Object.keys(pi), i, s, o, a, r;
    for(i = 0; i < t.length; i++){
        for(a = r = t[i], s = 0; s < e.length; s++)o = e[s], r = r.replace(o, pi[o]);
        o = parseInt(mi[a], 16), n[r] = [
            o >> 16 & 255,
            o >> 8 & 255,
            o & 255
        ];
    }
    return n;
}
var Ae;
function Wo(n) {
    Ae || (Ae = Vo(), Ae.transparent = [
        0,
        0,
        0,
        0
    ]);
    let t = Ae[n.toLowerCase()];
    return t && {
        r: t[0],
        g: t[1],
        b: t[2],
        a: t.length === 4 ? t[3] : 255
    };
}
function Te(n, t, e) {
    if (n) {
        let i = Pn(n);
        i[t] = Math.max(0, Math.min(i[t] + i[t] * e, t === 0 ? 360 : 1)), i = Cn(i), n.r = i[0], n.g = i[1], n.b = i[2];
    }
}
function zi(n, t) {
    return n && Object.assign(t || {}, n);
}
function bi(n) {
    var t = {
        r: 0,
        g: 0,
        b: 0,
        a: 255
    };
    return Array.isArray(n) ? n.length >= 3 && (t = {
        r: n[0],
        g: n[1],
        b: n[2],
        a: 255
    }, n.length > 3 && (t.a = ie(n[3]))) : (t = zi(n, {
        r: 0,
        g: 0,
        b: 0,
        a: 1
    }), t.a = ie(t.a)), t;
}
function Ho(n) {
    return n.charAt(0) === "r" ? Oo(n) : zo(n);
}
var Ft = class {
    constructor(t){
        if (t instanceof Ft) return t;
        let e = typeof t, i;
        e === "object" ? i = bi(t) : e === "string" && (i = Po(t) || Wo(t) || Ho(t)), this._rgb = i, this._valid = !!i;
    }
    get valid() {
        return this._valid;
    }
    get rgb() {
        var t = zi(this._rgb);
        return t && (t.a = Sn(t.a)), t;
    }
    set rgb(t) {
        this._rgb = bi(t);
    }
    rgbString() {
        return this._valid ? Ao(this._rgb) : this._rgb;
    }
    hexString() {
        return this._valid ? Do(this._rgb) : this._rgb;
    }
    hslString() {
        return this._valid ? Bo(this._rgb) : this._rgb;
    }
    mix(t, e) {
        let i = this;
        if (t) {
            let s = i.rgb, o = t.rgb, a, r = e === a ? .5 : e, l = 2 * r - 1, c = s.a - o.a, d = ((l * c === -1 ? l : (l + c) / (1 + l * c)) + 1) / 2;
            a = 1 - d, s.r = 255 & d * s.r + a * o.r + .5, s.g = 255 & d * s.g + a * o.g + .5, s.b = 255 & d * s.b + a * o.b + .5, s.a = r * s.a + (1 - r) * o.a, i.rgb = s;
        }
        return i;
    }
    clone() {
        return new Ft(this.rgb);
    }
    alpha(t) {
        return this._rgb.a = ie(t), this;
    }
    clearer(t) {
        let e = this._rgb;
        return e.a *= 1 - t, this;
    }
    greyscale() {
        let t = this._rgb, e = le(t.r * .3 + t.g * .59 + t.b * .11);
        return t.r = t.g = t.b = e, this;
    }
    opaquer(t) {
        let e = this._rgb;
        return e.a *= 1 + t, this;
    }
    negate() {
        let t = this._rgb;
        return t.r = 255 - t.r, t.g = 255 - t.g, t.b = 255 - t.b, this;
    }
    lighten(t) {
        return Te(this._rgb, 2, t), this;
    }
    darken(t) {
        return Te(this._rgb, 2, -t), this;
    }
    saturate(t) {
        return Te(this._rgb, 1, t), this;
    }
    desaturate(t) {
        return Te(this._rgb, 1, -t), this;
    }
    rotate(t) {
        return Io(this._rgb, t), this;
    }
};
function Ii(n) {
    return new Ft(n);
}
var Bi = (n)=>n instanceof CanvasGradient || n instanceof CanvasPattern;
function On(n) {
    return Bi(n) ? n : Ii(n);
}
function mn(n) {
    return Bi(n) ? n : Ii(n).saturate(.5).darken(.1).hexString();
}
var pt = Object.create(null), Ne = Object.create(null);
function ne(n, t) {
    if (!t) return n;
    let e = t.split(".");
    for(let i = 0, s = e.length; i < s; ++i){
        let o = e[i];
        n = n[o] || (n[o] = Object.create(null));
    }
    return n;
}
function bn(n, t, e) {
    return typeof t == "string" ? Rt(ne(n, t), e) : Rt(ne(n, ""), t);
}
var yn = class {
    constructor(t){
        this.animation = void 0, this.backgroundColor = "rgba(0,0,0,0.1)", this.borderColor = "rgba(0,0,0,0.1)", this.color = "#666", this.datasets = {}, this.devicePixelRatio = (e)=>e.chart.platform.getDevicePixelRatio(), this.elements = {}, this.events = [
            "mousemove",
            "mouseout",
            "click",
            "touchstart",
            "touchmove"
        ], this.font = {
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            style: "normal",
            lineHeight: 1.2,
            weight: null
        }, this.hover = {}, this.hoverBackgroundColor = (e, i)=>mn(i.backgroundColor), this.hoverBorderColor = (e, i)=>mn(i.borderColor), this.hoverColor = (e, i)=>mn(i.color), this.indexAxis = "x", this.interaction = {
            mode: "nearest",
            intersect: !0
        }, this.maintainAspectRatio = !0, this.onHover = null, this.onClick = null, this.parsing = !0, this.plugins = {}, this.responsive = !0, this.scale = void 0, this.scales = {}, this.showLine = !0, this.describe(t);
    }
    set(t, e) {
        return bn(this, t, e);
    }
    get(t) {
        return ne(this, t);
    }
    describe(t, e) {
        return bn(Ne, t, e);
    }
    override(t, e) {
        return bn(pt, t, e);
    }
    route(t, e, i, s) {
        let o = ne(this, t), a = ne(this, i), r = "_" + e;
        Object.defineProperties(o, {
            [r]: {
                value: o[e],
                writable: !0
            },
            [e]: {
                enumerable: !0,
                get () {
                    let l = this[r], c = a[s];
                    return A(l) ? Object.assign({}, c, l) : S(l, c);
                },
                set (l) {
                    this[r] = l;
                }
            }
        });
    }
}, P = new yn({
    _scriptable: (n)=>!n.startsWith("on"),
    _indexable: (n)=>n !== "events",
    hover: {
        _fallback: "interaction"
    },
    interaction: {
        _scriptable: !1,
        _indexable: !1
    }
});
function No(n) {
    return !n || D(n.size) || D(n.family) ? null : (n.style ? n.style + " " : "") + (n.weight ? n.weight + " " : "") + n.size + "px " + n.family;
}
function se(n, t, e, i, s) {
    let o = t[s];
    return o || (o = t[s] = n.measureText(s).width, e.push(s)), o > i && (i = o), i;
}
function Vi(n, t, e, i) {
    i = i || {};
    let s = i.data = i.data || {}, o = i.garbageCollect = i.garbageCollect || [];
    i.font !== t && (s = i.data = {}, o = i.garbageCollect = [], i.font = t), n.save(), n.font = t;
    let a = 0, r = e.length, l, c, d, u, f;
    for(l = 0; l < r; l++)if (u = e[l], u != null && E(u) !== !0) a = se(n, s, o, a, u);
    else if (E(u)) for(c = 0, d = u.length; c < d; c++)f = u[c], f != null && !E(f) && (a = se(n, s, o, a, f));
    n.restore();
    let h = o.length / 2;
    if (h > e.length) {
        for(l = 0; l < h; l++)delete s[o[l]];
        o.splice(0, h);
    }
    return a;
}
function mt(n, t, e) {
    let i = n.currentDevicePixelRatio, s = e !== 0 ? Math.max(e / 2, .5) : 0;
    return Math.round((t - s) * i) / i + s;
}
function An(n, t) {
    t = t || n.getContext("2d"), t.save(), t.resetTransform(), t.clearRect(0, 0, n.width, n.height), t.restore();
}
function ce(n, t, e, i) {
    let s, o, a, r, l, c = t.pointStyle, d = t.rotation, u = t.radius, f = (d || 0) * vo;
    if (c && typeof c == "object" && (s = c.toString(), s === "[object HTMLImageElement]" || s === "[object HTMLCanvasElement]")) {
        n.save(), n.translate(e, i), n.rotate(f), n.drawImage(c, -c.width / 2, -c.height / 2, c.width, c.height), n.restore();
        return;
    }
    if (!(isNaN(u) || u <= 0)) {
        switch(n.beginPath(), c){
            default:
                n.arc(e, i, u, 0, L), n.closePath();
                break;
            case "triangle":
                n.moveTo(e + Math.sin(f) * u, i - Math.cos(f) * u), f += ui, n.lineTo(e + Math.sin(f) * u, i - Math.cos(f) * u), f += ui, n.lineTo(e + Math.sin(f) * u, i - Math.cos(f) * u), n.closePath();
                break;
            case "rectRounded":
                l = u * .516, r = u - l, o = Math.cos(f + te) * r, a = Math.sin(f + te) * r, n.arc(e - o, i - a, l, f - W, f - B), n.arc(e + a, i - o, l, f - B, f), n.arc(e + o, i + a, l, f, f + B), n.arc(e - a, i + o, l, f + B, f + W), n.closePath();
                break;
            case "rect":
                if (!d) {
                    r = Math.SQRT1_2 * u, n.rect(e - r, i - r, 2 * r, 2 * r);
                    break;
                }
                f += te;
            case "rectRot":
                o = Math.cos(f) * u, a = Math.sin(f) * u, n.moveTo(e - o, i - a), n.lineTo(e + a, i - o), n.lineTo(e + o, i + a), n.lineTo(e - a, i + o), n.closePath();
                break;
            case "crossRot":
                f += te;
            case "cross":
                o = Math.cos(f) * u, a = Math.sin(f) * u, n.moveTo(e - o, i - a), n.lineTo(e + o, i + a), n.moveTo(e + a, i - o), n.lineTo(e - a, i + o);
                break;
            case "star":
                o = Math.cos(f) * u, a = Math.sin(f) * u, n.moveTo(e - o, i - a), n.lineTo(e + o, i + a), n.moveTo(e + a, i - o), n.lineTo(e - a, i + o), f += te, o = Math.cos(f) * u, a = Math.sin(f) * u, n.moveTo(e - o, i - a), n.lineTo(e + o, i + a), n.moveTo(e + a, i - o), n.lineTo(e - a, i + o);
                break;
            case "line":
                o = Math.cos(f) * u, a = Math.sin(f) * u, n.moveTo(e - o, i - a), n.lineTo(e + o, i + a);
                break;
            case "dash":
                n.moveTo(e, i), n.lineTo(e + Math.cos(f) * u, i + Math.sin(f) * u);
                break;
        }
        n.fill(), t.borderWidth > 0 && n.stroke();
    }
}
function Et(n, t, e) {
    return e = e || .5, n && n.x > t.left - e && n.x < t.right + e && n.y > t.top - e && n.y < t.bottom + e;
}
function Bt(n, t) {
    n.save(), n.beginPath(), n.rect(t.left, t.top, t.right - t.left, t.bottom - t.top), n.clip();
}
function Vt(n) {
    n.restore();
}
function Wi(n, t, e, i, s) {
    if (!t) return n.lineTo(e.x, e.y);
    if (s === "middle") {
        let o = (t.x + e.x) / 2;
        n.lineTo(o, t.y), n.lineTo(o, e.y);
    } else s === "after" != !!i ? n.lineTo(t.x, e.y) : n.lineTo(e.x, t.y);
    n.lineTo(e.x, e.y);
}
function Hi(n, t, e, i) {
    if (!t) return n.lineTo(e.x, e.y);
    n.bezierCurveTo(i ? t.cp1x : t.cp2x, i ? t.cp1y : t.cp2y, i ? e.cp2x : e.cp1x, i ? e.cp2y : e.cp1y, e.x, e.y);
}
function bt(n, t, e, i, s, o = {}) {
    let a = E(t) ? t : [
        t
    ], r = o.strokeWidth > 0 && o.strokeColor !== "", l, c;
    for(n.save(), o.translation && n.translate(o.translation[0], o.translation[1]), D(o.rotation) || n.rotate(o.rotation), n.font = s.string, o.color && (n.fillStyle = o.color), o.textAlign && (n.textAlign = o.textAlign), o.textBaseline && (n.textBaseline = o.textBaseline), l = 0; l < a.length; ++l){
        if (c = a[l], r && (o.strokeColor && (n.strokeStyle = o.strokeColor), D(o.strokeWidth) || (n.lineWidth = o.strokeWidth), n.strokeText(c, e, i, o.maxWidth)), n.fillText(c, e, i, o.maxWidth), o.strikethrough || o.underline) {
            let d = n.measureText(c), u = e - d.actualBoundingBoxLeft, f = e + d.actualBoundingBoxRight, h = i - d.actualBoundingBoxAscent, g = i + d.actualBoundingBoxDescent, p = o.strikethrough ? (h + g) / 2 : g;
            n.strokeStyle = n.fillStyle, n.beginPath(), n.lineWidth = o.decorationWidth || 2, n.moveTo(u, p), n.lineTo(f, p), n.stroke();
        }
        i += s.lineHeight;
    }
    n.restore();
}
function de(n, t) {
    let { x: e , y: i , w: s , h: o , radius: a  } = t;
    n.arc(e + a.topLeft, i + a.topLeft, a.topLeft, -B, W, !0), n.lineTo(e, i + o - a.bottomLeft), n.arc(e + a.bottomLeft, i + o - a.bottomLeft, a.bottomLeft, W, B, !0), n.lineTo(e + s - a.bottomRight, i + o), n.arc(e + s - a.bottomRight, i + o - a.bottomRight, a.bottomRight, B, 0, !0), n.lineTo(e + s, i + a.topRight), n.arc(e + s - a.topRight, i + a.topRight, a.topRight, 0, -B, !0), n.lineTo(e + a.topLeft, i);
}
var jo = new RegExp(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/), Yo = new RegExp(/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/);
function $o(n, t) {
    let e = ("" + n).match(jo);
    if (!e || e[1] === "normal") return t * 1.2;
    switch(n = +e[2], e[3]){
        case "px":
            return n;
        case "%":
            n /= 100;
            break;
    }
    return t * n;
}
var Xo = (n)=>+n || 0;
function je(n, t) {
    let e = {}, i = A(t), s = i ? Object.keys(t) : t, o = A(n) ? i ? (a)=>S(n[a], n[t[a]]) : (a)=>n[a] : ()=>n;
    for (let a of s)e[a] = Xo(o(a));
    return e;
}
function Tn(n) {
    return je(n, {
        top: "y",
        right: "x",
        bottom: "y",
        left: "x"
    });
}
function Ye(n) {
    return je(n, [
        "topLeft",
        "topRight",
        "bottomLeft",
        "bottomRight"
    ]);
}
function X(n) {
    let t = Tn(n);
    return t.width = t.left + t.right, t.height = t.top + t.bottom, t;
}
function N(n, t) {
    n = n || {}, t = t || P.font;
    let e = S(n.size, t.size);
    typeof e == "string" && (e = parseInt(e, 10));
    let i = S(n.style, t.style);
    i && !("" + i).match(Yo) && (console.warn('Invalid font style specified: "' + i + '"'), i = "");
    let s = {
        family: S(n.family, t.family),
        lineHeight: $o(S(n.lineHeight, t.lineHeight), e),
        size: e,
        style: i,
        weight: S(n.weight, t.weight),
        string: ""
    };
    return s.string = No(s), s;
}
function Wt(n, t, e, i) {
    let s = !0, o, a, r;
    for(o = 0, a = n.length; o < a; ++o)if (r = n[o], r !== void 0 && (t !== void 0 && typeof r == "function" && (r = r(t), s = !1), e !== void 0 && E(r) && (r = r[e % r.length], s = !1), r !== void 0)) return i && !s && (i.cacheable = !1), r;
}
function Ni(n, t) {
    let { min: e , max: i  } = n;
    return {
        min: e - Math.abs(Re(t, e)),
        max: i + Re(t, i)
    };
}
function ue(n, t, e) {
    e = e || ((a)=>n[a] < t);
    let i = n.length - 1, s = 0, o;
    for(; i - s > 1;)o = s + i >> 1, e(o) ? s = o : i = o;
    return {
        lo: s,
        hi: i
    };
}
var xt = (n, t, e)=>ue(n, e, (i)=>n[i][t] < e), ji = (n, t, e)=>ue(n, e, (i)=>n[i][t] >= e);
function Yi(n, t, e) {
    let i = 0, s = n.length;
    for(; i < s && n[i] < t;)i++;
    for(; s > i && n[s - 1] > e;)s--;
    return i > 0 || s < n.length ? n.slice(i, s) : n;
}
var $i = [
    "push",
    "pop",
    "shift",
    "splice",
    "unshift"
];
function Xi(n, t) {
    if (n._chartjs) {
        n._chartjs.listeners.push(t);
        return;
    }
    Object.defineProperty(n, "_chartjs", {
        configurable: !0,
        enumerable: !1,
        value: {
            listeners: [
                t
            ]
        }
    }), $i.forEach((e)=>{
        let i = "_onData" + Ve(e), s = n[e];
        Object.defineProperty(n, e, {
            configurable: !0,
            enumerable: !1,
            value (...o) {
                let a = s.apply(this, o);
                return n._chartjs.listeners.forEach((r)=>{
                    typeof r[i] == "function" && r[i](...o);
                }), a;
            }
        });
    });
}
function Ln(n, t) {
    let e = n._chartjs;
    if (!e) return;
    let i = e.listeners, s = i.indexOf(t);
    s !== -1 && i.splice(s, 1), !(i.length > 0) && ($i.forEach((o)=>{
        delete n[o];
    }), delete n._chartjs);
}
function Rn(n) {
    let t = new Set, e, i;
    for(e = 0, i = n.length; e < i; ++e)t.add(n[e]);
    if (t.size === i) return n;
    let s = [];
    return t.forEach((o)=>{
        s.push(o);
    }), s;
}
function $e(n, t = [
    ""
], e = n, i, s = ()=>n[0]) {
    nt(i) || (i = Gi("_fallback", n));
    let o = {
        [Symbol.toStringTag]: "Object",
        _cacheable: !0,
        _scopes: n,
        _rootScopes: e,
        _fallback: i,
        _getTarget: s,
        override: (a)=>$e([
                a,
                ...n
            ], t, e, i)
    };
    return new Proxy(o, {
        deleteProperty (a, r) {
            return delete a[r], delete a._keys, delete n[0][r], !0;
        },
        get (a, r) {
            return Ki(a, r, ()=>Jo(r, t, n, a));
        },
        getOwnPropertyDescriptor (a, r) {
            return Reflect.getOwnPropertyDescriptor(a._scopes[0], r);
        },
        getPrototypeOf () {
            return Reflect.getPrototypeOf(n[0]);
        },
        has (a, r) {
            return _i(a).includes(r);
        },
        ownKeys (a) {
            return _i(a);
        },
        set (a, r, l) {
            let c = a._storage || (a._storage = s());
            return c[r] = l, delete a[r], delete a._keys, !0;
        }
    });
}
function kt(n, t, e, i) {
    let s = {
        _cacheable: !1,
        _proxy: n,
        _context: t,
        _subProxy: e,
        _stack: new Set,
        _descriptors: Fn(n, i),
        setContext: (o)=>kt(n, o, e, i),
        override: (o)=>kt(n.override(o), t, e, i)
    };
    return new Proxy(s, {
        deleteProperty (o, a) {
            return delete o[a], delete n[a], !0;
        },
        get (o, a, r) {
            return Ki(o, a, ()=>Ko(o, a, r));
        },
        getOwnPropertyDescriptor (o, a) {
            return o._descriptors.allKeys ? Reflect.has(n, a) ? {
                enumerable: !0,
                configurable: !0
            } : void 0 : Reflect.getOwnPropertyDescriptor(n, a);
        },
        getPrototypeOf () {
            return Reflect.getPrototypeOf(n);
        },
        has (o, a) {
            return Reflect.has(n, a);
        },
        ownKeys () {
            return Reflect.ownKeys(n);
        },
        set (o, a, r) {
            return n[a] = r, delete o[a], !0;
        }
    });
}
function Fn(n, t = {
    scriptable: !0,
    indexable: !0
}) {
    let { _scriptable: e = t.scriptable , _indexable: i = t.indexable , _allKeys: s = t.allKeys  } = n;
    return {
        allKeys: s,
        scriptable: e,
        indexable: i,
        isScriptable: wt(e) ? e : ()=>e,
        isIndexable: wt(i) ? i : ()=>i
    };
}
var Uo = (n, t)=>n ? n + Ve(t) : t, Ui = (n, t)=>A(t) && n !== "adapters";
function Ki(n, t, e) {
    let i = n[t];
    return nt(i) || (i = e(), nt(i) && (n[t] = i)), i;
}
function Ko(n, t, e) {
    let { _proxy: i , _context: s , _subProxy: o , _descriptors: a  } = n, r = i[t];
    return wt(r) && a.isScriptable(t) && (r = qo(t, r, n, e)), E(r) && r.length && (r = Go(t, r, n, a.isIndexable)), Ui(t, r) && (r = kt(r, s, o && o[t], a)), r;
}
function qo(n, t, e, i) {
    let { _proxy: s , _context: o , _subProxy: a , _stack: r  } = e;
    if (r.has(n)) throw new Error("Recursion detected: " + [
        ...r
    ].join("->") + "->" + n);
    return r.add(n), t = t(o, a || i), r.delete(n), A(t) && (t = En(s._scopes, s, n, t)), t;
}
function Go(n, t, e, i) {
    let { _proxy: s , _context: o , _subProxy: a , _descriptors: r  } = e;
    if (nt(o.index) && i(n)) t = t[o.index % t.length];
    else if (A(t[0])) {
        let l = t, c = s._scopes.filter((d)=>d !== l);
        t = [];
        for (let d of l){
            let u = En(c, s, n, d);
            t.push(kt(u, o, a && a[n], r));
        }
    }
    return t;
}
function qi(n, t, e) {
    return wt(n) ? n(t, e) : n;
}
var Zo = (n, t)=>n === !0 ? t : typeof n == "string" ? lt(t, n) : void 0;
function Qo(n, t, e, i) {
    for (let s of t){
        let o = Zo(e, s);
        if (o) {
            n.add(o);
            let a = qi(o._fallback, e, o);
            if (nt(a) && a !== e && a !== i) return a;
        } else if (o === !1 && nt(i) && e !== i) return null;
    }
    return !1;
}
function En(n, t, e, i) {
    let s = t._rootScopes, o = qi(t._fallback, e, i), a = [
        ...n,
        ...s
    ], r = new Set;
    r.add(i);
    let l = xi(r, a, e, o || e);
    return l === null || nt(o) && o !== e && (l = xi(r, a, o, l), l === null) ? !1 : $e([
        ...r
    ], [
        ""
    ], s, o, ()=>{
        let c = t._getTarget();
        return e in c || (c[e] = {}), c[e];
    });
}
function xi(n, t, e, i) {
    for(; e;)e = Qo(n, t, e, i);
    return e;
}
function Jo(n, t, e, i) {
    let s;
    for (let o of t)if (s = Gi(Uo(o, n), e), nt(s)) return Ui(n, s) ? En(e, i, n, s) : s;
}
function Gi(n, t) {
    for (let e of t){
        if (!e) continue;
        let i = e[n];
        if (nt(i)) return i;
    }
}
function _i(n) {
    let t = n._keys;
    return t || (t = n._keys = ta(n._scopes)), t;
}
function ta(n) {
    let t = new Set;
    for (let e of n)for (let i of Object.keys(e).filter((s)=>!s.startsWith("_")))t.add(i);
    return [
        ...t
    ];
}
var ea = Number.EPSILON || 1e-14, zt = (n, t)=>t < n.length && !n[t].skip && n[t];
function na(n, t, e, i) {
    let s = n.skip ? t : n, o = t, a = e.skip ? t : e, r = ze(o, s), l = ze(a, o), c = r / (r + l), d = l / (r + l);
    c = isNaN(c) ? 0 : c, d = isNaN(d) ? 0 : d;
    let u = i * c, f = i * d;
    return {
        previous: {
            x: o.x - u * (a.x - s.x),
            y: o.y - u * (a.y - s.y)
        },
        next: {
            x: o.x + f * (a.x - s.x),
            y: o.y + f * (a.y - s.y)
        }
    };
}
function ia(n, t, e) {
    let i = n.length, s, o, a, r, l, c = zt(n, 0);
    for(let d = 0; d < i - 1; ++d)if (l = c, c = zt(n, d + 1), !(!l || !c)) {
        if (ae(t[d], 0, ea)) {
            e[d] = e[d + 1] = 0;
            continue;
        }
        s = e[d] / t[d], o = e[d + 1] / t[d], r = Math.pow(s, 2) + Math.pow(o, 2), !(r <= 9) && (a = 3 / Math.sqrt(r), e[d] = s * a * t[d], e[d + 1] = o * a * t[d]);
    }
}
function sa(n, t) {
    let e = n.length, i, s, o, a = zt(n, 0);
    for(let r = 0; r < e; ++r){
        if (s = o, o = a, a = zt(n, r + 1), !o) continue;
        let { x: l , y: c  } = o;
        s && (i = (l - s.x) / 3, o.cp1x = l - i, o.cp1y = c - i * t[r]), a && (i = (a.x - l) / 3, o.cp2x = l + i, o.cp2y = c + i * t[r]);
    }
}
function oa(n) {
    let t = n.length, e = Array(t).fill(0), i = Array(t), s, o, a, r = zt(n, 0);
    for(s = 0; s < t; ++s)if (o = a, a = r, r = zt(n, s + 1), !!a) {
        if (r) {
            let l = r.x - a.x;
            e[s] = l !== 0 ? (r.y - a.y) / l : 0;
        }
        i[s] = o ? r ? rt(e[s - 1]) !== rt(e[s]) ? 0 : (e[s - 1] + e[s]) / 2 : e[s - 1] : e[s];
    }
    ia(n, e, i), sa(n, i);
}
function Le(n, t, e) {
    return Math.max(Math.min(n, e), t);
}
function aa(n, t) {
    let e, i, s, o, a, r = Et(n[0], t);
    for(e = 0, i = n.length; e < i; ++e)a = o, o = r, r = e < i - 1 && Et(n[e + 1], t), o && (s = n[e], a && (s.cp1x = Le(s.cp1x, t.left, t.right), s.cp1y = Le(s.cp1y, t.top, t.bottom)), r && (s.cp2x = Le(s.cp2x, t.left, t.right), s.cp2y = Le(s.cp2y, t.top, t.bottom)));
}
function Zi(n, t, e, i) {
    let s, o, a, r;
    if (t.spanGaps && (n = n.filter((l)=>!l.skip)), t.cubicInterpolationMode === "monotone") oa(n);
    else {
        let l = i ? n[n.length - 1] : n[0];
        for(s = 0, o = n.length; s < o; ++s)a = n[s], r = na(l, a, n[Math.min(s + 1, o - (i ? 0 : 1)) % o], t.tension), a.cp1x = r.previous.x, a.cp1y = r.previous.y, a.cp2x = r.next.x, a.cp2y = r.next.y, l = a;
    }
    t.capBezierPoints && aa(n, e);
}
function _t(n) {
    let t = n.parentNode;
    return t && t.toString() === "[object ShadowRoot]" && (t = t.host), t;
}
function Ie(n, t, e) {
    let i;
    return typeof n == "string" ? (i = parseInt(n, 10), n.indexOf("%") !== -1 && (i = i / 100 * t.parentNode[e])) : i = n, i;
}
var Xe = (n)=>window.getComputedStyle(n, null);
function ra(n, t) {
    return Xe(n).getPropertyValue(t);
}
var la = [
    "top",
    "right",
    "bottom",
    "left"
];
function Mt(n, t, e) {
    let i = {};
    e = e ? "-" + e : "";
    for(let s = 0; s < 4; s++){
        let o = la[s];
        i[o] = parseFloat(n[t + "-" + o + e]) || 0;
    }
    return i.width = i.left + i.right, i.height = i.top + i.bottom, i;
}
var ca = (n, t, e)=>(n > 0 || t > 0) && (!e || !e.shadowRoot);
function da(n, t) {
    let e = n.native || n, i = e.touches, s = i && i.length ? i[0] : e, { offsetX: o , offsetY: a  } = s, r = !1, l, c;
    if (ca(o, a, e.target)) l = o, c = a;
    else {
        let d = t.getBoundingClientRect();
        l = s.clientX - d.left, c = s.clientY - d.top, r = !0;
    }
    return {
        x: l,
        y: c,
        box: r
    };
}
function zn(n, t) {
    let { canvas: e , currentDevicePixelRatio: i  } = t, s = Xe(e), o = s.boxSizing === "border-box", a = Mt(s, "padding"), r = Mt(s, "border", "width"), { x: l , y: c , box: d  } = da(n, e), u = a.left + (d && r.left), f = a.top + (d && r.top), { width: h , height: g  } = t;
    return o && (h -= a.width + r.width, g -= a.height + r.height), {
        x: Math.round((l - u) / h * e.width / i),
        y: Math.round((c - f) / g * e.height / i)
    };
}
function ua(n, t, e) {
    let i, s;
    if (t === void 0 || e === void 0) {
        let o = _t(n);
        if (!o) t = n.clientWidth, e = n.clientHeight;
        else {
            let a = o.getBoundingClientRect(), r = Xe(o), l = Mt(r, "border", "width"), c = Mt(r, "padding");
            t = a.width - c.width - l.width, e = a.height - c.height - l.height, i = Ie(r.maxWidth, o, "clientWidth"), s = Ie(r.maxHeight, o, "clientHeight");
        }
    }
    return {
        width: t,
        height: e,
        maxWidth: i || Ee,
        maxHeight: s || Ee
    };
}
var xn = (n)=>Math.round(n * 10) / 10;
function Qi(n, t, e, i) {
    let s = Xe(n), o = Mt(s, "margin"), a = Ie(s.maxWidth, n, "clientWidth") || Ee, r = Ie(s.maxHeight, n, "clientHeight") || Ee, l = ua(n, t, e), { width: c , height: d  } = l;
    if (s.boxSizing === "content-box") {
        let u = Mt(s, "border", "width"), f = Mt(s, "padding");
        c -= f.width + u.width, d -= f.height + u.height;
    }
    return c = Math.max(0, c - o.width), d = Math.max(0, i ? Math.floor(c / i) : d - o.height), c = xn(Math.min(c, a, l.maxWidth)), d = xn(Math.min(d, r, l.maxHeight)), c && !d && (d = xn(c / 2)), {
        width: c,
        height: d
    };
}
function In(n, t, e) {
    let i = n.currentDevicePixelRatio = t || 1, { canvas: s , width: o , height: a  } = n;
    s.height = a * i, s.width = o * i, n.ctx.setTransform(i, 0, 0, i, 0, 0), s.style && (e || !s.style.height && !s.style.width) && (s.style.height = a + "px", s.style.width = o + "px");
}
var Ji = function() {
    let n = !1;
    try {
        let t = {
            get passive () {
                return n = !0, !1;
            }
        };
        window.addEventListener("test", null, t), window.removeEventListener("test", null, t);
    } catch  {}
    return n;
}();
function Bn(n, t) {
    let e = ra(n, t), i = e && e.match(/^(\d+)(\.\d+)?px$/);
    return i ? +i[1] : void 0;
}
function gt(n, t, e, i) {
    return {
        x: n.x + e * (t.x - n.x),
        y: n.y + e * (t.y - n.y)
    };
}
function ts(n, t, e, i) {
    return {
        x: n.x + e * (t.x - n.x),
        y: i === "middle" ? e < .5 ? n.y : t.y : i === "after" ? e < 1 ? n.y : t.y : e > 0 ? t.y : n.y
    };
}
function es(n, t, e, i) {
    let s = {
        x: n.cp2x,
        y: n.cp2y
    }, o = {
        x: t.cp1x,
        y: t.cp1y
    }, a = gt(n, s, e), r = gt(s, o, e), l = gt(o, t, e), c = gt(a, r, e), d = gt(r, l, e);
    return gt(c, d, e);
}
var yi = new Map;
function fa(n, t) {
    t = t || {};
    let e = n + JSON.stringify(t), i = yi.get(e);
    return i || (i = new Intl.NumberFormat(n, t), yi.set(e, i)), i;
}
function fe(n, t, e) {
    return fa(t, e).format(n);
}
var ha = function(n, t) {
    return {
        x (e) {
            return n + n + t - e;
        },
        setWidth (e) {
            t = e;
        },
        textAlign (e) {
            return e === "center" ? e : e === "right" ? "left" : "right";
        },
        xPlus (e, i) {
            return e - i;
        },
        leftForLtr (e, i) {
            return e - i;
        }
    };
}, ga = function() {
    return {
        x (n) {
            return n;
        },
        setWidth (n) {},
        textAlign (n) {
            return n;
        },
        xPlus (n, t) {
            return n + t;
        },
        leftForLtr (n, t) {
            return n;
        }
    };
};
function Ht(n, t, e) {
    return n ? ha(t, e) : ga();
}
function Vn(n, t) {
    let e, i;
    (t === "ltr" || t === "rtl") && (e = n.canvas.style, i = [
        e.getPropertyValue("direction"),
        e.getPropertyPriority("direction")
    ], e.setProperty("direction", t, "important"), n.prevTextDirection = i);
}
function Wn(n, t) {
    t !== void 0 && (delete n.prevTextDirection, n.canvas.style.setProperty("direction", t[0], t[1]));
}
function ns(n) {
    return n === "angle" ? {
        between: re,
        compare: Mo,
        normalize: J
    } : {
        between: (t, e, i)=>t >= Math.min(e, i) && t <= Math.max(i, e),
        compare: (t, e)=>t - e,
        normalize: (t)=>t
    };
}
function vi({ start: n , end: t , count: e , loop: i , style: s  }) {
    return {
        start: n % e,
        end: t % e,
        loop: i && (t - n + 1) % e === 0,
        style: s
    };
}
function pa(n, t, e) {
    let { property: i , start: s , end: o  } = e, { between: a , normalize: r  } = ns(i), l = t.length, { start: c , end: d , loop: u  } = n, f, h;
    if (u) {
        for(c += l, d += l, f = 0, h = l; f < h && a(r(t[c % l][i]), s, o); ++f)c--, d--;
        c %= l, d %= l;
    }
    return d < c && (d += l), {
        start: c,
        end: d,
        loop: u,
        style: n.style
    };
}
function Hn(n, t, e) {
    if (!e) return [
        n
    ];
    let { property: i , start: s , end: o  } = e, a = t.length, { compare: r , between: l , normalize: c  } = ns(i), { start: d , end: u , loop: f , style: h  } = pa(n, t, e), g = [], p = !1, m = null, b, x, y, _ = ()=>l(s, y, b) && r(s, y) !== 0, v = ()=>r(o, b) === 0 || l(o, y, b), M = ()=>p || _(), w = ()=>!p || v();
    for(let k = d, z = d; k <= u; ++k)x = t[k % a], !x.skip && (b = c(x[i]), p = l(b, s, o), m === null && M() && (m = r(b, s) === 0 ? k : z), m !== null && w() && (g.push(vi({
        start: m,
        end: k,
        loop: f,
        count: a,
        style: h
    })), m = null), z = k, y = b);
    return m !== null && g.push(vi({
        start: m,
        end: u,
        loop: f,
        count: a,
        style: h
    })), g;
}
function Nn(n, t) {
    let e = [], i = n.segments;
    for(let s = 0; s < i.length; s++){
        let o = Hn(i[s], n.points, t);
        o.length && e.push(...o);
    }
    return e;
}
function ma(n, t, e, i) {
    let s = 0, o = t - 1;
    if (e && !i) for(; s < t && !n[s].skip;)s++;
    for(; s < t && n[s].skip;)s++;
    for(s %= t, e && (o += s); o > s && n[o % t].skip;)o--;
    return o %= t, {
        start: s,
        end: o
    };
}
function ba(n, t, e, i) {
    let s = n.length, o = [], a = t, r = n[t], l;
    for(l = t + 1; l <= e; ++l){
        let c = n[l % s];
        c.skip || c.stop ? r.skip || (i = !1, o.push({
            start: t % s,
            end: (l - 1) % s,
            loop: i
        }), t = a = c.stop ? l : null) : (a = l, r.skip && (t = l)), r = c;
    }
    return a !== null && o.push({
        start: t % s,
        end: a % s,
        loop: i
    }), o;
}
function is(n, t) {
    let e = n.points, i = n.options.spanGaps, s = e.length;
    if (!s) return [];
    let o = !!n._loop, { start: a , end: r  } = ma(e, s, o, i);
    if (i === !0) return Mi([
        {
            start: a,
            end: r,
            loop: o
        }
    ], e, t);
    let l = r < a ? r + s : r, c = !!n._fullLoop && a === 0 && r === s - 1;
    return Mi(ba(e, a, l, c), e, t);
}
function Mi(n, t, e) {
    return !e || !e.setContext || !t ? n : xa(n, t, e);
}
function xa(n, t, e) {
    let i = t.length, s = [], o = n[0].start, a = o;
    for (let r of n){
        let l, c, d = t[o % i];
        for(a = o + 1; a <= r.end; a++){
            let u = t[a % i];
            c = _a(e.setContext({
                type: "segment",
                p0: d,
                p1: u
            })), ya(c, l) && (s.push({
                start: o,
                end: a - 1,
                loop: r.loop,
                style: l
            }), l = c, o = a - 1), d = u, l = c;
        }
        o < a - 1 && (s.push({
            start: o,
            end: a - 1,
            loop: r.loop,
            style: c
        }), o = a - 1);
    }
    return s;
}
function _a(n) {
    return {
        backgroundColor: n.backgroundColor,
        borderCapStyle: n.borderCapStyle,
        borderDash: n.borderDash,
        borderDashOffset: n.borderDashOffset,
        borderJoinStyle: n.borderJoinStyle,
        borderWidth: n.borderWidth,
        borderColor: n.borderColor
    };
}
function ya(n, t) {
    return t && JSON.stringify(n) !== JSON.stringify(t);
}
var Zn = class {
    constructor(){
        this._request = null, this._charts = new Map, this._running = !1, this._lastDate = void 0;
    }
    _notify(t, e, i, s) {
        let o = e.listeners[s], a = e.duration;
        o.forEach((r)=>r({
                chart: t,
                initial: e.initial,
                numSteps: a,
                currentStep: Math.min(i - e.start, a)
            }));
    }
    _refresh() {
        let t = this;
        t._request || (t._running = !0, t._request = vn.call(window, ()=>{
            t._update(), t._request = null, t._running && t._refresh();
        }));
    }
    _update(t = Date.now()) {
        let e = this, i = 0;
        e._charts.forEach((s, o)=>{
            if (!s.running || !s.items.length) return;
            let a = s.items, r = a.length - 1, l = !1, c;
            for(; r >= 0; --r)c = a[r], c._active ? (c._total > s.duration && (s.duration = c._total), c.tick(t), l = !0) : (a[r] = a[a.length - 1], a.pop());
            l && (o.draw(), e._notify(o, s, t, "progress")), a.length || (s.running = !1, e._notify(o, s, t, "complete"), s.initial = !1), i += a.length;
        }), e._lastDate = t, i === 0 && (e._running = !1);
    }
    _getAnims(t) {
        let e = this._charts, i = e.get(t);
        return i || (i = {
            running: !1,
            initial: !0,
            items: [],
            listeners: {
                complete: [],
                progress: []
            }
        }, e.set(t, i)), i;
    }
    listen(t, e, i) {
        this._getAnims(t).listeners[e].push(i);
    }
    add(t, e) {
        !e || !e.length || this._getAnims(t).items.push(...e);
    }
    has(t) {
        return this._getAnims(t).items.length > 0;
    }
    start(t) {
        let e = this._charts.get(t);
        e && (e.running = !0, e.start = Date.now(), e.duration = e.items.reduce((i, s)=>Math.max(i, s._duration), 0), this._refresh());
    }
    running(t) {
        if (!this._running) return !1;
        let e = this._charts.get(t);
        return !(!e || !e.running || !e.items.length);
    }
    stop(t) {
        let e = this._charts.get(t);
        if (!e || !e.items.length) return;
        let i = e.items, s = i.length - 1;
        for(; s >= 0; --s)i[s].cancel();
        e.items = [], this._notify(t, e, Date.now(), "complete");
    }
    remove(t) {
        return this._charts.delete(t);
    }
}, ct = new Zn, ss = "transparent", va = {
    boolean (n, t, e) {
        return e > .5 ? t : n;
    },
    color (n, t, e) {
        let i = On(n || ss), s = i.valid && On(t || ss);
        return s && s.valid ? s.mix(i, e).hexString() : t;
    },
    number (n, t, e) {
        return n + (t - n) * e;
    }
}, Qn = class {
    constructor(t, e, i, s){
        let o = e[i];
        s = Wt([
            t.to,
            s,
            o,
            t.from
        ]);
        let a = Wt([
            t.from,
            o,
            s
        ]);
        this._active = !0, this._fn = t.fn || va[t.type || typeof a], this._easing = Lt[t.easing] || Lt.linear, this._start = Math.floor(Date.now() + (t.delay || 0)), this._duration = this._total = Math.floor(t.duration), this._loop = !!t.loop, this._target = e, this._prop = i, this._from = a, this._to = s, this._promises = void 0;
    }
    active() {
        return this._active;
    }
    update(t, e, i) {
        let s = this;
        if (s._active) {
            s._notify(!1);
            let o = s._target[s._prop], a = i - s._start, r = s._duration - a;
            s._start = i, s._duration = Math.floor(Math.max(r, t.duration)), s._total += a, s._loop = !!t.loop, s._to = Wt([
                t.to,
                e,
                o,
                t.from
            ]), s._from = Wt([
                t.from,
                o,
                e
            ]);
        }
    }
    cancel() {
        let t = this;
        t._active && (t.tick(Date.now()), t._active = !1, t._notify(!1));
    }
    tick(t) {
        let e = this, i = t - e._start, s = e._duration, o = e._prop, a = e._from, r = e._loop, l = e._to, c;
        if (e._active = a !== l && (r || i < s), !e._active) {
            e._target[o] = l, e._notify(!0);
            return;
        }
        if (i < 0) {
            e._target[o] = a;
            return;
        }
        c = i / s % 2, c = r && c > 1 ? 2 - c : c, c = e._easing(Math.min(1, Math.max(0, c))), e._target[o] = e._fn(a, l, c);
    }
    wait() {
        let t = this._promises || (this._promises = []);
        return new Promise((e, i)=>{
            t.push({
                res: e,
                rej: i
            });
        });
    }
    _notify(t) {
        let e = t ? "res" : "rej", i = this._promises || [];
        for(let s = 0; s < i.length; s++)i[s][e]();
    }
}, Ma = [
    "x",
    "y",
    "borderWidth",
    "radius",
    "tension"
], wa = [
    "color",
    "borderColor",
    "backgroundColor"
];
P.set("animation", {
    delay: void 0,
    duration: 1e3,
    easing: "easeOutQuart",
    fn: void 0,
    from: void 0,
    loop: void 0,
    to: void 0,
    type: void 0
});
var ka = Object.keys(P.animation);
P.describe("animation", {
    _fallback: !1,
    _indexable: !1,
    _scriptable: (n)=>n !== "onProgress" && n !== "onComplete" && n !== "fn"
});
P.set("animations", {
    colors: {
        type: "color",
        properties: wa
    },
    numbers: {
        type: "number",
        properties: Ma
    }
});
P.describe("animations", {
    _fallback: "animation"
});
P.set("transitions", {
    active: {
        animation: {
            duration: 400
        }
    },
    resize: {
        animation: {
            duration: 0
        }
    },
    show: {
        animations: {
            colors: {
                from: "transparent"
            },
            visible: {
                type: "boolean",
                duration: 0
            }
        }
    },
    hide: {
        animations: {
            colors: {
                to: "transparent"
            },
            visible: {
                type: "boolean",
                easing: "linear",
                fn: (n)=>n | 0
            }
        }
    }
});
var Je = class {
    constructor(t, e){
        this._chart = t, this._properties = new Map, this.configure(e);
    }
    configure(t) {
        if (!A(t)) return;
        let e = this._properties;
        Object.getOwnPropertyNames(t).forEach((i)=>{
            let s = t[i];
            if (!A(s)) return;
            let o = {};
            for (let a of ka)o[a] = s[a];
            (E(s.properties) && s.properties || [
                i
            ]).forEach((a)=>{
                (a === i || !e.has(a)) && e.set(a, o);
            });
        });
    }
    _animateOptions(t, e) {
        let i = e.options, s = Pa(t, i);
        if (!s) return [];
        let o = this._createAnimations(s, i);
        return i.$shared && Sa(t.options.$animations, i).then(()=>{
            t.options = i;
        }, ()=>{}), o;
    }
    _createAnimations(t, e) {
        let i = this._properties, s = [], o = t.$animations || (t.$animations = {}), a = Object.keys(e), r = Date.now(), l;
        for(l = a.length - 1; l >= 0; --l){
            let c = a[l];
            if (c.charAt(0) === "$") continue;
            if (c === "options") {
                s.push(...this._animateOptions(t, e));
                continue;
            }
            let d = e[c], u = o[c], f = i.get(c);
            if (u) if (f && u.active()) {
                u.update(f, d, r);
                continue;
            } else u.cancel();
            if (!f || !f.duration) {
                t[c] = d;
                continue;
            }
            o[c] = u = new Qn(f, t, c, d), s.push(u);
        }
        return s;
    }
    update(t, e) {
        if (this._properties.size === 0) {
            Object.assign(t, e);
            return;
        }
        let i = this._createAnimations(t, e);
        if (i.length) return ct.add(this._chart, i), !0;
    }
};
function Sa(n, t) {
    let e = [], i = Object.keys(t);
    for(let s = 0; s < i.length; s++){
        let o = n[i[s]];
        o && o.active() && e.push(o.wait());
    }
    return Promise.all(e);
}
function Pa(n, t) {
    if (!t) return;
    let e = n.options;
    if (!e) {
        n.options = t;
        return;
    }
    return e.$shared && (n.options = e = Object.assign({}, e, {
        $shared: !1,
        $animations: {}
    })), e;
}
function os(n, t) {
    let e = n && n.options || {}, i = e.reverse, s = e.min === void 0 ? t : 0, o = e.max === void 0 ? t : 0;
    return {
        start: i ? o : s,
        end: i ? s : o
    };
}
function Da(n, t, e) {
    if (e === !1) return !1;
    let i = os(n, e), s = os(t, e);
    return {
        top: s.end,
        right: i.end,
        bottom: s.start,
        left: i.start
    };
}
function Ca(n) {
    let t, e, i, s;
    return A(n) ? (t = n.top, e = n.right, i = n.bottom, s = n.left) : t = e = i = s = n, {
        top: t,
        right: e,
        bottom: i,
        left: s
    };
}
function as(n, t) {
    let e = [], i = n._getSortedDatasetMetas(t), s, o;
    for(s = 0, o = i.length; s < o; ++s)e.push(i[s].index);
    return e;
}
function rs(n, t, e, i) {
    let s = n.keys, o = i.mode === "single", a, r, l, c;
    if (t !== null) {
        for(a = 0, r = s.length; a < r; ++a){
            if (l = +s[a], l === e) {
                if (i.all) continue;
                break;
            }
            c = n.values[l], V(c) && (o || t === 0 || rt(t) === rt(c)) && (t += c);
        }
        return t;
    }
}
function Oa(n) {
    let t = Object.keys(n), e = new Array(t.length), i, s, o;
    for(i = 0, s = t.length; i < s; ++i)o = t[i], e[i] = {
        x: o,
        y: n[o]
    };
    return e;
}
function ls(n, t) {
    let e = n && n.options.stacked;
    return e || e === void 0 && t.stack !== void 0;
}
function Aa(n, t, e) {
    return `${n.id}.${t.id}.${e.stack || e.type}`;
}
function Ta(n) {
    let { min: t , max: e , minDefined: i , maxDefined: s  } = n.getUserBounds();
    return {
        min: i ? t : Number.NEGATIVE_INFINITY,
        max: s ? e : Number.POSITIVE_INFINITY
    };
}
function La(n, t, e) {
    let i = n[t] || (n[t] = {});
    return i[e] || (i[e] = {});
}
function cs(n, t, e) {
    for (let i of t.getMatchingVisibleMetas("bar").reverse()){
        let s = n[i.index];
        if (e && s > 0 || !e && s < 0) return i.index;
    }
    return null;
}
function ds(n, t) {
    let { chart: e , _cachedMeta: i  } = n, s = e._stacks || (e._stacks = {}), { iScale: o , vScale: a , index: r  } = i, l = o.axis, c = a.axis, d = Aa(o, a, i), u = t.length, f;
    for(let h = 0; h < u; ++h){
        let g = t[h], { [l]: p , [c]: m  } = g, b = g._stacks || (g._stacks = {});
        f = b[c] = La(s, d, p), f[r] = m, f._top = cs(f, a, !0), f._bottom = cs(f, a, !1);
    }
}
function jn(n, t) {
    let e = n.scales;
    return Object.keys(e).filter((i)=>e[i].axis === t).shift();
}
function Ra(n, t) {
    return Object.assign(Object.create(n), {
        active: !1,
        dataset: void 0,
        datasetIndex: t,
        index: t,
        mode: "default",
        type: "dataset"
    });
}
function Fa(n, t, e) {
    return Object.assign(Object.create(n), {
        active: !1,
        dataIndex: t,
        parsed: void 0,
        raw: void 0,
        element: e,
        index: t,
        mode: "default",
        type: "data"
    });
}
function Ue(n, t) {
    t = t || n._parsed;
    for (let e of t){
        let i = e._stacks;
        if (!i || i[n.vScale.id] === void 0 || i[n.vScale.id][n.index] === void 0) return;
        delete i[n.vScale.id][n.index];
    }
}
var Yn = (n)=>n === "reset" || n === "none", us = (n, t)=>t ? n : Object.assign({}, n), et = class {
    constructor(t, e){
        this.chart = t, this._ctx = t.ctx, this.index = e, this._cachedDataOpts = {}, this._cachedMeta = this.getMeta(), this._type = this._cachedMeta.type, this.options = void 0, this._parsing = !1, this._data = void 0, this._objectData = void 0, this._sharedOptions = void 0, this._drawStart = void 0, this._drawCount = void 0, this.enableOptionSharing = !1, this.$context = void 0, this.initialize();
    }
    initialize() {
        let t = this, e = t._cachedMeta;
        t.configure(), t.linkScales(), e._stacked = ls(e.vScale, e), t.addElements();
    }
    updateIndex(t) {
        this.index = t;
    }
    linkScales() {
        let t = this, e = t.chart, i = t._cachedMeta, s = t.getDataset(), o = (f, h, g, p)=>f === "x" ? h : f === "r" ? p : g, a = i.xAxisID = S(s.xAxisID, jn(e, "x")), r = i.yAxisID = S(s.yAxisID, jn(e, "y")), l = i.rAxisID = S(s.rAxisID, jn(e, "r")), c = i.indexAxis, d = i.iAxisID = o(c, a, r, l), u = i.vAxisID = o(c, r, a, l);
        i.xScale = t.getScaleForId(a), i.yScale = t.getScaleForId(r), i.rScale = t.getScaleForId(l), i.iScale = t.getScaleForId(d), i.vScale = t.getScaleForId(u);
    }
    getDataset() {
        return this.chart.data.datasets[this.index];
    }
    getMeta() {
        return this.chart.getDatasetMeta(this.index);
    }
    getScaleForId(t) {
        return this.chart.scales[t];
    }
    _getOtherScale(t) {
        let e = this._cachedMeta;
        return t === e.iScale ? e.vScale : e.iScale;
    }
    reset() {
        this._update("reset");
    }
    _destroy() {
        let t = this._cachedMeta;
        this._data && Ln(this._data, this), t._stacked && Ue(t);
    }
    _dataCheck() {
        let t = this, e = t.getDataset(), i = e.data || (e.data = []);
        A(i) ? t._data = Oa(i) : t._data !== i && (t._data && (Ln(t._data, t), Ue(t._cachedMeta)), i && Object.isExtensible(i) && Xi(i, t), t._data = i);
    }
    addElements() {
        let t = this, e = t._cachedMeta;
        t._dataCheck(), t.datasetElementType && (e.dataset = new t.datasetElementType);
    }
    buildOrUpdateElements(t) {
        let e = this, i = e._cachedMeta, s = e.getDataset(), o = !1;
        e._dataCheck(), i._stacked = ls(i.vScale, i), i.stack !== s.stack && (o = !0, Ue(i), i.stack = s.stack), e._resyncElements(t), o && ds(e, i._parsed);
    }
    configure() {
        let t = this, e = t.chart.config, i = e.datasetScopeKeys(t._type), s = e.getOptionScopes(t.getDataset(), i, !0);
        t.options = e.createResolver(s, t.getContext()), t._parsing = t.options.parsing;
    }
    parse(t, e) {
        let i = this, { _cachedMeta: s , _data: o  } = i, { iScale: a , _stacked: r  } = s, l = a.axis, c = t === 0 && e === o.length ? !0 : s._sorted, d = t > 0 && s._parsed[t - 1], u, f, h;
        if (i._parsing === !1) s._parsed = o, s._sorted = !0, h = o;
        else {
            E(o[t]) ? h = i.parseArrayData(s, o, t, e) : A(o[t]) ? h = i.parseObjectData(s, o, t, e) : h = i.parsePrimitiveData(s, o, t, e);
            let g = ()=>f[l] === null || d && f[l] < d[l];
            for(u = 0; u < e; ++u)s._parsed[u + t] = f = h[u], c && (g() && (c = !1), d = f);
            s._sorted = c;
        }
        r && ds(i, h);
    }
    parsePrimitiveData(t, e, i, s) {
        let { iScale: o , vScale: a  } = t, r = o.axis, l = a.axis, c = o.getLabels(), d = o === a, u = new Array(s), f, h, g;
        for(f = 0, h = s; f < h; ++f)g = f + i, u[f] = {
            [r]: d || o.parse(c[g], g),
            [l]: a.parse(e[g], g)
        };
        return u;
    }
    parseArrayData(t, e, i, s) {
        let { xScale: o , yScale: a  } = t, r = new Array(s), l, c, d, u;
        for(l = 0, c = s; l < c; ++l)d = l + i, u = e[d], r[l] = {
            x: o.parse(u[0], d),
            y: a.parse(u[1], d)
        };
        return r;
    }
    parseObjectData(t, e, i, s) {
        let { xScale: o , yScale: a  } = t, { xAxisKey: r = "x" , yAxisKey: l = "y"  } = this._parsing, c = new Array(s), d, u, f, h;
        for(d = 0, u = s; d < u; ++d)f = d + i, h = e[f], c[d] = {
            x: o.parse(lt(h, r), f),
            y: a.parse(lt(h, l), f)
        };
        return c;
    }
    getParsed(t) {
        return this._cachedMeta._parsed[t];
    }
    getDataElement(t) {
        return this._cachedMeta.data[t];
    }
    applyStack(t, e, i) {
        let s = this.chart, o = this._cachedMeta, a = e[t.axis], r = {
            keys: as(s, !0),
            values: e._stacks[t.axis]
        };
        return rs(r, a, o.index, {
            mode: i
        });
    }
    updateRangeFromParsed(t, e, i, s) {
        let o = i[e.axis], a = o === null ? NaN : o, r = s && i._stacks[e.axis];
        s && r && (s.values = r, t.min = Math.min(t.min, a), t.max = Math.max(t.max, a), a = rs(s, o, this._cachedMeta.index, {
            all: !0
        })), t.min = Math.min(t.min, a), t.max = Math.max(t.max, a);
    }
    getMinMax(t, e) {
        let i = this, s = i._cachedMeta, o = s._parsed, a = s._sorted && t === s.iScale, r = o.length, l = i._getOtherScale(t), c = e && s._stacked && {
            keys: as(i.chart, !0),
            values: null
        }, d = {
            min: Number.POSITIVE_INFINITY,
            max: Number.NEGATIVE_INFINITY
        }, { min: u , max: f  } = Ta(l), h, g, p, m;
        function b() {
            return p = o[h], g = p[t.axis], m = p[l.axis], !V(g) || u > m || f < m;
        }
        for(h = 0; h < r && !(!b() && (i.updateRangeFromParsed(d, t, p, c), a)); ++h);
        if (a) {
            for(h = r - 1; h >= 0; --h)if (!b()) {
                i.updateRangeFromParsed(d, t, p, c);
                break;
            }
        }
        return d;
    }
    getAllParsedValues(t) {
        let e = this._cachedMeta._parsed, i = [], s, o, a;
        for(s = 0, o = e.length; s < o; ++s)a = e[s][t.axis], V(a) && i.push(a);
        return i;
    }
    getMaxOverflow() {
        return !1;
    }
    getLabelAndValue(t) {
        let e = this, i = e._cachedMeta, s = i.iScale, o = i.vScale, a = e.getParsed(t);
        return {
            label: s ? "" + s.getLabelForValue(a[s.axis]) : "",
            value: o ? "" + o.getLabelForValue(a[o.axis]) : ""
        };
    }
    _update(t) {
        let e = this, i = e._cachedMeta;
        e.configure(), e._cachedDataOpts = {}, e.update(t || "default"), i._clip = Ca(S(e.options.clip, Da(i.xScale, i.yScale, e.getMaxOverflow())));
    }
    update(t) {}
    draw() {
        let t = this, e = t._ctx, i = t.chart, s = t._cachedMeta, o = s.data || [], a = i.chartArea, r = [], l = t._drawStart || 0, c = t._drawCount || o.length - l, d;
        for(s.dataset && s.dataset.draw(e, a, l, c), d = l; d < l + c; ++d){
            let u = o[d];
            u.active ? r.push(u) : u.draw(e, a);
        }
        for(d = 0; d < r.length; ++d)r[d].draw(e, a);
    }
    getStyle(t, e) {
        let i = e ? "active" : "default";
        return t === void 0 && this._cachedMeta.dataset ? this.resolveDatasetElementOptions(i) : this.resolveDataElementOptions(t || 0, i);
    }
    getContext(t, e, i) {
        let s = this, o = s.getDataset(), a;
        if (t >= 0 && t < s._cachedMeta.data.length) {
            let r = s._cachedMeta.data[t];
            a = r.$context || (r.$context = Fa(s.getContext(), t, r)), a.parsed = s.getParsed(t), a.raw = o.data[t];
        } else a = s.$context || (s.$context = Ra(s.chart.getContext(), s.index)), a.dataset = o;
        return a.active = !!e, a.mode = i, a;
    }
    resolveDatasetElementOptions(t) {
        return this._resolveElementOptions(this.datasetElementType.id, t);
    }
    resolveDataElementOptions(t, e) {
        return this._resolveElementOptions(this.dataElementType.id, e, t);
    }
    _resolveElementOptions(t, e = "default", i) {
        let s = this, o = e === "active", a = s._cachedDataOpts, r = t + "-" + e, l = a[r], c = s.enableOptionSharing && nt(i);
        if (l) return us(l, c);
        let d = s.chart.config, u = d.datasetElementScopeKeys(s._type, t), f = o ? [
            `${t}Hover`,
            "hover",
            t,
            ""
        ] : [
            t,
            ""
        ], h = d.getOptionScopes(s.getDataset(), u), g = Object.keys(P.elements[t]), p = ()=>s.getContext(i, o), m = d.resolveNamedOptions(h, g, p, f);
        return m.$shared && (m.$shared = c, a[r] = Object.freeze(us(m, c))), m;
    }
    _resolveAnimations(t, e, i) {
        let s = this, o = s.chart, a = s._cachedDataOpts, r = `animation-${e}`, l = a[r];
        if (l) return l;
        let c;
        if (o.options.animation !== !1) {
            let u = s.chart.config, f = u.datasetAnimationScopeKeys(s._type, e), h = u.getOptionScopes(s.getDataset(), f);
            c = u.createResolver(h, s.getContext(t, i, e));
        }
        let d = new Je(o, c && c.animations);
        return c && c._cacheable && (a[r] = Object.freeze(d)), d;
    }
    getSharedOptions(t) {
        if (t.$shared) return this._sharedOptions || (this._sharedOptions = Object.assign({}, t));
    }
    includeOptions(t, e) {
        return !e || Yn(t) || this.chart._animationsDisabled;
    }
    updateElement(t, e, i, s) {
        Yn(s) ? Object.assign(t, i) : this._resolveAnimations(e, s).update(t, i);
    }
    updateSharedOptions(t, e, i) {
        t && !Yn(e) && this._resolveAnimations(void 0, e).update(t, i);
    }
    _setStyle(t, e, i, s) {
        t.active = s;
        let o = this.getStyle(e, s);
        this._resolveAnimations(e, i, s).update(t, {
            options: !s && this.getSharedOptions(o) || o
        });
    }
    removeHoverStyle(t, e, i) {
        this._setStyle(t, i, "active", !1);
    }
    setHoverStyle(t, e, i) {
        this._setStyle(t, i, "active", !0);
    }
    _removeDatasetHoverStyle() {
        let t = this._cachedMeta.dataset;
        t && this._setStyle(t, void 0, "active", !1);
    }
    _setDatasetHoverStyle() {
        let t = this._cachedMeta.dataset;
        t && this._setStyle(t, void 0, "active", !0);
    }
    _resyncElements(t) {
        let e = this, i = e._cachedMeta.data.length, s = e._data.length;
        s > i ? e._insertElements(i, s - i, t) : s < i && e._removeElements(s, i - s);
        let o = Math.min(s, i);
        o && e.parse(0, o);
    }
    _insertElements(t, e, i = !0) {
        let s = this, o = s._cachedMeta, a = o.data, r = t + e, l, c = (d)=>{
            for(d.length += e, l = d.length - 1; l >= r; l--)d[l] = d[l - e];
        };
        for(c(a), l = t; l < r; ++l)a[l] = new s.dataElementType;
        s._parsing && c(o._parsed), s.parse(t, e), i && s.updateElements(a, t, e, "reset");
    }
    updateElements(t, e, i, s) {}
    _removeElements(t, e) {
        let i = this, s = i._cachedMeta;
        if (i._parsing) {
            let o = s._parsed.splice(t, e);
            s._stacked && Ue(s, o);
        }
        s.data.splice(t, e);
    }
    _onDataPush() {
        let t = arguments.length;
        this._insertElements(this.getDataset().data.length - t, t);
    }
    _onDataPop() {
        this._removeElements(this._cachedMeta.data.length - 1, 1);
    }
    _onDataShift() {
        this._removeElements(0, 1);
    }
    _onDataSplice(t, e) {
        this._removeElements(t, e), this._insertElements(t, arguments.length - 2);
    }
    _onDataUnshift() {
        this._insertElements(0, arguments.length);
    }
};
et.defaults = {};
et.prototype.datasetElementType = null;
et.prototype.dataElementType = null;
function Ea(n) {
    if (!n._cache.$bar) {
        let t = n.getMatchingVisibleMetas("bar"), e = [];
        for(let i = 0, s = t.length; i < s; i++)e = e.concat(t[i].controller.getAllParsedValues(n));
        n._cache.$bar = Rn(e.sort((i, s)=>i - s));
    }
    return n._cache.$bar;
}
function za(n) {
    let t = Ea(n), e = n._length, i, s, o, a, r = ()=>{
        e = Math.min(e, i && Math.abs(o - a) || e), a = o;
    };
    for(i = 0, s = t.length; i < s; ++i)o = n.getPixelForValue(t[i]), r();
    for(i = 0, s = n.ticks.length; i < s; ++i)o = n.getPixelForTick(i), r();
    return e;
}
function Ia(n, t, e, i) {
    let s = e.barThickness, o, a;
    return D(s) ? (o = t.min * e.categoryPercentage, a = e.barPercentage) : (o = s * i, a = 1), {
        chunk: o / i,
        ratio: a,
        start: t.pixels[n] - o / 2
    };
}
function Ba(n, t, e, i) {
    let s = t.pixels, o = s[n], a = n > 0 ? s[n - 1] : null, r = n < s.length - 1 ? s[n + 1] : null, l = e.categoryPercentage;
    a === null && (a = o - (r === null ? t.end - t.start : r - o)), r === null && (r = o + o - a);
    let c = o - (o - Math.min(a, r)) / 2 * l;
    return {
        chunk: Math.abs(r - a) / 2 * l / i,
        ratio: e.barPercentage,
        start: c
    };
}
function Va(n, t, e, i) {
    let s = e.parse(n[0], i), o = e.parse(n[1], i), a = Math.min(s, o), r = Math.max(s, o), l = a, c = r;
    Math.abs(a) > Math.abs(r) && (l = r, c = a), t[e.axis] = c, t._custom = {
        barStart: l,
        barEnd: c,
        start: s,
        end: o,
        min: a,
        max: r
    };
}
function qs(n, t, e, i) {
    return E(n) ? Va(n, t, e, i) : t[e.axis] = e.parse(n, i), t;
}
function fs(n, t, e, i) {
    let s = n.iScale, o = n.vScale, a = s.getLabels(), r = s === o, l = [], c, d, u, f;
    for(c = e, d = e + i; c < d; ++c)f = t[c], u = {}, u[s.axis] = r || s.parse(a[c], c), l.push(qs(f, u, o, c));
    return l;
}
function $n(n) {
    return n && n.barStart !== void 0 && n.barEnd !== void 0;
}
var Yt = class extends et {
    parsePrimitiveData(t, e, i, s) {
        return fs(t, e, i, s);
    }
    parseArrayData(t, e, i, s) {
        return fs(t, e, i, s);
    }
    parseObjectData(t, e, i, s) {
        let { iScale: o , vScale: a  } = t, { xAxisKey: r = "x" , yAxisKey: l = "y"  } = this._parsing, c = o.axis === "x" ? r : l, d = a.axis === "x" ? r : l, u = [], f, h, g, p;
        for(f = i, h = i + s; f < h; ++f)p = e[f], g = {}, g[o.axis] = o.parse(lt(p, c), f), u.push(qs(lt(p, d), g, a, f));
        return u;
    }
    updateRangeFromParsed(t, e, i, s) {
        super.updateRangeFromParsed(t, e, i, s);
        let o = i._custom;
        o && e === this._cachedMeta.vScale && (t.min = Math.min(t.min, o.min), t.max = Math.max(t.max, o.max));
    }
    getLabelAndValue(t) {
        let e = this, i = e._cachedMeta, { iScale: s , vScale: o  } = i, a = e.getParsed(t), r = a._custom, l = $n(r) ? "[" + r.start + ", " + r.end + "]" : "" + o.getLabelForValue(a[o.axis]);
        return {
            label: "" + s.getLabelForValue(a[s.axis]),
            value: l
        };
    }
    initialize() {
        let t = this;
        t.enableOptionSharing = !0, super.initialize();
        let e = t._cachedMeta;
        e.stack = t.getDataset().stack;
    }
    update(t) {
        let e = this, i = e._cachedMeta;
        e.updateElements(i.data, 0, i.data.length, t);
    }
    updateElements(t, e, i, s) {
        let o = this, a = s === "reset", r = o._cachedMeta.vScale, l = r.getBasePixel(), c = r.isHorizontal(), d = o._getRuler(), u = o.resolveDataElementOptions(e, s), f = o.getSharedOptions(u), h = o.includeOptions(s, f);
        o.updateSharedOptions(f, s, u);
        for(let g = e; g < e + i; g++){
            let p = o.getParsed(g), m = a || D(p[r.axis]) ? {
                base: l,
                head: l
            } : o._calculateBarValuePixels(g), b = o._calculateBarIndexPixels(g, d), x = (p._stacks || {})[r.axis], y = {
                horizontal: c,
                base: m.base,
                enableBorderRadius: !x || $n(p._custom) || o.index === x._top || o.index === x._bottom,
                x: c ? m.head : b.center,
                y: c ? b.center : m.head,
                height: c ? b.size : void 0,
                width: c ? void 0 : b.size
            };
            h && (y.options = f || o.resolveDataElementOptions(g, s)), o.updateElement(t[g], g, y, s);
        }
    }
    _getStacks(t, e) {
        let i = this, o = i._cachedMeta.iScale, a = o.getMatchingVisibleMetas(i._type), r = o.options.stacked, l = a.length, c = [], d, u;
        for(d = 0; d < l; ++d){
            if (u = a[d], typeof e < "u") {
                let f = u.controller.getParsed(e)[u.controller._cachedMeta.vScale.axis];
                if (D(f) || isNaN(f)) continue;
            }
            if ((r === !1 || c.indexOf(u.stack) === -1 || r === void 0 && u.stack === void 0) && c.push(u.stack), u.index === t) break;
        }
        return c.length || c.push(void 0), c;
    }
    _getStackCount(t) {
        return this._getStacks(void 0, t).length;
    }
    _getStackIndex(t, e, i) {
        let s = this._getStacks(t, i), o = e !== void 0 ? s.indexOf(e) : -1;
        return o === -1 ? s.length - 1 : o;
    }
    _getRuler() {
        let t = this, e = t.options, i = t._cachedMeta, s = i.iScale, o = [], a, r;
        for(a = 0, r = i.data.length; a < r; ++a)o.push(s.getPixelForValue(t.getParsed(a)[s.axis], a));
        let l = e.barThickness;
        return {
            min: l || za(s),
            pixels: o,
            start: s._startPixel,
            end: s._endPixel,
            stackCount: t._getStackCount(),
            scale: s,
            grouped: e.grouped,
            ratio: l ? 1 : e.categoryPercentage * e.barPercentage
        };
    }
    _calculateBarValuePixels(t) {
        let e = this, { vScale: i , _stacked: s  } = e._cachedMeta, { base: o , minBarLength: a  } = e.options, r = e.getParsed(t), l = r._custom, c = $n(l), d = r[i.axis], u = 0, f = s ? e.applyStack(i, r, s) : d, h, g;
        f !== d && (u = f - d, f = d), c && (d = l.barStart, f = l.barEnd - l.barStart, d !== 0 && rt(d) !== rt(l.barEnd) && (u = 0), u += d);
        let p = !D(o) && !c ? o : u, m = i.getPixelForValue(p);
        this.chart.getDataVisibility(t) ? h = i.getPixelForValue(u + f) : h = m, g = h - m, a !== void 0 && Math.abs(g) < a && (g = g < 0 ? -a : a, d === 0 && (m -= g / 2), h = m + g);
        let b = o || 0;
        if (m === i.getPixelForValue(b)) {
            let x = i.getLineWidthForValue(b) / 2;
            g > 0 ? (m += x, g -= x) : g < 0 && (m -= x, g += x);
        }
        return {
            size: g,
            base: m,
            head: h,
            center: h + g / 2
        };
    }
    _calculateBarIndexPixels(t, e) {
        let i = this, s = e.scale, o = i.options, a = o.skipNull, r = S(o.maxBarThickness, 1 / 0), l, c;
        if (e.grouped) {
            let d = a ? i._getStackCount(t) : e.stackCount, u = o.barThickness === "flex" ? Ba(t, e, o, d) : Ia(t, e, o, d), f = i._getStackIndex(i.index, i._cachedMeta.stack, a ? t : void 0);
            l = u.start + u.chunk * f + u.chunk / 2, c = Math.min(r, u.chunk * u.ratio);
        } else l = s.getPixelForValue(i.getParsed(t)[s.axis], t), c = Math.min(r, e.min * e.ratio);
        return {
            base: l - c / 2,
            head: l + c / 2,
            center: l,
            size: c
        };
    }
    draw() {
        let t = this, e = t.chart, i = t._cachedMeta, s = i.vScale, o = i.data, a = o.length, r = 0;
        for(Bt(e.ctx, e.chartArea); r < a; ++r)t.getParsed(r)[s.axis] !== null && o[r].draw(t._ctx);
        Vt(e.ctx);
    }
};
Yt.id = "bar";
Yt.defaults = {
    datasetElementType: !1,
    dataElementType: "bar",
    categoryPercentage: .8,
    barPercentage: .9,
    grouped: !0,
    animations: {
        numbers: {
            type: "number",
            properties: [
                "x",
                "y",
                "base",
                "width",
                "height"
            ]
        }
    }
};
Yt.overrides = {
    interaction: {
        mode: "index"
    },
    scales: {
        _index_: {
            type: "category",
            offset: !0,
            grid: {
                offset: !0
            }
        },
        _value_: {
            type: "linear",
            beginAtZero: !0
        }
    }
};
var $t = class extends et {
    initialize() {
        this.enableOptionSharing = !0, super.initialize();
    }
    parseObjectData(t, e, i, s) {
        let { xScale: o , yScale: a  } = t, { xAxisKey: r = "x" , yAxisKey: l = "y"  } = this._parsing, c = [], d, u, f;
        for(d = i, u = i + s; d < u; ++d)f = e[d], c.push({
            x: o.parse(lt(f, r), d),
            y: a.parse(lt(f, l), d),
            _custom: f && f.r && +f.r
        });
        return c;
    }
    getMaxOverflow() {
        let { data: t , _parsed: e  } = this._cachedMeta, i = 0;
        for(let s = t.length - 1; s >= 0; --s)i = Math.max(i, t[s].size() / 2, e[s]._custom);
        return i > 0 && i;
    }
    getLabelAndValue(t) {
        let e = this, i = e._cachedMeta, { xScale: s , yScale: o  } = i, a = e.getParsed(t), r = s.getLabelForValue(a.x), l = o.getLabelForValue(a.y), c = a._custom;
        return {
            label: i.label,
            value: "(" + r + ", " + l + (c ? ", " + c : "") + ")"
        };
    }
    update(t) {
        let e = this, i = e._cachedMeta.data;
        e.updateElements(i, 0, i.length, t);
    }
    updateElements(t, e, i, s) {
        let o = this, a = s === "reset", { xScale: r , yScale: l  } = o._cachedMeta, c = o.resolveDataElementOptions(e, s), d = o.getSharedOptions(c), u = o.includeOptions(s, d);
        for(let f = e; f < e + i; f++){
            let h = t[f], g = !a && o.getParsed(f), p = a ? r.getPixelForDecimal(.5) : r.getPixelForValue(g.x), m = a ? l.getBasePixel() : l.getPixelForValue(g.y), b = {
                x: p,
                y: m,
                skip: isNaN(p) || isNaN(m)
            };
            u && (b.options = o.resolveDataElementOptions(f, s), a && (b.options.radius = 0)), o.updateElement(h, f, b, s);
        }
        o.updateSharedOptions(d, s, c);
    }
    resolveDataElementOptions(t, e) {
        let i = this.getParsed(t), s = super.resolveDataElementOptions(t, e);
        s.$shared && (s = Object.assign({}, s, {
            $shared: !1
        }));
        let o = s.radius;
        return e !== "active" && (s.radius = 0), s.radius += S(i && i._custom, o), s;
    }
};
$t.id = "bubble";
$t.defaults = {
    datasetElementType: !1,
    dataElementType: "point",
    animations: {
        numbers: {
            type: "number",
            properties: [
                "x",
                "y",
                "borderWidth",
                "radius"
            ]
        }
    }
};
$t.overrides = {
    scales: {
        x: {
            type: "linear"
        },
        y: {
            type: "linear"
        }
    },
    plugins: {
        tooltip: {
            callbacks: {
                title () {
                    return "";
                }
            }
        }
    }
};
function Wa(n, t, e) {
    let i = 1, s = 1, o = 0, a = 0;
    if (t < L) {
        let r = n, l = r + t, c = Math.cos(r), d = Math.sin(r), u = Math.cos(l), f = Math.sin(l), h = (y, _, v)=>re(y, r, l) ? 1 : Math.max(_, _ * e, v, v * e), g = (y, _, v)=>re(y, r, l) ? -1 : Math.min(_, _ * e, v, v * e), p = h(0, c, u), m = h(B, d, f), b = g(W, c, u), x = g(W + B, d, f);
        i = (p - b) / 2, s = (m - x) / 2, o = -(p + b) / 2, a = -(m + x) / 2;
    }
    return {
        ratioX: i,
        ratioY: s,
        offsetX: o,
        offsetY: a
    };
}
var Dt = class extends et {
    constructor(t, e){
        super(t, e), this.enableOptionSharing = !0, this.innerRadius = void 0, this.outerRadius = void 0, this.offsetX = void 0, this.offsetY = void 0;
    }
    linkScales() {}
    parse(t, e) {
        let i = this.getDataset().data, s = this._cachedMeta, o, a;
        for(o = t, a = t + e; o < a; ++o)s._parsed[o] = +i[o];
    }
    _getRotation() {
        return st(this.options.rotation - 90);
    }
    _getCircumference() {
        return st(this.options.circumference);
    }
    _getRotationExtents() {
        let t = L, e = -L, i = this;
        for(let s = 0; s < i.chart.data.datasets.length; ++s)if (i.chart.isDatasetVisible(s)) {
            let o = i.chart.getDatasetMeta(s).controller, a = o._getRotation(), r = o._getCircumference();
            t = Math.min(t, a), e = Math.max(e, a + r);
        }
        return {
            rotation: t,
            circumference: e - t
        };
    }
    update(t) {
        let e = this, i = e.chart, { chartArea: s  } = i, o = e._cachedMeta, a = o.data, r = e.getMaxBorderWidth() + e.getMaxOffset(a), l = Math.max((Math.min(s.width, s.height) - r) / 2, 0), c = Math.min(Pi(e.options.cutout, l), 1), d = e._getRingWeight(e.index), { circumference: u , rotation: f  } = e._getRotationExtents(), { ratioX: h , ratioY: g , offsetX: p , offsetY: m  } = Wa(f, u, c), b = (s.width - r) / h, x = (s.height - r) / g, y = Math.max(Math.min(b, x) / 2, 0), _ = Re(e.options.radius, y), v = Math.max(_ * c, 0), M = (_ - v) / e._getVisibleDatasetWeightTotal();
        e.offsetX = p * _, e.offsetY = m * _, o.total = e.calculateTotal(), e.outerRadius = _ - M * e._getRingWeightOffset(e.index), e.innerRadius = Math.max(e.outerRadius - M * d, 0), e.updateElements(a, 0, a.length, t);
    }
    _circumference(t, e) {
        let i = this, s = i.options, o = i._cachedMeta, a = i._getCircumference();
        return e && s.animation.animateRotate || !this.chart.getDataVisibility(t) || o._parsed[t] === null ? 0 : i.calculateCircumference(o._parsed[t] * a / L);
    }
    updateElements(t, e, i, s) {
        let o = this, a = s === "reset", r = o.chart, l = r.chartArea, d = r.options.animation, u = (l.left + l.right) / 2, f = (l.top + l.bottom) / 2, h = a && d.animateScale, g = h ? 0 : o.innerRadius, p = h ? 0 : o.outerRadius, m = o.resolveDataElementOptions(e, s), b = o.getSharedOptions(m), x = o.includeOptions(s, b), y = o._getRotation(), _;
        for(_ = 0; _ < e; ++_)y += o._circumference(_, a);
        for(_ = e; _ < e + i; ++_){
            let v = o._circumference(_, a), M = t[_], w = {
                x: u + o.offsetX,
                y: f + o.offsetY,
                startAngle: y,
                endAngle: y + v,
                circumference: v,
                outerRadius: p,
                innerRadius: g
            };
            x && (w.options = b || o.resolveDataElementOptions(_, s)), y += v, o.updateElement(M, _, w, s);
        }
        o.updateSharedOptions(b, s, m);
    }
    calculateTotal() {
        let t = this._cachedMeta, e = t.data, i = 0, s;
        for(s = 0; s < e.length; s++){
            let o = t._parsed[s];
            o !== null && !isNaN(o) && this.chart.getDataVisibility(s) && (i += Math.abs(o));
        }
        return i;
    }
    calculateCircumference(t) {
        let e = this._cachedMeta.total;
        return e > 0 && !isNaN(t) ? L * (Math.abs(t) / e) : 0;
    }
    getLabelAndValue(t) {
        let e = this, i = e._cachedMeta, s = e.chart, o = s.data.labels || [], a = fe(i._parsed[t], s.options.locale);
        return {
            label: o[t] || "",
            value: a
        };
    }
    getMaxBorderWidth(t) {
        let e = this, i = 0, s = e.chart, o, a, r, l, c;
        if (!t) {
            for(o = 0, a = s.data.datasets.length; o < a; ++o)if (s.isDatasetVisible(o)) {
                r = s.getDatasetMeta(o), t = r.data, l = r.controller, l !== e && l.configure();
                break;
            }
        }
        if (!t) return 0;
        for(o = 0, a = t.length; o < a; ++o)c = l.resolveDataElementOptions(o), c.borderAlign !== "inner" && (i = Math.max(i, c.borderWidth || 0, c.hoverBorderWidth || 0));
        return i;
    }
    getMaxOffset(t) {
        let e = 0;
        for(let i = 0, s = t.length; i < s; ++i){
            let o = this.resolveDataElementOptions(i);
            e = Math.max(e, o.offset || 0, o.hoverOffset || 0);
        }
        return e;
    }
    _getRingWeightOffset(t) {
        let e = 0;
        for(let i = 0; i < t; ++i)this.chart.isDatasetVisible(i) && (e += this._getRingWeight(i));
        return e;
    }
    _getRingWeight(t) {
        return Math.max(S(this.chart.data.datasets[t].weight, 1), 0);
    }
    _getVisibleDatasetWeightTotal() {
        return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
    }
};
Dt.id = "doughnut";
Dt.defaults = {
    datasetElementType: !1,
    dataElementType: "arc",
    animation: {
        animateRotate: !0,
        animateScale: !1
    },
    animations: {
        numbers: {
            type: "number",
            properties: [
                "circumference",
                "endAngle",
                "innerRadius",
                "outerRadius",
                "startAngle",
                "x",
                "y",
                "offset",
                "borderWidth"
            ]
        }
    },
    cutout: "50%",
    rotation: 0,
    circumference: 360,
    radius: "100%",
    indexAxis: "r"
};
Dt.overrides = {
    aspectRatio: 1,
    plugins: {
        legend: {
            labels: {
                generateLabels (n) {
                    let t = n.data;
                    return t.labels.length && t.datasets.length ? t.labels.map((e, i)=>{
                        let o = n.getDatasetMeta(0).controller.getStyle(i);
                        return {
                            text: e,
                            fillStyle: o.backgroundColor,
                            strokeStyle: o.borderColor,
                            lineWidth: o.borderWidth,
                            hidden: !n.getDataVisibility(i),
                            index: i
                        };
                    }) : [];
                }
            },
            onClick (n, t, e) {
                e.chart.toggleDataVisibility(t.index), e.chart.update();
            }
        },
        tooltip: {
            callbacks: {
                title () {
                    return "";
                },
                label (n) {
                    let t = n.label, e = ": " + n.formattedValue;
                    return E(t) ? (t = t.slice(), t[0] += e) : t += e, t;
                }
            }
        }
    }
};
var Ct = class extends et {
    initialize() {
        this.enableOptionSharing = !0, super.initialize();
    }
    update(t) {
        let e = this, i = e._cachedMeta, { dataset: s , data: o = [] , _dataset: a  } = i, r = e.chart._animationsDisabled, { start: l , count: c  } = Ha(i, o, r);
        e._drawStart = l, e._drawCount = c, Na(i) && (l = 0, c = o.length), s._decimated = !!a._decimated, s.points = o;
        let d = e.resolveDatasetElementOptions(t);
        e.options.showLine || (d.borderWidth = 0), d.segment = e.options.segment, e.updateElement(s, void 0, {
            animated: !r,
            options: d
        }, t), e.updateElements(o, l, c, t);
    }
    updateElements(t, e, i, s) {
        let o = this, a = s === "reset", { xScale: r , yScale: l , _stacked: c  } = o._cachedMeta, d = o.resolveDataElementOptions(e, s), u = o.getSharedOptions(d), f = o.includeOptions(s, u), h = o.options.spanGaps, g = St(h) ? h : Number.POSITIVE_INFINITY, p = o.chart._animationsDisabled || a || s === "none", m = e > 0 && o.getParsed(e - 1);
        for(let b = e; b < e + i; ++b){
            let x = t[b], y = o.getParsed(b), _ = p ? x : {}, v = D(y.y), M = _.x = r.getPixelForValue(y.x, b), w = _.y = a || v ? l.getBasePixel() : l.getPixelForValue(c ? o.applyStack(l, y, c) : y.y, b);
            _.skip = isNaN(M) || isNaN(w) || v, _.stop = b > 0 && y.x - m.x > g, _.parsed = y, f && (_.options = u || o.resolveDataElementOptions(b, s)), p || o.updateElement(x, b, _, s), m = y;
        }
        o.updateSharedOptions(u, s, d);
    }
    getMaxOverflow() {
        let t = this, e = t._cachedMeta, i = e.dataset, s = i.options && i.options.borderWidth || 0, o = e.data || [];
        if (!o.length) return s;
        let a = o[0].size(t.resolveDataElementOptions(0)), r = o[o.length - 1].size(t.resolveDataElementOptions(o.length - 1));
        return Math.max(s, a, r) / 2;
    }
    draw() {
        this._cachedMeta.dataset.updateControlPoints(this.chart.chartArea), super.draw();
    }
};
Ct.id = "line";
Ct.defaults = {
    datasetElementType: "line",
    dataElementType: "point",
    showLine: !0,
    spanGaps: !1
};
Ct.overrides = {
    scales: {
        _index_: {
            type: "category"
        },
        _value_: {
            type: "linear"
        }
    }
};
function Ha(n, t, e) {
    let i = t.length, s = 0, o = i;
    if (n._sorted) {
        let { iScale: a , _parsed: r  } = n, l = a.axis, { min: c , max: d , minDefined: u , maxDefined: f  } = a.getUserBounds();
        u && (s = U(Math.min(xt(r, a.axis, c).lo, e ? i : xt(t, l, a.getPixelForValue(c)).lo), 0, i - 1)), f ? o = U(Math.max(xt(r, a.axis, d).hi + 1, e ? 0 : xt(t, l, a.getPixelForValue(d)).hi + 1), s, i) - s : o = i - s;
    }
    return {
        start: s,
        count: o
    };
}
function Na(n) {
    let { xScale: t , yScale: e , _scaleRanges: i  } = n, s = {
        xmin: t.min,
        xmax: t.max,
        ymin: e.min,
        ymax: e.max
    };
    if (!i) return n._scaleRanges = s, !0;
    let o = i.xmin !== t.min || i.xmax !== t.max || i.ymin !== e.min || i.ymax !== e.max;
    return Object.assign(i, s), o;
}
var Xt = class extends et {
    constructor(t, e){
        super(t, e), this.innerRadius = void 0, this.outerRadius = void 0;
    }
    update(t) {
        let e = this._cachedMeta.data;
        this._updateRadius(), this.updateElements(e, 0, e.length, t);
    }
    _updateRadius() {
        let t = this, e = t.chart, i = e.chartArea, s = e.options, o = Math.min(i.right - i.left, i.bottom - i.top), a = Math.max(o / 2, 0), r = Math.max(s.cutoutPercentage ? a / 100 * s.cutoutPercentage : 1, 0), l = (a - r) / e.getVisibleDatasetCount();
        t.outerRadius = a - l * t.index, t.innerRadius = t.outerRadius - l;
    }
    updateElements(t, e, i, s) {
        let o = this, a = s === "reset", r = o.chart, l = o.getDataset(), d = r.options.animation, u = o._cachedMeta.rScale, f = u.xCenter, h = u.yCenter, g = u.getIndexAngle(0) - .5 * W, p = g, m, b = 360 / o.countVisibleElements();
        for(m = 0; m < e; ++m)p += o._computeAngle(m, s, b);
        for(m = e; m < e + i; m++){
            let x = t[m], y = p, _ = p + o._computeAngle(m, s, b), v = r.getDataVisibility(m) ? u.getDistanceFromCenterForValue(l.data[m]) : 0;
            p = _, a && (d.animateScale && (v = 0), d.animateRotate && (y = _ = g));
            let M = {
                x: f,
                y: h,
                innerRadius: 0,
                outerRadius: v,
                startAngle: y,
                endAngle: _,
                options: o.resolveDataElementOptions(m, s)
            };
            o.updateElement(x, m, M, s);
        }
    }
    countVisibleElements() {
        let t = this.getDataset(), e = this._cachedMeta, i = 0;
        return e.data.forEach((s, o)=>{
            !isNaN(t.data[o]) && this.chart.getDataVisibility(o) && i++;
        }), i;
    }
    _computeAngle(t, e, i) {
        return this.chart.getDataVisibility(t) ? st(this.resolveDataElementOptions(t, e).angle || i) : 0;
    }
};
Xt.id = "polarArea";
Xt.defaults = {
    dataElementType: "arc",
    animation: {
        animateRotate: !0,
        animateScale: !0
    },
    animations: {
        numbers: {
            type: "number",
            properties: [
                "x",
                "y",
                "startAngle",
                "endAngle",
                "innerRadius",
                "outerRadius"
            ]
        }
    },
    indexAxis: "r",
    startAngle: 0
};
Xt.overrides = {
    aspectRatio: 1,
    plugins: {
        legend: {
            labels: {
                generateLabels (n) {
                    let t = n.data;
                    return t.labels.length && t.datasets.length ? t.labels.map((e, i)=>{
                        let o = n.getDatasetMeta(0).controller.getStyle(i);
                        return {
                            text: e,
                            fillStyle: o.backgroundColor,
                            strokeStyle: o.borderColor,
                            lineWidth: o.borderWidth,
                            hidden: !n.getDataVisibility(i),
                            index: i
                        };
                    }) : [];
                }
            },
            onClick (n, t, e) {
                e.chart.toggleDataVisibility(t.index), e.chart.update();
            }
        },
        tooltip: {
            callbacks: {
                title () {
                    return "";
                },
                label (n) {
                    return n.chart.data.labels[n.dataIndex] + ": " + n.formattedValue;
                }
            }
        }
    },
    scales: {
        r: {
            type: "radialLinear",
            angleLines: {
                display: !1
            },
            beginAtZero: !0,
            grid: {
                circular: !0
            },
            pointLabels: {
                display: !1
            },
            startAngle: 0
        }
    }
};
var ye = class extends Dt {
};
ye.id = "pie";
ye.defaults = {
    cutout: 0,
    rotation: 0,
    circumference: 360,
    radius: "100%"
};
var Ut = class extends et {
    getLabelAndValue(t) {
        let e = this, i = e._cachedMeta.vScale, s = e.getParsed(t);
        return {
            label: i.getLabels()[t],
            value: "" + i.getLabelForValue(s[i.axis])
        };
    }
    update(t) {
        let e = this, i = e._cachedMeta, s = i.dataset, o = i.data || [], a = i.iScale.getLabels();
        if (s.points = o, t !== "resize") {
            let r = e.resolveDatasetElementOptions(t);
            e.options.showLine || (r.borderWidth = 0);
            let l = {
                _loop: !0,
                _fullLoop: a.length === o.length,
                options: r
            };
            e.updateElement(s, void 0, l, t);
        }
        e.updateElements(o, 0, o.length, t);
    }
    updateElements(t, e, i, s) {
        let o = this, a = o.getDataset(), r = o._cachedMeta.rScale, l = s === "reset";
        for(let c = e; c < e + i; c++){
            let d = t[c], u = o.resolveDataElementOptions(c, s), f = r.getPointPositionForValue(c, a.data[c]), h = l ? r.xCenter : f.x, g = l ? r.yCenter : f.y, p = {
                x: h,
                y: g,
                angle: f.angle,
                skip: isNaN(h) || isNaN(g),
                options: u
            };
            o.updateElement(d, c, p, s);
        }
    }
};
Ut.id = "radar";
Ut.defaults = {
    datasetElementType: "line",
    dataElementType: "point",
    indexAxis: "r",
    showLine: !0,
    elements: {
        line: {
            fill: "start"
        }
    }
};
Ut.overrides = {
    aspectRatio: 1,
    scales: {
        r: {
            type: "radialLinear"
        }
    }
};
var Kt = class extends Ct {
};
Kt.id = "scatter";
Kt.defaults = {
    showLine: !1,
    fill: !1
};
Kt.overrides = {
    interaction: {
        mode: "point"
    },
    plugins: {
        tooltip: {
            callbacks: {
                title () {
                    return "";
                },
                label (n) {
                    return "(" + n.label + ", " + n.formattedValue + ")";
                }
            }
        }
    },
    scales: {
        x: {
            type: "linear"
        },
        y: {
            type: "linear"
        }
    }
};
var ja = Object.freeze({
    __proto__: null,
    BarController: Yt,
    BubbleController: $t,
    DoughnutController: Dt,
    LineController: Ct,
    PolarAreaController: Xt,
    PieController: ye,
    RadarController: Ut,
    ScatterController: Kt
});
function Pt() {
    throw new Error("This method is not implemented: either no adapter can be found or an incomplete integration was provided.");
}
var ve = class {
    constructor(t){
        this.options = t || {};
    }
    formats() {
        return Pt();
    }
    parse(t, e) {
        return Pt();
    }
    format(t, e) {
        return Pt();
    }
    add(t, e, i) {
        return Pt();
    }
    diff(t, e, i) {
        return Pt();
    }
    startOf(t, e, i) {
        return Pt();
    }
    endOf(t, e) {
        return Pt();
    }
};
ve.override = function(n) {
    Object.assign(ve.prototype, n);
};
var Ya = {
    _date: ve
};
function be(n, t) {
    return "native" in n ? {
        x: n.x,
        y: n.y
    } : zn(n, t);
}
function $a(n, t) {
    let e = n.getSortedVisibleDatasetMetas(), i, s, o;
    for(let a = 0, r = e.length; a < r; ++a){
        ({ index: i , data: s  } = e[a]);
        for(let l = 0, c = s.length; l < c; ++l)o = s[l], o.skip || t(o, i, l);
    }
}
function Xa(n, t, e, i) {
    let { controller: s , data: o , _sorted: a  } = n, r = s._cachedMeta.iScale;
    if (r && t === r.axis && a && o.length) {
        let l = r._reversePixels ? ji : xt;
        if (i) {
            if (s._sharedOptions) {
                let c = o[0], d = typeof c.getRange == "function" && c.getRange(t);
                if (d) {
                    let u = l(o, t, e - d), f = l(o, t, e + d);
                    return {
                        lo: u.lo,
                        hi: f.hi
                    };
                }
            }
        } else return l(o, t, e);
    }
    return {
        lo: 0,
        hi: o.length - 1
    };
}
function Gs(n, t, e, i, s) {
    let o = n.getSortedVisibleDatasetMetas(), a = e[t];
    for(let r = 0, l = o.length; r < l; ++r){
        let { index: c , data: d  } = o[r], { lo: u , hi: f  } = Xa(o[r], t, a, s);
        for(let h = u; h <= f; ++h){
            let g = d[h];
            g.skip || i(g, c, h);
        }
    }
}
function Ua(n) {
    let t = n.indexOf("x") !== -1, e = n.indexOf("y") !== -1;
    return function(i, s) {
        let o = t ? Math.abs(i.x - s.x) : 0, a = e ? Math.abs(i.y - s.y) : 0;
        return Math.sqrt(Math.pow(o, 2) + Math.pow(a, 2));
    };
}
function Xn(n, t, e, i) {
    let s = [];
    return Et(t, n.chartArea, n._minPadding) && Gs(n, e, t, function(a, r, l) {
        a.inRange(t.x, t.y, i) && s.push({
            element: a,
            datasetIndex: r,
            index: l
        });
    }, !0), s;
}
function Un(n, t, e, i, s) {
    let o = Ua(e), a = Number.POSITIVE_INFINITY, r = [];
    return Et(t, n.chartArea, n._minPadding) && Gs(n, e, t, function(c, d, u) {
        if (i && !c.inRange(t.x, t.y, s)) return;
        let f = c.getCenterPoint(s), h = o(t, f);
        h < a ? (r = [
            {
                element: c,
                datasetIndex: d,
                index: u
            }
        ], a = h) : h === a && r.push({
            element: c,
            datasetIndex: d,
            index: u
        });
    }), r;
}
function hs(n, t, e, i) {
    let s = be(t, n), o = [], a = e.axis, r = a === "x" ? "inXRange" : "inYRange", l = !1;
    return $a(n, (c, d, u)=>{
        c[r](s[a], i) && o.push({
            element: c,
            datasetIndex: d,
            index: u
        }), c.inRange(s.x, s.y, i) && (l = !0);
    }), e.intersect && !l ? [] : o;
}
var Ka = {
    modes: {
        index (n, t, e, i) {
            let s = be(t, n), o = e.axis || "x", a = e.intersect ? Xn(n, s, o, i) : Un(n, s, o, !1, i), r = [];
            return a.length ? (n.getSortedVisibleDatasetMetas().forEach((l)=>{
                let c = a[0].index, d = l.data[c];
                d && !d.skip && r.push({
                    element: d,
                    datasetIndex: l.index,
                    index: c
                });
            }), r) : [];
        },
        dataset (n, t, e, i) {
            let s = be(t, n), o = e.axis || "xy", a = e.intersect ? Xn(n, s, o, i) : Un(n, s, o, !1, i);
            if (a.length > 0) {
                let r = a[0].datasetIndex, l = n.getDatasetMeta(r).data;
                a = [];
                for(let c = 0; c < l.length; ++c)a.push({
                    element: l[c],
                    datasetIndex: r,
                    index: c
                });
            }
            return a;
        },
        point (n, t, e, i) {
            let s = be(t, n), o = e.axis || "xy";
            return Xn(n, s, o, i);
        },
        nearest (n, t, e, i) {
            let s = be(t, n), o = e.axis || "xy";
            return Un(n, s, o, e.intersect, i);
        },
        x (n, t, e, i) {
            return e.axis = "x", hs(n, t, e, i);
        },
        y (n, t, e, i) {
            return e.axis = "y", hs(n, t, e, i);
        }
    }
}, qa = [
    "left",
    "top",
    "right",
    "bottom"
];
function he(n, t) {
    return n.filter((e)=>e.pos === t);
}
function gs(n, t) {
    return n.filter((e)=>qa.indexOf(e.pos) === -1 && e.box.axis === t);
}
function ge(n, t) {
    return n.sort((e, i)=>{
        let s = t ? i : e, o = t ? e : i;
        return s.weight === o.weight ? s.index - o.index : s.weight - o.weight;
    });
}
function Ga(n) {
    let t = [], e, i, s;
    for(e = 0, i = (n || []).length; e < i; ++e)s = n[e], t.push({
        index: e,
        box: s,
        pos: s.position,
        horizontal: s.isHorizontal(),
        weight: s.weight
    });
    return t;
}
function Za(n, t) {
    let e, i, s;
    for(e = 0, i = n.length; e < i; ++e)s = n[e], s.horizontal ? (s.width = s.box.fullSize && t.availableWidth, s.height = t.hBoxMaxHeight) : (s.width = t.vBoxMaxWidth, s.height = s.box.fullSize && t.availableHeight);
}
function Qa(n) {
    let t = Ga(n), e = ge(t.filter((c)=>c.box.fullSize), !0), i = ge(he(t, "left"), !0), s = ge(he(t, "right")), o = ge(he(t, "top"), !0), a = ge(he(t, "bottom")), r = gs(t, "x"), l = gs(t, "y");
    return {
        fullSize: e,
        leftAndTop: i.concat(o),
        rightAndBottom: s.concat(l).concat(a).concat(r),
        chartArea: he(t, "chartArea"),
        vertical: i.concat(s).concat(l),
        horizontal: o.concat(a).concat(r)
    };
}
function ps(n, t, e, i) {
    return Math.max(n[e], t[e]) + Math.max(n[i], t[i]);
}
function Zs(n, t) {
    n.top = Math.max(n.top, t.top), n.left = Math.max(n.left, t.left), n.bottom = Math.max(n.bottom, t.bottom), n.right = Math.max(n.right, t.right);
}
function Ja(n, t, e) {
    let i = e.box, s = n.maxPadding;
    A(e.pos) || (e.size && (n[e.pos] -= e.size), e.size = e.horizontal ? i.height : i.width, n[e.pos] += e.size), i.getPadding && Zs(s, i.getPadding());
    let o = Math.max(0, t.outerWidth - ps(s, n, "left", "right")), a = Math.max(0, t.outerHeight - ps(s, n, "top", "bottom")), r = o !== n.w, l = a !== n.h;
    return n.w = o, n.h = a, e.horizontal ? {
        same: r,
        other: l
    } : {
        same: l,
        other: r
    };
}
function tr(n) {
    let t = n.maxPadding;
    function e(i) {
        let s = Math.max(t[i] - n[i], 0);
        return n[i] += s, s;
    }
    n.y += e("top"), n.x += e("left"), e("right"), e("bottom");
}
function er(n, t) {
    let e = t.maxPadding;
    function i(s) {
        let o = {
            left: 0,
            top: 0,
            right: 0,
            bottom: 0
        };
        return s.forEach((a)=>{
            o[a] = Math.max(t[a], e[a]);
        }), o;
    }
    return i(n ? [
        "left",
        "right"
    ] : [
        "top",
        "bottom"
    ]);
}
function xe(n, t, e) {
    let i = [], s, o, a, r, l, c;
    for(s = 0, o = n.length, l = 0; s < o; ++s){
        a = n[s], r = a.box, r.update(a.width || t.w, a.height || t.h, er(a.horizontal, t));
        let { same: d , other: u  } = Ja(t, e, a);
        l |= d && i.length, c = c || u, r.fullSize || i.push(a);
    }
    return l && xe(i, t, e) || c;
}
function ms(n, t, e) {
    let i = e.padding, s = t.x, o = t.y, a, r, l, c;
    for(a = 0, r = n.length; a < r; ++a)l = n[a], c = l.box, l.horizontal ? (c.left = c.fullSize ? i.left : t.left, c.right = c.fullSize ? e.outerWidth - i.right : t.left + t.w, c.top = o, c.bottom = o + c.height, c.width = c.right - c.left, o = c.bottom) : (c.left = s, c.right = s + c.width, c.top = c.fullSize ? i.top : t.top, c.bottom = c.fullSize ? e.outerHeight - i.right : t.top + t.h, c.height = c.bottom - c.top, s = c.right);
    t.x = s, t.y = o;
}
P.set("layout", {
    padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
    }
});
var tt = {
    addBox (n, t) {
        n.boxes || (n.boxes = []), t.fullSize = t.fullSize || !1, t.position = t.position || "top", t.weight = t.weight || 0, t._layers = t._layers || function() {
            return [
                {
                    z: 0,
                    draw (e) {
                        t.draw(e);
                    }
                }
            ];
        }, n.boxes.push(t);
    },
    removeBox (n, t) {
        let e = n.boxes ? n.boxes.indexOf(t) : -1;
        e !== -1 && n.boxes.splice(e, 1);
    },
    configure (n, t, e) {
        t.fullSize = e.fullSize, t.position = e.position, t.weight = e.weight;
    },
    update (n, t, e, i) {
        if (!n) return;
        let s = X(n.options.layout.padding), o = t - s.width, a = e - s.height, r = Qa(n.boxes), l = r.vertical, c = r.horizontal;
        T(n.boxes, (g)=>{
            typeof g.beforeLayout == "function" && g.beforeLayout();
        });
        let d = l.reduce((g, p)=>p.box.options && p.box.options.display === !1 ? g : g + 1, 0) || 1, u = Object.freeze({
            outerWidth: t,
            outerHeight: e,
            padding: s,
            availableWidth: o,
            availableHeight: a,
            vBoxMaxWidth: o / 2 / d,
            hBoxMaxHeight: a / 2
        }), f = Object.assign({}, s);
        Zs(f, X(i));
        let h = Object.assign({
            maxPadding: f,
            w: o,
            h: a,
            x: s.left,
            y: s.top
        }, s);
        Za(l.concat(c), u), xe(r.fullSize, h, u), xe(l, h, u), xe(c, h, u) && xe(l, h, u), tr(h), ms(r.leftAndTop, h, u), h.x += h.w, h.y += h.h, ms(r.rightAndBottom, h, u), n.chartArea = {
            left: h.left,
            top: h.top,
            right: h.left + h.w,
            bottom: h.top + h.h,
            height: h.h,
            width: h.w
        }, T(r.chartArea, (g)=>{
            let p = g.box;
            Object.assign(p, n.chartArea), p.update(h.w, h.h);
        });
    }
}, tn = class {
    acquireContext(t, e) {}
    releaseContext(t) {
        return !1;
    }
    addEventListener(t, e, i) {}
    removeEventListener(t, e, i) {}
    getDevicePixelRatio() {
        return 1;
    }
    getMaximumSize(t, e, i, s) {
        return e = Math.max(0, e || t.width), i = i || t.height, {
            width: e,
            height: Math.max(0, s ? Math.floor(e / s) : i)
        };
    }
    isAttached(t) {
        return !0;
    }
}, Jn = class extends tn {
    acquireContext(t) {
        return t && t.getContext && t.getContext("2d") || null;
    }
}, Qe = "$chartjs", nr = {
    touchstart: "mousedown",
    touchmove: "mousemove",
    touchend: "mouseup",
    pointerenter: "mouseenter",
    pointerdown: "mousedown",
    pointermove: "mousemove",
    pointerup: "mouseup",
    pointerleave: "mouseout",
    pointerout: "mouseout"
}, bs = (n)=>n === null || n === "";
function ir(n, t) {
    let e = n.style, i = n.getAttribute("height"), s = n.getAttribute("width");
    if (n[Qe] = {
        initial: {
            height: i,
            width: s,
            style: {
                display: e.display,
                height: e.height,
                width: e.width
            }
        }
    }, e.display = e.display || "block", e.boxSizing = e.boxSizing || "border-box", bs(s)) {
        let o = Bn(n, "width");
        o !== void 0 && (n.width = o);
    }
    if (bs(i)) if (n.style.height === "") n.height = n.width / (t || 2);
    else {
        let o1 = Bn(n, "height");
        o1 !== void 0 && (n.height = o1);
    }
    return n;
}
var Qs = Ji ? {
    passive: !0
} : !1;
function sr(n, t, e) {
    n.addEventListener(t, e, Qs);
}
function or(n, t, e) {
    n.canvas.removeEventListener(t, e, Qs);
}
function ar(n, t) {
    let e = nr[n.type] || n.type, { x: i , y: s  } = zn(n, t);
    return {
        type: e,
        chart: t,
        native: n,
        x: i !== void 0 ? i : null,
        y: s !== void 0 ? s : null
    };
}
function rr(n, t, e) {
    let i = n.canvas, o = i && _t(i) || i, a = new MutationObserver((r)=>{
        let l = _t(o);
        r.forEach((c)=>{
            for(let d = 0; d < c.addedNodes.length; d++){
                let u = c.addedNodes[d];
                (u === o || u === l) && e(c.target);
            }
        });
    });
    return a.observe(document, {
        childList: !0,
        subtree: !0
    }), a;
}
function lr(n, t, e) {
    let i = n.canvas, s = i && _t(i);
    if (!s) return;
    let o = new MutationObserver((a)=>{
        a.forEach((r)=>{
            for(let l = 0; l < r.removedNodes.length; l++)if (r.removedNodes[l] === i) {
                e();
                break;
            }
        });
    });
    return o.observe(s, {
        childList: !0
    }), o;
}
var Me = new Map, xs = 0;
function Js() {
    let n = window.devicePixelRatio;
    n !== xs && (xs = n, Me.forEach((t, e)=>{
        e.currentDevicePixelRatio !== n && t();
    }));
}
function cr(n, t) {
    Me.size || window.addEventListener("resize", Js), Me.set(n, t);
}
function dr(n) {
    Me.delete(n), Me.size || window.removeEventListener("resize", Js);
}
function ur(n, t, e) {
    let i = n.canvas, s = i && _t(i);
    if (!s) return;
    let o = Mn((r, l)=>{
        let c = s.clientWidth;
        e(r, l), c < s.clientWidth && e();
    }, window), a = new ResizeObserver((r)=>{
        let l = r[0], c = l.contentRect.width, d = l.contentRect.height;
        c === 0 && d === 0 || o(c, d);
    });
    return a.observe(s), cr(n, o), a;
}
function Kn(n, t, e) {
    e && e.disconnect(), t === "resize" && dr(n);
}
function fr(n, t, e) {
    let i = n.canvas, s = Mn((o)=>{
        n.ctx !== null && e(ar(o, n));
    }, n, (o)=>{
        let a = o[0];
        return [
            a,
            a.offsetX,
            a.offsetY
        ];
    });
    return sr(i, t, s), s;
}
var ti = class extends tn {
    acquireContext(t, e) {
        let i = t && t.getContext && t.getContext("2d");
        return i && i.canvas === t ? (ir(t, e), i) : null;
    }
    releaseContext(t) {
        let e = t.canvas;
        if (!e[Qe]) return !1;
        let i = e[Qe].initial;
        [
            "height",
            "width"
        ].forEach((o)=>{
            let a = i[o];
            D(a) ? e.removeAttribute(o) : e.setAttribute(o, a);
        });
        let s = i.style || {};
        return Object.keys(s).forEach((o)=>{
            e.style[o] = s[o];
        }), e.width = e.width, delete e[Qe], !0;
    }
    addEventListener(t, e, i) {
        this.removeEventListener(t, e);
        let s = t.$proxies || (t.$proxies = {}), a = {
            attach: rr,
            detach: lr,
            resize: ur
        }[e] || fr;
        s[e] = a(t, e, i);
    }
    removeEventListener(t, e) {
        let i = t.$proxies || (t.$proxies = {}), s = i[e];
        if (!s) return;
        (({
            attach: Kn,
            detach: Kn,
            resize: Kn
        })[e] || or)(t, e, s), i[e] = void 0;
    }
    getDevicePixelRatio() {
        return window.devicePixelRatio;
    }
    getMaximumSize(t, e, i, s) {
        return Qi(t, e, i, s);
    }
    isAttached(t) {
        let e = _t(t);
        return !!(e && _t(e));
    }
}, Z = class {
    constructor(){
        this.x = void 0, this.y = void 0, this.active = !1, this.options = void 0, this.$animations = void 0;
    }
    tooltipPosition(t) {
        let { x: e , y: i  } = this.getProps([
            "x",
            "y"
        ], t);
        return {
            x: e,
            y: i
        };
    }
    hasValue() {
        return St(this.x) && St(this.y);
    }
    getProps(t, e) {
        let i = this, s = this.$animations;
        if (!e || !s) return i;
        let o = {};
        return t.forEach((a)=>{
            o[a] = s[a] && s[a].active() ? s[a]._to : i[a];
        }), o;
    }
};
Z.defaults = {};
Z.defaultRoutes = void 0;
var to = {
    values (n) {
        return E(n) ? n : "" + n;
    },
    numeric (n, t, e) {
        if (n === 0) return "0";
        let i = this.chart.options.locale, s, o = n;
        if (e.length > 1) {
            let c = Math.max(Math.abs(e[0].value), Math.abs(e[e.length - 1].value));
            (c < 1e-4 || c > 1e15) && (s = "scientific"), o = hr(n, e);
        }
        let a = G(Math.abs(o)), r = Math.max(Math.min(-1 * Math.floor(a), 20), 0), l = {
            notation: s,
            minimumFractionDigits: r,
            maximumFractionDigits: r
        };
        return Object.assign(l, this.options.ticks.format), fe(n, i, l);
    },
    logarithmic (n, t, e) {
        if (n === 0) return "0";
        let i = n / Math.pow(10, Math.floor(G(n)));
        return i === 1 || i === 2 || i === 5 ? to.numeric.call(this, n, t, e) : "";
    }
};
function hr(n, t) {
    let e = t.length > 3 ? t[2].value - t[1].value : t[1].value - t[0].value;
    return Math.abs(e) > 1 && n !== Math.floor(n) && (e = n - Math.floor(n)), e;
}
var rn = {
    formatters: to
};
P.set("scale", {
    display: !0,
    offset: !1,
    reverse: !1,
    beginAtZero: !1,
    bounds: "ticks",
    grace: 0,
    grid: {
        display: !0,
        lineWidth: 1,
        drawBorder: !0,
        drawOnChartArea: !0,
        drawTicks: !0,
        tickLength: 8,
        tickWidth: (n, t)=>t.lineWidth,
        tickColor: (n, t)=>t.color,
        offset: !1,
        borderDash: [],
        borderDashOffset: 0,
        borderWidth: 1
    },
    title: {
        display: !1,
        text: "",
        padding: {
            top: 4,
            bottom: 4
        }
    },
    ticks: {
        minRotation: 0,
        maxRotation: 50,
        mirror: !1,
        textStrokeWidth: 0,
        textStrokeColor: "",
        padding: 3,
        display: !0,
        autoSkip: !0,
        autoSkipPadding: 3,
        labelOffset: 0,
        callback: rn.formatters.values,
        minor: {},
        major: {},
        align: "center",
        crossAlign: "near",
        showLabelBackdrop: !1,
        backdropColor: "rgba(255, 255, 255, 0.75)",
        backdropPadding: 2
    }
});
P.route("scale.ticks", "color", "", "color");
P.route("scale.grid", "color", "", "borderColor");
P.route("scale.grid", "borderColor", "", "borderColor");
P.route("scale.title", "color", "", "color");
P.describe("scale", {
    _fallback: !1,
    _scriptable: (n)=>!n.startsWith("before") && !n.startsWith("after") && n !== "callback" && n !== "parser",
    _indexable: (n)=>n !== "borderDash" && n !== "tickBorderDash"
});
P.describe("scales", {
    _fallback: "scale"
});
function gr(n, t) {
    let e = n.options.ticks, i = e.maxTicksLimit || pr(n), s = e.major.enabled ? br(t) : [], o = s.length, a = s[0], r = s[o - 1], l = [];
    if (o > i) return xr(t, l, s, o / i), l;
    let c = mr(s, t, i);
    if (o > 0) {
        let d, u, f = o > 1 ? Math.round((r - a) / (o - 1)) : null;
        for(Ke(t, l, c, D(f) ? 0 : a - f, a), d = 0, u = o - 1; d < u; d++)Ke(t, l, c, s[d], s[d + 1]);
        return Ke(t, l, c, r, D(f) ? t.length : r + f), l;
    }
    return Ke(t, l, c), l;
}
function pr(n) {
    let t = n.options.offset, e = n._tickSize(), i = n._length / e + (t ? 0 : 1), s = n._maxLength / e;
    return Math.floor(Math.min(i, s));
}
function mr(n, t, e) {
    let i = _r(n), s = t.length / e;
    if (!i) return Math.max(s, 1);
    let o = Oi(i);
    for(let a = 0, r = o.length - 1; a < r; a++){
        let l = o[a];
        if (l > s) return l;
    }
    return Math.max(s, 1);
}
function br(n) {
    let t = [], e, i;
    for(e = 0, i = n.length; e < i; e++)n[e].major && t.push(e);
    return t;
}
function xr(n, t, e, i) {
    let s = 0, o = e[0], a;
    for(i = Math.ceil(i), a = 0; a < n.length; a++)a === o && (t.push(n[a]), s++, o = e[s * i]);
}
function Ke(n, t, e, i, s) {
    let o = S(i, 0), a = Math.min(S(s, n.length), n.length), r = 0, l, c, d;
    for(e = Math.ceil(e), s && (l = s - i, e = l / Math.floor(l / e)), d = o; d < 0;)r++, d = Math.round(o + r * e);
    for(c = Math.max(o, 0); c < a; c++)c === d && (t.push(n[c]), r++, d = Math.round(o + r * e));
}
function _r(n) {
    let t = n.length, e, i;
    if (t < 2) return !1;
    for(i = n[0], e = 1; e < t; ++e)if (n[e] - n[e - 1] !== i) return !1;
    return i;
}
var yr = (n)=>n === "left" ? "right" : n === "right" ? "left" : n, _s = (n, t, e)=>t === "top" || t === "left" ? n[t] + e : n[t] - e;
function ys(n, t) {
    let e = [], i = n.length / t, s = n.length, o = 0;
    for(; o < s; o += i)e.push(n[Math.floor(o)]);
    return e;
}
function vr(n, t, e) {
    let i = n.ticks.length, s = Math.min(t, i - 1), o = n._startPixel, a = n._endPixel, r = 1e-6, l = n.getPixelForTick(s), c;
    if (!(e && (i === 1 ? c = Math.max(l - o, a - l) : t === 0 ? c = (n.getPixelForTick(1) - l) / 2 : c = (l - n.getPixelForTick(s - 1)) / 2, l += s < t ? c : -c, l < o - r || l > a + r))) return l;
}
function Mr(n, t) {
    T(n, (e)=>{
        let i = e.gc, s = i.length / 2, o;
        if (s > t) {
            for(o = 0; o < s; ++o)delete e.data[i[o]];
            i.splice(0, s);
        }
    });
}
function pe(n) {
    return n.drawTicks ? n.tickLength : 0;
}
function vs(n, t) {
    if (!n.display) return 0;
    let e = N(n.font, t), i = X(n.padding);
    return (E(n.text) ? n.text.length : 1) * e.lineHeight + i.height;
}
function wr(n, t) {
    return Object.assign(Object.create(n), {
        scale: t,
        type: "scale"
    });
}
function kr(n, t, e) {
    return Object.assign(Object.create(n), {
        tick: e,
        index: t,
        type: "tick"
    });
}
function Sr(n, t, e) {
    let i = Be(n);
    return (e && t !== "right" || !e && t === "right") && (i = yr(i)), i;
}
function Pr(n, t, e, i) {
    let { top: s , left: o , bottom: a , right: r  } = n, l = 0, c, d, u;
    return n.isHorizontal() ? (d = $(i, o, r), u = _s(n, e, t), c = r - o) : (d = _s(n, e, t), u = $(i, a, s), l = e === "left" ? -B : B), {
        titleX: d,
        titleY: u,
        maxWidth: c,
        rotation: l
    };
}
var ft = class extends Z {
    constructor(t){
        super(), this.id = t.id, this.type = t.type, this.options = void 0, this.ctx = t.ctx, this.chart = t.chart, this.top = void 0, this.bottom = void 0, this.left = void 0, this.right = void 0, this.width = void 0, this.height = void 0, this._margins = {
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        }, this.maxWidth = void 0, this.maxHeight = void 0, this.paddingTop = void 0, this.paddingBottom = void 0, this.paddingLeft = void 0, this.paddingRight = void 0, this.axis = void 0, this.labelRotation = void 0, this.min = void 0, this.max = void 0, this._range = void 0, this.ticks = [], this._gridLineItems = null, this._labelItems = null, this._labelSizes = null, this._length = 0, this._maxLength = 0, this._longestTextCache = {}, this._startPixel = void 0, this._endPixel = void 0, this._reversePixels = !1, this._userMax = void 0, this._userMin = void 0, this._suggestedMax = void 0, this._suggestedMin = void 0, this._ticksLength = 0, this._borderValue = 0, this._cache = {}, this._dataLimitsCached = !1, this.$context = void 0;
    }
    init(t) {
        let e = this;
        e.options = t.setContext(e.getContext()), e.axis = t.axis, e._userMin = e.parse(t.min), e._userMax = e.parse(t.max), e._suggestedMin = e.parse(t.suggestedMin), e._suggestedMax = e.parse(t.suggestedMax);
    }
    parse(t, e) {
        return t;
    }
    getUserBounds() {
        let { _userMin: t , _userMax: e , _suggestedMin: i , _suggestedMax: s  } = this;
        return t = q(t, Number.POSITIVE_INFINITY), e = q(e, Number.NEGATIVE_INFINITY), i = q(i, Number.POSITIVE_INFINITY), s = q(s, Number.NEGATIVE_INFINITY), {
            min: q(t, i),
            max: q(e, s),
            minDefined: V(t),
            maxDefined: V(e)
        };
    }
    getMinMax(t) {
        let e = this, { min: i , max: s , minDefined: o , maxDefined: a  } = e.getUserBounds(), r;
        if (o && a) return {
            min: i,
            max: s
        };
        let l = e.getMatchingVisibleMetas();
        for(let c = 0, d = l.length; c < d; ++c)r = l[c].controller.getMinMax(e, t), o || (i = Math.min(i, r.min)), a || (s = Math.max(s, r.max));
        return {
            min: q(i, q(s, i)),
            max: q(s, q(i, s))
        };
    }
    getPadding() {
        let t = this;
        return {
            left: t.paddingLeft || 0,
            top: t.paddingTop || 0,
            right: t.paddingRight || 0,
            bottom: t.paddingBottom || 0
        };
    }
    getTicks() {
        return this.ticks;
    }
    getLabels() {
        let t = this.chart.data;
        return this.options.labels || (this.isHorizontal() ? t.xLabels : t.yLabels) || t.labels || [];
    }
    beforeLayout() {
        this._cache = {}, this._dataLimitsCached = !1;
    }
    beforeUpdate() {
        R(this.options.beforeUpdate, [
            this
        ]);
    }
    update(t, e, i) {
        let s = this, o = s.options.ticks, a = o.sampleSize;
        s.beforeUpdate(), s.maxWidth = t, s.maxHeight = e, s._margins = i = Object.assign({
            left: 0,
            right: 0,
            top: 0,
            bottom: 0
        }, i), s.ticks = null, s._labelSizes = null, s._gridLineItems = null, s._labelItems = null, s.beforeSetDimensions(), s.setDimensions(), s.afterSetDimensions(), s._maxLength = s.isHorizontal() ? s.width + i.left + i.right : s.height + i.top + i.bottom, s._dataLimitsCached || (s.beforeDataLimits(), s.determineDataLimits(), s.afterDataLimits(), s._range = Ni(s, s.options.grace), s._dataLimitsCached = !0), s.beforeBuildTicks(), s.ticks = s.buildTicks() || [], s.afterBuildTicks();
        let r = a < s.ticks.length;
        s._convertTicksToLabels(r ? ys(s.ticks, a) : s.ticks), s.configure(), s.beforeCalculateLabelRotation(), s.calculateLabelRotation(), s.afterCalculateLabelRotation(), o.display && (o.autoSkip || o.source === "auto") && (s.ticks = gr(s, s.ticks), s._labelSizes = null), r && s._convertTicksToLabels(s.ticks), s.beforeFit(), s.fit(), s.afterFit(), s.afterUpdate();
    }
    configure() {
        let t = this, e = t.options.reverse, i, s;
        t.isHorizontal() ? (i = t.left, s = t.right) : (i = t.top, s = t.bottom, e = !e), t._startPixel = i, t._endPixel = s, t._reversePixels = e, t._length = s - i, t._alignToPixels = t.options.alignToPixels;
    }
    afterUpdate() {
        R(this.options.afterUpdate, [
            this
        ]);
    }
    beforeSetDimensions() {
        R(this.options.beforeSetDimensions, [
            this
        ]);
    }
    setDimensions() {
        let t = this;
        t.isHorizontal() ? (t.width = t.maxWidth, t.left = 0, t.right = t.width) : (t.height = t.maxHeight, t.top = 0, t.bottom = t.height), t.paddingLeft = 0, t.paddingTop = 0, t.paddingRight = 0, t.paddingBottom = 0;
    }
    afterSetDimensions() {
        R(this.options.afterSetDimensions, [
            this
        ]);
    }
    _callHooks(t) {
        let e = this;
        e.chart.notifyPlugins(t, e.getContext()), R(e.options[t], [
            e
        ]);
    }
    beforeDataLimits() {
        this._callHooks("beforeDataLimits");
    }
    determineDataLimits() {}
    afterDataLimits() {
        this._callHooks("afterDataLimits");
    }
    beforeBuildTicks() {
        this._callHooks("beforeBuildTicks");
    }
    buildTicks() {
        return [];
    }
    afterBuildTicks() {
        this._callHooks("afterBuildTicks");
    }
    beforeTickToLabelConversion() {
        R(this.options.beforeTickToLabelConversion, [
            this
        ]);
    }
    generateTickLabels(t) {
        let e = this, i = e.options.ticks, s, o, a;
        for(s = 0, o = t.length; s < o; s++)a = t[s], a.label = R(i.callback, [
            a.value,
            s,
            t
        ], e);
        for(s = 0; s < o; s++)D(t[s].label) && (t.splice(s, 1), o--, s--);
    }
    afterTickToLabelConversion() {
        R(this.options.afterTickToLabelConversion, [
            this
        ]);
    }
    beforeCalculateLabelRotation() {
        R(this.options.beforeCalculateLabelRotation, [
            this
        ]);
    }
    calculateLabelRotation() {
        let t = this, e = t.options, i = e.ticks, s = t.ticks.length, o = i.minRotation || 0, a = i.maxRotation, r = o, l, c, d;
        if (!t._isVisible() || !i.display || o >= a || s <= 1 || !t.isHorizontal()) {
            t.labelRotation = o;
            return;
        }
        let u = t._getLabelSizes(), f = u.widest.width, h = u.highest.height, g = U(t.chart.width - f, 0, t.maxWidth);
        l = e.offset ? t.maxWidth / s : g / (s - 1), f + 6 > l && (l = g / (s - (e.offset ? .5 : 1)), c = t.maxHeight - pe(e.grid) - i.padding - vs(e.title, t.chart.options.font), d = Math.sqrt(f * f + h * h), r = We(Math.min(Math.asin(Math.min((u.highest.height + 6) / l, 1)), Math.asin(Math.min(c / d, 1)) - Math.asin(h / d))), r = Math.max(o, Math.min(a, r))), t.labelRotation = r;
    }
    afterCalculateLabelRotation() {
        R(this.options.afterCalculateLabelRotation, [
            this
        ]);
    }
    beforeFit() {
        R(this.options.beforeFit, [
            this
        ]);
    }
    fit() {
        let t = this, e = {
            width: 0,
            height: 0
        }, { chart: i , options: { ticks: s , title: o , grid: a  }  } = t, r = t._isVisible(), l = t.isHorizontal();
        if (r) {
            let c = vs(o, i.options.font);
            if (l ? (e.width = t.maxWidth, e.height = pe(a) + c) : (e.height = t.maxHeight, e.width = pe(a) + c), s.display && t.ticks.length) {
                let { first: d , last: u , widest: f , highest: h  } = t._getLabelSizes(), g = s.padding * 2, p = st(t.labelRotation), m = Math.cos(p), b = Math.sin(p);
                if (l) {
                    let x = s.mirror ? 0 : b * f.width + m * h.height;
                    e.height = Math.min(t.maxHeight, e.height + x + g);
                } else {
                    let x1 = s.mirror ? 0 : m * f.width + b * h.height;
                    e.width = Math.min(t.maxWidth, e.width + x1 + g);
                }
                t._calculatePadding(d, u, b, m);
            }
        }
        t._handleMargins(), l ? (t.width = t._length = i.width - t._margins.left - t._margins.right, t.height = e.height) : (t.width = e.width, t.height = t._length = i.height - t._margins.top - t._margins.bottom);
    }
    _calculatePadding(t, e, i, s) {
        let o = this, { ticks: { align: a , padding: r  } , position: l  } = o.options, c = o.labelRotation !== 0, d = l !== "top" && o.axis === "x";
        if (o.isHorizontal()) {
            let u = o.getPixelForTick(0) - o.left, f = o.right - o.getPixelForTick(o.ticks.length - 1), h = 0, g = 0;
            c ? d ? (h = s * t.width, g = i * e.height) : (h = i * t.height, g = s * e.width) : a === "start" ? g = e.width : a === "end" ? h = t.width : (h = t.width / 2, g = e.width / 2), o.paddingLeft = Math.max((h - u + r) * o.width / (o.width - u), 0), o.paddingRight = Math.max((g - f + r) * o.width / (o.width - f), 0);
        } else {
            let u1 = e.height / 2, f1 = t.height / 2;
            a === "start" ? (u1 = 0, f1 = t.height) : a === "end" && (u1 = e.height, f1 = 0), o.paddingTop = u1 + r, o.paddingBottom = f1 + r;
        }
    }
    _handleMargins() {
        let t = this;
        t._margins && (t._margins.left = Math.max(t.paddingLeft, t._margins.left), t._margins.top = Math.max(t.paddingTop, t._margins.top), t._margins.right = Math.max(t.paddingRight, t._margins.right), t._margins.bottom = Math.max(t.paddingBottom, t._margins.bottom));
    }
    afterFit() {
        R(this.options.afterFit, [
            this
        ]);
    }
    isHorizontal() {
        let { axis: t , position: e  } = this.options;
        return e === "top" || e === "bottom" || t === "x";
    }
    isFullSize() {
        return this.options.fullSize;
    }
    _convertTicksToLabels(t) {
        let e = this;
        e.beforeTickToLabelConversion(), e.generateTickLabels(t), e.afterTickToLabelConversion();
    }
    _getLabelSizes() {
        let t = this, e = t._labelSizes;
        if (!e) {
            let i = t.options.ticks.sampleSize, s = t.ticks;
            i < s.length && (s = ys(s, i)), t._labelSizes = e = t._computeLabelSizes(s, s.length);
        }
        return e;
    }
    _computeLabelSizes(t, e) {
        let { ctx: i , _longestTextCache: s  } = this, o = [], a = [], r = 0, l = 0, c, d, u, f, h, g, p, m, b, x, y;
        for(c = 0; c < e; ++c){
            if (f = t[c].label, h = this._resolveTickFontOptions(c), i.font = g = h.string, p = s[g] = s[g] || {
                data: {},
                gc: []
            }, m = h.lineHeight, b = x = 0, !D(f) && !E(f)) b = se(i, p.data, p.gc, b, f), x = m;
            else if (E(f)) for(d = 0, u = f.length; d < u; ++d)y = f[d], !D(y) && !E(y) && (b = se(i, p.data, p.gc, b, y), x += m);
            o.push(b), a.push(x), r = Math.max(b, r), l = Math.max(x, l);
        }
        Mr(s, e);
        let _ = o.indexOf(r), v = a.indexOf(l), M = (w)=>({
                width: o[w] || 0,
                height: a[w] || 0
            });
        return {
            first: M(0),
            last: M(e - 1),
            widest: M(_),
            highest: M(v),
            widths: o,
            heights: a
        };
    }
    getLabelForValue(t) {
        return t;
    }
    getPixelForValue(t, e) {
        return NaN;
    }
    getValueForPixel(t) {}
    getPixelForTick(t) {
        let e = this.ticks;
        return t < 0 || t > e.length - 1 ? null : this.getPixelForValue(e[t].value);
    }
    getPixelForDecimal(t) {
        let e = this;
        e._reversePixels && (t = 1 - t);
        let i = e._startPixel + t * e._length;
        return Ri(e._alignToPixels ? mt(e.chart, i, 0) : i);
    }
    getDecimalForPixel(t) {
        let e = (t - this._startPixel) / this._length;
        return this._reversePixels ? 1 - e : e;
    }
    getBasePixel() {
        return this.getPixelForValue(this.getBaseValue());
    }
    getBaseValue() {
        let { min: t , max: e  } = this;
        return t < 0 && e < 0 ? e : t > 0 && e > 0 ? t : 0;
    }
    getContext(t) {
        let e = this, i = e.ticks || [];
        if (t >= 0 && t < i.length) {
            let s = i[t];
            return s.$context || (s.$context = kr(e.getContext(), t, s));
        }
        return e.$context || (e.$context = wr(e.chart.getContext(), e));
    }
    _tickSize() {
        let t = this, e = t.options.ticks, i = st(t.labelRotation), s = Math.abs(Math.cos(i)), o = Math.abs(Math.sin(i)), a = t._getLabelSizes(), r = e.autoSkipPadding || 0, l = a ? a.widest.width + r : 0, c = a ? a.highest.height + r : 0;
        return t.isHorizontal() ? c * s > l * o ? l / s : c / o : c * o < l * s ? c / s : l / o;
    }
    _isVisible() {
        let t = this.options.display;
        return t !== "auto" ? !!t : this.getMatchingVisibleMetas().length > 0;
    }
    _computeGridLineItems(t) {
        let e = this, i = e.axis, s = e.chart, o = e.options, { grid: a , position: r  } = o, l = a.offset, c = e.isHorizontal(), u = e.ticks.length + (l ? 1 : 0), f = pe(a), h = [], g = a.setContext(e.getContext()), p = g.drawBorder ? g.borderWidth : 0, m = p / 2, b = function(C) {
            return mt(s, C, p);
        }, x, y, _, v, M, w, k, z, F, I, j, O;
        if (r === "top") x = b(e.bottom), w = e.bottom - f, z = x - m, I = b(t.top) + m, O = t.bottom;
        else if (r === "bottom") x = b(e.top), I = t.top, O = b(t.bottom) - m, w = x + m, z = e.top + f;
        else if (r === "left") x = b(e.right), M = e.right - f, k = x - m, F = b(t.left) + m, j = t.right;
        else if (r === "right") x = b(e.left), F = t.left, j = b(t.right) - m, M = x + m, k = e.left + f;
        else if (i === "x") {
            if (r === "center") x = b((t.top + t.bottom) / 2 + .5);
            else if (A(r)) {
                let C = Object.keys(r)[0], Y = r[C];
                x = b(e.chart.scales[C].getPixelForValue(Y));
            }
            I = t.top, O = t.bottom, w = x + m, z = w + f;
        } else if (i === "y") {
            if (r === "center") x = b((t.left + t.right) / 2);
            else if (A(r)) {
                let C1 = Object.keys(r)[0], Y1 = r[C1];
                x = b(e.chart.scales[C1].getPixelForValue(Y1));
            }
            M = x - m, k = M - f, F = t.left, j = t.right;
        }
        for(y = 0; y < u; ++y){
            let C2 = a.setContext(e.getContext(y)), Y2 = C2.lineWidth, H = C2.color, ht = a.borderDash || [], cn = C2.borderDashOffset, dn = C2.tickWidth, un = C2.tickColor, De = C2.tickBorderDash || [], Tt = C2.tickBorderDashOffset;
            _ = vr(e, y, l), _ !== void 0 && (v = mt(s, _, Y2), c ? M = k = F = j = v : w = z = I = O = v, h.push({
                tx1: M,
                ty1: w,
                tx2: k,
                ty2: z,
                x1: F,
                y1: I,
                x2: j,
                y2: O,
                width: Y2,
                color: H,
                borderDash: ht,
                borderDashOffset: cn,
                tickWidth: dn,
                tickColor: un,
                tickBorderDash: De,
                tickBorderDashOffset: Tt
            }));
        }
        return e._ticksLength = u, e._borderValue = x, h;
    }
    _computeLabelItems(t) {
        let e = this, i = e.axis, s = e.options, { position: o , ticks: a  } = s, r = e.isHorizontal(), l = e.ticks, { align: c , crossAlign: d , padding: u , mirror: f  } = a, h = pe(s.grid), g = h + u, p = f ? -u : g, m = -st(e.labelRotation), b = [], x, y, _, v, M, w, k, z, F, I, j, O, C = "middle";
        if (o === "top") w = e.bottom - p, k = e._getXAxisLabelAlignment();
        else if (o === "bottom") w = e.top + p, k = e._getXAxisLabelAlignment();
        else if (o === "left") {
            let H = e._getYAxisLabelAlignment(h);
            k = H.textAlign, M = H.x;
        } else if (o === "right") {
            let H1 = e._getYAxisLabelAlignment(h);
            k = H1.textAlign, M = H1.x;
        } else if (i === "x") {
            if (o === "center") w = (t.top + t.bottom) / 2 + g;
            else if (A(o)) {
                let H2 = Object.keys(o)[0], ht = o[H2];
                w = e.chart.scales[H2].getPixelForValue(ht) + g;
            }
            k = e._getXAxisLabelAlignment();
        } else if (i === "y") {
            if (o === "center") M = (t.left + t.right) / 2 - g;
            else if (A(o)) {
                let H3 = Object.keys(o)[0], ht1 = o[H3];
                M = e.chart.scales[H3].getPixelForValue(ht1);
            }
            k = e._getYAxisLabelAlignment(h).textAlign;
        }
        i === "y" && (c === "start" ? C = "top" : c === "end" && (C = "bottom"));
        let Y = e._getLabelSizes();
        for(x = 0, y = l.length; x < y; ++x){
            _ = l[x], v = _.label;
            let H4 = a.setContext(e.getContext(x));
            z = e.getPixelForTick(x) + a.labelOffset, F = e._resolveTickFontOptions(x), I = F.lineHeight, j = E(v) ? v.length : 1;
            let ht2 = j / 2, cn = H4.color, dn = H4.textStrokeColor, un = H4.textStrokeWidth;
            r ? (M = z, o === "top" ? d === "near" || m !== 0 ? O = -j * I + I / 2 : d === "center" ? O = -Y.highest.height / 2 - ht2 * I + I : O = -Y.highest.height + I / 2 : d === "near" || m !== 0 ? O = I / 2 : d === "center" ? O = Y.highest.height / 2 - ht2 * I : O = Y.highest.height - j * I, f && (O *= -1)) : (w = z, O = (1 - j) * I / 2);
            let De;
            if (H4.showLabelBackdrop) {
                let Tt = X(H4.backdropPadding), fn = Y.heights[x], hn = Y.widths[x], gn = w + O - Tt.top, pn = M - Tt.left;
                switch(C){
                    case "middle":
                        gn -= fn / 2;
                        break;
                    case "bottom":
                        gn -= fn;
                        break;
                }
                switch(k){
                    case "center":
                        pn -= hn / 2;
                        break;
                    case "right":
                        pn -= hn;
                        break;
                }
                De = {
                    left: pn,
                    top: gn,
                    width: hn + Tt.width,
                    height: fn + Tt.height,
                    color: H4.backdropColor
                };
            }
            b.push({
                rotation: m,
                label: v,
                font: F,
                color: cn,
                strokeColor: dn,
                strokeWidth: un,
                textOffset: O,
                textAlign: k,
                textBaseline: C,
                translation: [
                    M,
                    w
                ],
                backdrop: De
            });
        }
        return b;
    }
    _getXAxisLabelAlignment() {
        let t = this, { position: e , ticks: i  } = t.options;
        if (-st(t.labelRotation)) return e === "top" ? "left" : "right";
        let o = "center";
        return i.align === "start" ? o = "left" : i.align === "end" && (o = "right"), o;
    }
    _getYAxisLabelAlignment(t) {
        let e = this, { position: i , ticks: { crossAlign: s , mirror: o , padding: a  }  } = e.options, r = e._getLabelSizes(), l = t + a, c = r.widest.width, d, u;
        return i === "left" ? o ? (d = "left", u = e.right + a) : (u = e.right - l, s === "near" ? d = "right" : s === "center" ? (d = "center", u -= c / 2) : (d = "left", u = e.left)) : i === "right" ? o ? (d = "right", u = e.left + a) : (u = e.left + l, s === "near" ? d = "left" : s === "center" ? (d = "center", u += c / 2) : (d = "right", u = e.right)) : d = "right", {
            textAlign: d,
            x: u
        };
    }
    _computeLabelArea() {
        let t = this;
        if (t.options.ticks.mirror) return;
        let e = t.chart, i = t.options.position;
        if (i === "left" || i === "right") return {
            top: 0,
            left: t.left,
            bottom: e.height,
            right: t.right
        };
        if (i === "top" || i === "bottom") return {
            top: t.top,
            left: 0,
            bottom: t.bottom,
            right: e.width
        };
    }
    drawBackground() {
        let { ctx: t , options: { backgroundColor: e  } , left: i , top: s , width: o , height: a  } = this;
        e && (t.save(), t.fillStyle = e, t.fillRect(i, s, o, a), t.restore());
    }
    getLineWidthForValue(t) {
        let e = this, i = e.options.grid;
        if (!e._isVisible() || !i.display) return 0;
        let o = e.ticks.findIndex((a)=>a.value === t);
        return o >= 0 ? i.setContext(e.getContext(o)).lineWidth : 0;
    }
    drawGrid(t) {
        let e = this, i = e.options.grid, s = e.ctx, o = e._gridLineItems || (e._gridLineItems = e._computeGridLineItems(t)), a, r, l = (c, d, u)=>{
            !u.width || !u.color || (s.save(), s.lineWidth = u.width, s.strokeStyle = u.color, s.setLineDash(u.borderDash || []), s.lineDashOffset = u.borderDashOffset, s.beginPath(), s.moveTo(c.x, c.y), s.lineTo(d.x, d.y), s.stroke(), s.restore());
        };
        if (i.display) for(a = 0, r = o.length; a < r; ++a){
            let c = o[a];
            i.drawOnChartArea && l({
                x: c.x1,
                y: c.y1
            }, {
                x: c.x2,
                y: c.y2
            }, c), i.drawTicks && l({
                x: c.tx1,
                y: c.ty1
            }, {
                x: c.tx2,
                y: c.ty2
            }, {
                color: c.tickColor,
                width: c.tickWidth,
                borderDash: c.tickBorderDash,
                borderDashOffset: c.tickBorderDashOffset
            });
        }
    }
    drawBorder() {
        let t = this, { chart: e , ctx: i , options: { grid: s  }  } = t, o = s.setContext(t.getContext()), a = s.drawBorder ? o.borderWidth : 0;
        if (!a) return;
        let r = s.setContext(t.getContext(0)).lineWidth, l = t._borderValue, c, d, u, f;
        t.isHorizontal() ? (c = mt(e, t.left, a) - a / 2, d = mt(e, t.right, r) + r / 2, u = f = l) : (u = mt(e, t.top, a) - a / 2, f = mt(e, t.bottom, r) + r / 2, c = d = l), i.save(), i.lineWidth = o.borderWidth, i.strokeStyle = o.borderColor, i.beginPath(), i.moveTo(c, u), i.lineTo(d, f), i.stroke(), i.restore();
    }
    drawLabels(t) {
        let e = this;
        if (!e.options.ticks.display) return;
        let s = e.ctx, o = e._computeLabelArea();
        o && Bt(s, o);
        let a = e._labelItems || (e._labelItems = e._computeLabelItems(t)), r, l;
        for(r = 0, l = a.length; r < l; ++r){
            let c = a[r], d = c.font, u = c.label;
            c.backdrop && (s.fillStyle = c.backdrop.color, s.fillRect(c.backdrop.left, c.backdrop.top, c.backdrop.width, c.backdrop.height));
            let f = c.textOffset;
            bt(s, u, 0, f, d, c);
        }
        o && Vt(s);
    }
    drawTitle() {
        let { ctx: t , options: { position: e , title: i , reverse: s  }  } = this;
        if (!i.display) return;
        let o = N(i.font), a = X(i.padding), r = i.align, l = o.lineHeight / 2;
        e === "bottom" ? (l += a.bottom, E(i.text) && (l += o.lineHeight * (i.text.length - 1))) : l += a.top;
        let { titleX: c , titleY: d , maxWidth: u , rotation: f  } = Pr(this, l, e, r);
        bt(t, i.text, 0, 0, o, {
            color: i.color,
            maxWidth: u,
            rotation: f,
            textAlign: Sr(r, e, s),
            textBaseline: "middle",
            translation: [
                c,
                d
            ]
        });
    }
    draw(t) {
        let e = this;
        e._isVisible() && (e.drawBackground(), e.drawGrid(t), e.drawBorder(), e.drawTitle(), e.drawLabels(t));
    }
    _layers() {
        let t = this, e = t.options, i = e.ticks && e.ticks.z || 0, s = e.grid && e.grid.z || 0;
        return !t._isVisible() || t.draw !== ft.prototype.draw ? [
            {
                z: i,
                draw (o) {
                    t.draw(o);
                }
            }
        ] : [
            {
                z: s,
                draw (o) {
                    t.drawBackground(), t.drawGrid(o), t.drawTitle();
                }
            },
            {
                z: s + 1,
                draw () {
                    t.drawBorder();
                }
            },
            {
                z: i,
                draw (o) {
                    t.drawLabels(o);
                }
            }
        ];
    }
    getMatchingVisibleMetas(t) {
        let e = this, i = e.chart.getSortedVisibleDatasetMetas(), s = e.axis + "AxisID", o = [], a, r;
        for(a = 0, r = i.length; a < r; ++a){
            let l = i[a];
            l[s] === e.id && (!t || l.type === t) && o.push(l);
        }
        return o;
    }
    _resolveTickFontOptions(t) {
        let e = this.options.ticks.setContext(this.getContext(t));
        return N(e.font);
    }
}, jt = class {
    constructor(t, e, i){
        this.type = t, this.scope = e, this.override = i, this.items = Object.create(null);
    }
    isForType(t) {
        return Object.prototype.isPrototypeOf.call(this.type.prototype, t.prototype);
    }
    register(t) {
        let e = this, i = Object.getPrototypeOf(t), s;
        Or(i) && (s = e.register(i));
        let o = e.items, a = t.id, r = e.scope + "." + a;
        if (!a) throw new Error("class does not have id: " + t);
        return a in o || (o[a] = t, Dr(t, r, s), e.override && P.override(t.id, t.overrides)), r;
    }
    get(t) {
        return this.items[t];
    }
    unregister(t) {
        let e = this.items, i = t.id, s = this.scope;
        i in e && delete e[i], s && i in P[s] && (delete P[s][i], this.override && delete pt[i]);
    }
};
function Dr(n, t, e) {
    let i = Rt(Object.create(null), [
        e ? P.get(e) : {},
        P.get(t),
        n.defaults
    ]);
    P.set(t, i), n.defaultRoutes && Cr(t, n.defaultRoutes), n.descriptors && P.describe(t, n.descriptors);
}
function Cr(n, t) {
    Object.keys(t).forEach((e)=>{
        let i = e.split("."), s = i.pop(), o = [
            n
        ].concat(i).join("."), a = t[e].split("."), r = a.pop(), l = a.join(".");
        P.route(o, s, l, r);
    });
}
function Or(n) {
    return "id" in n && "defaults" in n;
}
var ei = class {
    constructor(){
        this.controllers = new jt(et, "datasets", !0), this.elements = new jt(Z, "elements"), this.plugins = new jt(Object, "plugins"), this.scales = new jt(ft, "scales"), this._typedRegistries = [
            this.controllers,
            this.scales,
            this.elements
        ];
    }
    add(...t) {
        this._each("register", t);
    }
    remove(...t) {
        this._each("unregister", t);
    }
    addControllers(...t) {
        this._each("register", t, this.controllers);
    }
    addElements(...t) {
        this._each("register", t, this.elements);
    }
    addPlugins(...t) {
        this._each("register", t, this.plugins);
    }
    addScales(...t) {
        this._each("register", t, this.scales);
    }
    getController(t) {
        return this._get(t, this.controllers, "controller");
    }
    getElement(t) {
        return this._get(t, this.elements, "element");
    }
    getPlugin(t) {
        return this._get(t, this.plugins, "plugin");
    }
    getScale(t) {
        return this._get(t, this.scales, "scale");
    }
    removeControllers(...t) {
        this._each("unregister", t, this.controllers);
    }
    removeElements(...t) {
        this._each("unregister", t, this.elements);
    }
    removePlugins(...t) {
        this._each("unregister", t, this.plugins);
    }
    removeScales(...t) {
        this._each("unregister", t, this.scales);
    }
    _each(t, e, i) {
        let s = this;
        [
            ...e
        ].forEach((o)=>{
            let a = i || s._getRegistryForType(o);
            i || a.isForType(o) || a === s.plugins && o.id ? s._exec(t, a, o) : T(o, (r)=>{
                let l = i || s._getRegistryForType(r);
                s._exec(t, l, r);
            });
        });
    }
    _exec(t, e, i) {
        let s = Ve(t);
        R(i["before" + s], [], i), e[t](i), R(i["after" + s], [], i);
    }
    _getRegistryForType(t) {
        for(let e = 0; e < this._typedRegistries.length; e++){
            let i = this._typedRegistries[e];
            if (i.isForType(t)) return i;
        }
        return this.plugins;
    }
    _get(t, e, i) {
        let s = e.get(t);
        if (s === void 0) throw new Error('"' + t + '" is not a registered ' + i + ".");
        return s;
    }
}, ut = new ei, ni = class {
    constructor(){
        this._init = [];
    }
    notify(t, e, i, s) {
        let o = this;
        e === "beforeInit" && (o._init = o._createDescriptors(t, !0), o._notify(o._init, t, "install"));
        let a = s ? o._descriptors(t).filter(s) : o._descriptors(t), r = o._notify(a, t, e, i);
        return e === "destroy" && (o._notify(a, t, "stop"), o._notify(o._init, t, "uninstall")), r;
    }
    _notify(t, e, i, s) {
        s = s || {};
        for (let o of t){
            let a = o.plugin, r = a[i], l = [
                e,
                s,
                o.options
            ];
            if (R(r, l, a) === !1 && s.cancelable) return !1;
        }
        return !0;
    }
    invalidate() {
        D(this._cache) || (this._oldCache = this._cache, this._cache = void 0);
    }
    _descriptors(t) {
        if (this._cache) return this._cache;
        let e = this._cache = this._createDescriptors(t);
        return this._notifyStateChanges(t), e;
    }
    _createDescriptors(t, e) {
        let i = t && t.config, s = S(i.options && i.options.plugins, {}), o = Ar(i);
        return s === !1 && !e ? [] : Lr(t, o, s, e);
    }
    _notifyStateChanges(t) {
        let e = this._oldCache || [], i = this._cache, s = (o, a)=>o.filter((r)=>!a.some((l)=>r.plugin.id === l.plugin.id));
        this._notify(s(e, i), t, "stop"), this._notify(s(i, e), t, "start");
    }
};
function Ar(n) {
    let t = [], e = Object.keys(ut.plugins.items);
    for(let s = 0; s < e.length; s++)t.push(ut.getPlugin(e[s]));
    let i = n.plugins || [];
    for(let s1 = 0; s1 < i.length; s1++){
        let o = i[s1];
        t.indexOf(o) === -1 && t.push(o);
    }
    return t;
}
function Tr(n, t) {
    return !t && n === !1 ? null : n === !0 ? {} : n;
}
function Lr(n, t, e, i) {
    let s = [], o = n.getContext();
    for(let a = 0; a < t.length; a++){
        let r = t[a], l = r.id, c = Tr(e[l], i);
        c !== null && s.push({
            plugin: r,
            options: Rr(n.config, r, c, o)
        });
    }
    return s;
}
function Rr(n, t, e, i) {
    let s = n.pluginScopeKeys(t), o = n.getOptionScopes(e, s);
    return n.createResolver(o, i, [
        ""
    ], {
        scriptable: !1,
        indexable: !1,
        allKeys: !0
    });
}
function ii(n, t) {
    let e = P.datasets[n] || {};
    return ((t.datasets || {})[n] || {}).indexAxis || t.indexAxis || e.indexAxis || "x";
}
function Fr(n, t) {
    let e = n;
    return n === "_index_" ? e = t : n === "_value_" && (e = t === "x" ? "y" : "x"), e;
}
function Er(n, t) {
    return n === t ? "_index_" : "_value_";
}
function zr(n) {
    if (n === "top" || n === "bottom") return "x";
    if (n === "left" || n === "right") return "y";
}
function si(n, t) {
    return n === "x" || n === "y" ? n : t.axis || zr(t.position) || n.charAt(0).toLowerCase();
}
function Ir(n, t) {
    let e = pt[n.type] || {
        scales: {}
    }, i = t.scales || {}, s = ii(n.type, t), o = Object.create(null), a = Object.create(null);
    return Object.keys(i).forEach((r)=>{
        let l = i[r], c = si(r, l), d = Er(c, s), u = e.scales || {};
        o[c] = o[c] || r, a[r] = It(Object.create(null), [
            {
                axis: c
            },
            l,
            u[c],
            u[d]
        ]);
    }), n.data.datasets.forEach((r)=>{
        let l = r.type || n.type, c = r.indexAxis || ii(l, t), u = (pt[l] || {}).scales || {};
        Object.keys(u).forEach((f)=>{
            let h = Fr(f, c), g = r[h + "AxisID"] || o[h] || h;
            a[g] = a[g] || Object.create(null), It(a[g], [
                {
                    axis: h
                },
                i[g],
                u[f]
            ]);
        });
    }), Object.keys(a).forEach((r)=>{
        let l = a[r];
        It(l, [
            P.scales[l.type],
            P.scale
        ]);
    }), a;
}
function eo(n) {
    let t = n.options || (n.options = {});
    t.plugins = S(t.plugins, {}), t.scales = Ir(n, t);
}
function no(n) {
    return n = n || {}, n.datasets = n.datasets || [], n.labels = n.labels || [], n;
}
function Br(n) {
    return n = n || {}, n.data = no(n.data), eo(n), n;
}
var Ms = new Map, io = new Set;
function qe(n, t) {
    let e = Ms.get(n);
    return e || (e = t(), Ms.set(n, e), io.add(e)), e;
}
var me = (n, t, e)=>{
    let i = lt(t, e);
    i !== void 0 && n.add(i);
}, oi = class {
    constructor(t){
        this._config = Br(t), this._scopeCache = new Map, this._resolverCache = new Map;
    }
    get type() {
        return this._config.type;
    }
    set type(t) {
        this._config.type = t;
    }
    get data() {
        return this._config.data;
    }
    set data(t) {
        this._config.data = no(t);
    }
    get options() {
        return this._config.options;
    }
    set options(t) {
        this._config.options = t;
    }
    get plugins() {
        return this._config.plugins;
    }
    update() {
        let t = this._config;
        this.clearCache(), eo(t);
    }
    clearCache() {
        this._scopeCache.clear(), this._resolverCache.clear();
    }
    datasetScopeKeys(t) {
        return qe(t, ()=>[
                [
                    `datasets.${t}`,
                    ""
                ]
            ]);
    }
    datasetAnimationScopeKeys(t, e) {
        return qe(`${t}.transition.${e}`, ()=>[
                [
                    `datasets.${t}.transitions.${e}`,
                    `transitions.${e}`
                ],
                [
                    `datasets.${t}`,
                    ""
                ]
            ]);
    }
    datasetElementScopeKeys(t, e) {
        return qe(`${t}-${e}`, ()=>[
                [
                    `datasets.${t}.elements.${e}`,
                    `datasets.${t}`,
                    `elements.${e}`,
                    ""
                ]
            ]);
    }
    pluginScopeKeys(t) {
        let e = t.id, i = this.type;
        return qe(`${i}-plugin-${e}`, ()=>[
                [
                    `plugins.${e}`,
                    ...t.additionalOptionScopes || []
                ]
            ]);
    }
    _cachedScopes(t, e) {
        let i = this._scopeCache, s = i.get(t);
        return (!s || e) && (s = new Map, i.set(t, s)), s;
    }
    getOptionScopes(t, e, i) {
        let { options: s , type: o  } = this, a = this._cachedScopes(t, i), r = a.get(e);
        if (r) return r;
        let l = new Set;
        e.forEach((d)=>{
            t && (l.add(t), d.forEach((u)=>me(l, t, u))), d.forEach((u)=>me(l, s, u)), d.forEach((u)=>me(l, pt[o] || {}, u)), d.forEach((u)=>me(l, P, u)), d.forEach((u)=>me(l, Ne, u));
        });
        let c = [
            ...l
        ];
        return io.has(e) && a.set(e, c), c;
    }
    chartOptionScopes() {
        let { options: t , type: e  } = this;
        return [
            t,
            pt[e] || {},
            P.datasets[e] || {},
            {
                type: e
            },
            P,
            Ne
        ];
    }
    resolveNamedOptions(t, e, i, s = [
        ""
    ]) {
        let o = {
            $shared: !0
        }, { resolver: a , subPrefixes: r  } = ws(this._resolverCache, t, s), l = a;
        if (Vr(a, e)) {
            o.$shared = !1, i = wt(i) ? i() : i;
            let c = this.createResolver(t, i, r);
            l = kt(a, i, c);
        }
        for (let c1 of e)o[c1] = l[c1];
        return o;
    }
    createResolver(t, e, i = [
        ""
    ], s) {
        let { resolver: o  } = ws(this._resolverCache, t, i);
        return A(e) ? kt(o, e, void 0, s) : o;
    }
};
function ws(n, t, e) {
    let i = n.get(t);
    i || (i = new Map, n.set(t, i));
    let s = e.join(), o = i.get(s);
    return o || (o = {
        resolver: $e(t, e),
        subPrefixes: e.filter((r)=>!r.toLowerCase().includes("hover"))
    }, i.set(s, o)), o;
}
function Vr(n, t) {
    let { isScriptable: e , isIndexable: i  } = Fn(n);
    for (let s of t)if (e(s) && wt(n[s]) || i(s) && E(n[s])) return !0;
    return !1;
}
var Wr = "3.2.0", Hr = [
    "top",
    "bottom",
    "left",
    "right",
    "chartArea"
];
function ks(n, t) {
    return n === "top" || n === "bottom" || Hr.indexOf(n) === -1 && t === "x";
}
function Ss(n, t) {
    return function(e, i) {
        return e[n] === i[n] ? e[t] - i[t] : e[n] - i[n];
    };
}
function Ps(n) {
    let t = n.chart, e = t.options.animation;
    t.notifyPlugins("afterRender"), R(e && e.onComplete, [
        n
    ], t);
}
function Nr(n) {
    let t = n.chart, e = t.options.animation;
    R(e && e.onProgress, [
        n
    ], t);
}
function so() {
    return typeof document < "u" && typeof document < "u";
}
function oo(n) {
    return so() && typeof n == "string" ? n = document.getElementById(n) : n && n.length && (n = n[0]), n && n.canvas && (n = n.canvas), n;
}
var en = {}, ao = (n)=>{
    let t = oo(n);
    return Object.values(en).filter((e)=>e.canvas === t).pop();
}, nn = class {
    constructor(t, e){
        let i = this;
        this.config = e = new oi(e);
        let s = oo(t), o = ao(s);
        if (o) throw new Error("Canvas is already in use. Chart with ID '" + o.id + "' must be destroyed before the canvas can be reused.");
        let a = e.createResolver(e.chartOptionScopes(), i.getContext());
        this.platform = i._initializePlatform(s, e);
        let r = i.platform.acquireContext(s, a.aspectRatio), l = r && r.canvas, c = l && l.height, d = l && l.width;
        if (this.id = Si(), this.ctx = r, this.canvas = l, this.width = d, this.height = c, this._options = a, this._aspectRatio = this.aspectRatio, this._layers = [], this._metasets = [], this._stacks = void 0, this.boxes = [], this.currentDevicePixelRatio = void 0, this.chartArea = void 0, this._active = [], this._lastEvent = void 0, this._listeners = {}, this._sortedMetasets = [], this.scales = {}, this.scale = void 0, this._plugins = new ni, this.$proxies = {}, this._hiddenIndices = {}, this.attached = !1, this._animationsDisabled = void 0, this.$context = void 0, this._doResize = wi(()=>this.update("resize"), a.resizeDelay || 0), en[i.id] = i, !r || !l) {
            console.error("Failed to create chart: can't acquire context from the given item");
            return;
        }
        ct.listen(i, "complete", Ps), ct.listen(i, "progress", Nr), i._initialize(), i.attached && i.update();
    }
    get aspectRatio() {
        let { options: { aspectRatio: t , maintainAspectRatio: e  } , width: i , height: s , _aspectRatio: o  } = this;
        return D(t) ? e && o ? o : s ? i / s : null : t;
    }
    get data() {
        return this.config.data;
    }
    set data(t) {
        this.config.data = t;
    }
    get options() {
        return this._options;
    }
    set options(t) {
        this.config.options = t;
    }
    _initialize() {
        let t = this;
        return t.notifyPlugins("beforeInit"), t.options.responsive ? t.resize() : In(t, t.options.devicePixelRatio), t.bindEvents(), t.notifyPlugins("afterInit"), t;
    }
    _initializePlatform(t, e) {
        return e.platform ? new e.platform : !so() || typeof OffscreenCanvas < "u" && t instanceof OffscreenCanvas ? new Jn : new ti;
    }
    clear() {
        return An(this.canvas, this.ctx), this;
    }
    stop() {
        return ct.stop(this), this;
    }
    resize(t, e) {
        ct.running(this) ? this._resizeBeforeDraw = {
            width: t,
            height: e
        } : this._resize(t, e);
    }
    _resize(t, e) {
        let i = this, s = i.options, o = i.canvas, a = s.maintainAspectRatio && i.aspectRatio, r = i.platform.getMaximumSize(o, t, e, a), l = i.currentDevicePixelRatio, c = s.devicePixelRatio || i.platform.getDevicePixelRatio();
        i.width === r.width && i.height === r.height && l === c || (i.width = r.width, i.height = r.height, i._aspectRatio = i.aspectRatio, In(i, c, !0), i.notifyPlugins("resize", {
            size: r
        }), R(s.onResize, [
            i,
            r
        ], i), i.attached && i._doResize() && i.render());
    }
    ensureScalesHaveIDs() {
        let e = this.options.scales || {};
        T(e, (i, s)=>{
            i.id = s;
        });
    }
    buildOrUpdateScales() {
        let t = this, e = t.options, i = e.scales, s = t.scales, o = Object.keys(s).reduce((r, l)=>(r[l] = !1, r), {}), a = [];
        i && (a = a.concat(Object.keys(i).map((r)=>{
            let l = i[r], c = si(r, l), d = c === "r", u = c === "x";
            return {
                options: l,
                dposition: d ? "chartArea" : u ? "bottom" : "left",
                dtype: d ? "radialLinear" : u ? "category" : "linear"
            };
        }))), T(a, (r)=>{
            let l = r.options, c = l.id, d = si(c, l), u = S(l.type, r.dtype);
            (l.position === void 0 || ks(l.position, d) !== ks(r.dposition)) && (l.position = r.dposition), o[c] = !0;
            let f = null;
            if (c in s && s[c].type === u) f = s[c];
            else {
                let h = ut.getScale(u);
                f = new h({
                    id: c,
                    type: u,
                    ctx: t.ctx,
                    chart: t
                }), s[f.id] = f;
            }
            f.init(l, e);
        }), T(o, (r, l)=>{
            r || delete s[l];
        }), T(s, (r)=>{
            tt.configure(t, r, r.options), tt.addBox(t, r);
        });
    }
    _updateMetasetIndex(t, e) {
        let i = this._metasets, s = t.index;
        s !== e && (i[s] = i[e], i[e] = t, t.index = e);
    }
    _updateMetasets() {
        let t = this, e = t._metasets, i = t.data.datasets.length, s = e.length;
        if (s > i) {
            for(let o = i; o < s; ++o)t._destroyDatasetMeta(o);
            e.splice(i, s - i);
        }
        t._sortedMetasets = e.slice(0).sort(Ss("order", "index"));
    }
    _removeUnreferencedMetasets() {
        let t = this, { _metasets: e , data: { datasets: i  }  } = t;
        e.length > i.length && delete t._stacks, e.forEach((s, o)=>{
            i.filter((a)=>a === s._dataset).length === 0 && t._destroyDatasetMeta(o);
        });
    }
    buildOrUpdateControllers() {
        let t = this, e = [], i = t.data.datasets, s, o;
        for(t._removeUnreferencedMetasets(), s = 0, o = i.length; s < o; s++){
            let a = i[s], r = t.getDatasetMeta(s), l = a.type || t.config.type;
            if (r.type && r.type !== l && (t._destroyDatasetMeta(s), r = t.getDatasetMeta(s)), r.type = l, r.indexAxis = a.indexAxis || ii(l, t.options), r.order = a.order || 0, t._updateMetasetIndex(r, s), r.label = "" + a.label, r.visible = t.isDatasetVisible(s), r.controller) r.controller.updateIndex(s), r.controller.linkScales();
            else {
                let c = ut.getController(l), { datasetElementType: d , dataElementType: u  } = P.datasets[l];
                Object.assign(c.prototype, {
                    dataElementType: ut.getElement(u),
                    datasetElementType: d && ut.getElement(d)
                }), r.controller = new c(t, s), e.push(r.controller);
            }
        }
        return t._updateMetasets(), e;
    }
    _resetElements() {
        let t = this;
        T(t.data.datasets, (e, i)=>{
            t.getDatasetMeta(i).controller.reset();
        }, t);
    }
    reset() {
        this._resetElements(), this.notifyPlugins("reset");
    }
    update(t) {
        let e = this, i = e.config;
        i.update(), e._options = i.createResolver(i.chartOptionScopes(), e.getContext()), T(e.scales, (c)=>{
            tt.removeBox(e, c);
        });
        let s = e._animationsDisabled = !e.options.animation;
        e.ensureScalesHaveIDs(), e.buildOrUpdateScales();
        let o = new Set(Object.keys(e._listeners)), a = new Set(e.options.events);
        if (Ci(o, a) || (e.unbindEvents(), e.bindEvents()), e._plugins.invalidate(), e.notifyPlugins("beforeUpdate", {
            mode: t,
            cancelable: !0
        }) === !1) return;
        let r = e.buildOrUpdateControllers();
        e.notifyPlugins("beforeElementsUpdate");
        let l = 0;
        for(let c = 0, d = e.data.datasets.length; c < d; c++){
            let { controller: u  } = e.getDatasetMeta(c), f = !s && r.indexOf(u) === -1;
            u.buildOrUpdateElements(f), l = Math.max(+u.getMaxOverflow(), l);
        }
        e._minPadding = l, e._updateLayout(l), s || T(r, (c)=>{
            c.reset();
        }), e._updateDatasets(t), e.notifyPlugins("afterUpdate", {
            mode: t
        }), e._layers.sort(Ss("z", "_idx")), e._lastEvent && e._eventHandler(e._lastEvent, !0), e.render();
    }
    _updateLayout(t) {
        let e = this;
        if (e.notifyPlugins("beforeLayout", {
            cancelable: !0
        }) === !1) return;
        tt.update(e, e.width, e.height, t);
        let i = e.chartArea, s = i.width <= 0 || i.height <= 0;
        e._layers = [], T(e.boxes, (o)=>{
            s && o.position === "chartArea" || (o.configure && o.configure(), e._layers.push(...o._layers()));
        }, e), e._layers.forEach((o, a)=>{
            o._idx = a;
        }), e.notifyPlugins("afterLayout");
    }
    _updateDatasets(t) {
        let e = this, i = typeof t == "function";
        if (e.notifyPlugins("beforeDatasetsUpdate", {
            mode: t,
            cancelable: !0
        }) !== !1) {
            for(let s = 0, o = e.data.datasets.length; s < o; ++s)e._updateDataset(s, i ? t({
                datasetIndex: s
            }) : t);
            e.notifyPlugins("afterDatasetsUpdate", {
                mode: t
            });
        }
    }
    _updateDataset(t, e) {
        let i = this, s = i.getDatasetMeta(t), o = {
            meta: s,
            index: t,
            mode: e,
            cancelable: !0
        };
        i.notifyPlugins("beforeDatasetUpdate", o) !== !1 && (s.controller._update(e), o.cancelable = !1, i.notifyPlugins("afterDatasetUpdate", o));
    }
    render() {
        let t = this;
        t.notifyPlugins("beforeRender", {
            cancelable: !0
        }) !== !1 && (ct.has(t) ? t.attached && !ct.running(t) && ct.start(t) : (t.draw(), Ps({
            chart: t
        })));
    }
    draw() {
        let t = this, e;
        if (t._resizeBeforeDraw) {
            let { width: s , height: o  } = t._resizeBeforeDraw;
            t._resize(s, o), t._resizeBeforeDraw = null;
        }
        if (t.clear(), t.width <= 0 || t.height <= 0 || t.notifyPlugins("beforeDraw", {
            cancelable: !0
        }) === !1) return;
        let i = t._layers;
        for(e = 0; e < i.length && i[e].z <= 0; ++e)i[e].draw(t.chartArea);
        for(t._drawDatasets(); e < i.length; ++e)i[e].draw(t.chartArea);
        t.notifyPlugins("afterDraw");
    }
    _getSortedDatasetMetas(t) {
        let i = this._sortedMetasets, s = [], o, a;
        for(o = 0, a = i.length; o < a; ++o){
            let r = i[o];
            (!t || r.visible) && s.push(r);
        }
        return s;
    }
    getSortedVisibleDatasetMetas() {
        return this._getSortedDatasetMetas(!0);
    }
    _drawDatasets() {
        let t = this;
        if (t.notifyPlugins("beforeDatasetsDraw", {
            cancelable: !0
        }) === !1) return;
        let e = t.getSortedVisibleDatasetMetas();
        for(let i = e.length - 1; i >= 0; --i)t._drawDataset(e[i]);
        t.notifyPlugins("afterDatasetsDraw");
    }
    _drawDataset(t) {
        let e = this, i = e.ctx, s = t._clip, o = e.chartArea, a = {
            meta: t,
            index: t.index,
            cancelable: !0
        };
        e.notifyPlugins("beforeDatasetDraw", a) !== !1 && (Bt(i, {
            left: s.left === !1 ? 0 : o.left - s.left,
            right: s.right === !1 ? e.width : o.right + s.right,
            top: s.top === !1 ? 0 : o.top - s.top,
            bottom: s.bottom === !1 ? e.height : o.bottom + s.bottom
        }), t.controller.draw(), Vt(i), a.cancelable = !1, e.notifyPlugins("afterDatasetDraw", a));
    }
    getElementsAtEventForMode(t, e, i, s) {
        let o = Ka.modes[e];
        return typeof o == "function" ? o(this, t, i, s) : [];
    }
    getDatasetMeta(t) {
        let e = this, i = e.data.datasets[t], s = e._metasets, o = s.filter((a)=>a && a._dataset === i).pop();
        return o || (o = s[t] = {
            type: null,
            data: [],
            dataset: null,
            controller: null,
            hidden: null,
            xAxisID: null,
            yAxisID: null,
            order: i && i.order || 0,
            index: t,
            _dataset: i,
            _parsed: [],
            _sorted: !1
        }), o;
    }
    getContext() {
        return this.$context || (this.$context = {
            chart: this,
            type: "chart"
        });
    }
    getVisibleDatasetCount() {
        return this.getSortedVisibleDatasetMetas().length;
    }
    isDatasetVisible(t) {
        let e = this.data.datasets[t];
        if (!e) return !1;
        let i = this.getDatasetMeta(t);
        return typeof i.hidden == "boolean" ? !i.hidden : !e.hidden;
    }
    setDatasetVisibility(t, e) {
        let i = this.getDatasetMeta(t);
        i.hidden = !e;
    }
    toggleDataVisibility(t) {
        this._hiddenIndices[t] = !this._hiddenIndices[t];
    }
    getDataVisibility(t) {
        return !this._hiddenIndices[t];
    }
    _updateDatasetVisibility(t, e) {
        let i = this, s = e ? "show" : "hide", o = i.getDatasetMeta(t), a = o.controller._resolveAnimations(void 0, s);
        i.setDatasetVisibility(t, e), a.update(o, {
            visible: e
        }), i.update((r)=>r.datasetIndex === t ? s : void 0);
    }
    hide(t) {
        this._updateDatasetVisibility(t, !1);
    }
    show(t) {
        this._updateDatasetVisibility(t, !0);
    }
    _destroyDatasetMeta(t) {
        let e = this, i = e._metasets && e._metasets[t];
        i && i.controller && (i.controller._destroy(), delete e._metasets[t]);
    }
    destroy() {
        let t = this, { canvas: e , ctx: i  } = t, s, o;
        for(t.stop(), ct.remove(t), s = 0, o = t.data.datasets.length; s < o; ++s)t._destroyDatasetMeta(s);
        t.config.clearCache(), e && (t.unbindEvents(), An(e, i), t.platform.releaseContext(i), t.canvas = null, t.ctx = null), t.notifyPlugins("destroy"), delete en[t.id];
    }
    toBase64Image(...t) {
        return this.canvas.toDataURL(...t);
    }
    bindEvents() {
        let t = this, e = t._listeners, i = t.platform, s = (r, l)=>{
            i.addEventListener(t, r, l), e[r] = l;
        }, o = (r, l)=>{
            e[r] && (i.removeEventListener(t, r, l), delete e[r]);
        }, a = function(r, l, c) {
            r.offsetX = l, r.offsetY = c, t._eventHandler(r);
        };
        if (T(t.options.events, (r)=>s(r, a)), t.options.responsive) {
            a = (c, d)=>{
                t.canvas && t.resize(c, d);
            };
            let r, l = ()=>{
                o("attach", l), t.attached = !0, t.resize(), s("resize", a), s("detach", r);
            };
            r = ()=>{
                t.attached = !1, o("resize", a), s("attach", l);
            }, i.isAttached(t.canvas) ? l() : r();
        } else t.attached = !0;
    }
    unbindEvents() {
        let t = this, e = t._listeners;
        e && (t._listeners = {}, T(e, (i, s)=>{
            t.platform.removeEventListener(t, s, i);
        }));
    }
    updateHoverStyle(t, e, i) {
        let s = i ? "set" : "remove", o, a, r, l;
        for(e === "dataset" && (o = this.getDatasetMeta(t[0].datasetIndex), o.controller["_" + s + "DatasetHoverStyle"]()), r = 0, l = t.length; r < l; ++r){
            a = t[r];
            let c = a && this.getDatasetMeta(a.datasetIndex).controller;
            c && c[s + "HoverStyle"](a.element, a.datasetIndex, a.index);
        }
    }
    getActiveElements() {
        return this._active || [];
    }
    setActiveElements(t) {
        let e = this, i = e._active || [], s = t.map(({ datasetIndex: a , index: r  })=>{
            let l = e.getDatasetMeta(a);
            if (!l) throw new Error("No dataset found at index " + a);
            return {
                datasetIndex: a,
                element: l.data[r],
                index: r
            };
        });
        !oe(s, i) && (e._active = s, e._updateHoverStyles(s, i));
    }
    notifyPlugins(t, e, i) {
        return this._plugins.notify(this, t, e, i);
    }
    _updateHoverStyles(t, e, i) {
        let s = this, o = s.options.hover, a = (c, d)=>c.filter((u)=>!d.some((f)=>u.datasetIndex === f.datasetIndex && u.index === f.index)), r = a(e, t), l = i ? t : a(t, e);
        r.length && s.updateHoverStyle(r, o.mode, !1), l.length && o.mode && s.updateHoverStyle(l, o.mode, !0);
    }
    _eventHandler(t, e) {
        let i = this, s = {
            event: t,
            replay: e,
            cancelable: !0
        }, o = (r)=>(r.options.events || this.options.events).includes(t.type);
        if (i.notifyPlugins("beforeEvent", s, o) === !1) return;
        let a = i._handleEvent(t, e);
        return s.cancelable = !1, i.notifyPlugins("afterEvent", s, o), (a || s.changed) && i.render(), i;
    }
    _handleEvent(t, e) {
        let i = this, { _active: s = [] , options: o  } = i, a = o.hover, r = e, l = [], c = !1, d = null;
        return t.type !== "mouseout" && (l = i.getElementsAtEventForMode(t, a.mode, a, r), d = t.type === "click" ? i._lastEvent : t), i._lastEvent = null, Et(t, i.chartArea, i._minPadding) && (R(o.onHover, [
            t,
            l,
            i
        ], i), (t.type === "mouseup" || t.type === "click" || t.type === "contextmenu") && R(o.onClick, [
            t,
            l,
            i
        ], i)), c = !oe(l, s), (c || e) && (i._active = l, i._updateHoverStyles(l, s, e)), i._lastEvent = d, c;
    }
}, Ds = ()=>T(nn.instances, (n)=>n._plugins.invalidate()), yt = !0;
Object.defineProperties(nn, {
    defaults: {
        enumerable: yt,
        value: P
    },
    instances: {
        enumerable: yt,
        value: en
    },
    overrides: {
        enumerable: yt,
        value: pt
    },
    registry: {
        enumerable: yt,
        value: ut
    },
    version: {
        enumerable: yt,
        value: Wr
    },
    getChart: {
        enumerable: yt,
        value: ao
    },
    register: {
        enumerable: yt,
        value: (...n)=>{
            ut.add(...n), Ds();
        }
    },
    unregister: {
        enumerable: yt,
        value: (...n)=>{
            ut.remove(...n), Ds();
        }
    }
});
function ro(n, t) {
    let { startAngle: e , endAngle: i , pixelMargin: s , x: o , y: a , outerRadius: r , innerRadius: l  } = t, c = s / r;
    n.beginPath(), n.arc(o, a, r, e - c, i + c), l > s ? (c = s / l, n.arc(o, a, l, i + c, e - c, !0)) : n.arc(o, a, s, i + B, e - B), n.closePath(), n.clip();
}
function jr(n) {
    return je(n, [
        "outerStart",
        "outerEnd",
        "innerStart",
        "innerEnd"
    ]);
}
function Yr(n, t, e, i) {
    let s = jr(n.options.borderRadius), o = (e - t) / 2, a = Math.min(o, i * t / 2), r = (l)=>{
        let c = (e - Math.min(o, l)) * i / 2;
        return U(l, 0, Math.min(o, c));
    };
    return {
        outerStart: r(s.outerStart),
        outerEnd: r(s.outerEnd),
        innerStart: U(s.innerStart, 0, a),
        innerEnd: U(s.innerEnd, 0, a)
    };
}
function Nt(n, t, e, i) {
    return {
        x: e + n * Math.cos(t),
        y: i + n * Math.sin(t)
    };
}
function ai(n, t) {
    let { x: e , y: i , startAngle: s , endAngle: o , pixelMargin: a  } = t, r = Math.max(t.outerRadius - a, 0), l = t.innerRadius + a, { outerStart: c , outerEnd: d , innerStart: u , innerEnd: f  } = Yr(t, l, r, o - s), h = r - c, g = r - d, p = s + c / h, m = o - d / g, b = l + u, x = l + f, y = s + u / b, _ = o - f / x;
    if (n.beginPath(), n.arc(e, i, r, p, m), d > 0) {
        let w = Nt(g, m, e, i);
        n.arc(w.x, w.y, d, m, o + B);
    }
    let v = Nt(x, o, e, i);
    if (n.lineTo(v.x, v.y), f > 0) {
        let w1 = Nt(x, _, e, i);
        n.arc(w1.x, w1.y, f, o + B, _ + Math.PI);
    }
    if (n.arc(e, i, l, o - f / l, s + u / l, !0), u > 0) {
        let w2 = Nt(b, y, e, i);
        n.arc(w2.x, w2.y, u, y + Math.PI, s - B);
    }
    let M = Nt(h, s, e, i);
    if (n.lineTo(M.x, M.y), c > 0) {
        let w3 = Nt(h, p, e, i);
        n.arc(w3.x, w3.y, c, s - B, p);
    }
    n.closePath();
}
function $r(n, t) {
    if (t.fullCircles) {
        t.endAngle = t.startAngle + L, ai(n, t);
        for(let e = 0; e < t.fullCircles; ++e)n.fill();
    }
    isNaN(t.circumference) || (t.endAngle = t.startAngle + t.circumference % L), ai(n, t), n.fill();
}
function Xr(n, t, e) {
    let { x: i , y: s , startAngle: o , endAngle: a , pixelMargin: r  } = t, l = Math.max(t.outerRadius - r, 0), c = t.innerRadius + r, d;
    for(e && (t.endAngle = t.startAngle + L, ro(n, t), t.endAngle = a, t.endAngle === t.startAngle && (t.endAngle += L, t.fullCircles--)), n.beginPath(), n.arc(i, s, c, o + L, o, !0), d = 0; d < t.fullCircles; ++d)n.stroke();
    for(n.beginPath(), n.arc(i, s, l, o, o + L), d = 0; d < t.fullCircles; ++d)n.stroke();
}
function Ur(n, t) {
    let { options: e  } = t, i = e.borderAlign === "inner";
    e.borderWidth && (i ? (n.lineWidth = e.borderWidth * 2, n.lineJoin = "round") : (n.lineWidth = e.borderWidth, n.lineJoin = "bevel"), t.fullCircles && Xr(n, t, i), i && ro(n, t), ai(n, t), n.stroke());
}
var qt = class extends Z {
    constructor(t){
        super(), this.options = void 0, this.circumference = void 0, this.startAngle = void 0, this.endAngle = void 0, this.innerRadius = void 0, this.outerRadius = void 0, this.pixelMargin = 0, this.fullCircles = 0, t && Object.assign(this, t);
    }
    inRange(t, e, i) {
        let s = this.getProps([
            "x",
            "y"
        ], i), { angle: o , distance: a  } = Li(s, {
            x: t,
            y: e
        }), { startAngle: r , endAngle: l , innerRadius: c , outerRadius: d , circumference: u  } = this.getProps([
            "startAngle",
            "endAngle",
            "innerRadius",
            "outerRadius",
            "circumference"
        ], i), f = u >= L || re(o, r, l), h = a >= c && a <= d;
        return f && h;
    }
    getCenterPoint(t) {
        let { x: e , y: i , startAngle: s , endAngle: o , innerRadius: a , outerRadius: r  } = this.getProps([
            "x",
            "y",
            "startAngle",
            "endAngle",
            "innerRadius",
            "outerRadius"
        ], t), l = (s + o) / 2, c = (a + r) / 2;
        return {
            x: e + Math.cos(l) * c,
            y: i + Math.sin(l) * c
        };
    }
    tooltipPosition(t) {
        return this.getCenterPoint(t);
    }
    draw(t) {
        let e = this, i = e.options, s = i.offset || 0;
        if (e.pixelMargin = i.borderAlign === "inner" ? .33 : 0, e.fullCircles = Math.floor(e.circumference / L), !(e.circumference === 0 || e.innerRadius < 0 || e.outerRadius < 0)) {
            if (t.save(), s && e.circumference < L) {
                let o = (e.startAngle + e.endAngle) / 2;
                t.translate(Math.cos(o) * s, Math.sin(o) * s);
            }
            t.fillStyle = i.backgroundColor, t.strokeStyle = i.borderColor, $r(t, e), Ur(t, e), t.restore();
        }
    }
};
qt.id = "arc";
qt.defaults = {
    borderAlign: "center",
    borderColor: "#fff",
    borderRadius: 0,
    borderWidth: 2,
    offset: 0,
    angle: void 0
};
qt.defaultRoutes = {
    backgroundColor: "backgroundColor"
};
function lo(n, t, e = t) {
    n.lineCap = S(e.borderCapStyle, t.borderCapStyle), n.setLineDash(S(e.borderDash, t.borderDash)), n.lineDashOffset = S(e.borderDashOffset, t.borderDashOffset), n.lineJoin = S(e.borderJoinStyle, t.borderJoinStyle), n.lineWidth = S(e.borderWidth, t.borderWidth), n.strokeStyle = S(e.borderColor, t.borderColor);
}
function Kr(n, t, e) {
    n.lineTo(e.x, e.y);
}
function qr(n) {
    return n.stepped ? Wi : n.tension ? Hi : Kr;
}
function co(n, t, e = {}) {
    let i = n.length, { start: s = 0 , end: o = i - 1  } = e, { start: a , end: r  } = t, l = Math.max(s, a), c = Math.min(o, r), d = s < a && o < a || s > r && o > r;
    return {
        count: i,
        start: l,
        loop: t.loop,
        ilen: c < l && !d ? i + c - l : c - l
    };
}
function Gr(n, t, e, i) {
    let { points: s , options: o  } = t, { count: a , start: r , loop: l , ilen: c  } = co(s, e, i), d = qr(o), { move: u = !0 , reverse: f  } = i || {}, h, g, p;
    for(h = 0; h <= c; ++h)g = s[(r + (f ? c - h : h)) % a], !g.skip && (u ? (n.moveTo(g.x, g.y), u = !1) : d(n, p, g, f, o.stepped), p = g);
    return l && (g = s[(r + (f ? c : 0)) % a], d(n, p, g, f, o.stepped)), !!l;
}
function Zr(n, t, e, i) {
    let s = t.points, { count: o , start: a , ilen: r  } = co(s, e, i), { move: l = !0 , reverse: c  } = i || {}, d = 0, u = 0, f, h, g, p, m, b, x = (_)=>(a + (c ? r - _ : _)) % o, y = ()=>{
        p !== m && (n.lineTo(d, m), n.lineTo(d, p), n.lineTo(d, b));
    };
    for(l && (h = s[x(0)], n.moveTo(h.x, h.y)), f = 0; f <= r; ++f){
        if (h = s[x(f)], h.skip) continue;
        let _ = h.x, v = h.y, M = _ | 0;
        M === g ? (v < p ? p = v : v > m && (m = v), d = (u * d + _) / ++u) : (y(), n.lineTo(_, v), g = M, u = 0, p = m = v), b = v;
    }
    y();
}
function ri(n) {
    let t = n.options, e = t.borderDash && t.borderDash.length;
    return !n._decimated && !n._loop && !t.tension && !t.stepped && !e ? Zr : Gr;
}
function Qr(n) {
    return n.stepped ? ts : n.tension ? es : gt;
}
function Jr(n, t, e, i) {
    let s = t._path;
    s || (s = t._path = new Path2D, t.path(s, e, i) && s.closePath()), lo(n, t.options), n.stroke(s);
}
function tl(n, t, e, i) {
    let { segments: s , options: o  } = t, a = ri(t);
    for (let r of s)lo(n, o, r.style), n.beginPath(), a(n, t, r, {
        start: e,
        end: e + i - 1
    }) && n.closePath(), n.stroke();
}
var el = typeof Path2D == "function";
function nl(n, t, e, i) {
    el && t.segments.length === 1 ? Jr(n, t, e, i) : tl(n, t, e, i);
}
var at = class extends Z {
    constructor(t){
        super(), this.animated = !0, this.options = void 0, this._loop = void 0, this._fullLoop = void 0, this._path = void 0, this._points = void 0, this._segments = void 0, this._decimated = !1, this._pointsUpdated = !1, t && Object.assign(this, t);
    }
    updateControlPoints(t) {
        let e = this, i = e.options;
        if (i.tension && !i.stepped && !e._pointsUpdated) {
            let s = i.spanGaps ? e._loop : e._fullLoop;
            Zi(e._points, i, t, s), e._pointsUpdated = !0;
        }
    }
    set points(t) {
        let e = this;
        e._points = t, delete e._segments, delete e._path, e._pointsUpdated = !1;
    }
    get points() {
        return this._points;
    }
    get segments() {
        return this._segments || (this._segments = is(this, this.options.segment));
    }
    first() {
        let t = this.segments, e = this.points;
        return t.length && e[t[0].start];
    }
    last() {
        let t = this.segments, e = this.points, i = t.length;
        return i && e[t[i - 1].end];
    }
    interpolate(t, e) {
        let i = this, s = i.options, o = t[e], a = i.points, r = Nn(i, {
            property: e,
            start: o,
            end: o
        });
        if (!r.length) return;
        let l = [], c = Qr(s), d, u;
        for(d = 0, u = r.length; d < u; ++d){
            let { start: f , end: h  } = r[d], g = a[f], p = a[h];
            if (g === p) {
                l.push(g);
                continue;
            }
            let m = Math.abs((o - g[e]) / (p[e] - g[e])), b = c(g, p, m, s.stepped);
            b[e] = t[e], l.push(b);
        }
        return l.length === 1 ? l[0] : l;
    }
    pathSegment(t, e, i) {
        return ri(this)(t, this, e, i);
    }
    path(t, e, i) {
        let s = this, o = s.segments, a = ri(s), r = s._loop;
        e = e || 0, i = i || s.points.length - e;
        for (let l of o)r &= a(t, s, l, {
            start: e,
            end: e + i - 1
        });
        return !!r;
    }
    draw(t, e, i, s) {
        let o = this, a = o.options || {};
        !(o.points || []).length || !a.borderWidth || (t.save(), nl(t, o, i, s), t.restore(), o.animated && (o._pointsUpdated = !1, o._path = void 0));
    }
};
at.id = "line";
at.defaults = {
    borderCapStyle: "butt",
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: "miter",
    borderWidth: 3,
    capBezierPoints: !0,
    cubicInterpolationMode: "default",
    fill: !1,
    spanGaps: !1,
    stepped: !1,
    tension: 0
};
at.defaultRoutes = {
    backgroundColor: "backgroundColor",
    borderColor: "borderColor"
};
at.descriptors = {
    _scriptable: !0,
    _indexable: (n)=>n !== "borderDash" && n !== "fill"
};
function Cs(n, t, e, i) {
    let s = n.options, { [e]: o  } = n.getProps([
        e
    ], i);
    return Math.abs(t - o) < s.radius + s.hitRadius;
}
var Gt = class extends Z {
    constructor(t){
        super(), this.options = void 0, this.parsed = void 0, this.skip = void 0, this.stop = void 0, t && Object.assign(this, t);
    }
    inRange(t, e, i) {
        let s = this.options, { x: o , y: a  } = this.getProps([
            "x",
            "y"
        ], i);
        return Math.pow(t - o, 2) + Math.pow(e - a, 2) < Math.pow(s.hitRadius + s.radius, 2);
    }
    inXRange(t, e) {
        return Cs(this, t, "x", e);
    }
    inYRange(t, e) {
        return Cs(this, t, "y", e);
    }
    getCenterPoint(t) {
        let { x: e , y: i  } = this.getProps([
            "x",
            "y"
        ], t);
        return {
            x: e,
            y: i
        };
    }
    size(t) {
        t = t || this.options || {};
        let e = t.radius || 0;
        e = Math.max(e, e && t.hoverRadius || 0);
        let i = e && t.borderWidth || 0;
        return (e + i) * 2;
    }
    draw(t) {
        let e = this, i = e.options;
        e.skip || i.radius < .1 || (t.strokeStyle = i.borderColor, t.lineWidth = i.borderWidth, t.fillStyle = i.backgroundColor, ce(t, i, e.x, e.y));
    }
    getRange() {
        let t = this.options || {};
        return t.radius + t.hitRadius;
    }
};
Gt.id = "point";
Gt.defaults = {
    borderWidth: 1,
    hitRadius: 1,
    hoverBorderWidth: 1,
    hoverRadius: 4,
    pointStyle: "circle",
    radius: 3,
    rotation: 0
};
Gt.defaultRoutes = {
    backgroundColor: "backgroundColor",
    borderColor: "borderColor"
};
function uo(n, t) {
    let { x: e , y: i , base: s , width: o , height: a  } = n.getProps([
        "x",
        "y",
        "base",
        "width",
        "height"
    ], t), r, l, c, d, u;
    return n.horizontal ? (u = a / 2, r = Math.min(e, s), l = Math.max(e, s), c = i - u, d = i + u) : (u = o / 2, r = e - u, l = e + u, c = Math.min(i, s), d = Math.max(i, s)), {
        left: r,
        top: c,
        right: l,
        bottom: d
    };
}
function fo(n) {
    let t = n.options.borderSkipped, e = {};
    return t && (t = n.horizontal ? Os(t, "left", "right", n.base > n.x) : Os(t, "bottom", "top", n.base < n.y), e[t] = !0), e;
}
function Os(n, t, e, i) {
    return i ? (n = il(n, t, e), n = As(n, e, t)) : n = As(n, t, e), n;
}
function il(n, t, e) {
    return n === t ? e : n === e ? t : n;
}
function As(n, t, e) {
    return n === "start" ? t : n === "end" ? e : n;
}
function vt(n, t, e, i) {
    return n ? 0 : Math.max(Math.min(t, i), e);
}
function sl(n, t, e) {
    let i = n.options.borderWidth, s = fo(n), o = Tn(i);
    return {
        t: vt(s.top, o.top, 0, e),
        r: vt(s.right, o.right, 0, t),
        b: vt(s.bottom, o.bottom, 0, e),
        l: vt(s.left, o.left, 0, t)
    };
}
function ol(n, t, e) {
    let { enableBorderRadius: i  } = n.getProps([
        "enableBorderRadius"
    ]), s = n.options.borderRadius, o = Ye(s), a = Math.min(t, e), r = fo(n), l = i || A(s);
    return {
        topLeft: vt(!l || r.top || r.left, o.topLeft, 0, a),
        topRight: vt(!l || r.top || r.right, o.topRight, 0, a),
        bottomLeft: vt(!l || r.bottom || r.left, o.bottomLeft, 0, a),
        bottomRight: vt(!l || r.bottom || r.right, o.bottomRight, 0, a)
    };
}
function al(n) {
    let t = uo(n), e = t.right - t.left, i = t.bottom - t.top, s = sl(n, e / 2, i / 2), o = ol(n, e / 2, i / 2);
    return {
        outer: {
            x: t.left,
            y: t.top,
            w: e,
            h: i,
            radius: o
        },
        inner: {
            x: t.left + s.l,
            y: t.top + s.t,
            w: e - s.l - s.r,
            h: i - s.t - s.b,
            radius: {
                topLeft: Math.max(0, o.topLeft - Math.max(s.t, s.l)),
                topRight: Math.max(0, o.topRight - Math.max(s.t, s.r)),
                bottomLeft: Math.max(0, o.bottomLeft - Math.max(s.b, s.l)),
                bottomRight: Math.max(0, o.bottomRight - Math.max(s.b, s.r))
            }
        }
    };
}
function qn(n, t, e, i) {
    let s = t === null, o = e === null, r = n && !(s && o) && uo(n, i);
    return r && (s || t >= r.left && t <= r.right) && (o || e >= r.top && e <= r.bottom);
}
function rl(n) {
    return n.topLeft || n.topRight || n.bottomLeft || n.bottomRight;
}
function ll(n, t) {
    n.rect(t.x, t.y, t.w, t.h);
}
var Zt = class extends Z {
    constructor(t){
        super(), this.options = void 0, this.horizontal = void 0, this.base = void 0, this.width = void 0, this.height = void 0, t && Object.assign(this, t);
    }
    draw(t) {
        let e = this.options, { inner: i , outer: s  } = al(this), o = rl(s.radius) ? de : ll;
        t.save(), (s.w !== i.w || s.h !== i.h) && (t.beginPath(), o(t, s), t.clip(), o(t, i), t.fillStyle = e.borderColor, t.fill("evenodd")), t.beginPath(), o(t, i), t.fillStyle = e.backgroundColor, t.fill(), t.restore();
    }
    inRange(t, e, i) {
        return qn(this, t, e, i);
    }
    inXRange(t, e) {
        return qn(this, t, null, e);
    }
    inYRange(t, e) {
        return qn(this, null, t, e);
    }
    getCenterPoint(t) {
        let { x: e , y: i , base: s , horizontal: o  } = this.getProps([
            "x",
            "y",
            "base",
            "horizontal"
        ], t);
        return {
            x: o ? (e + s) / 2 : e,
            y: o ? i : (i + s) / 2
        };
    }
    getRange(t) {
        return t === "x" ? this.width / 2 : this.height / 2;
    }
};
Zt.id = "bar";
Zt.defaults = {
    borderSkipped: "start",
    borderWidth: 0,
    borderRadius: 0,
    enableBorderRadius: !0,
    pointStyle: void 0
};
Zt.defaultRoutes = {
    backgroundColor: "backgroundColor",
    borderColor: "borderColor"
};
var cl = Object.freeze({
    __proto__: null,
    ArcElement: qt,
    LineElement: at,
    PointElement: Gt,
    BarElement: Zt
});
function dl(n, t, e, i, s) {
    let o = s.samples || i;
    if (o >= e) return n.slice(t, t + e);
    let a = [], r = (e - 2) / (o - 2), l = 0, c = t + e - 1, d = t, u, f, h, g, p;
    for(a[l++] = n[d], u = 0; u < o - 2; u++){
        let m = 0, b = 0, x, y = Math.floor((u + 1) * r) + 1 + t, _ = Math.min(Math.floor((u + 2) * r) + 1, e) + t, v = _ - y;
        for(x = y; x < _; x++)m += n[x].x, b += n[x].y;
        m /= v, b /= v;
        let M = Math.floor(u * r) + 1 + t, w = Math.floor((u + 1) * r) + 1 + t, { x: k , y: z  } = n[d];
        for(h = g = -1, x = M; x < w; x++)g = .5 * Math.abs((k - m) * (n[x].y - z) - (k - n[x].x) * (b - z)), g > h && (h = g, f = n[x], p = x);
        a[l++] = f, d = p;
    }
    return a[l++] = n[c], a;
}
function ul(n, t, e, i) {
    let s = 0, o = 0, a, r, l, c, d, u, f, h, g, p, m = [], b = t + e - 1, x = n[t].x, _ = n[b].x - x;
    for(a = t; a < t + e; ++a){
        r = n[a], l = (r.x - x) / _ * i, c = r.y;
        let v = l | 0;
        if (v === d) c < g ? (g = c, u = a) : c > p && (p = c, f = a), s = (o * s + r.x) / ++o;
        else {
            let M = a - 1;
            if (!D(u) && !D(f)) {
                let w = Math.min(u, f), k = Math.max(u, f);
                w !== h && w !== M && m.push({
                    ...n[w],
                    x: s
                }), k !== h && k !== M && m.push({
                    ...n[k],
                    x: s
                });
            }
            a > 0 && M !== h && m.push(n[M]), m.push(r), d = v, o = 0, g = p = c, u = f = h = a;
        }
    }
    return m;
}
function ho(n) {
    if (n._decimated) {
        let t = n._data;
        delete n._decimated, delete n._data, Object.defineProperty(n, "data", {
            value: t
        });
    }
}
function Ts(n) {
    n.data.datasets.forEach((t)=>{
        ho(t);
    });
}
function fl(n, t) {
    let e = t.length, i = 0, s, { iScale: o  } = n, { min: a , max: r , minDefined: l , maxDefined: c  } = o.getUserBounds();
    return l && (i = U(xt(t, o.axis, a).lo, 0, e - 1)), c ? s = U(xt(t, o.axis, r).hi + 1, i, e) - i : s = e - i, {
        start: i,
        count: s
    };
}
var hl = {
    id: "decimation",
    defaults: {
        algorithm: "min-max",
        enabled: !1
    },
    beforeElementsUpdate: (n, t, e)=>{
        if (!e.enabled) {
            Ts(n);
            return;
        }
        let i = n.width;
        n.data.datasets.forEach((s, o)=>{
            let { _data: a , indexAxis: r  } = s, l = n.getDatasetMeta(o), c = a || s.data;
            if (Wt([
                r,
                n.options.indexAxis
            ]) === "y" || l.type !== "line") return;
            let d = n.scales[l.xAxisID];
            if (d.type !== "linear" && d.type !== "time" || n.options.parsing) return;
            let { start: u , count: f  } = fl(l, c);
            if (f <= 4 * i) {
                ho(s);
                return;
            }
            D(a) && (s._data = c, delete s.data, Object.defineProperty(s, "data", {
                configurable: !0,
                enumerable: !0,
                get: function() {
                    return this._decimated;
                },
                set: function(g) {
                    this._data = g;
                }
            }));
            let h;
            switch(e.algorithm){
                case "lttb":
                    h = dl(c, u, f, i, e);
                    break;
                case "min-max":
                    h = ul(c, u, f, i);
                    break;
                default:
                    throw new Error(`Unsupported decimation algorithm '${e.algorithm}'`);
            }
            s._decimated = h;
        });
    },
    destroy (n) {
        Ts(n);
    }
};
function gl(n, t) {
    let e = n.getDatasetMeta(t);
    return e && n.isDatasetVisible(t) ? e.dataset : null;
}
function pl(n) {
    let t = n.options, e = t.fill, i = S(e && e.target, e);
    return i === void 0 && (i = !!t.backgroundColor), i === !1 || i === null ? !1 : i === !0 ? "origin" : i;
}
function ml(n, t, e) {
    let i = pl(n);
    if (A(i)) return isNaN(i.value) ? !1 : i;
    let s = parseFloat(i);
    return V(s) && Math.floor(s) === s ? ((i[0] === "-" || i[0] === "+") && (s = t + s), s === t || s < 0 || s >= e ? !1 : s) : [
        "origin",
        "start",
        "end",
        "stack"
    ].indexOf(i) >= 0 && i;
}
function bl(n) {
    let { scale: t = {} , fill: e  } = n, i = null, s;
    return e === "start" ? i = t.bottom : e === "end" ? i = t.top : A(e) ? i = t.getPixelForValue(e.value) : t.getBasePixel && (i = t.getBasePixel()), V(i) ? (s = t.isHorizontal(), {
        x: s ? i : null,
        y: s ? null : i
    }) : null;
}
var sn = class {
    constructor(t){
        this.x = t.x, this.y = t.y, this.radius = t.radius;
    }
    pathSegment(t, e, i) {
        let { x: s , y: o , radius: a  } = this;
        return e = e || {
            start: 0,
            end: L
        }, t.arc(s, o, a, e.end, e.start, !0), !i.bounds;
    }
    interpolate(t) {
        let { x: e , y: i , radius: s  } = this, o = t.angle;
        return {
            x: e + Math.cos(o) * s,
            y: i + Math.sin(o) * s,
            angle: o
        };
    }
};
function xl(n) {
    let { scale: t , fill: e  } = n, i = t.options, s = t.getLabels().length, o = [], a = i.reverse ? t.max : t.min, r = i.reverse ? t.min : t.max, l, c, d;
    if (e === "start" ? d = a : e === "end" ? d = r : A(e) ? d = e.value : d = t.getBaseValue(), i.grid.circular) return c = t.getPointPositionForValue(0, a), new sn({
        x: c.x,
        y: c.y,
        radius: t.getDistanceFromCenterForValue(d)
    });
    for(l = 0; l < s; ++l)o.push(t.getPointPositionForValue(l, d));
    return o;
}
function _l(n) {
    return (n.scale || {}).getPointPositionForValue ? xl(n) : bl(n);
}
function yl(n, t) {
    let { x: e = null , y: i = null  } = n || {}, s = t.points, o = [];
    return t.segments.forEach((a)=>{
        let r = s[a.start], l = s[a.end];
        i !== null ? (o.push({
            x: r.x,
            y: i
        }), o.push({
            x: l.x,
            y: i
        })) : e !== null && (o.push({
            x: e,
            y: r.y
        }), o.push({
            x: e,
            y: l.y
        }));
    }), o;
}
function vl(n) {
    let { chart: t , scale: e , index: i , line: s  } = n, o = [], a = s.segments, r = s.points, l = wl(t, i);
    l.push(go({
        x: null,
        y: e.bottom
    }, s));
    for(let c = 0; c < a.length; c++){
        let d = a[c];
        for(let u = d.start; u <= d.end; u++)kl(o, r[u], l);
    }
    return new at({
        points: o,
        options: {}
    });
}
var Ml = (n)=>n.type === "line" && !n.hidden;
function wl(n, t) {
    let e = [], i = n.getSortedVisibleDatasetMetas();
    for(let s = 0; s < i.length; s++){
        let o = i[s];
        if (o.index === t) break;
        Ml(o) && e.unshift(o.dataset);
    }
    return e;
}
function kl(n, t, e) {
    let i = [];
    for(let s = 0; s < e.length; s++){
        let o = e[s], { first: a , last: r , point: l  } = Sl(o, t, "x");
        if (!(!l || a && r)) {
            if (a) i.unshift(l);
            else if (n.push(l), !r) break;
        }
    }
    n.push(...i);
}
function Sl(n, t, e) {
    let i = n.interpolate(t, e);
    if (!i) return {};
    let s = i[e], o = n.segments, a = n.points, r = !1, l = !1;
    for(let c = 0; c < o.length; c++){
        let d = o[c], u = a[d.start][e], f = a[d.end][e];
        if (s >= u && s <= f) {
            r = s === u, l = s === f;
            break;
        }
    }
    return {
        first: r,
        last: l,
        point: i
    };
}
function Pl(n) {
    let { chart: t , fill: e , line: i  } = n;
    if (V(e)) return gl(t, e);
    if (e === "stack") return vl(n);
    let s = _l(n);
    return s instanceof sn ? s : go(s, i);
}
function go(n, t) {
    let e = [], i = !1;
    return E(n) ? (i = !0, e = n) : e = yl(n, t), e.length ? new at({
        points: e,
        options: {
            tension: 0
        },
        _loop: i,
        _fullLoop: i
    }) : null;
}
function Dl(n, t, e) {
    let s = n[t].fill, o = [
        t
    ], a;
    if (!e) return s;
    for(; s !== !1 && o.indexOf(s) === -1;){
        if (!V(s)) return s;
        if (a = n[s], !a) return !1;
        if (a.visible) return s;
        o.push(s), s = a.fill;
    }
    return !1;
}
function Ls(n, t, e) {
    n.beginPath(), t.path(n), n.lineTo(t.last().x, e), n.lineTo(t.first().x, e), n.closePath(), n.clip();
}
function li(n, t, e, i) {
    if (i) return;
    let s = t[n], o = e[n];
    return n === "angle" && (s = J(s), o = J(o)), {
        property: n,
        start: s,
        end: o
    };
}
function Rs(n, t, e, i) {
    return n && t ? i(n[e], t[e]) : n ? n[e] : t ? t[e] : 0;
}
function Cl(n, t, e) {
    let i = n.segments, s = n.points, o = t.points, a = [];
    for (let r of i){
        let l = li(e, s[r.start], s[r.end], r.loop);
        if (!t.segments) {
            a.push({
                source: r,
                target: l,
                start: s[r.start],
                end: s[r.end]
            });
            continue;
        }
        let c = Nn(t, l);
        for (let d of c){
            let u = li(e, o[d.start], o[d.end], d.loop), f = Hn(r, s, u);
            for (let h of f)a.push({
                source: h,
                target: d,
                start: {
                    [e]: Rs(l, u, "start", Math.max)
                },
                end: {
                    [e]: Rs(l, u, "end", Math.min)
                }
            });
        }
    }
    return a;
}
function Ol(n, t, e) {
    let { top: i , bottom: s  } = t.chart.chartArea, { property: o , start: a , end: r  } = e || {};
    o === "x" && (n.beginPath(), n.rect(a, i, r - a, s - i), n.clip());
}
function Fs(n, t, e, i) {
    let s = t.interpolate(e, i);
    s && n.lineTo(s.x, s.y);
}
function Es(n, t) {
    let { line: e , target: i , property: s , color: o , scale: a  } = t, r = Cl(e, i, s);
    for (let { source: l , target: c , start: d , end: u  } of r){
        let { style: { backgroundColor: f = o  } = {}  } = l;
        n.save(), n.fillStyle = f, Ol(n, a, li(s, d, u)), n.beginPath();
        let h = !!e.pathSegment(n, l);
        h ? n.closePath() : Fs(n, i, u, s);
        let g = !!i.pathSegment(n, c, {
            move: h,
            reverse: !0
        }), p = h && g;
        p || Fs(n, i, d, s), n.closePath(), n.fill(p ? "evenodd" : "nonzero"), n.restore();
    }
}
function Al(n, t) {
    let { line: e , target: i , above: s , below: o , area: a , scale: r  } = t, l = e._loop ? "angle" : t.axis;
    n.save(), l === "x" && o !== s && (Ls(n, i, a.top), Es(n, {
        line: e,
        target: i,
        color: s,
        scale: r,
        property: l
    }), n.restore(), n.save(), Ls(n, i, a.bottom)), Es(n, {
        line: e,
        target: i,
        color: o,
        scale: r,
        property: l
    }), n.restore();
}
function Gn(n, t, e) {
    let i = Pl(t), { line: s , scale: o , axis: a  } = t, r = s.options, l = r.fill, c = r.backgroundColor, { above: d = c , below: u = c  } = l || {};
    i && s.points.length && (Bt(n, e), Al(n, {
        line: s,
        target: i,
        above: d,
        below: u,
        area: e,
        scale: o,
        axis: a
    }), Vt(n));
}
var Tl = {
    id: "filler",
    afterDatasetsUpdate (n, t, e) {
        let i = (n.data.datasets || []).length, s = [], o, a, r, l;
        for(a = 0; a < i; ++a)o = n.getDatasetMeta(a), r = o.dataset, l = null, r && r.options && r instanceof at && (l = {
            visible: n.isDatasetVisible(a),
            index: a,
            fill: ml(r, a, i),
            chart: n,
            axis: o.controller.options.indexAxis,
            scale: o.vScale,
            line: r
        }), o.$filler = l, s.push(l);
        for(a = 0; a < i; ++a)l = s[a], !(!l || l.fill === !1) && (l.fill = Dl(s, a, e.propagate));
    },
    beforeDraw (n, t, e) {
        let i = e.drawTime === "beforeDraw", s = n.getSortedVisibleDatasetMetas(), o = n.chartArea;
        for(let a = s.length - 1; a >= 0; --a){
            let r = s[a].$filler;
            r && (r.line.updateControlPoints(o), i && Gn(n.ctx, r, o));
        }
    },
    beforeDatasetsDraw (n, t, e) {
        if (e.drawTime !== "beforeDatasetsDraw") return;
        let i = n.getSortedVisibleDatasetMetas();
        for(let s = i.length - 1; s >= 0; --s){
            let o = i[s].$filler;
            o && Gn(n.ctx, o, n.chartArea);
        }
    },
    beforeDatasetDraw (n, t, e) {
        let i = t.meta.$filler;
        !i || i.fill === !1 || e.drawTime !== "beforeDatasetDraw" || Gn(n.ctx, i, n.chartArea);
    },
    defaults: {
        propagate: !0,
        drawTime: "beforeDatasetDraw"
    }
}, zs = (n, t)=>{
    let { boxHeight: e = t , boxWidth: i = t  } = n;
    return n.usePointStyle && (e = Math.min(e, t), i = Math.min(i, t)), {
        boxWidth: i,
        boxHeight: e,
        itemHeight: Math.max(t, e)
    };
}, Ll = (n, t)=>n !== null && t !== null && n.datasetIndex === t.datasetIndex && n.index === t.index, on = class extends Z {
    constructor(t){
        super(), this._added = !1, this.legendHitBoxes = [], this._hoveredItem = null, this.doughnutMode = !1, this.chart = t.chart, this.options = t.options, this.ctx = t.ctx, this.legendItems = void 0, this.columnSizes = void 0, this.lineWidths = void 0, this.maxHeight = void 0, this.maxWidth = void 0, this.top = void 0, this.bottom = void 0, this.left = void 0, this.right = void 0, this.height = void 0, this.width = void 0, this._margins = void 0, this.position = void 0, this.weight = void 0, this.fullSize = void 0;
    }
    update(t, e, i) {
        let s = this;
        s.maxWidth = t, s.maxHeight = e, s._margins = i, s.setDimensions(), s.buildLabels(), s.fit();
    }
    setDimensions() {
        let t = this;
        t.isHorizontal() ? (t.width = t.maxWidth, t.left = 0, t.right = t.width) : (t.height = t.maxHeight, t.top = 0, t.bottom = t.height);
    }
    buildLabels() {
        let t = this, e = t.options.labels || {}, i = R(e.generateLabels, [
            t.chart
        ], t) || [];
        e.filter && (i = i.filter((s)=>e.filter(s, t.chart.data))), e.sort && (i = i.sort((s, o)=>e.sort(s, o, t.chart.data))), t.options.reverse && i.reverse(), t.legendItems = i;
    }
    fit() {
        let t = this, { options: e , ctx: i  } = t;
        if (!e.display) {
            t.width = t.height = 0;
            return;
        }
        let s = e.labels, o = N(s.font), a = o.size, r = t._computeTitleHeight(), { boxWidth: l , itemHeight: c  } = zs(s, a), d, u;
        i.font = o.string, t.isHorizontal() ? (d = t.maxWidth, u = t._fitRows(r, a, l, c) + 10) : (u = t.maxHeight, d = t._fitCols(r, a, l, c) + 10), t.width = Math.min(d, e.maxWidth || t.maxWidth), t.height = Math.min(u, e.maxHeight || t.maxHeight);
    }
    _fitRows(t, e, i, s) {
        let o = this, { ctx: a , maxWidth: r , options: { labels: { padding: l  }  }  } = o, c = o.legendHitBoxes = [], d = o.lineWidths = [
            0
        ], u = s + l, f = t;
        a.textAlign = "left", a.textBaseline = "middle";
        let h = -1, g = -u;
        return o.legendItems.forEach((p, m)=>{
            let b = i + e / 2 + a.measureText(p.text).width;
            (m === 0 || d[d.length - 1] + b + 2 * l > r) && (f += u, d[d.length - (m > 0 ? 0 : 1)] = 0, g += u, h++), c[m] = {
                left: 0,
                top: g,
                row: h,
                width: b,
                height: s
            }, d[d.length - 1] += b + l;
        }), f;
    }
    _fitCols(t, e, i, s) {
        let o = this, { ctx: a , maxHeight: r , options: { labels: { padding: l  }  }  } = o, c = o.legendHitBoxes = [], d = o.columnSizes = [], u = r - t, f = l, h = 0, g = 0, p = 0, m = 0, b = 0;
        return o.legendItems.forEach((x, y)=>{
            let _ = i + e / 2 + a.measureText(x.text).width;
            y > 0 && g + e + 2 * l > u && (f += h + l, d.push({
                width: h,
                height: g
            }), p += h + l, b++, m = 0, h = g = 0), h = Math.max(h, _), g += e + l, c[y] = {
                left: p,
                top: m,
                col: b,
                width: _,
                height: s
            }, m += s + l;
        }), f += h, d.push({
            width: h,
            height: g
        }), f;
    }
    adjustHitBoxes() {
        let t = this;
        if (!t.options.display) return;
        let e = t._computeTitleHeight(), { legendHitBoxes: i , options: { align: s , labels: { padding: o  }  }  } = t;
        if (this.isHorizontal()) {
            let a = 0, r = $(s, t.left + o, t.right - t.lineWidths[a]);
            for (let l of i)a !== l.row && (a = l.row, r = $(s, t.left + o, t.right - t.lineWidths[a])), l.top += t.top + e + o, l.left = r, r += l.width + o;
        } else {
            let a1 = 0, r1 = $(s, t.top + e + o, t.bottom - t.columnSizes[a1].height);
            for (let l1 of i)l1.col !== a1 && (a1 = l1.col, r1 = $(s, t.top + e + o, t.bottom - t.columnSizes[a1].height)), l1.top = r1, l1.left += t.left + o, r1 += l1.height + o;
        }
    }
    isHorizontal() {
        return this.options.position === "top" || this.options.position === "bottom";
    }
    draw() {
        let t = this;
        if (t.options.display) {
            let e = t.ctx;
            Bt(e, t), t._draw(), Vt(e);
        }
    }
    _draw() {
        let t = this, { options: e , columnSizes: i , lineWidths: s , ctx: o  } = t, { align: a , labels: r  } = e, l = P.color, c = Ht(e.rtl, t.left, t.width), d = N(r.font), { color: u , padding: f  } = r, h = d.size, g = h / 2, p;
        t.drawTitle(), o.textAlign = c.textAlign("left"), o.textBaseline = "middle", o.lineWidth = .5, o.font = d.string;
        let { boxWidth: m , boxHeight: b , itemHeight: x  } = zs(r, h), y = function(k, z, F) {
            if (isNaN(m) || m <= 0 || isNaN(b) || b < 0) return;
            o.save();
            let I = S(F.lineWidth, 1);
            if (o.fillStyle = S(F.fillStyle, l), o.lineCap = S(F.lineCap, "butt"), o.lineDashOffset = S(F.lineDashOffset, 0), o.lineJoin = S(F.lineJoin, "miter"), o.lineWidth = I, o.strokeStyle = S(F.strokeStyle, l), o.setLineDash(S(F.lineDash, [])), r.usePointStyle) {
                let j = {
                    radius: m * Math.SQRT2 / 2,
                    pointStyle: F.pointStyle,
                    rotation: F.rotation,
                    borderWidth: I
                }, O = c.xPlus(k, m / 2), C = z + g;
                ce(o, j, O, C);
            } else {
                let j1 = z + Math.max((h - b) / 2, 0), O1 = c.leftForLtr(k, m), C1 = Ye(F.borderRadius);
                o.beginPath(), Object.values(C1).some((Y)=>Y !== 0) ? de(o, {
                    x: O1,
                    y: j1,
                    w: m,
                    h: b,
                    radius: C1
                }) : o.rect(O1, j1, m, b), o.fill(), I !== 0 && o.stroke();
            }
            o.restore();
        }, _ = function(k, z, F) {
            bt(o, F.text, k, z + x / 2, d, {
                strikethrough: F.hidden,
                textAlign: F.textAlign
            });
        }, v = t.isHorizontal(), M = this._computeTitleHeight();
        v ? p = {
            x: $(a, t.left + f, t.right - s[0]),
            y: t.top + f + M,
            line: 0
        } : p = {
            x: t.left + f,
            y: $(a, t.top + M + f, t.bottom - i[0].height),
            line: 0
        }, Vn(t.ctx, e.textDirection);
        let w = x + f;
        t.legendItems.forEach((k, z)=>{
            o.strokeStyle = k.fontColor || u, o.fillStyle = k.fontColor || u;
            let F = o.measureText(k.text).width, I = c.textAlign(k.textAlign || (k.textAlign = r.textAlign)), j = m + h / 2 + F, O = p.x, C = p.y;
            c.setWidth(t.width), v ? z > 0 && O + j + f > t.right && (C = p.y += w, p.line++, O = p.x = $(a, t.left + f, t.right - s[p.line])) : z > 0 && C + w > t.bottom && (O = p.x = O + i[p.line].width + f, p.line++, C = p.y = $(a, t.top + M + f, t.bottom - i[p.line].height));
            let Y = c.x(O);
            y(Y, C, k), O = ki(I, O + m + g, t.right), _(c.x(O), C, k), v ? p.x += j + f : p.y += w;
        }), Wn(t.ctx, e.textDirection);
    }
    drawTitle() {
        let t = this, e = t.options, i = e.title, s = N(i.font), o = X(i.padding);
        if (!i.display) return;
        let a = Ht(e.rtl, t.left, t.width), r = t.ctx, l = i.position, c = s.size / 2, d = o.top + c, u, f = t.left, h = t.width;
        if (this.isHorizontal()) h = Math.max(...t.lineWidths), u = t.top + d, f = $(e.align, f, t.right - h);
        else {
            let p = t.columnSizes.reduce((m, b)=>Math.max(m, b.height), 0);
            u = d + $(e.align, t.top, t.bottom - p - e.labels.padding - t._computeTitleHeight());
        }
        let g = $(l, f, f + h);
        r.textAlign = a.textAlign(Be(l)), r.textBaseline = "middle", r.strokeStyle = i.color, r.fillStyle = i.color, r.font = s.string, bt(r, i.text, g, u, s);
    }
    _computeTitleHeight() {
        let t = this.options.title, e = N(t.font), i = X(t.padding);
        return t.display ? e.lineHeight + i.height : 0;
    }
    _getLegendItemAt(t, e) {
        let i = this, s, o, a;
        if (t >= i.left && t <= i.right && e >= i.top && e <= i.bottom) {
            for(a = i.legendHitBoxes, s = 0; s < a.length; ++s)if (o = a[s], t >= o.left && t <= o.left + o.width && e >= o.top && e <= o.top + o.height) return i.legendItems[s];
        }
        return null;
    }
    handleEvent(t) {
        let e = this, i = e.options;
        if (!Rl(t.type, i)) return;
        let s = e._getLegendItemAt(t.x, t.y);
        if (t.type === "mousemove") {
            let o = e._hoveredItem, a = Ll(o, s);
            o && !a && R(i.onLeave, [
                t,
                o,
                e
            ], e), e._hoveredItem = s, s && !a && R(i.onHover, [
                t,
                s,
                e
            ], e);
        } else s && R(i.onClick, [
            t,
            s,
            e
        ], e);
    }
};
function Rl(n, t) {
    return !!(n === "mousemove" && (t.onHover || t.onLeave) || t.onClick && (n === "click" || n === "mouseup"));
}
var Fl = {
    id: "legend",
    _element: on,
    start (n, t, e) {
        let i = n.legend = new on({
            ctx: n.ctx,
            options: e,
            chart: n
        });
        tt.configure(n, i, e), tt.addBox(n, i);
    },
    stop (n) {
        tt.removeBox(n, n.legend), delete n.legend;
    },
    beforeUpdate (n, t, e) {
        let i = n.legend;
        tt.configure(n, i, e), i.options = e;
    },
    afterUpdate (n) {
        let t = n.legend;
        t.buildLabels(), t.adjustHitBoxes();
    },
    afterEvent (n, t) {
        t.replay || n.legend.handleEvent(t.event);
    },
    defaults: {
        display: !0,
        position: "top",
        align: "center",
        fullSize: !0,
        reverse: !1,
        weight: 1e3,
        onClick (n, t, e) {
            let i = t.datasetIndex, s = e.chart;
            s.isDatasetVisible(i) ? (s.hide(i), t.hidden = !0) : (s.show(i), t.hidden = !1);
        },
        onHover: null,
        onLeave: null,
        labels: {
            color: (n)=>n.chart.options.color,
            boxWidth: 40,
            padding: 10,
            generateLabels (n) {
                let t = n.data.datasets, { labels: { usePointStyle: e , pointStyle: i , textAlign: s , color: o  }  } = n.legend.options;
                return n._getSortedDatasetMetas().map((a)=>{
                    let r = a.controller.getStyle(e ? 0 : void 0), l = X(r.borderWidth);
                    return {
                        text: t[a.index].label,
                        fillStyle: r.backgroundColor,
                        fontColor: o,
                        hidden: !a.visible,
                        lineCap: r.borderCapStyle,
                        lineDash: r.borderDash,
                        lineDashOffset: r.borderDashOffset,
                        lineJoin: r.borderJoinStyle,
                        lineWidth: (l.width + l.height) / 4,
                        strokeStyle: r.borderColor,
                        pointStyle: i || r.pointStyle,
                        rotation: r.rotation,
                        textAlign: s || r.textAlign,
                        borderRadius: 0,
                        datasetIndex: a.index
                    };
                }, this);
            }
        },
        title: {
            color: (n)=>n.chart.options.color,
            display: !1,
            position: "center",
            text: ""
        }
    },
    descriptors: {
        _scriptable: (n)=>!n.startsWith("on"),
        labels: {
            _scriptable: (n)=>![
                    "generateLabels",
                    "filter",
                    "sort"
                ].includes(n)
        }
    }
}, an = class extends Z {
    constructor(t){
        super(), this.chart = t.chart, this.options = t.options, this.ctx = t.ctx, this._padding = void 0, this.top = void 0, this.bottom = void 0, this.left = void 0, this.right = void 0, this.width = void 0, this.height = void 0, this.position = void 0, this.weight = void 0, this.fullSize = void 0;
    }
    update(t, e) {
        let i = this, s = i.options;
        if (i.left = 0, i.top = 0, !s.display) {
            i.width = i.height = i.right = i.bottom = 0;
            return;
        }
        i.width = i.right = t, i.height = i.bottom = e;
        let o = E(s.text) ? s.text.length : 1;
        i._padding = X(s.padding);
        let a = o * N(s.font).lineHeight + i._padding.height;
        i.isHorizontal() ? i.height = a : i.width = a;
    }
    isHorizontal() {
        let t = this.options.position;
        return t === "top" || t === "bottom";
    }
    _drawArgs(t) {
        let { top: e , left: i , bottom: s , right: o , options: a  } = this, r = a.align, l = 0, c, d, u;
        return this.isHorizontal() ? (d = $(r, i, o), u = e + t, c = o - i) : (a.position === "left" ? (d = i + t, u = $(r, s, e), l = W * -.5) : (d = o - t, u = $(r, e, s), l = W * .5), c = s - e), {
            titleX: d,
            titleY: u,
            maxWidth: c,
            rotation: l
        };
    }
    draw() {
        let t = this, e = t.ctx, i = t.options;
        if (!i.display) return;
        let s = N(i.font), a = s.lineHeight / 2 + t._padding.top, { titleX: r , titleY: l , maxWidth: c , rotation: d  } = t._drawArgs(a);
        bt(e, i.text, 0, 0, s, {
            color: i.color,
            maxWidth: c,
            rotation: d,
            textAlign: Be(i.align),
            textBaseline: "middle",
            translation: [
                r,
                l
            ]
        });
    }
};
function El(n, t) {
    let e = new an({
        ctx: n.ctx,
        options: t,
        chart: n
    });
    tt.configure(n, e, t), tt.addBox(n, e), n.titleBlock = e;
}
var zl = {
    id: "title",
    _element: an,
    start (n, t, e) {
        El(n, e);
    },
    stop (n) {
        let t = n.titleBlock;
        tt.removeBox(n, t), delete n.titleBlock;
    },
    beforeUpdate (n, t, e) {
        let i = n.titleBlock;
        tt.configure(n, i, e), i.options = e;
    },
    defaults: {
        align: "center",
        display: !1,
        font: {
            weight: "bold"
        },
        fullSize: !0,
        padding: 10,
        position: "top",
        text: "",
        weight: 2e3
    },
    defaultRoutes: {
        color: "color"
    },
    descriptors: {
        _scriptable: !0,
        _indexable: !1
    }
}, _e = {
    average (n) {
        if (!n.length) return !1;
        let t, e, i = 0, s = 0, o = 0;
        for(t = 0, e = n.length; t < e; ++t){
            let a = n[t].element;
            if (a && a.hasValue()) {
                let r = a.tooltipPosition();
                i += r.x, s += r.y, ++o;
            }
        }
        return {
            x: i / o,
            y: s / o
        };
    },
    nearest (n, t) {
        if (!n.length) return !1;
        let e = t.x, i = t.y, s = Number.POSITIVE_INFINITY, o, a, r;
        for(o = 0, a = n.length; o < a; ++o){
            let l = n[o].element;
            if (l && l.hasValue()) {
                let c = l.getCenterPoint(), d = ze(t, c);
                d < s && (s = d, r = l);
            }
        }
        if (r) {
            let l1 = r.tooltipPosition();
            e = l1.x, i = l1.y;
        }
        return {
            x: e,
            y: i
        };
    }
};
function ot(n, t) {
    return t && (E(t) ? Array.prototype.push.apply(n, t) : n.push(t)), n;
}
function dt(n) {
    return (typeof n == "string" || n instanceof String) && n.indexOf(`
`) > -1 ? n.split(`
`) : n;
}
function Il(n, t) {
    let { element: e , datasetIndex: i , index: s  } = t, o = n.getDatasetMeta(i).controller, { label: a , value: r  } = o.getLabelAndValue(s);
    return {
        chart: n,
        label: a,
        parsed: o.getParsed(s),
        raw: n.data.datasets[i].data[s],
        formattedValue: r,
        dataset: o.getDataset(),
        dataIndex: s,
        datasetIndex: i,
        element: e
    };
}
function Is(n, t) {
    let e = n._chart.ctx, { body: i , footer: s , title: o  } = n, { boxWidth: a , boxHeight: r  } = t, l = N(t.bodyFont), c = N(t.titleFont), d = N(t.footerFont), u = o.length, f = s.length, h = i.length, g = X(t.padding), p = g.height, m = 0, b = i.reduce((_, v)=>_ + v.before.length + v.lines.length + v.after.length, 0);
    if (b += n.beforeBody.length + n.afterBody.length, u && (p += u * c.lineHeight + (u - 1) * t.titleSpacing + t.titleMarginBottom), b) {
        let _ = t.displayColors ? Math.max(r, l.lineHeight) : l.lineHeight;
        p += h * _ + (b - h) * l.lineHeight + (b - 1) * t.bodySpacing;
    }
    f && (p += t.footerMarginTop + f * d.lineHeight + (f - 1) * t.footerSpacing);
    let x = 0, y = function(_) {
        m = Math.max(m, e.measureText(_).width + x);
    };
    return e.save(), e.font = c.string, T(n.title, y), e.font = l.string, T(n.beforeBody.concat(n.afterBody), y), x = t.displayColors ? a + 2 : 0, T(i, (_)=>{
        T(_.before, y), T(_.lines, y), T(_.after, y);
    }), x = 0, e.font = d.string, T(n.footer, y), e.restore(), m += g.width, {
        width: m,
        height: p
    };
}
function Bl(n, t) {
    let { y: e , height: i  } = t;
    return e < i / 2 ? "top" : e > n.height - i / 2 ? "bottom" : "center";
}
function Vl(n, t, e, i) {
    let { x: s , width: o  } = i, a = e.caretSize + e.caretPadding;
    if (n === "left" && s + o + a > t.width || n === "right" && s - o - a < 0) return !0;
}
function Wl(n, t, e, i) {
    let { x: s , width: o  } = e, { width: a , chartArea: { left: r , right: l  }  } = n, c = "center";
    return i === "center" ? c = s <= (r + l) / 2 ? "left" : "right" : s <= o / 2 ? c = "left" : s >= a - o / 2 && (c = "right"), Vl(c, n, t, e) && (c = "center"), c;
}
function Bs(n, t, e) {
    let i = t.yAlign || Bl(n, e);
    return {
        xAlign: t.xAlign || Wl(n, t, e, i),
        yAlign: i
    };
}
function Hl(n, t) {
    let { x: e , width: i  } = n;
    return t === "right" ? e -= i : t === "center" && (e -= i / 2), e;
}
function Nl(n, t, e) {
    let { y: i , height: s  } = n;
    return t === "top" ? i += e : t === "bottom" ? i -= s + e : i -= s / 2, i;
}
function Vs(n, t, e, i) {
    let { caretSize: s , caretPadding: o , cornerRadius: a  } = n, { xAlign: r , yAlign: l  } = e, c = s + o, d = a + o, u = Hl(t, r), f = Nl(t, l, c);
    return l === "center" ? r === "left" ? u += c : r === "right" && (u -= c) : r === "left" ? u -= d : r === "right" && (u += d), {
        x: U(u, 0, i.width - t.width),
        y: U(f, 0, i.height - t.height)
    };
}
function Ge(n, t, e) {
    let i = X(e.padding);
    return t === "center" ? n.x + n.width / 2 : t === "right" ? n.x + n.width - i.right : n.x + i.left;
}
function Ws(n) {
    return ot([], dt(n));
}
function jl(n, t, e) {
    return Object.assign(Object.create(n), {
        tooltip: t,
        tooltipItems: e,
        type: "tooltip"
    });
}
function Hs(n, t) {
    let e = t && t.dataset && t.dataset.tooltip && t.dataset.tooltip.callbacks;
    return e ? n.override(e) : n;
}
var we = class extends Z {
    constructor(t){
        super(), this.opacity = 0, this._active = [], this._chart = t._chart, this._eventPosition = void 0, this._size = void 0, this._cachedAnimations = void 0, this._tooltipItems = [], this.$animations = void 0, this.$context = void 0, this.options = t.options, this.dataPoints = void 0, this.title = void 0, this.beforeBody = void 0, this.body = void 0, this.afterBody = void 0, this.footer = void 0, this.xAlign = void 0, this.yAlign = void 0, this.x = void 0, this.y = void 0, this.height = void 0, this.width = void 0, this.caretX = void 0, this.caretY = void 0, this.labelColors = void 0, this.labelPointStyles = void 0, this.labelTextColors = void 0;
    }
    initialize(t) {
        this.options = t, this._cachedAnimations = void 0, this.$context = void 0;
    }
    _resolveAnimations() {
        let t = this, e = t._cachedAnimations;
        if (e) return e;
        let i = t._chart, s = t.options.setContext(t.getContext()), o = s.enabled && i.options.animation && s.animations, a = new Je(t._chart, o);
        return o._cacheable && (t._cachedAnimations = Object.freeze(a)), a;
    }
    getContext() {
        let t = this;
        return t.$context || (t.$context = jl(t._chart.getContext(), t, t._tooltipItems));
    }
    getTitle(t, e) {
        let i = this, { callbacks: s  } = e, o = s.beforeTitle.apply(i, [
            t
        ]), a = s.title.apply(i, [
            t
        ]), r = s.afterTitle.apply(i, [
            t
        ]), l = [];
        return l = ot(l, dt(o)), l = ot(l, dt(a)), l = ot(l, dt(r)), l;
    }
    getBeforeBody(t, e) {
        return Ws(e.callbacks.beforeBody.apply(this, [
            t
        ]));
    }
    getBody(t, e) {
        let i = this, { callbacks: s  } = e, o = [];
        return T(t, (a)=>{
            let r = {
                before: [],
                lines: [],
                after: []
            }, l = Hs(s, a);
            ot(r.before, dt(l.beforeLabel.call(i, a))), ot(r.lines, l.label.call(i, a)), ot(r.after, dt(l.afterLabel.call(i, a))), o.push(r);
        }), o;
    }
    getAfterBody(t, e) {
        return Ws(e.callbacks.afterBody.apply(this, [
            t
        ]));
    }
    getFooter(t, e) {
        let i = this, { callbacks: s  } = e, o = s.beforeFooter.apply(i, [
            t
        ]), a = s.footer.apply(i, [
            t
        ]), r = s.afterFooter.apply(i, [
            t
        ]), l = [];
        return l = ot(l, dt(o)), l = ot(l, dt(a)), l = ot(l, dt(r)), l;
    }
    _createItems(t) {
        let e = this, i = e._active, s = e._chart.data, o = [], a = [], r = [], l = [], c, d;
        for(c = 0, d = i.length; c < d; ++c)l.push(Il(e._chart, i[c]));
        return t.filter && (l = l.filter((u, f, h)=>t.filter(u, f, h, s))), t.itemSort && (l = l.sort((u, f)=>t.itemSort(u, f, s))), T(l, (u)=>{
            let f = Hs(t.callbacks, u);
            o.push(f.labelColor.call(e, u)), a.push(f.labelPointStyle.call(e, u)), r.push(f.labelTextColor.call(e, u));
        }), e.labelColors = o, e.labelPointStyles = a, e.labelTextColors = r, e.dataPoints = l, l;
    }
    update(t, e) {
        let i = this, s = i.options.setContext(i.getContext()), o = i._active, a, r = [];
        if (!o.length) i.opacity !== 0 && (a = {
            opacity: 0
        });
        else {
            let l = _e[s.position].call(i, o, i._eventPosition);
            r = i._createItems(s), i.title = i.getTitle(r, s), i.beforeBody = i.getBeforeBody(r, s), i.body = i.getBody(r, s), i.afterBody = i.getAfterBody(r, s), i.footer = i.getFooter(r, s);
            let c = i._size = Is(i, s), d = Object.assign({}, l, c), u = Bs(i._chart, s, d), f = Vs(s, d, u, i._chart);
            i.xAlign = u.xAlign, i.yAlign = u.yAlign, a = {
                opacity: 1,
                x: f.x,
                y: f.y,
                width: c.width,
                height: c.height,
                caretX: l.x,
                caretY: l.y
            };
        }
        i._tooltipItems = r, i.$context = void 0, a && i._resolveAnimations().update(i, a), t && s.external && s.external.call(i, {
            chart: i._chart,
            tooltip: i,
            replay: e
        });
    }
    drawCaret(t, e, i, s) {
        let o = this.getCaretPosition(t, i, s);
        e.lineTo(o.x1, o.y1), e.lineTo(o.x2, o.y2), e.lineTo(o.x3, o.y3);
    }
    getCaretPosition(t, e, i) {
        let { xAlign: s , yAlign: o  } = this, { cornerRadius: a , caretSize: r  } = i, { x: l , y: c  } = t, { width: d , height: u  } = e, f, h, g, p, m, b;
        return o === "center" ? (m = c + u / 2, s === "left" ? (f = l, h = f - r, p = m + r, b = m - r) : (f = l + d, h = f + r, p = m - r, b = m + r), g = f) : (s === "left" ? h = l + a + r : s === "right" ? h = l + d - a - r : h = this.caretX, o === "top" ? (p = c, m = p - r, f = h - r, g = h + r) : (p = c + u, m = p + r, f = h + r, g = h - r), b = p), {
            x1: f,
            x2: h,
            x3: g,
            y1: p,
            y2: m,
            y3: b
        };
    }
    drawTitle(t, e, i) {
        let s = this, o = s.title, a = o.length, r, l, c;
        if (a) {
            let d = Ht(i.rtl, s.x, s.width);
            for(t.x = Ge(s, i.titleAlign, i), e.textAlign = d.textAlign(i.titleAlign), e.textBaseline = "middle", r = N(i.titleFont), l = i.titleSpacing, e.fillStyle = i.titleColor, e.font = r.string, c = 0; c < a; ++c)e.fillText(o[c], d.x(t.x), t.y + r.lineHeight / 2), t.y += r.lineHeight + l, c + 1 === a && (t.y += i.titleMarginBottom - l);
        }
    }
    _drawColorBox(t, e, i, s, o) {
        let a = this, r = a.labelColors[i], l = a.labelPointStyles[i], { boxHeight: c , boxWidth: d  } = o, u = N(o.bodyFont), f = Ge(a, "left", o), h = s.x(f), g = c < u.lineHeight ? (u.lineHeight - c) / 2 : 0, p = e.y + g;
        if (o.usePointStyle) {
            let m = {
                radius: Math.min(d, c) / 2,
                pointStyle: l.pointStyle,
                rotation: l.rotation,
                borderWidth: 1
            }, b = s.leftForLtr(h, d) + d / 2, x = p + c / 2;
            t.strokeStyle = o.multiKeyBackground, t.fillStyle = o.multiKeyBackground, ce(t, m, b, x), t.strokeStyle = r.borderColor, t.fillStyle = r.backgroundColor, ce(t, m, b, x);
        } else {
            t.lineWidth = r.borderWidth || 1, t.strokeStyle = r.borderColor, t.setLineDash(r.borderDash || []), t.lineDashOffset = r.borderDashOffset || 0;
            let m1 = s.leftForLtr(h, d), b1 = s.leftForLtr(s.xPlus(h, 1), d - 2), x1 = Ye(r.borderRadius);
            Object.values(x1).some((y)=>y !== 0) ? (t.beginPath(), t.fillStyle = o.multiKeyBackground, de(t, {
                x: m1,
                y: p,
                w: d,
                h: c,
                radius: x1
            }), t.fill(), t.stroke(), t.fillStyle = r.backgroundColor, t.beginPath(), de(t, {
                x: b1,
                y: p + 1,
                w: d - 2,
                h: c - 2,
                radius: x1
            }), t.fill()) : (t.fillStyle = o.multiKeyBackground, t.fillRect(m1, p, d, c), t.strokeRect(m1, p, d, c), t.fillStyle = r.backgroundColor, t.fillRect(b1, p + 1, d - 2, c - 2));
        }
        t.fillStyle = a.labelTextColors[i];
    }
    drawBody(t, e, i) {
        let s = this, { body: o  } = s, { bodySpacing: a , bodyAlign: r , displayColors: l , boxHeight: c , boxWidth: d  } = i, u = N(i.bodyFont), f = u.lineHeight, h = 0, g = Ht(i.rtl, s.x, s.width), p = function(k) {
            e.fillText(k, g.x(t.x + h), t.y + f / 2), t.y += f + a;
        }, m = g.textAlign(r), b, x, y, _, v, M, w;
        for(e.textAlign = r, e.textBaseline = "middle", e.font = u.string, t.x = Ge(s, m, i), e.fillStyle = i.bodyColor, T(s.beforeBody, p), h = l && m !== "right" ? r === "center" ? d / 2 + 1 : d + 2 : 0, _ = 0, M = o.length; _ < M; ++_){
            for(b = o[_], x = s.labelTextColors[_], e.fillStyle = x, T(b.before, p), y = b.lines, l && y.length && (s._drawColorBox(e, t, _, g, i), f = Math.max(u.lineHeight, c)), v = 0, w = y.length; v < w; ++v)p(y[v]), f = u.lineHeight;
            T(b.after, p);
        }
        h = 0, f = u.lineHeight, T(s.afterBody, p), t.y -= a;
    }
    drawFooter(t, e, i) {
        let s = this, o = s.footer, a = o.length, r, l;
        if (a) {
            let c = Ht(i.rtl, s.x, s.width);
            for(t.x = Ge(s, i.footerAlign, i), t.y += i.footerMarginTop, e.textAlign = c.textAlign(i.footerAlign), e.textBaseline = "middle", r = N(i.footerFont), e.fillStyle = i.footerColor, e.font = r.string, l = 0; l < a; ++l)e.fillText(o[l], c.x(t.x), t.y + r.lineHeight / 2), t.y += r.lineHeight + i.footerSpacing;
        }
    }
    drawBackground(t, e, i, s) {
        let { xAlign: o , yAlign: a  } = this, { x: r , y: l  } = t, { width: c , height: d  } = i, u = s.cornerRadius;
        e.fillStyle = s.backgroundColor, e.strokeStyle = s.borderColor, e.lineWidth = s.borderWidth, e.beginPath(), e.moveTo(r + u, l), a === "top" && this.drawCaret(t, e, i, s), e.lineTo(r + c - u, l), e.quadraticCurveTo(r + c, l, r + c, l + u), a === "center" && o === "right" && this.drawCaret(t, e, i, s), e.lineTo(r + c, l + d - u), e.quadraticCurveTo(r + c, l + d, r + c - u, l + d), a === "bottom" && this.drawCaret(t, e, i, s), e.lineTo(r + u, l + d), e.quadraticCurveTo(r, l + d, r, l + d - u), a === "center" && o === "left" && this.drawCaret(t, e, i, s), e.lineTo(r, l + u), e.quadraticCurveTo(r, l, r + u, l), e.closePath(), e.fill(), s.borderWidth > 0 && e.stroke();
    }
    _updateAnimationTarget(t) {
        let e = this, i = e._chart, s = e.$animations, o = s && s.x, a = s && s.y;
        if (o || a) {
            let r = _e[t.position].call(e, e._active, e._eventPosition);
            if (!r) return;
            let l = e._size = Is(e, t), c = Object.assign({}, r, e._size), d = Bs(i, t, c), u = Vs(t, c, d, i);
            (o._to !== u.x || a._to !== u.y) && (e.xAlign = d.xAlign, e.yAlign = d.yAlign, e.width = l.width, e.height = l.height, e.caretX = r.x, e.caretY = r.y, e._resolveAnimations().update(e, u));
        }
    }
    draw(t) {
        let e = this, i = e.options.setContext(e.getContext()), s = e.opacity;
        if (!s) return;
        e._updateAnimationTarget(i);
        let o = {
            width: e.width,
            height: e.height
        }, a = {
            x: e.x,
            y: e.y
        };
        s = Math.abs(s) < .001 ? 0 : s;
        let r = X(i.padding), l = e.title.length || e.beforeBody.length || e.body.length || e.afterBody.length || e.footer.length;
        i.enabled && l && (t.save(), t.globalAlpha = s, e.drawBackground(a, t, o, i), Vn(t, i.textDirection), a.y += r.top, e.drawTitle(a, t, i), e.drawBody(a, t, i), e.drawFooter(a, t, i), Wn(t, i.textDirection), t.restore());
    }
    getActiveElements() {
        return this._active || [];
    }
    setActiveElements(t, e) {
        let i = this, s = i._active, o = t.map(({ datasetIndex: l , index: c  })=>{
            let d = i._chart.getDatasetMeta(l);
            if (!d) throw new Error("Cannot find a dataset at index " + l);
            return {
                datasetIndex: l,
                element: d.data[c],
                index: c
            };
        }), a = !oe(s, o), r = i._positionChanged(o, e);
        (a || r) && (i._active = o, i._eventPosition = e, i.update(!0));
    }
    handleEvent(t, e) {
        let i = this, s = i.options, o = i._active || [], a = !1, r = [];
        t.type !== "mouseout" && (r = i._chart.getElementsAtEventForMode(t, s.mode, s, e), s.reverse && r.reverse());
        let l = i._positionChanged(r, t);
        return a = e || !oe(r, o) || l, a && (i._active = r, (s.enabled || s.external) && (i._eventPosition = {
            x: t.x,
            y: t.y
        }, i.update(!0, e))), a;
    }
    _positionChanged(t, e) {
        let { caretX: i , caretY: s , options: o  } = this, a = _e[o.position].call(this, t, e);
        return a !== !1 && (i !== a.x || s !== a.y);
    }
};
we.positioners = _e;
var Yl = {
    id: "tooltip",
    _element: we,
    positioners: _e,
    afterInit (n, t, e) {
        e && (n.tooltip = new we({
            _chart: n,
            options: e
        }));
    },
    beforeUpdate (n, t, e) {
        n.tooltip && n.tooltip.initialize(e);
    },
    reset (n, t, e) {
        n.tooltip && n.tooltip.initialize(e);
    },
    afterDraw (n) {
        let t = n.tooltip, e = {
            tooltip: t
        };
        n.notifyPlugins("beforeTooltipDraw", e) !== !1 && (t && t.draw(n.ctx), n.notifyPlugins("afterTooltipDraw", e));
    },
    afterEvent (n, t) {
        if (n.tooltip) {
            let e = t.replay;
            n.tooltip.handleEvent(t.event, e) && (t.changed = !0);
        }
    },
    defaults: {
        enabled: !0,
        external: null,
        position: "average",
        backgroundColor: "rgba(0,0,0,0.8)",
        titleColor: "#fff",
        titleFont: {
            weight: "bold"
        },
        titleSpacing: 2,
        titleMarginBottom: 6,
        titleAlign: "left",
        bodyColor: "#fff",
        bodySpacing: 2,
        bodyFont: {},
        bodyAlign: "left",
        footerColor: "#fff",
        footerSpacing: 2,
        footerMarginTop: 6,
        footerFont: {
            weight: "bold"
        },
        footerAlign: "left",
        padding: 6,
        caretPadding: 2,
        caretSize: 5,
        cornerRadius: 6,
        boxHeight: (n, t)=>t.bodyFont.size,
        boxWidth: (n, t)=>t.bodyFont.size,
        multiKeyBackground: "#fff",
        displayColors: !0,
        borderColor: "rgba(0,0,0,0)",
        borderWidth: 0,
        animation: {
            duration: 400,
            easing: "easeOutQuart"
        },
        animations: {
            numbers: {
                type: "number",
                properties: [
                    "x",
                    "y",
                    "width",
                    "height",
                    "caretX",
                    "caretY"
                ]
            },
            opacity: {
                easing: "linear",
                duration: 200
            }
        },
        callbacks: {
            beforeTitle: it,
            title (n) {
                if (n.length > 0) {
                    let t = n[0], e = t.chart.data.labels, i = e ? e.length : 0;
                    if (this && this.options && this.options.mode === "dataset") return t.dataset.label || "";
                    if (t.label) return t.label;
                    if (i > 0 && t.dataIndex < i) return e[t.dataIndex];
                }
                return "";
            },
            afterTitle: it,
            beforeBody: it,
            beforeLabel: it,
            label (n) {
                if (this && this.options && this.options.mode === "dataset") return n.label + ": " + n.formattedValue || n.formattedValue;
                let t = n.dataset.label || "";
                t && (t += ": ");
                let e = n.formattedValue;
                return D(e) || (t += e), t;
            },
            labelColor (n) {
                let e = n.chart.getDatasetMeta(n.datasetIndex).controller.getStyle(n.dataIndex);
                return {
                    borderColor: e.borderColor,
                    backgroundColor: e.backgroundColor,
                    borderWidth: e.borderWidth,
                    borderDash: e.borderDash,
                    borderDashOffset: e.borderDashOffset,
                    borderRadius: 0
                };
            },
            labelTextColor () {
                return this.options.bodyColor;
            },
            labelPointStyle (n) {
                let e = n.chart.getDatasetMeta(n.datasetIndex).controller.getStyle(n.dataIndex);
                return {
                    pointStyle: e.pointStyle,
                    rotation: e.rotation
                };
            },
            afterLabel: it,
            afterBody: it,
            beforeFooter: it,
            footer: it,
            afterFooter: it
        }
    },
    defaultRoutes: {
        bodyFont: "font",
        footerFont: "font",
        titleFont: "font"
    },
    descriptors: {
        _scriptable: (n)=>n !== "filter" && n !== "itemSort" && n !== "external",
        _indexable: !1,
        callbacks: {
            _scriptable: !1,
            _indexable: !1
        },
        animation: {
            _fallback: !1
        },
        animations: {
            _fallback: "animation"
        }
    },
    additionalOptionScopes: [
        "interaction"
    ]
}, $l = Object.freeze({
    __proto__: null,
    Decimation: hl,
    Filler: Tl,
    Legend: Fl,
    Title: zl,
    Tooltip: Yl
}), Xl = (n, t, e)=>typeof t == "string" ? n.push(t) - 1 : isNaN(t) ? null : e;
function Ul(n, t, e) {
    let i = n.indexOf(t);
    if (i === -1) return Xl(n, t, e);
    let s = n.lastIndexOf(t);
    return i !== s ? e : i;
}
var Kl = (n, t)=>n === null ? null : U(Math.round(n), 0, t), Qt = class extends ft {
    constructor(t){
        super(t), this._startValue = void 0, this._valueRange = 0;
    }
    parse(t, e) {
        if (D(t)) return null;
        let i = this.getLabels();
        return e = isFinite(e) && i[e] === t ? e : Ul(i, t, S(e, t)), Kl(e, i.length - 1);
    }
    determineDataLimits() {
        let t = this, { minDefined: e , maxDefined: i  } = t.getUserBounds(), { min: s , max: o  } = t.getMinMax(!0);
        t.options.bounds === "ticks" && (e || (s = 0), i || (o = t.getLabels().length - 1)), t.min = s, t.max = o;
    }
    buildTicks() {
        let t = this, e = t.min, i = t.max, s = t.options.offset, o = [], a = t.getLabels();
        a = e === 0 && i === a.length - 1 ? a : a.slice(e, i + 1), t._valueRange = Math.max(a.length - (s ? 0 : 1), 1), t._startValue = t.min - (s ? .5 : 0);
        for(let r = e; r <= i; r++)o.push({
            value: r
        });
        return o;
    }
    getLabelForValue(t) {
        let i = this.getLabels();
        return t >= 0 && t < i.length ? i[t] : t;
    }
    configure() {
        let t = this;
        super.configure(), t.isHorizontal() || (t._reversePixels = !t._reversePixels);
    }
    getPixelForValue(t) {
        let e = this;
        return typeof t != "number" && (t = e.parse(t)), t === null ? NaN : e.getPixelForDecimal((t - e._startValue) / e._valueRange);
    }
    getPixelForTick(t) {
        let e = this, i = e.ticks;
        return t < 0 || t > i.length - 1 ? null : e.getPixelForValue(i[t].value);
    }
    getValueForPixel(t) {
        let e = this;
        return Math.round(e._startValue + e.getDecimalForPixel(t) * e._valueRange);
    }
    getBasePixel() {
        return this.bottom;
    }
};
Qt.id = "category";
Qt.defaults = {
    ticks: {
        callback: Qt.prototype.getLabelForValue
    }
};
function ql(n, t) {
    let e = [], { step: s , min: o , max: a , precision: r , count: l , maxTicks: c  } = n, d = s || 1, u = c - 1, { min: f , max: h  } = t, g = !D(o), p = !D(a), m = !D(l), b = wn((h - f) / u / d) * d, x, y, _, v;
    if (b < 1e-14 && !g && !p) return [
        {
            value: f
        },
        {
            value: h
        }
    ];
    v = Math.ceil(h / b) - Math.floor(f / b), v > u && (b = wn(v * b / u / d) * d), D(r) || (x = Math.pow(10, r), b = Math.ceil(b * x) / x), y = Math.floor(f / b) * b, _ = Math.ceil(h / b) * b, g && p && s && Ai((a - o) / s, b / 1e3) ? (v = Math.min((a - o) / b, c), b = (a - o) / v, y = o, _ = a) : m ? (y = g ? o : y, _ = p ? a : _, v = l - 1, b = (_ - y) / v) : (v = (_ - y) / b, ae(v, Math.round(v), b / 1e3) ? v = Math.round(v) : v = Math.ceil(v)), x = Math.pow(10, D(r) ? Ti(b) : r), y = Math.round(y * x) / x, _ = Math.round(_ * x) / x;
    let M = 0;
    for(g && (e.push({
        value: o
    }), y <= o && M++, ae(Math.round((y + M * b) * x) / x, o, b / 10) && M++); M < v; ++M)e.push({
        value: Math.round((y + M * b) * x) / x
    });
    return p ? ae(e[e.length - 1].value, a, b / 10) ? e[e.length - 1].value = a : e.push({
        value: a
    }) : e.push({
        value: _
    }), e;
}
var Jt = class extends ft {
    constructor(t){
        super(t), this.start = void 0, this.end = void 0, this._startValue = void 0, this._endValue = void 0, this._valueRange = 0;
    }
    parse(t, e) {
        return D(t) || (typeof t == "number" || t instanceof Number) && !isFinite(+t) ? null : +t;
    }
    handleTickRangeOptions() {
        let t = this, { beginAtZero: e , stacked: i  } = t.options, { minDefined: s , maxDefined: o  } = t.getUserBounds(), { min: a , max: r  } = t, l = (d)=>a = s ? a : d, c = (d)=>r = o ? r : d;
        if (e || i) {
            let d = rt(a), u = rt(r);
            d < 0 && u < 0 ? c(0) : d > 0 && u > 0 && l(0);
        }
        a === r && (c(r + 1), e || l(a - 1)), t.min = a, t.max = r;
    }
    getTickLimit() {
        let t = this, e = t.options.ticks, { maxTicksLimit: i , stepSize: s  } = e, o;
        return s ? o = Math.ceil(t.max / s) - Math.floor(t.min / s) + 1 : (o = t.computeTickLimit(), i = i || 11), i && (o = Math.min(i, o)), o;
    }
    computeTickLimit() {
        return Number.POSITIVE_INFINITY;
    }
    buildTicks() {
        let t = this, e = t.options, i = e.ticks, s = t.getTickLimit();
        s = Math.max(2, s);
        let o = {
            maxTicks: s,
            min: e.min,
            max: e.max,
            precision: i.precision,
            step: i.stepSize,
            count: i.count
        }, a = t._range || t, r = ql(o, a);
        return e.bounds === "ticks" && kn(r, t, "value"), e.reverse ? (r.reverse(), t.start = t.max, t.end = t.min) : (t.start = t.min, t.end = t.max), r;
    }
    configure() {
        let t = this, e = t.ticks, i = t.min, s = t.max;
        if (super.configure(), t.options.offset && e.length) {
            let o = (s - i) / Math.max(e.length - 1, 1) / 2;
            i -= o, s += o;
        }
        t._startValue = i, t._endValue = s, t._valueRange = s - i;
    }
    getLabelForValue(t) {
        return fe(t, this.chart.options.locale);
    }
}, ke = class extends Jt {
    determineDataLimits() {
        let t = this, { min: e , max: i  } = t.getMinMax(!0);
        t.min = V(e) ? e : 0, t.max = V(i) ? i : 1, t.handleTickRangeOptions();
    }
    computeTickLimit() {
        let t = this;
        if (t.isHorizontal()) return Math.ceil(t.width / 40);
        let e = t._resolveTickFontOptions(0);
        return Math.ceil(t.height / e.lineHeight);
    }
    getPixelForValue(t) {
        return t === null ? NaN : this.getPixelForDecimal((t - this._startValue) / this._valueRange);
    }
    getValueForPixel(t) {
        return this._startValue + this.getDecimalForPixel(t) * this._valueRange;
    }
};
ke.id = "linear";
ke.defaults = {
    ticks: {
        callback: rn.formatters.numeric
    }
};
function Ns(n) {
    return n / Math.pow(10, Math.floor(G(n))) === 1;
}
function Gl(n, t) {
    let e = Math.floor(G(t.max)), i = Math.ceil(t.max / Math.pow(10, e)), s = [], o = q(n.min, Math.pow(10, Math.floor(G(t.min)))), a = Math.floor(G(o)), r = Math.floor(o / Math.pow(10, a)), l = a < 0 ? Math.pow(10, Math.abs(a)) : 1;
    do s.push({
        value: o,
        major: Ns(o)
    }), ++r, r === 10 && (r = 1, ++a, l = a >= 0 ? 1 : l), o = Math.round(r * Math.pow(10, a) * l) / l;
    while (a < e || a === e && r < i)
    let c = q(n.max, o);
    return s.push({
        value: c,
        major: Ns(o)
    }), s;
}
var Se = class extends ft {
    constructor(t){
        super(t), this.start = void 0, this.end = void 0, this._startValue = void 0, this._valueRange = 0;
    }
    parse(t, e) {
        let i = Jt.prototype.parse.apply(this, [
            t,
            e
        ]);
        if (i === 0) {
            this._zero = !0;
            return;
        }
        return V(i) && i > 0 ? i : null;
    }
    determineDataLimits() {
        let t = this, { min: e , max: i  } = t.getMinMax(!0);
        t.min = V(e) ? Math.max(0, e) : null, t.max = V(i) ? Math.max(0, i) : null, t.options.beginAtZero && (t._zero = !0), t.handleTickRangeOptions();
    }
    handleTickRangeOptions() {
        let t = this, { minDefined: e , maxDefined: i  } = t.getUserBounds(), s = t.min, o = t.max, a = (c)=>s = e ? s : c, r = (c)=>o = i ? o : c, l = (c, d)=>Math.pow(10, Math.floor(G(c)) + d);
        s === o && (s <= 0 ? (a(1), r(10)) : (a(l(s, -1)), r(l(o, 1)))), s <= 0 && a(l(o, -1)), o <= 0 && r(l(s, 1)), t._zero && t.min !== t._suggestedMin && s === l(t.min, 0) && a(l(s, -1)), t.min = s, t.max = o;
    }
    buildTicks() {
        let t = this, e = t.options, i = {
            min: t._userMin,
            max: t._userMax
        }, s = Gl(i, t);
        return e.bounds === "ticks" && kn(s, t, "value"), e.reverse ? (s.reverse(), t.start = t.max, t.end = t.min) : (t.start = t.min, t.end = t.max), s;
    }
    getLabelForValue(t) {
        return t === void 0 ? "0" : fe(t, this.chart.options.locale);
    }
    configure() {
        let t = this, e = t.min;
        super.configure(), t._startValue = G(e), t._valueRange = G(t.max) - G(e);
    }
    getPixelForValue(t) {
        let e = this;
        return (t === void 0 || t === 0) && (t = e.min), t === null || isNaN(t) ? NaN : e.getPixelForDecimal(t === e.min ? 0 : (G(t) - e._startValue) / e._valueRange);
    }
    getValueForPixel(t) {
        let e = this, i = e.getDecimalForPixel(t);
        return Math.pow(10, e._startValue + i * e._valueRange);
    }
};
Se.id = "logarithmic";
Se.defaults = {
    ticks: {
        callback: rn.formatters.logarithmic,
        major: {
            enabled: !0
        }
    }
};
function ci(n) {
    let t = n.ticks;
    if (t.display && n.display) {
        let e = X(t.backdropPadding);
        return S(t.font && t.font.size, P.font.size) + e.height;
    }
    return 0;
}
function Zl(n, t, e) {
    return E(e) ? {
        w: Vi(n, n.font, e),
        h: e.length * t
    } : {
        w: n.measureText(e).width,
        h: t
    };
}
function js(n, t, e, i, s) {
    return n === i || n === s ? {
        start: t - e / 2,
        end: t + e / 2
    } : n < i || n > s ? {
        start: t - e,
        end: t
    } : {
        start: t,
        end: t + e
    };
}
function Ql(n) {
    let t = {
        l: 0,
        r: n.width,
        t: 0,
        b: n.height - n.paddingTop
    }, e = {}, i, s, o, a = [], r = [], l = n.getLabels().length;
    for(i = 0; i < l; i++){
        let f = n.options.pointLabels.setContext(n.getContext(i));
        r[i] = f.padding, o = n.getPointPosition(i, n.drawingArea + r[i]);
        let h = N(f.font);
        n.ctx.font = h.string, s = Zl(n.ctx, h.lineHeight, n._pointLabels[i]), a[i] = s;
        let g = n.getIndexAngle(i), p = We(g), m = js(p, o.x, s.w, 0, 180), b = js(p, o.y, s.h, 90, 270);
        m.start < t.l && (t.l = m.start, e.l = g), m.end > t.r && (t.r = m.end, e.r = g), b.start < t.t && (t.t = b.start, e.t = g), b.end > t.b && (t.b = b.end, e.b = g);
    }
    n._setReductions(n.drawingArea, t, e), n._pointLabelItems = [];
    let c = n.options, d = ci(c), u = n.getDistanceFromCenterForValue(c.ticks.reverse ? n.min : n.max);
    for(i = 0; i < l; i++){
        let f1 = i === 0 ? d / 2 : 0, h1 = n.getPointPosition(i, u + f1 + r[i]), g1 = We(n.getIndexAngle(i)), p1 = a[i];
        tc(g1, p1, h1);
        let m1 = Jl(g1), b1;
        m1 === "left" ? b1 = h1.x : m1 === "center" ? b1 = h1.x - p1.w / 2 : b1 = h1.x - p1.w;
        let x = b1 + p1.w;
        n._pointLabelItems[i] = {
            x: h1.x,
            y: h1.y,
            textAlign: m1,
            left: b1,
            top: h1.y,
            right: x,
            bottom: h1.y + p1.h
        };
    }
}
function Jl(n) {
    return n === 0 || n === 180 ? "center" : n < 180 ? "left" : "right";
}
function tc(n, t, e) {
    n === 90 || n === 270 ? e.y -= t.h / 2 : (n > 270 || n < 90) && (e.y -= t.h);
}
function ec(n, t) {
    let { ctx: e , options: { pointLabels: i  }  } = n;
    for(let s = t - 1; s >= 0; s--){
        let o = i.setContext(n.getContext(s)), a = N(o.font), { x: r , y: l , textAlign: c , left: d , top: u , right: f , bottom: h  } = n._pointLabelItems[s], { backdropColor: g  } = o;
        if (!D(g)) {
            let p = X(o.backdropPadding);
            e.fillStyle = g, e.fillRect(d - p.left, u - p.top, f - d + p.width, h - u + p.height);
        }
        bt(e, n._pointLabels[s], r, l + a.lineHeight / 2, a, {
            color: o.color,
            textAlign: c,
            textBaseline: "middle"
        });
    }
}
function po(n, t, e, i) {
    let { ctx: s  } = n;
    if (e) s.arc(n.xCenter, n.yCenter, t, 0, L);
    else {
        let o = n.getPointPosition(0, t);
        s.moveTo(o.x, o.y);
        for(let a = 1; a < i; a++)o = n.getPointPosition(a, t), s.lineTo(o.x, o.y);
    }
}
function nc(n, t, e, i) {
    let s = n.ctx, o = t.circular, { color: a , lineWidth: r  } = t;
    !o && !i || !a || !r || e < 0 || (s.save(), s.strokeStyle = a, s.lineWidth = r, s.setLineDash(t.borderDash), s.lineDashOffset = t.borderDashOffset, s.beginPath(), po(n, e, o, i), s.closePath(), s.stroke(), s.restore());
}
function Ze(n) {
    return St(n) ? n : 0;
}
var Ot = class extends Jt {
    constructor(t){
        super(t), this.xCenter = void 0, this.yCenter = void 0, this.drawingArea = void 0, this._pointLabels = [], this._pointLabelItems = [];
    }
    setDimensions() {
        let t = this;
        t.width = t.maxWidth, t.height = t.maxHeight, t.paddingTop = ci(t.options) / 2, t.xCenter = Math.floor(t.width / 2), t.yCenter = Math.floor((t.height - t.paddingTop) / 2), t.drawingArea = Math.min(t.height - t.paddingTop, t.width) / 2;
    }
    determineDataLimits() {
        let t = this, { min: e , max: i  } = t.getMinMax(!1);
        t.min = V(e) && !isNaN(e) ? e : 0, t.max = V(i) && !isNaN(i) ? i : 0, t.handleTickRangeOptions();
    }
    computeTickLimit() {
        return Math.ceil(this.drawingArea / ci(this.options));
    }
    generateTickLabels(t) {
        let e = this;
        Jt.prototype.generateTickLabels.call(e, t), e._pointLabels = e.getLabels().map((i, s)=>{
            let o = R(e.options.pointLabels.callback, [
                i,
                s
            ], e);
            return o || o === 0 ? o : "";
        });
    }
    fit() {
        let t = this, e = t.options;
        e.display && e.pointLabels.display ? Ql(t) : t.setCenterPoint(0, 0, 0, 0);
    }
    _setReductions(t, e, i) {
        let s = this, o = e.l / Math.sin(i.l), a = Math.max(e.r - s.width, 0) / Math.sin(i.r), r = -e.t / Math.cos(i.t), l = -Math.max(e.b - (s.height - s.paddingTop), 0) / Math.cos(i.b);
        o = Ze(o), a = Ze(a), r = Ze(r), l = Ze(l), s.drawingArea = Math.max(t / 2, Math.min(Math.floor(t - (o + a) / 2), Math.floor(t - (r + l) / 2))), s.setCenterPoint(o, a, r, l);
    }
    setCenterPoint(t, e, i, s) {
        let o = this, a = o.width - e - o.drawingArea, r = t + o.drawingArea, l = i + o.drawingArea, c = o.height - o.paddingTop - s - o.drawingArea;
        o.xCenter = Math.floor((r + a) / 2 + o.left), o.yCenter = Math.floor((l + c) / 2 + o.top + o.paddingTop);
    }
    getIndexAngle(t) {
        let e = L / this.getLabels().length, i = this.options.startAngle || 0;
        return J(t * e + st(i));
    }
    getDistanceFromCenterForValue(t) {
        let e = this;
        if (D(t)) return NaN;
        let i = e.drawingArea / (e.max - e.min);
        return e.options.reverse ? (e.max - t) * i : (t - e.min) * i;
    }
    getValueForDistanceFromCenter(t) {
        if (D(t)) return NaN;
        let e = this, i = t / (e.drawingArea / (e.max - e.min));
        return e.options.reverse ? e.max - i : e.min + i;
    }
    getPointPosition(t, e) {
        let i = this, s = i.getIndexAngle(t) - B;
        return {
            x: Math.cos(s) * e + i.xCenter,
            y: Math.sin(s) * e + i.yCenter,
            angle: s
        };
    }
    getPointPositionForValue(t, e) {
        return this.getPointPosition(t, this.getDistanceFromCenterForValue(e));
    }
    getBasePosition(t) {
        return this.getPointPositionForValue(t || 0, this.getBaseValue());
    }
    getPointLabelPosition(t) {
        let { left: e , top: i , right: s , bottom: o  } = this._pointLabelItems[t];
        return {
            left: e,
            top: i,
            right: s,
            bottom: o
        };
    }
    drawBackground() {
        let t = this, { backgroundColor: e , grid: { circular: i  }  } = t.options;
        if (e) {
            let s = t.ctx;
            s.save(), s.beginPath(), po(t, t.getDistanceFromCenterForValue(t._endValue), i, t.getLabels().length), s.closePath(), s.fillStyle = e, s.fill(), s.restore();
        }
    }
    drawGrid() {
        let t = this, e = t.ctx, i = t.options, { angleLines: s , grid: o  } = i, a = t.getLabels().length, r, l, c;
        if (i.pointLabels.display && ec(t, a), o.display && t.ticks.forEach((d, u)=>{
            if (u !== 0) {
                l = t.getDistanceFromCenterForValue(d.value);
                let f = o.setContext(t.getContext(u - 1));
                nc(t, f, l, a);
            }
        }), s.display) {
            for(e.save(), r = t.getLabels().length - 1; r >= 0; r--){
                let d = s.setContext(t.getContext(r)), { color: u , lineWidth: f  } = d;
                !f || !u || (e.lineWidth = f, e.strokeStyle = u, e.setLineDash(d.borderDash), e.lineDashOffset = d.borderDashOffset, l = t.getDistanceFromCenterForValue(i.ticks.reverse ? t.min : t.max), c = t.getPointPosition(r, l), e.beginPath(), e.moveTo(t.xCenter, t.yCenter), e.lineTo(c.x, c.y), e.stroke());
            }
            e.restore();
        }
    }
    drawBorder() {}
    drawLabels() {
        let t = this, e = t.ctx, i = t.options, s = i.ticks;
        if (!s.display) return;
        let o = t.getIndexAngle(0), a, r;
        e.save(), e.translate(t.xCenter, t.yCenter), e.rotate(o), e.textAlign = "center", e.textBaseline = "middle", t.ticks.forEach((l, c)=>{
            if (c === 0 && !i.reverse) return;
            let d = s.setContext(t.getContext(c)), u = N(d.font);
            if (a = t.getDistanceFromCenterForValue(t.ticks[c].value), d.showLabelBackdrop) {
                r = e.measureText(l.label).width, e.fillStyle = d.backdropColor;
                let f = X(d.backdropPadding);
                e.fillRect(-r / 2 - f.left, -a - u.size / 2 - f.top, r + f.width, u.size + f.height);
            }
            bt(e, l.label, 0, -a, u, {
                color: d.color
            });
        }), e.restore();
    }
    drawTitle() {}
};
Ot.id = "radialLinear";
Ot.defaults = {
    display: !0,
    animate: !0,
    position: "chartArea",
    angleLines: {
        display: !0,
        lineWidth: 1,
        borderDash: [],
        borderDashOffset: 0
    },
    grid: {
        circular: !1
    },
    startAngle: 0,
    ticks: {
        showLabelBackdrop: !0,
        callback: rn.formatters.numeric
    },
    pointLabels: {
        backdropColor: void 0,
        backdropPadding: 2,
        display: !0,
        font: {
            size: 10
        },
        callback (n) {
            return n;
        },
        padding: 5
    }
};
Ot.defaultRoutes = {
    "angleLines.color": "borderColor",
    "pointLabels.color": "color",
    "ticks.color": "color"
};
Ot.descriptors = {
    angleLines: {
        _fallback: "grid"
    }
};
var ln = {
    millisecond: {
        common: !0,
        size: 1,
        steps: 1e3
    },
    second: {
        common: !0,
        size: 1e3,
        steps: 60
    },
    minute: {
        common: !0,
        size: 6e4,
        steps: 60
    },
    hour: {
        common: !0,
        size: 36e5,
        steps: 24
    },
    day: {
        common: !0,
        size: 864e5,
        steps: 30
    },
    week: {
        common: !1,
        size: 6048e5,
        steps: 4
    },
    month: {
        common: !0,
        size: 2628e6,
        steps: 12
    },
    quarter: {
        common: !1,
        size: 7884e6,
        steps: 4
    },
    year: {
        common: !0,
        size: 3154e7
    }
}, K = Object.keys(ln);
function ic(n, t) {
    return n - t;
}
function Ys(n, t) {
    if (D(t)) return null;
    let e = n._adapter, { parser: i , round: s , isoWeekday: o  } = n._parseOpts, a = t;
    return typeof i == "function" && (a = i(a)), V(a) || (a = typeof i == "string" ? e.parse(a, i) : e.parse(a)), a === null ? null : (s && (a = s === "week" && (St(o) || o === !0) ? e.startOf(a, "isoWeek", o) : e.startOf(a, s)), +a);
}
function $s(n, t, e, i) {
    let s = K.length;
    for(let o = K.indexOf(n); o < s - 1; ++o){
        let a = ln[K[o]], r = a.steps ? a.steps : Number.MAX_SAFE_INTEGER;
        if (a.common && Math.ceil((e - t) / (r * a.size)) <= i) return K[o];
    }
    return K[s - 1];
}
function sc(n, t, e, i, s) {
    for(let o = K.length - 1; o >= K.indexOf(e); o--){
        let a = K[o];
        if (ln[a].common && n._adapter.diff(s, i, a) >= t - 1) return a;
    }
    return K[e ? K.indexOf(e) : 0];
}
function oc(n) {
    for(let t = K.indexOf(n) + 1, e = K.length; t < e; ++t)if (ln[K[t]].common) return K[t];
}
function Xs(n, t, e) {
    if (!e) n[t] = !0;
    else if (e.length) {
        let { lo: i , hi: s  } = ue(e, t), o = e[i] >= t ? e[i] : e[s];
        n[o] = !0;
    }
}
function ac(n, t, e, i) {
    let s = n._adapter, o = +s.startOf(t[0].value, i), a = t[t.length - 1].value, r, l;
    for(r = o; r <= a; r = +s.add(r, 1, i))l = e[r], l >= 0 && (t[l].major = !0);
    return t;
}
function Us(n, t, e) {
    let i = [], s = {}, o = t.length, a, r;
    for(a = 0; a < o; ++a)r = t[a], s[r] = a, i.push({
        value: r,
        major: !1
    });
    return o === 0 || !e ? i : ac(n, i, s, e);
}
var At = class extends ft {
    constructor(t){
        super(t), this._cache = {
            data: [],
            labels: [],
            all: []
        }, this._unit = "day", this._majorUnit = void 0, this._offsets = {}, this._normalized = !1, this._parseOpts = void 0;
    }
    init(t, e) {
        let i = t.time || (t.time = {}), s = this._adapter = new Ya._date(t.adapters.date);
        It(i.displayFormats, s.formats()), this._parseOpts = {
            parser: i.parser,
            round: i.round,
            isoWeekday: i.isoWeekday
        }, super.init(t), this._normalized = e.normalized;
    }
    parse(t, e) {
        return t === void 0 ? null : Ys(this, t);
    }
    beforeLayout() {
        super.beforeLayout(), this._cache = {
            data: [],
            labels: [],
            all: []
        };
    }
    determineDataLimits() {
        let t = this, e = t.options, i = t._adapter, s = e.time.unit || "day", { min: o , max: a , minDefined: r , maxDefined: l  } = t.getUserBounds();
        function c(d) {
            !r && !isNaN(d.min) && (o = Math.min(o, d.min)), !l && !isNaN(d.max) && (a = Math.max(a, d.max));
        }
        (!r || !l) && (c(t._getLabelBounds()), (e.bounds !== "ticks" || e.ticks.source !== "labels") && c(t.getMinMax(!1))), o = V(o) && !isNaN(o) ? o : +i.startOf(Date.now(), s), a = V(a) && !isNaN(a) ? a : +i.endOf(Date.now(), s) + 1, t.min = Math.min(o, a - 1), t.max = Math.max(o + 1, a);
    }
    _getLabelBounds() {
        let t = this.getLabelTimestamps(), e = Number.POSITIVE_INFINITY, i = Number.NEGATIVE_INFINITY;
        return t.length && (e = t[0], i = t[t.length - 1]), {
            min: e,
            max: i
        };
    }
    buildTicks() {
        let t = this, e = t.options, i = e.time, s = e.ticks, o = s.source === "labels" ? t.getLabelTimestamps() : t._generate();
        e.bounds === "ticks" && o.length && (t.min = t._userMin || o[0], t.max = t._userMax || o[o.length - 1]);
        let a = t.min, r = t.max, l = Yi(o, a, r);
        return t._unit = i.unit || (s.autoSkip ? $s(i.minUnit, t.min, t.max, t._getLabelCapacity(a)) : sc(t, l.length, i.minUnit, t.min, t.max)), t._majorUnit = !s.major.enabled || t._unit === "year" ? void 0 : oc(t._unit), t.initOffsets(o), e.reverse && l.reverse(), Us(t, l, t._majorUnit);
    }
    initOffsets(t) {
        let e = this, i = 0, s = 0, o, a;
        e.options.offset && t.length && (o = e.getDecimalForValue(t[0]), t.length === 1 ? i = 1 - o : i = (e.getDecimalForValue(t[1]) - o) / 2, a = e.getDecimalForValue(t[t.length - 1]), t.length === 1 ? s = a : s = (a - e.getDecimalForValue(t[t.length - 2])) / 2);
        let r = t.length < 3 ? .5 : .25;
        i = U(i, 0, r), s = U(s, 0, r), e._offsets = {
            start: i,
            end: s,
            factor: 1 / (i + 1 + s)
        };
    }
    _generate() {
        let t = this, e = t._adapter, i = t.min, s = t.max, o = t.options, a = o.time, r = a.unit || $s(a.minUnit, i, s, t._getLabelCapacity(i)), l = S(a.stepSize, 1), c = r === "week" ? a.isoWeekday : !1, d = St(c) || c === !0, u = {}, f = i, h, g;
        if (d && (f = +e.startOf(f, "isoWeek", c)), f = +e.startOf(f, d ? "day" : r), e.diff(s, i, r) > 1e5 * l) throw new Error(i + " and " + s + " are too far apart with stepSize of " + l + " " + r);
        let p = o.ticks.source === "data" && t.getDataTimestamps();
        for(h = f, g = 0; h < s; h = +e.add(h, l, r), g++)Xs(u, h, p);
        return (h === s || o.bounds === "ticks" || g === 1) && Xs(u, h, p), Object.keys(u).sort((m, b)=>m - b).map((m)=>+m);
    }
    getLabelForValue(t) {
        let e = this, i = e._adapter, s = e.options.time;
        return s.tooltipFormat ? i.format(t, s.tooltipFormat) : i.format(t, s.displayFormats.datetime);
    }
    _tickFormatFunction(t, e, i, s) {
        let o = this, a = o.options, r = a.time.displayFormats, l = o._unit, c = o._majorUnit, d = l && r[l], u = c && r[c], f = i[e], h = c && u && f && f.major, g = o._adapter.format(t, s || (h ? u : d)), p = a.ticks.callback;
        return p ? R(p, [
            g,
            e,
            i
        ], o) : g;
    }
    generateTickLabels(t) {
        let e, i, s;
        for(e = 0, i = t.length; e < i; ++e)s = t[e], s.label = this._tickFormatFunction(s.value, e, t);
    }
    getDecimalForValue(t) {
        let e = this;
        return t === null ? NaN : (t - e.min) / (e.max - e.min);
    }
    getPixelForValue(t) {
        let e = this, i = e._offsets, s = e.getDecimalForValue(t);
        return e.getPixelForDecimal((i.start + s) * i.factor);
    }
    getValueForPixel(t) {
        let e = this, i = e._offsets, s = e.getDecimalForPixel(t) / i.factor - i.end;
        return e.min + s * (e.max - e.min);
    }
    _getLabelSize(t) {
        let e = this, i = e.options.ticks, s = e.ctx.measureText(t).width, o = st(e.isHorizontal() ? i.maxRotation : i.minRotation), a = Math.cos(o), r = Math.sin(o), l = e._resolveTickFontOptions(0).size;
        return {
            w: s * a + l * r,
            h: s * r + l * a
        };
    }
    _getLabelCapacity(t) {
        let e = this, i = e.options.time, s = i.displayFormats, o = s[i.unit] || s.millisecond, a = e._tickFormatFunction(t, 0, Us(e, [
            t
        ], e._majorUnit), o), r = e._getLabelSize(a), l = Math.floor(e.isHorizontal() ? e.width / r.w : e.height / r.h) - 1;
        return l > 0 ? l : 1;
    }
    getDataTimestamps() {
        let t = this, e = t._cache.data || [], i, s;
        if (e.length) return e;
        let o = t.getMatchingVisibleMetas();
        if (t._normalized && o.length) return t._cache.data = o[0].controller.getAllParsedValues(t);
        for(i = 0, s = o.length; i < s; ++i)e = e.concat(o[i].controller.getAllParsedValues(t));
        return t._cache.data = t.normalize(e);
    }
    getLabelTimestamps() {
        let t = this, e = t._cache.labels || [], i, s;
        if (e.length) return e;
        let o = t.getLabels();
        for(i = 0, s = o.length; i < s; ++i)e.push(Ys(t, o[i]));
        return t._cache.labels = t._normalized ? e : t.normalize(e);
    }
    normalize(t) {
        return Rn(t.sort(ic));
    }
};
At.id = "time";
At.defaults = {
    bounds: "data",
    adapters: {},
    time: {
        parser: !1,
        unit: !1,
        round: !1,
        isoWeekday: !1,
        minUnit: "millisecond",
        displayFormats: {}
    },
    ticks: {
        source: "auto",
        major: {
            enabled: !1
        }
    }
};
function Ks(n, t, e) {
    let i, s, o, a;
    if (e) i = Math.floor(t), s = Math.ceil(t), o = n[i], a = n[s];
    else {
        let l = ue(n, t);
        o = l.lo, a = l.hi, i = n[o], s = n[a];
    }
    let r = s - i;
    return r ? o + (a - o) * (t - i) / r : o;
}
var Pe = class extends At {
    constructor(t){
        super(t), this._table = [], this._maxIndex = void 0;
    }
    initOffsets() {
        let t = this, e = t._getTimestampsForTable();
        t._table = t.buildLookupTable(e), t._maxIndex = t._table.length - 1, super.initOffsets(e);
    }
    buildLookupTable(t) {
        let e = this, { min: i , max: s  } = e;
        if (!t.length) return [
            {
                time: i,
                pos: 0
            },
            {
                time: s,
                pos: 1
            }
        ];
        let o = [
            i
        ], a, r, l;
        for(a = 0, r = t.length; a < r; ++a)l = t[a], l > i && l < s && o.push(l);
        return o.push(s), o;
    }
    _getTimestampsForTable() {
        let t = this, e = t._cache.all || [];
        if (e.length) return e;
        let i = t.getDataTimestamps(), s = t.getLabelTimestamps();
        return i.length && s.length ? e = t.normalize(i.concat(s)) : e = i.length ? i : s, e = t._cache.all = e, e;
    }
    getPixelForValue(t, e) {
        let i = this, s = i._offsets, o = i._normalized && i._maxIndex > 0 && !D(e) ? e / i._maxIndex : i.getDecimalForValue(t);
        return i.getPixelForDecimal((s.start + o) * s.factor);
    }
    getDecimalForValue(t) {
        return Ks(this._table, t) / this._maxIndex;
    }
    getValueForPixel(t) {
        let e = this, i = e._offsets, s = e.getDecimalForPixel(t) / i.factor - i.end;
        return Ks(e._table, s * this._maxIndex, !0);
    }
};
Pe.id = "timeseries";
Pe.defaults = At.defaults;
var rc = Object.freeze({
    __proto__: null,
    CategoryScale: Qt,
    LinearScale: ke,
    LogarithmicScale: Se,
    RadialLinearScale: Ot,
    TimeScale: At,
    TimeSeriesScale: Pe
}), dc = [
    ja,
    cl,
    $l,
    rc
];
var Fe1 = Object.create;
var Qt1 = Object.defineProperty;
var Ve1 = Object.getOwnPropertyDescriptor;
var We1 = Object.getOwnPropertyNames;
var qe1 = Object.getPrototypeOf, we1 = Object.prototype.hasOwnProperty;
var Ge1 = (o, f)=>()=>(f || o((f = {
            exports: {}
        }).exports, f), f.exports);
var ke1 = (o, f, M, u)=>{
    if (f && typeof f == "object" || typeof f == "function") for (let S of We1(f))!we1.call(o, S) && S !== M && Qt1(o, S, {
        get: ()=>f[S],
        enumerable: !(u = Ve1(f, S)) || u.enumerable
    });
    return o;
};
var ze1 = (o, f, M)=>(M = o != null ? Fe1(qe1(o)) : {}, ke1(f || !o || !o.__esModule ? Qt1(M, "default", {
        value: o,
        enumerable: !0
    }) : M, o));
var jt1 = Ge1(($e, lt)=>{
    (function(o, f, M, u) {
        "use strict";
        var S = [
            "",
            "webkit",
            "Moz",
            "MS",
            "ms",
            "o"
        ], ee = f.createElement("div"), ie = "function", H = Math.round, U = Math.abs, ut = Date.now;
        function ct(t, e, i) {
            return setTimeout(ft(t, i), e);
        }
        function b(t, e, i) {
            return Array.isArray(t) ? (N(t, i[e], i), !0) : !1;
        }
        function N(t, e, i) {
            var r;
            if (t) if (t.forEach) t.forEach(e, i);
            else if (t.length !== u) for(r = 0; r < t.length;)e.call(i, t[r], r, t), r++;
            else for(r in t)t.hasOwnProperty(r) && e.call(i, t[r], r, t);
        }
        function Ot(t, e, i) {
            var r = "DEPRECATED METHOD: " + e + `
` + i + ` AT 
`;
            return function() {
                var n = new Error("get-stack-trace"), s = n && n.stack ? n.stack.replace(/^[^\(]+?[\n$]/gm, "").replace(/^\s+at\s+/gm, "").replace(/^Object.<anonymous>\s*\(/gm, "{anonymous}()@") : "Unknown Stack Trace", a = o.console && (o.console.warn || o.console.log);
                return a && a.call(o.console, r, s), t.apply(this, arguments);
            };
        }
        var _;
        typeof Object.assign != "function" ? _ = function(e) {
            if (e === u || e === null) throw new TypeError("Cannot convert undefined or null to object");
            for(var i = Object(e), r = 1; r < arguments.length; r++){
                var n = arguments[r];
                if (n !== u && n !== null) for(var s in n)n.hasOwnProperty(s) && (i[s] = n[s]);
            }
            return i;
        } : _ = Object.assign;
        var At = Ot(function(e, i, r) {
            for(var n = Object.keys(i), s = 0; s < n.length;)(!r || r && e[n[s]] === u) && (e[n[s]] = i[n[s]]), s++;
            return e;
        }, "extend", "Use `assign`."), re = Ot(function(e, i) {
            return At(e, i, !0);
        }, "merge", "Use `assign`.");
        function d(t, e, i) {
            var r = e.prototype, n;
            n = t.prototype = Object.create(r), n.constructor = t, n._super = r, i && _(n, i);
        }
        function ft(t, e) {
            return function() {
                return t.apply(e, arguments);
            };
        }
        function vt(t, e) {
            return typeof t == ie ? t.apply(e && e[0] || u, e) : t;
        }
        function Ct(t, e) {
            return t === u ? e : t;
        }
        function B(t, e, i) {
            N(J(e), function(r) {
                t.addEventListener(r, i, !1);
            });
        }
        function $(t, e, i) {
            N(J(e), function(r) {
                t.removeEventListener(r, i, !1);
            });
        }
        function St(t, e) {
            for(; t;){
                if (t == e) return !0;
                t = t.parentNode;
            }
            return !1;
        }
        function R(t, e) {
            return t.indexOf(e) > -1;
        }
        function J(t) {
            return t.trim().split(/\s+/g);
        }
        function X(t, e, i) {
            if (t.indexOf && !i) return t.indexOf(e);
            for(var r = 0; r < t.length;){
                if (i && t[r][i] == e || !i && t[r] === e) return r;
                r++;
            }
            return -1;
        }
        function Q(t) {
            return Array.prototype.slice.call(t, 0);
        }
        function Dt(t, e, i) {
            for(var r = [], n = [], s = 0; s < t.length;){
                var a = e ? t[s][e] : t[s];
                X(n, a) < 0 && r.push(t[s]), n[s] = a, s++;
            }
            return i && (e ? r = r.sort(function(c, p) {
                return c[e] > p[e];
            }) : r = r.sort()), r;
        }
        function j(t, e) {
            for(var i, r, n = e[0].toUpperCase() + e.slice(1), s = 0; s < S.length;){
                if (i = S[s], r = i ? i + n : e, r in t) return r;
                s++;
            }
            return u;
        }
        var ne = 1;
        function se() {
            return ne++;
        }
        function Mt(t) {
            var e = t.ownerDocument || t;
            return e.defaultView || e.parentWindow || o;
        }
        var ae = /mobile|tablet|ip(ad|hone|od)|android/i, Ut = "ontouchstart" in o, oe = j(o, "PointerEvent") !== u, he = Ut && ae.test(navigator.userAgent), V = "touch", le = "pen", pt = "mouse", ue = "kinect", ce = 25, v = 1, L = 2, h = 4, T = 8, K = 1, W = 2, q = 4, w = 8, G = 16, I = W | q, x = w | G, Rt = I | x, Lt = [
            "x",
            "y"
        ], tt = [
            "clientX",
            "clientY"
        ];
        function m(t, e) {
            var i = this;
            this.manager = t, this.callback = e, this.element = t.element, this.target = t.options.inputTarget, this.domHandler = function(r) {
                vt(t.options.enable, [
                    t
                ]) && i.handler(r);
            }, this.init();
        }
        m.prototype = {
            handler: function() {},
            init: function() {
                this.evEl && B(this.element, this.evEl, this.domHandler), this.evTarget && B(this.target, this.evTarget, this.domHandler), this.evWin && B(Mt(this.element), this.evWin, this.domHandler);
            },
            destroy: function() {
                this.evEl && $(this.element, this.evEl, this.domHandler), this.evTarget && $(this.target, this.evTarget, this.domHandler), this.evWin && $(Mt(this.element), this.evWin, this.domHandler);
            }
        };
        function fe(t) {
            var e, i = t.options.inputClass;
            return i ? e = i : oe ? e = dt : he ? e = rt : Ut ? e = mt : e = it, new e(t, ve);
        }
        function ve(t, e, i) {
            var r = i.pointers.length, n = i.changedPointers.length, s = e & v && r - n === 0, a = e & (h | T) && r - n === 0;
            i.isFirst = !!s, i.isFinal = !!a, s && (t.session = {}), i.eventType = e, pe(t, i), t.emit("hammer.input", i), t.recognize(i), t.session.prevInput = i;
        }
        function pe(t, e) {
            var i = t.session, r = e.pointers, n = r.length;
            i.firstInput || (i.firstInput = xt(e)), n > 1 && !i.firstMultiple ? i.firstMultiple = xt(e) : n === 1 && (i.firstMultiple = !1);
            var s = i.firstInput, a = i.firstMultiple, l = a ? a.center : s.center, c = e.center = Yt(r);
            e.timeStamp = ut(), e.deltaTime = e.timeStamp - s.timeStamp, e.angle = Tt(l, c), e.distance = et(l, c), Te(i, e), e.offsetDirection = bt(e.deltaX, e.deltaY);
            var p = Ht(e.deltaTime, e.deltaX, e.deltaY);
            e.overallVelocityX = p.x, e.overallVelocityY = p.y, e.overallVelocity = U(p.x) > U(p.y) ? p.x : p.y, e.scale = a ? Ee(a.pointers, r) : 1, e.rotation = a ? me(a.pointers, r) : 0, e.maxPointers = i.prevInput ? e.pointers.length > i.prevInput.maxPointers ? e.pointers.length : i.prevInput.maxPointers : e.pointers.length, de(i, e);
            var P = t.element;
            St(e.srcEvent.target, P) && (P = e.srcEvent.target), e.target = P;
        }
        function Te(t, e) {
            var i = e.center, r = t.offsetDelta || {}, n = t.prevDelta || {}, s = t.prevInput || {};
            (e.eventType === v || s.eventType === h) && (n = t.prevDelta = {
                x: s.deltaX || 0,
                y: s.deltaY || 0
            }, r = t.offsetDelta = {
                x: i.x,
                y: i.y
            }), e.deltaX = n.x + (i.x - r.x), e.deltaY = n.y + (i.y - r.y);
        }
        function de(t, e) {
            var i = t.lastInterval || e, r = e.timeStamp - i.timeStamp, n, s, a, l;
            if (e.eventType != T && (r > ce || i.velocity === u)) {
                var c = e.deltaX - i.deltaX, p = e.deltaY - i.deltaY, P = Ht(r, c, p);
                s = P.x, a = P.y, n = U(P.x) > U(P.y) ? P.x : P.y, l = bt(c, p), t.lastInterval = e;
            } else n = i.velocity, s = i.velocityX, a = i.velocityY, l = i.direction;
            e.velocity = n, e.velocityX = s, e.velocityY = a, e.direction = l;
        }
        function xt(t) {
            for(var e = [], i = 0; i < t.pointers.length;)e[i] = {
                clientX: H(t.pointers[i].clientX),
                clientY: H(t.pointers[i].clientY)
            }, i++;
            return {
                timeStamp: ut(),
                pointers: e,
                center: Yt(e),
                deltaX: t.deltaX,
                deltaY: t.deltaY
            };
        }
        function Yt(t) {
            var e = t.length;
            if (e === 1) return {
                x: H(t[0].clientX),
                y: H(t[0].clientY)
            };
            for(var i = 0, r = 0, n = 0; n < e;)i += t[n].clientX, r += t[n].clientY, n++;
            return {
                x: H(i / e),
                y: H(r / e)
            };
        }
        function Ht(t, e, i) {
            return {
                x: e / t || 0,
                y: i / t || 0
            };
        }
        function bt(t, e) {
            return t === e ? K : U(t) >= U(e) ? t < 0 ? W : q : e < 0 ? w : G;
        }
        function et(t, e, i) {
            i || (i = Lt);
            var r = e[i[0]] - t[i[0]], n = e[i[1]] - t[i[1]];
            return Math.sqrt(r * r + n * n);
        }
        function Tt(t, e, i) {
            i || (i = Lt);
            var r = e[i[0]] - t[i[0]], n = e[i[1]] - t[i[1]];
            return Math.atan2(n, r) * 180 / Math.PI;
        }
        function me(t, e) {
            return Tt(e[1], e[0], tt) + Tt(t[1], t[0], tt);
        }
        function Ee(t, e) {
            return et(e[0], e[1], tt) / et(t[0], t[1], tt);
        }
        var ge = {
            mousedown: v,
            mousemove: L,
            mouseup: h
        }, _e = "mousedown", Ie = "mousemove mouseup";
        function it() {
            this.evEl = _e, this.evWin = Ie, this.pressed = !1, m.apply(this, arguments);
        }
        d(it, m, {
            handler: function(e) {
                var i = ge[e.type];
                i & v && e.button === 0 && (this.pressed = !0), i & L && e.which !== 1 && (i = h), this.pressed && (i & h && (this.pressed = !1), this.callback(this.manager, i, {
                    pointers: [
                        e
                    ],
                    changedPointers: [
                        e
                    ],
                    pointerType: pt,
                    srcEvent: e
                }));
            }
        });
        var ye = {
            pointerdown: v,
            pointermove: L,
            pointerup: h,
            pointercancel: T,
            pointerout: T
        }, Pe = {
            2: V,
            3: le,
            4: pt,
            5: ue
        }, Xt = "pointerdown", Ft = "pointermove pointerup pointercancel";
        o.MSPointerEvent && !o.PointerEvent && (Xt = "MSPointerDown", Ft = "MSPointerMove MSPointerUp MSPointerCancel");
        function dt() {
            this.evEl = Xt, this.evWin = Ft, m.apply(this, arguments), this.store = this.manager.session.pointerEvents = [];
        }
        d(dt, m, {
            handler: function(e) {
                var i = this.store, r = !1, n = e.type.toLowerCase().replace("ms", ""), s = ye[n], a = Pe[e.pointerType] || e.pointerType, l = a == V, c = X(i, e.pointerId, "pointerId");
                s & v && (e.button === 0 || l) ? c < 0 && (i.push(e), c = i.length - 1) : s & (h | T) && (r = !0), !(c < 0) && (i[c] = e, this.callback(this.manager, s, {
                    pointers: i,
                    changedPointers: [
                        e
                    ],
                    pointerType: a,
                    srcEvent: e
                }), r && i.splice(c, 1));
            }
        });
        var Ne = {
            touchstart: v,
            touchmove: L,
            touchend: h,
            touchcancel: T
        }, Oe = "touchstart", Ae = "touchstart touchmove touchend touchcancel";
        function Vt() {
            this.evTarget = Oe, this.evWin = Ae, this.started = !1, m.apply(this, arguments);
        }
        d(Vt, m, {
            handler: function(e) {
                var i = Ne[e.type];
                if (i === v && (this.started = !0), !!this.started) {
                    var r = Ce.call(this, e, i);
                    i & (h | T) && r[0].length - r[1].length === 0 && (this.started = !1), this.callback(this.manager, i, {
                        pointers: r[0],
                        changedPointers: r[1],
                        pointerType: V,
                        srcEvent: e
                    });
                }
            }
        });
        function Ce(t, e) {
            var i = Q(t.touches), r = Q(t.changedTouches);
            return e & (h | T) && (i = Dt(i.concat(r), "identifier", !0)), [
                i,
                r
            ];
        }
        var Se = {
            touchstart: v,
            touchmove: L,
            touchend: h,
            touchcancel: T
        }, De = "touchstart touchmove touchend touchcancel";
        function rt() {
            this.evTarget = De, this.targetIds = {}, m.apply(this, arguments);
        }
        d(rt, m, {
            handler: function(e) {
                var i = Se[e.type], r = Me.call(this, e, i);
                r && this.callback(this.manager, i, {
                    pointers: r[0],
                    changedPointers: r[1],
                    pointerType: V,
                    srcEvent: e
                });
            }
        });
        function Me(t, e) {
            var i = Q(t.touches), r = this.targetIds;
            if (e & (v | L) && i.length === 1) return r[i[0].identifier] = !0, [
                i,
                i
            ];
            var n, s, a = Q(t.changedTouches), l = [], c = this.target;
            if (s = i.filter(function(p) {
                return St(p.target, c);
            }), e === v) for(n = 0; n < s.length;)r[s[n].identifier] = !0, n++;
            for(n = 0; n < a.length;)r[a[n].identifier] && l.push(a[n]), e & (h | T) && delete r[a[n].identifier], n++;
            if (l.length) return [
                Dt(s.concat(l), "identifier", !0),
                l
            ];
        }
        var Ue = 2500, Wt = 25;
        function mt() {
            m.apply(this, arguments);
            var t = ft(this.handler, this);
            this.touch = new rt(this.manager, t), this.mouse = new it(this.manager, t), this.primaryTouch = null, this.lastTouches = [];
        }
        d(mt, m, {
            handler: function(e, i, r) {
                var n = r.pointerType == V, s = r.pointerType == pt;
                if (!(s && r.sourceCapabilities && r.sourceCapabilities.firesTouchEvents)) {
                    if (n) Re.call(this, i, r);
                    else if (s && Le.call(this, r)) return;
                    this.callback(e, i, r);
                }
            },
            destroy: function() {
                this.touch.destroy(), this.mouse.destroy();
            }
        });
        function Re(t, e) {
            t & v ? (this.primaryTouch = e.changedPointers[0].identifier, qt.call(this, e)) : t & (h | T) && qt.call(this, e);
        }
        function qt(t) {
            var e = t.changedPointers[0];
            if (e.identifier === this.primaryTouch) {
                var i = {
                    x: e.clientX,
                    y: e.clientY
                };
                this.lastTouches.push(i);
                var r = this.lastTouches, n = function() {
                    var s = r.indexOf(i);
                    s > -1 && r.splice(s, 1);
                };
                setTimeout(n, Ue);
            }
        }
        function Le(t) {
            for(var e = t.srcEvent.clientX, i = t.srcEvent.clientY, r = 0; r < this.lastTouches.length; r++){
                var n = this.lastTouches[r], s = Math.abs(e - n.x), a = Math.abs(i - n.y);
                if (s <= Wt && a <= Wt) return !0;
            }
            return !1;
        }
        var wt = j(ee.style, "touchAction"), Gt = wt !== u, kt = "compute", zt = "auto", Et = "manipulation", Y = "none", k = "pan-x", z = "pan-y", nt = Ye();
        function gt(t, e) {
            this.manager = t, this.set(e);
        }
        gt.prototype = {
            set: function(t) {
                t == kt && (t = this.compute()), Gt && this.manager.element.style && nt[t] && (this.manager.element.style[wt] = t), this.actions = t.toLowerCase().trim();
            },
            update: function() {
                this.set(this.manager.options.touchAction);
            },
            compute: function() {
                var t = [];
                return N(this.manager.recognizers, function(e) {
                    vt(e.options.enable, [
                        e
                    ]) && (t = t.concat(e.getTouchAction()));
                }), xe(t.join(" "));
            },
            preventDefaults: function(t) {
                var e = t.srcEvent, i = t.offsetDirection;
                if (this.manager.session.prevented) {
                    e.preventDefault();
                    return;
                }
                var r = this.actions, n = R(r, Y) && !nt[Y], s = R(r, z) && !nt[z], a = R(r, k) && !nt[k];
                if (n) {
                    var l = t.pointers.length === 1, c = t.distance < 2, p = t.deltaTime < 250;
                    if (l && c && p) return;
                }
                if (!(a && s) && (n || s && i & I || a && i & x)) return this.preventSrc(e);
            },
            preventSrc: function(t) {
                this.manager.session.prevented = !0, t.preventDefault();
            }
        };
        function xe(t) {
            if (R(t, Y)) return Y;
            var e = R(t, k), i = R(t, z);
            return e && i ? Y : e || i ? e ? k : z : R(t, Et) ? Et : zt;
        }
        function Ye() {
            if (!Gt) return !1;
            var t = {}, e = o.CSS && o.CSS.supports;
            return [
                "auto",
                "manipulation",
                "pan-y",
                "pan-x",
                "pan-x pan-y",
                "none"
            ].forEach(function(i) {
                t[i] = e ? o.CSS.supports("touch-action", i) : !0;
            }), t;
        }
        var st = 1, E = 2, F = 4, D = 8, O = D, Z = 16, y = 32;
        function A(t) {
            this.options = _({}, this.defaults, t || {}), this.id = se(), this.manager = null, this.options.enable = Ct(this.options.enable, !0), this.state = st, this.simultaneous = {}, this.requireFail = [];
        }
        A.prototype = {
            defaults: {},
            set: function(t) {
                return _(this.options, t), this.manager && this.manager.touchAction.update(), this;
            },
            recognizeWith: function(t) {
                if (b(t, "recognizeWith", this)) return this;
                var e = this.simultaneous;
                return t = at(t, this), e[t.id] || (e[t.id] = t, t.recognizeWith(this)), this;
            },
            dropRecognizeWith: function(t) {
                return b(t, "dropRecognizeWith", this) ? this : (t = at(t, this), delete this.simultaneous[t.id], this);
            },
            requireFailure: function(t) {
                if (b(t, "requireFailure", this)) return this;
                var e = this.requireFail;
                return t = at(t, this), X(e, t) === -1 && (e.push(t), t.requireFailure(this)), this;
            },
            dropRequireFailure: function(t) {
                if (b(t, "dropRequireFailure", this)) return this;
                t = at(t, this);
                var e = X(this.requireFail, t);
                return e > -1 && this.requireFail.splice(e, 1), this;
            },
            hasRequireFailures: function() {
                return this.requireFail.length > 0;
            },
            canRecognizeWith: function(t) {
                return !!this.simultaneous[t.id];
            },
            emit: function(t) {
                var e = this, i = this.state;
                function r(n) {
                    e.manager.emit(n, t);
                }
                i < D && r(e.options.event + Zt(i)), r(e.options.event), t.additionalEvent && r(t.additionalEvent), i >= D && r(e.options.event + Zt(i));
            },
            tryEmit: function(t) {
                if (this.canEmit()) return this.emit(t);
                this.state = y;
            },
            canEmit: function() {
                for(var t = 0; t < this.requireFail.length;){
                    if (!(this.requireFail[t].state & (y | st))) return !1;
                    t++;
                }
                return !0;
            },
            recognize: function(t) {
                var e = _({}, t);
                if (!vt(this.options.enable, [
                    this,
                    e
                ])) {
                    this.reset(), this.state = y;
                    return;
                }
                this.state & (O | Z | y) && (this.state = st), this.state = this.process(e), this.state & (E | F | D | Z) && this.tryEmit(e);
            },
            process: function(t) {},
            getTouchAction: function() {},
            reset: function() {}
        };
        function Zt(t) {
            return t & Z ? "cancel" : t & D ? "end" : t & F ? "move" : t & E ? "start" : "";
        }
        function Bt(t) {
            return t == G ? "down" : t == w ? "up" : t == W ? "left" : t == q ? "right" : "";
        }
        function at(t, e) {
            var i = e.manager;
            return i ? i.get(t) : t;
        }
        function g() {
            A.apply(this, arguments);
        }
        d(g, A, {
            defaults: {
                pointers: 1
            },
            attrTest: function(t) {
                var e = this.options.pointers;
                return e === 0 || t.pointers.length === e;
            },
            process: function(t) {
                var e = this.state, i = t.eventType, r = e & (E | F), n = this.attrTest(t);
                return r && (i & T || !n) ? e | Z : r || n ? i & h ? e | D : e & E ? e | F : E : y;
            }
        });
        function ot() {
            g.apply(this, arguments), this.pX = null, this.pY = null;
        }
        d(ot, g, {
            defaults: {
                event: "pan",
                threshold: 10,
                pointers: 1,
                direction: Rt
            },
            getTouchAction: function() {
                var t = this.options.direction, e = [];
                return t & I && e.push(z), t & x && e.push(k), e;
            },
            directionTest: function(t) {
                var e = this.options, i = !0, r = t.distance, n = t.direction, s = t.deltaX, a = t.deltaY;
                return n & e.direction || (e.direction & I ? (n = s === 0 ? K : s < 0 ? W : q, i = s != this.pX, r = Math.abs(t.deltaX)) : (n = a === 0 ? K : a < 0 ? w : G, i = a != this.pY, r = Math.abs(t.deltaY))), t.direction = n, i && r > e.threshold && n & e.direction;
            },
            attrTest: function(t) {
                return g.prototype.attrTest.call(this, t) && (this.state & E || !(this.state & E) && this.directionTest(t));
            },
            emit: function(t) {
                this.pX = t.deltaX, this.pY = t.deltaY;
                var e = Bt(t.direction);
                e && (t.additionalEvent = this.options.event + e), this._super.emit.call(this, t);
            }
        });
        function _t() {
            g.apply(this, arguments);
        }
        d(_t, g, {
            defaults: {
                event: "pinch",
                threshold: 0,
                pointers: 2
            },
            getTouchAction: function() {
                return [
                    Y
                ];
            },
            attrTest: function(t) {
                return this._super.attrTest.call(this, t) && (Math.abs(t.scale - 1) > this.options.threshold || this.state & E);
            },
            emit: function(t) {
                if (t.scale !== 1) {
                    var e = t.scale < 1 ? "in" : "out";
                    t.additionalEvent = this.options.event + e;
                }
                this._super.emit.call(this, t);
            }
        });
        function It() {
            A.apply(this, arguments), this._timer = null, this._input = null;
        }
        d(It, A, {
            defaults: {
                event: "press",
                pointers: 1,
                time: 251,
                threshold: 9
            },
            getTouchAction: function() {
                return [
                    zt
                ];
            },
            process: function(t) {
                var e = this.options, i = t.pointers.length === e.pointers, r = t.distance < e.threshold, n = t.deltaTime > e.time;
                if (this._input = t, !r || !i || t.eventType & (h | T) && !n) this.reset();
                else if (t.eventType & v) this.reset(), this._timer = ct(function() {
                    this.state = O, this.tryEmit();
                }, e.time, this);
                else if (t.eventType & h) return O;
                return y;
            },
            reset: function() {
                clearTimeout(this._timer);
            },
            emit: function(t) {
                this.state === O && (t && t.eventType & h ? this.manager.emit(this.options.event + "up", t) : (this._input.timeStamp = ut(), this.manager.emit(this.options.event, this._input)));
            }
        });
        function yt() {
            g.apply(this, arguments);
        }
        d(yt, g, {
            defaults: {
                event: "rotate",
                threshold: 0,
                pointers: 2
            },
            getTouchAction: function() {
                return [
                    Y
                ];
            },
            attrTest: function(t) {
                return this._super.attrTest.call(this, t) && (Math.abs(t.rotation) > this.options.threshold || this.state & E);
            }
        });
        function Pt() {
            g.apply(this, arguments);
        }
        d(Pt, g, {
            defaults: {
                event: "swipe",
                threshold: 10,
                velocity: .3,
                direction: I | x,
                pointers: 1
            },
            getTouchAction: function() {
                return ot.prototype.getTouchAction.call(this);
            },
            attrTest: function(t) {
                var e = this.options.direction, i;
                return e & (I | x) ? i = t.overallVelocity : e & I ? i = t.overallVelocityX : e & x && (i = t.overallVelocityY), this._super.attrTest.call(this, t) && e & t.offsetDirection && t.distance > this.options.threshold && t.maxPointers == this.options.pointers && U(i) > this.options.velocity && t.eventType & h;
            },
            emit: function(t) {
                var e = Bt(t.offsetDirection);
                e && this.manager.emit(this.options.event + e, t), this.manager.emit(this.options.event, t);
            }
        });
        function ht() {
            A.apply(this, arguments), this.pTime = !1, this.pCenter = !1, this._timer = null, this._input = null, this.count = 0;
        }
        d(ht, A, {
            defaults: {
                event: "tap",
                pointers: 1,
                taps: 1,
                interval: 300,
                time: 250,
                threshold: 9,
                posThreshold: 10
            },
            getTouchAction: function() {
                return [
                    Et
                ];
            },
            process: function(t) {
                var e = this.options, i = t.pointers.length === e.pointers, r = t.distance < e.threshold, n = t.deltaTime < e.time;
                if (this.reset(), t.eventType & v && this.count === 0) return this.failTimeout();
                if (r && n && i) {
                    if (t.eventType != h) return this.failTimeout();
                    var s = this.pTime ? t.timeStamp - this.pTime < e.interval : !0, a = !this.pCenter || et(this.pCenter, t.center) < e.posThreshold;
                    this.pTime = t.timeStamp, this.pCenter = t.center, !a || !s ? this.count = 1 : this.count += 1, this._input = t;
                    var l = this.count % e.taps;
                    if (l === 0) return this.hasRequireFailures() ? (this._timer = ct(function() {
                        this.state = O, this.tryEmit();
                    }, e.interval, this), E) : O;
                }
                return y;
            },
            failTimeout: function() {
                return this._timer = ct(function() {
                    this.state = y;
                }, this.options.interval, this), y;
            },
            reset: function() {
                clearTimeout(this._timer);
            },
            emit: function() {
                this.state == O && (this._input.tapCount = this.count, this.manager.emit(this.options.event, this._input));
            }
        });
        function C(t, e) {
            return e = e || {}, e.recognizers = Ct(e.recognizers, C.defaults.preset), new Nt(t, e);
        }
        C.VERSION = "2.0.7", C.defaults = {
            domEvents: !1,
            touchAction: kt,
            enable: !0,
            inputTarget: null,
            inputClass: null,
            preset: [
                [
                    yt,
                    {
                        enable: !1
                    }
                ],
                [
                    _t,
                    {
                        enable: !1
                    },
                    [
                        "rotate"
                    ]
                ],
                [
                    Pt,
                    {
                        direction: I
                    }
                ],
                [
                    ot,
                    {
                        direction: I
                    },
                    [
                        "swipe"
                    ]
                ],
                [
                    ht
                ],
                [
                    ht,
                    {
                        event: "doubletap",
                        taps: 2
                    },
                    [
                        "tap"
                    ]
                ],
                [
                    It
                ]
            ],
            cssProps: {
                userSelect: "none",
                touchSelect: "none",
                touchCallout: "none",
                contentZooming: "none",
                userDrag: "none",
                tapHighlightColor: "rgba(0,0,0,0)"
            }
        };
        var He = 1, $t = 2;
        function Nt(t, e) {
            this.options = _({}, C.defaults, e || {}), this.options.inputTarget = this.options.inputTarget || t, this.handlers = {}, this.session = {}, this.recognizers = [], this.oldCssProps = {}, this.element = t, this.input = fe(this), this.touchAction = new gt(this, this.options.touchAction), Jt(this, !0), N(this.options.recognizers, function(i) {
                var r = this.add(new i[0](i[1]));
                i[2] && r.recognizeWith(i[2]), i[3] && r.requireFailure(i[3]);
            }, this);
        }
        Nt.prototype = {
            set: function(t) {
                return _(this.options, t), t.touchAction && this.touchAction.update(), t.inputTarget && (this.input.destroy(), this.input.target = t.inputTarget, this.input.init()), this;
            },
            stop: function(t) {
                this.session.stopped = t ? $t : He;
            },
            recognize: function(t) {
                var e = this.session;
                if (!e.stopped) {
                    this.touchAction.preventDefaults(t);
                    var i, r = this.recognizers, n = e.curRecognizer;
                    (!n || n && n.state & O) && (n = e.curRecognizer = null);
                    for(var s = 0; s < r.length;)i = r[s], e.stopped !== $t && (!n || i == n || i.canRecognizeWith(n)) ? i.recognize(t) : i.reset(), !n && i.state & (E | F | D) && (n = e.curRecognizer = i), s++;
                }
            },
            get: function(t) {
                if (t instanceof A) return t;
                for(var e = this.recognizers, i = 0; i < e.length; i++)if (e[i].options.event == t) return e[i];
                return null;
            },
            add: function(t) {
                if (b(t, "add", this)) return this;
                var e = this.get(t.options.event);
                return e && this.remove(e), this.recognizers.push(t), t.manager = this, this.touchAction.update(), t;
            },
            remove: function(t) {
                if (b(t, "remove", this)) return this;
                if (t = this.get(t), t) {
                    var e = this.recognizers, i = X(e, t);
                    i !== -1 && (e.splice(i, 1), this.touchAction.update());
                }
                return this;
            },
            on: function(t, e) {
                if (t !== u && e !== u) {
                    var i = this.handlers;
                    return N(J(t), function(r) {
                        i[r] = i[r] || [], i[r].push(e);
                    }), this;
                }
            },
            off: function(t, e) {
                if (t !== u) {
                    var i = this.handlers;
                    return N(J(t), function(r) {
                        e ? i[r] && i[r].splice(X(i[r], e), 1) : delete i[r];
                    }), this;
                }
            },
            emit: function(t, e) {
                this.options.domEvents && be(t, e);
                var i = this.handlers[t] && this.handlers[t].slice();
                if (!(!i || !i.length)) {
                    e.type = t, e.preventDefault = function() {
                        e.srcEvent.preventDefault();
                    };
                    for(var r = 0; r < i.length;)i[r](e), r++;
                }
            },
            destroy: function() {
                this.element && Jt(this, !1), this.handlers = {}, this.session = {}, this.input.destroy(), this.element = null;
            }
        };
        function Jt(t, e) {
            var i = t.element;
            if (i.style) {
                var r;
                N(t.options.cssProps, function(n, s) {
                    r = j(i.style, s), e ? (t.oldCssProps[r] = i.style[r], i.style[r] = n) : i.style[r] = t.oldCssProps[r] || "";
                }), e || (t.oldCssProps = {});
            }
        }
        function be(t, e) {
            var i = f.createEvent("Event");
            i.initEvent(t, !0, !0), i.gesture = e, e.target.dispatchEvent(i);
        }
        _(C, {
            INPUT_START: v,
            INPUT_MOVE: L,
            INPUT_END: h,
            INPUT_CANCEL: T,
            STATE_POSSIBLE: st,
            STATE_BEGAN: E,
            STATE_CHANGED: F,
            STATE_ENDED: D,
            STATE_RECOGNIZED: O,
            STATE_CANCELLED: Z,
            STATE_FAILED: y,
            DIRECTION_NONE: K,
            DIRECTION_LEFT: W,
            DIRECTION_RIGHT: q,
            DIRECTION_UP: w,
            DIRECTION_DOWN: G,
            DIRECTION_HORIZONTAL: I,
            DIRECTION_VERTICAL: x,
            DIRECTION_ALL: Rt,
            Manager: Nt,
            Input: m,
            TouchAction: gt,
            TouchInput: rt,
            MouseInput: it,
            PointerEventInput: dt,
            TouchMouseInput: mt,
            SingleTouchInput: Vt,
            Recognizer: A,
            AttrRecognizer: g,
            Tap: ht,
            Pan: ot,
            Swipe: Pt,
            Pinch: _t,
            Rotate: yt,
            Press: It,
            on: B,
            off: $,
            each: N,
            merge: re,
            extend: At,
            assign: _,
            inherit: d,
            bindFn: ft,
            prefixed: j
        });
        var Xe = typeof o < "u" ? o : typeof self < "u" ? self : {};
        Xe.Hammer = C, typeof define == "function" && define.amd ? define(function() {
            return C;
        }) : typeof lt < "u" && lt.exports ? lt.exports = C : o[M] = C;
    })(window, document, "Hammer");
});
var te1 = ze1(jt1()), { VERSION: Je1 , defaults: Qe1  } = te1, { default: Kt1 , ...Ze1 } = te1, je1 = Kt1 !== void 0 ? Kt1 : Ze1;
(function() {
    return typeof window > "u" ? function(e) {
        return e();
    } : window.requestAnimationFrame;
})();
(function() {
    let e = 0;
    return function() {
        return e++;
    };
})();
function _(e) {
    if (Array.isArray && Array.isArray(e)) return !0;
    let t = Object.prototype.toString.call(e);
    return t.substr(0, 7) === "[object" && t.substr(-6) === "Array]";
}
function b(e) {
    return e !== null && Object.prototype.toString.call(e) === "[object Object]";
}
function T1(e, t) {
    return typeof e > "u" ? t : e;
}
function Pn1(e, t, n) {
    if (e && typeof e.call == "function") return e.apply(n, t);
}
function Rn1(e, t, n, r) {
    let o, i, s;
    if (_(e)) if (i = e.length, r) for(o = i - 1; o >= 0; o--)t.call(n, e[o], o);
    else for(o = 0; o < i; o++)t.call(n, e[o], o);
    else if (b(e)) for(s = Object.keys(e), i = s.length, o = 0; o < i; o++)t.call(n, e[s[o]], s[o]);
}
function X1(e) {
    if (_(e)) return e.map(X1);
    if (b(e)) {
        let t = Object.create(null), n = Object.keys(e), r = n.length, o = 0;
        for(; o < r; ++o)t[n[o]] = X1(e[n[o]]);
        return t;
    }
    return e;
}
function Ie1(e) {
    return [
        "__proto__",
        "prototype",
        "constructor"
    ].indexOf(e) === -1;
}
function Ve2(e, t, n, r) {
    if (!Ie1(e)) return;
    let o = t[e], i = n[e];
    b(o) && b(i) ? q1(o, i, r) : t[e] = X1(i);
}
function q1(e, t, n) {
    let r = _(t) ? t : [
        t
    ], o = r.length;
    if (!b(e)) return e;
    n = n || {};
    let i = n.merger || Ve2;
    for(let s = 0; s < o; ++s){
        if (t = r[s], !b(t)) continue;
        let a = Object.keys(t);
        for(let c = 0, f = a.length; c < f; ++c)i(a[c], e, t, n);
    }
    return e;
}
var h = Math.PI, w = 2 * h, K1 = Number.POSITIVE_INFINITY, y = h / 2, ge1 = Math.sign;
var j = (e)=>e === 0 || e === 1, me1 = (e, t, n)=>-(Math.pow(2, 10 * (e -= 1)) * Math.sin((e - t) * w / n)), ye1 = (e, t, n)=>Math.pow(2, -10 * e) * Math.sin((e - t) * w / n) + 1, J1 = {
    linear: (e)=>e,
    easeInQuad: (e)=>e * e,
    easeOutQuad: (e)=>-e * (e - 2),
    easeInOutQuad: (e)=>(e /= .5) < 1 ? .5 * e * e : -.5 * (--e * (e - 2) - 1),
    easeInCubic: (e)=>e * e * e,
    easeOutCubic: (e)=>(e -= 1) * e * e + 1,
    easeInOutCubic: (e)=>(e /= .5) < 1 ? .5 * e * e * e : .5 * ((e -= 2) * e * e + 2),
    easeInQuart: (e)=>e * e * e * e,
    easeOutQuart: (e)=>-((e -= 1) * e * e * e - 1),
    easeInOutQuart: (e)=>(e /= .5) < 1 ? .5 * e * e * e * e : -.5 * ((e -= 2) * e * e * e - 2),
    easeInQuint: (e)=>e * e * e * e * e,
    easeOutQuint: (e)=>(e -= 1) * e * e * e * e + 1,
    easeInOutQuint: (e)=>(e /= .5) < 1 ? .5 * e * e * e * e * e : .5 * ((e -= 2) * e * e * e * e + 2),
    easeInSine: (e)=>-Math.cos(e * y) + 1,
    easeOutSine: (e)=>Math.sin(e * y),
    easeInOutSine: (e)=>-.5 * (Math.cos(h * e) - 1),
    easeInExpo: (e)=>e === 0 ? 0 : Math.pow(2, 10 * (e - 1)),
    easeOutExpo: (e)=>e === 1 ? 1 : -Math.pow(2, -10 * e) + 1,
    easeInOutExpo: (e)=>j(e) ? e : e < .5 ? .5 * Math.pow(2, 10 * (e * 2 - 1)) : .5 * (-Math.pow(2, -10 * (e * 2 - 1)) + 2),
    easeInCirc: (e)=>e >= 1 ? e : -(Math.sqrt(1 - e * e) - 1),
    easeOutCirc: (e)=>Math.sqrt(1 - (e -= 1) * e),
    easeInOutCirc: (e)=>(e /= .5) < 1 ? -.5 * (Math.sqrt(1 - e * e) - 1) : .5 * (Math.sqrt(1 - (e -= 2) * e) + 1),
    easeInElastic: (e)=>j(e) ? e : me1(e, .075, .3),
    easeOutElastic: (e)=>j(e) ? e : ye1(e, .075, .3),
    easeInOutElastic (e) {
        return j(e) ? e : e < .5 ? .5 * me1(e * 2, .1125, .45) : .5 + .5 * ye1(e * 2 - 1, .1125, .45);
    },
    easeInBack (e) {
        return e * e * ((1.70158 + 1) * e - 1.70158);
    },
    easeOutBack (e) {
        return (e -= 1) * e * ((1.70158 + 1) * e + 1.70158) + 1;
    },
    easeInOutBack (e) {
        let t = 1.70158;
        return (e /= .5) < 1 ? .5 * (e * e * (((t *= 1.525) + 1) * e - t)) : .5 * ((e -= 2) * e * (((t *= 1.525) + 1) * e + t) + 2);
    },
    easeInBounce: (e)=>1 - J1.easeOutBounce(1 - e),
    easeOutBounce (e) {
        return e < 1 / 2.75 ? 7.5625 * e * e : e < 2 / 2.75 ? 7.5625 * (e -= 1.5 / 2.75) * e + .75 : e < 2.5 / 2.75 ? 7.5625 * (e -= 2.25 / 2.75) * e + .9375 : 7.5625 * (e -= 2.625 / 2.75) * e + .984375;
    },
    easeInOutBounce: (e)=>e < .5 ? J1.easeInBounce(e * 2) * .5 : J1.easeOutBounce(e * 2 - 1) * .5 + .5
};
var m = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15
}, re1 = "0123456789ABCDEF", lt1 = (e)=>re1[e & 15], ut1 = (e)=>re1[(e & 240) >> 4] + re1[e & 15], W1 = (e)=>(e & 240) >> 4 === (e & 15);
function dt1(e) {
    return W1(e.r) && W1(e.g) && W1(e.b) && W1(e.a);
}
function ht(e) {
    var t = e.length, n;
    return e[0] === "#" && (t === 4 || t === 5 ? n = {
        r: 255 & m[e[1]] * 17,
        g: 255 & m[e[2]] * 17,
        b: 255 & m[e[3]] * 17,
        a: t === 5 ? m[e[4]] * 17 : 255
    } : (t === 7 || t === 9) && (n = {
        r: m[e[1]] << 4 | m[e[2]],
        g: m[e[3]] << 4 | m[e[4]],
        b: m[e[5]] << 4 | m[e[6]],
        a: t === 9 ? m[e[7]] << 4 | m[e[8]] : 255
    })), n;
}
function gt1(e) {
    var t = dt1(e) ? lt1 : ut1;
    return e && "#" + t(e.r) + t(e.g) + t(e.b) + (e.a < 255 ? t(e.a) : "");
}
function L1(e) {
    return e + .5 | 0;
}
var Z1 = (e, t, n)=>Math.max(Math.min(e, n), t);
function E1(e) {
    return Z1(L1(e * 2.55), 0, 255);
}
function v(e) {
    return Z1(L1(e * 255), 0, 255);
}
function ie1(e) {
    return Z1(L1(e / 2.55) / 100, 0, 1);
}
function pe1(e) {
    return Z1(L1(e * 100), 0, 100);
}
var bt1 = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
function mt1(e) {
    let t = bt1.exec(e), n = 255, r, o, i;
    if (t) {
        if (t[7] !== r) {
            let s = +t[7];
            n = 255 & (t[8] ? E1(s) : s * 255);
        }
        return r = +t[1], o = +t[3], i = +t[5], r = 255 & (t[2] ? E1(r) : r), o = 255 & (t[4] ? E1(o) : o), i = 255 & (t[6] ? E1(i) : i), {
            r,
            g: o,
            b: i,
            a: n
        };
    }
}
function yt1(e) {
    return e && (e.a < 255 ? `rgba(${e.r}, ${e.g}, ${e.b}, ${ie1(e.a)})` : `rgb(${e.r}, ${e.g}, ${e.b})`);
}
var pt1 = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
function Ce1(e, t, n) {
    let r = t * Math.min(n, 1 - n), o = (i, s = (i + e / 30) % 12)=>n - r * Math.max(Math.min(s - 3, 9 - s, 1), -1);
    return [
        o(0),
        o(8),
        o(4)
    ];
}
function _t1(e, t, n) {
    let r = (o, i = (o + e / 60) % 6)=>n - n * t * Math.max(Math.min(i, 4 - i, 1), 0);
    return [
        r(5),
        r(3),
        r(1)
    ];
}
function wt1(e, t, n) {
    let r = Ce1(e, 1, .5), o;
    for(t + n > 1 && (o = 1 / (t + n), t *= o, n *= o), o = 0; o < 3; o++)r[o] *= 1 - t - n, r[o] += t;
    return r;
}
function se1(e) {
    let n = e.r / 255, r = e.g / 255, o = e.b / 255, i = Math.max(n, r, o), s = Math.min(n, r, o), a = (i + s) / 2, c, f, l;
    return i !== s && (l = i - s, f = a > .5 ? l / (2 - i - s) : l / (i + s), c = i === n ? (r - o) / l + (r < o ? 6 : 0) : i === r ? (o - n) / l + 2 : (n - r) / l + 4, c = c * 60 + .5), [
        c | 0,
        f || 0,
        a
    ];
}
function ae1(e, t, n, r) {
    return (Array.isArray(t) ? e(t[0], t[1], t[2]) : e(t, n, r)).map(v);
}
function ce1(e, t, n) {
    return ae1(Ce1, e, t, n);
}
function xt1(e, t, n) {
    return ae1(wt1, e, t, n);
}
function Mt1(e, t, n) {
    return ae1(_t1, e, t, n);
}
function Ee1(e) {
    return (e % 360 + 360) % 360;
}
function St1(e) {
    let t = pt1.exec(e), n = 255, r;
    if (!t) return;
    t[5] !== r && (n = t[6] ? E1(+t[5]) : v(+t[5]));
    let o = Ee1(+t[2]), i = +t[3] / 100, s = +t[4] / 100;
    return t[1] === "hwb" ? r = xt1(o, i, s) : t[1] === "hsv" ? r = Mt1(o, i, s) : r = ce1(o, i, s), {
        r: r[0],
        g: r[1],
        b: r[2],
        a: n
    };
}
function Ot1(e, t) {
    var n = se1(e);
    n[0] = Ee1(n[0] + t), n = ce1(n), e.r = n[0], e.g = n[1], e.b = n[2];
}
function Tt(e) {
    if (!e) return;
    let t = se1(e), n = t[0], r = pe1(t[1]), o = pe1(t[2]);
    return e.a < 255 ? `hsla(${n}, ${r}%, ${o}%, ${ie1(e.a)})` : `hsl(${n}, ${r}%, ${o}%)`;
}
var _e1 = {
    x: "dark",
    Z: "light",
    Y: "re",
    X: "blu",
    W: "gr",
    V: "medium",
    U: "slate",
    A: "ee",
    T: "ol",
    S: "or",
    B: "ra",
    C: "lateg",
    D: "ights",
    R: "in",
    Q: "turquois",
    E: "hi",
    P: "ro",
    O: "al",
    N: "le",
    M: "de",
    L: "yello",
    F: "en",
    K: "ch",
    G: "arks",
    H: "ea",
    I: "ightg",
    J: "wh"
}, we2 = {
    OiceXe: "f0f8ff",
    antiquewEte: "faebd7",
    aqua: "ffff",
    aquamarRe: "7fffd4",
    azuY: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "0",
    blanKedOmond: "ffebcd",
    Xe: "ff",
    XeviTet: "8a2be2",
    bPwn: "a52a2a",
    burlywood: "deb887",
    caMtXe: "5f9ea0",
    KartYuse: "7fff00",
    KocTate: "d2691e",
    cSO: "ff7f50",
    cSnflowerXe: "6495ed",
    cSnsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "ffff",
    xXe: "8b",
    xcyan: "8b8b",
    xgTMnPd: "b8860b",
    xWay: "a9a9a9",
    xgYF: "6400",
    xgYy: "a9a9a9",
    xkhaki: "bdb76b",
    xmagFta: "8b008b",
    xTivegYF: "556b2f",
    xSange: "ff8c00",
    xScEd: "9932cc",
    xYd: "8b0000",
    xsOmon: "e9967a",
    xsHgYF: "8fbc8f",
    xUXe: "483d8b",
    xUWay: "2f4f4f",
    xUgYy: "2f4f4f",
    xQe: "ced1",
    xviTet: "9400d3",
    dAppRk: "ff1493",
    dApskyXe: "bfff",
    dimWay: "696969",
    dimgYy: "696969",
    dodgerXe: "1e90ff",
    fiYbrick: "b22222",
    flSOwEte: "fffaf0",
    foYstWAn: "228b22",
    fuKsia: "ff00ff",
    gaRsbSo: "dcdcdc",
    ghostwEte: "f8f8ff",
    gTd: "ffd700",
    gTMnPd: "daa520",
    Way: "808080",
    gYF: "8000",
    gYFLw: "adff2f",
    gYy: "808080",
    honeyMw: "f0fff0",
    hotpRk: "ff69b4",
    RdianYd: "cd5c5c",
    Rdigo: "4b0082",
    ivSy: "fffff0",
    khaki: "f0e68c",
    lavFMr: "e6e6fa",
    lavFMrXsh: "fff0f5",
    lawngYF: "7cfc00",
    NmoncEffon: "fffacd",
    ZXe: "add8e6",
    ZcSO: "f08080",
    Zcyan: "e0ffff",
    ZgTMnPdLw: "fafad2",
    ZWay: "d3d3d3",
    ZgYF: "90ee90",
    ZgYy: "d3d3d3",
    ZpRk: "ffb6c1",
    ZsOmon: "ffa07a",
    ZsHgYF: "20b2aa",
    ZskyXe: "87cefa",
    ZUWay: "778899",
    ZUgYy: "778899",
    ZstAlXe: "b0c4de",
    ZLw: "ffffe0",
    lime: "ff00",
    limegYF: "32cd32",
    lRF: "faf0e6",
    magFta: "ff00ff",
    maPon: "800000",
    VaquamarRe: "66cdaa",
    VXe: "cd",
    VScEd: "ba55d3",
    VpurpN: "9370db",
    VsHgYF: "3cb371",
    VUXe: "7b68ee",
    VsprRggYF: "fa9a",
    VQe: "48d1cc",
    VviTetYd: "c71585",
    midnightXe: "191970",
    mRtcYam: "f5fffa",
    mistyPse: "ffe4e1",
    moccasR: "ffe4b5",
    navajowEte: "ffdead",
    navy: "80",
    Tdlace: "fdf5e6",
    Tive: "808000",
    TivedBb: "6b8e23",
    Sange: "ffa500",
    SangeYd: "ff4500",
    ScEd: "da70d6",
    pOegTMnPd: "eee8aa",
    pOegYF: "98fb98",
    pOeQe: "afeeee",
    pOeviTetYd: "db7093",
    papayawEp: "ffefd5",
    pHKpuff: "ffdab9",
    peru: "cd853f",
    pRk: "ffc0cb",
    plum: "dda0dd",
    powMrXe: "b0e0e6",
    purpN: "800080",
    YbeccapurpN: "663399",
    Yd: "ff0000",
    Psybrown: "bc8f8f",
    PyOXe: "4169e1",
    saddNbPwn: "8b4513",
    sOmon: "fa8072",
    sandybPwn: "f4a460",
    sHgYF: "2e8b57",
    sHshell: "fff5ee",
    siFna: "a0522d",
    silver: "c0c0c0",
    skyXe: "87ceeb",
    UXe: "6a5acd",
    UWay: "708090",
    UgYy: "708090",
    snow: "fffafa",
    sprRggYF: "ff7f",
    stAlXe: "4682b4",
    tan: "d2b48c",
    teO: "8080",
    tEstN: "d8bfd8",
    tomato: "ff6347",
    Qe: "40e0d0",
    viTet: "ee82ee",
    JHt: "f5deb3",
    wEte: "ffffff",
    wEtesmoke: "f5f5f5",
    Lw: "ffff00",
    LwgYF: "9acd32"
};
function Pt1() {
    let e = {}, t = Object.keys(we2), n = Object.keys(_e1), r, o, i, s, a;
    for(r = 0; r < t.length; r++){
        for(s = a = t[r], o = 0; o < n.length; o++)i = n[o], a = a.replace(i, _e1[i]);
        i = parseInt(we2[s], 16), e[a] = [
            i >> 16 & 255,
            i >> 8 & 255,
            i & 255
        ];
    }
    return e;
}
var Y;
function Rt1(e) {
    Y || (Y = Pt1(), Y.transparent = [
        0,
        0,
        0,
        0
    ]);
    let t = Y[e.toLowerCase()];
    return t && {
        r: t[0],
        g: t[1],
        b: t[2],
        a: t.length === 4 ? t[3] : 255
    };
}
function H(e, t, n) {
    if (e) {
        let r = se1(e);
        r[t] = Math.max(0, Math.min(r[t] + r[t] * n, t === 0 ? 360 : 1)), r = ce1(r), e.r = r[0], e.g = r[1], e.b = r[2];
    }
}
function Be1(e, t) {
    return e && Object.assign(t || {}, e);
}
function xe1(e) {
    var t = {
        r: 0,
        g: 0,
        b: 0,
        a: 255
    };
    return Array.isArray(e) ? e.length >= 3 && (t = {
        r: e[0],
        g: e[1],
        b: e[2],
        a: 255
    }, e.length > 3 && (t.a = v(e[3]))) : (t = Be1(e, {
        r: 0,
        g: 0,
        b: 0,
        a: 1
    }), t.a = v(t.a)), t;
}
function kt1(e) {
    return e.charAt(0) === "r" ? mt1(e) : St1(e);
}
var I = class {
    constructor(t){
        if (t instanceof I) return t;
        let n = typeof t, r;
        n === "object" ? r = xe1(t) : n === "string" && (r = ht(t) || Rt1(t) || kt1(t)), this._rgb = r, this._valid = !!r;
    }
    get valid() {
        return this._valid;
    }
    get rgb() {
        var t = Be1(this._rgb);
        return t && (t.a = ie1(t.a)), t;
    }
    set rgb(t) {
        this._rgb = xe1(t);
    }
    rgbString() {
        return this._valid ? yt1(this._rgb) : this._rgb;
    }
    hexString() {
        return this._valid ? gt1(this._rgb) : this._rgb;
    }
    hslString() {
        return this._valid ? Tt(this._rgb) : this._rgb;
    }
    mix(t, n) {
        let r = this;
        if (t) {
            let o = r.rgb, i = t.rgb, s, a = n === s ? .5 : n, c = 2 * a - 1, f = o.a - i.a, l = ((c * f === -1 ? c : (c + f) / (1 + c * f)) + 1) / 2;
            s = 1 - l, o.r = 255 & l * o.r + s * i.r + .5, o.g = 255 & l * o.g + s * i.g + .5, o.b = 255 & l * o.b + s * i.b + .5, o.a = a * o.a + (1 - a) * i.a, r.rgb = o;
        }
        return r;
    }
    clone() {
        return new I(this.rgb);
    }
    alpha(t) {
        return this._rgb.a = v(t), this;
    }
    clearer(t) {
        let n = this._rgb;
        return n.a *= 1 - t, this;
    }
    greyscale() {
        let t = this._rgb, n = L1(t.r * .3 + t.g * .59 + t.b * .11);
        return t.r = t.g = t.b = n, this;
    }
    opaquer(t) {
        let n = this._rgb;
        return n.a *= 1 + t, this;
    }
    negate() {
        let t = this._rgb;
        return t.r = 255 - t.r, t.g = 255 - t.g, t.b = 255 - t.b, this;
    }
    lighten(t) {
        return H(this._rgb, 2, t), this;
    }
    darken(t) {
        return H(this._rgb, 2, -t), this;
    }
    saturate(t) {
        return H(this._rgb, 1, t), this;
    }
    desaturate(t) {
        return H(this._rgb, 1, -t), this;
    }
    rotate(t) {
        return Ot1(this._rgb, t), this;
    }
};
function ve1(e) {
    return new I(e);
}
var Le1 = (e)=>e instanceof CanvasGradient || e instanceof CanvasPattern;
function ee1(e) {
    return Le1(e) ? e : ve1(e).saturate(.5).darken(.1).hexString();
}
var Ft1 = Object.create(null), It1 = Object.create(null);
function B1(e, t) {
    if (!t) return e;
    let n = t.split(".");
    for(let r = 0, o = n.length; r < o; ++r){
        let i = n[r];
        e = e[i] || (e[i] = Object.create(null));
    }
    return e;
}
function te2(e, t, n) {
    return typeof t == "string" ? q1(B1(e, t), n) : q1(B1(e, ""), t);
}
var oe1 = class {
    constructor(t){
        this.animation = void 0, this.backgroundColor = "rgba(0,0,0,0.1)", this.borderColor = "rgba(0,0,0,0.1)", this.color = "#666", this.datasets = {}, this.devicePixelRatio = (n)=>n.chart.platform.getDevicePixelRatio(), this.elements = {}, this.events = [
            "mousemove",
            "mouseout",
            "click",
            "touchstart",
            "touchmove"
        ], this.font = {
            family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
            size: 12,
            style: "normal",
            lineHeight: 1.2,
            weight: null
        }, this.hover = {}, this.hoverBackgroundColor = (n, r)=>ee1(r.backgroundColor), this.hoverBorderColor = (n, r)=>ee1(r.borderColor), this.hoverColor = (n, r)=>ee1(r.color), this.indexAxis = "x", this.interaction = {
            mode: "nearest",
            intersect: !0
        }, this.maintainAspectRatio = !0, this.onHover = null, this.onClick = null, this.parsing = !0, this.plugins = {}, this.responsive = !0, this.scale = void 0, this.scales = {}, this.showLine = !0, this.describe(t);
    }
    set(t, n) {
        return te2(this, t, n);
    }
    get(t) {
        return B1(this, t);
    }
    describe(t, n) {
        return te2(It1, t, n);
    }
    override(t, n) {
        return te2(Ft1, t, n);
    }
    route(t, n, r, o) {
        let i = B1(this, t), s = B1(this, r), a = "_" + n;
        Object.defineProperties(i, {
            [a]: {
                value: i[n],
                writable: !0
            },
            [n]: {
                enumerable: !0,
                get () {
                    let c = this[a], f = s[o];
                    return b(c) ? Object.assign({}, f, c) : T1(c, f);
                },
                set (c) {
                    this[a] = c;
                }
            }
        });
    }
}, At1 = new oe1({
    _scriptable: (e)=>!e.startsWith("on"),
    _indexable: (e)=>e !== "events",
    hover: {
        _fallback: "interaction"
    },
    interaction: {
        _scriptable: !1,
        _indexable: !1
    }
});
new RegExp(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/), new RegExp(/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/);
Number.EPSILON || 1e-14;
(function() {
    let e = !1;
    try {
        let t = {
            get passive () {
                return e = !0, !1;
            }
        };
        window.addEventListener("test", null, t), window.removeEventListener("test", null, t);
    } catch  {}
    return e;
})();
new Map;
var O = (n)=>n && n.enabled && n.modifierKey, W2 = (n, e)=>n && e[n + "Key"], H1 = (n, e)=>n && !e[n + "Key"];
function w1(n, e, o) {
    return n === void 0 ? !0 : typeof n == "string" ? n.indexOf(e) !== -1 : typeof n == "function" ? n({
        chart: o
    }).indexOf(e) !== -1 : !1;
}
function R1(n, e) {
    return typeof n == "function" && (n = n({
        chart: e
    })), typeof n == "string" ? {
        x: n.indexOf("x") !== -1,
        y: n.indexOf("y") !== -1
    } : {
        x: !1,
        y: !1
    };
}
function on1(n, e) {
    let o;
    return function() {
        return clearTimeout(o), o = setTimeout(n, e), e;
    };
}
function tn1({ x: n , y: e  }, o) {
    let t = o.scales, i = Object.keys(t);
    for(let s = 0; s < i.length; s++){
        let a = t[i[s]];
        if (e >= a.top && e <= a.bottom && n >= a.left && n <= a.right) return a;
    }
    return null;
}
function _1(n, e, o) {
    let { mode: t = "xy" , scaleMode: i , overScaleMode: s  } = n || {}, a = tn1(e, o), r = R1(t, o), f = R1(i, o);
    if (s) {
        let l = R1(s, o);
        for (let m of [
            "x",
            "y"
        ])l[m] && (f[m] = r[m], r[m] = !1);
    }
    if (a && f[a.axis]) return [
        a
    ];
    let c = [];
    return Rn1(o.scales, function(l) {
        r[l.axis] && c.push(l);
    }), c;
}
var Z2 = new WeakMap;
function u(n) {
    let e = Z2.get(n);
    return e || (e = {
        originalScaleLimits: {},
        updatedScaleLimits: {},
        handlers: {},
        panDelta: {}
    }, Z2.set(n, e)), e;
}
function sn1(n) {
    Z2.delete(n);
}
function U1(n, e, o) {
    let t = n.max - n.min, i = t * (e - 1), s = n.isHorizontal() ? o.x : o.y, a = Math.max(0, Math.min(1, (n.getValueForPixel(s) - n.min) / t || 0)), r = 1 - a;
    return {
        min: i * a,
        max: i * r
    };
}
function T2(n, e, o, t, i) {
    let s = o[t];
    if (s === "original") {
        let a = n.originalScaleLimits[e.id][t];
        s = T1(a.options, a.scale);
    }
    return T1(s, i);
}
function an1(n, e, o) {
    let t = n.getValueForPixel(e), i = n.getValueForPixel(o);
    return {
        min: Math.min(t, i),
        max: Math.max(t, i)
    };
}
function z(n, { min: e , max: o  }, t, i = !1) {
    let s = u(n.chart), { id: a , axis: r , options: f  } = n, c = t && (t[a] || t[r]) || {}, { minRange: l = 0  } = c, m = T2(s, n, c, "min", -1 / 0), p = T2(s, n, c, "max", 1 / 0), y = Math.max(e, m), x = Math.min(o, p), b = i ? Math.max(x - y, l) : n.max - n.min;
    if (x - y !== b) if (m > x - b) e = y, o = y + b;
    else if (p < y + b) o = x, e = x - b;
    else {
        let h = (b - x + y) / 2;
        e = y - h, o = x + h;
    }
    else e = y, o = x;
    return f.min = e, f.max = o, s.updatedScaleLimits[n.id] = {
        min: e,
        max: o
    }, n.parse(e) !== n.min || n.parse(o) !== n.max;
}
function rn1(n, e, o, t) {
    let i = U1(n, e, o), s = {
        min: n.min + i.min,
        max: n.max - i.max
    };
    return z(n, s, t, !0);
}
function ln1(n, e, o, t) {
    z(n, an1(n, e, o), t, !0);
}
var j1 = (n)=>n === 0 || isNaN(n) ? 0 : n < 0 ? Math.min(Math.round(n), -1) : Math.max(Math.round(n), 1);
function fn(n) {
    let o = n.getLabels().length - 1;
    n.min > 0 && (n.min -= 1), n.max < o && (n.max += 1);
}
function cn(n, e, o, t) {
    let i = U1(n, e, o);
    n.min === n.max && e < 1 && fn(n);
    let s = {
        min: n.min + j1(i.min),
        max: n.max - j1(i.max)
    };
    return z(n, s, t, !0);
}
function un(n) {
    return n.isHorizontal() ? n.width : n.height;
}
function dn(n, e, o) {
    let i = n.getLabels().length - 1, { min: s , max: a  } = n, r = Math.max(a - s, 1), f = Math.round(un(n) / Math.max(r, 10)), c = Math.round(Math.abs(e / f)), l;
    return e < -f ? (a = Math.min(a + c, i), s = r === 1 ? a : a - r, l = a === i) : e > f && (s = Math.max(0, s - c), a = r === 1 ? s : s + r, l = s === 0), z(n, {
        min: s,
        max: a
    }, o) || l;
}
var mn1 = {
    second: 500,
    minute: 30 * 1e3,
    hour: 30 * 60 * 1e3,
    day: 12 * 60 * 60 * 1e3,
    week: 3.5 * 24 * 60 * 60 * 1e3,
    month: 15 * 24 * 60 * 60 * 1e3,
    quarter: 60 * 24 * 60 * 60 * 1e3,
    year: 182 * 24 * 60 * 60 * 1e3
};
function A1(n, e, o, t = !1) {
    let { min: i , max: s , options: a  } = n, r = a.time && a.time.round, f = mn1[r] || 0, c = n.getValueForPixel(n.getPixelForValue(i + f) - e), l = n.getValueForPixel(n.getPixelForValue(s + f) - e), { min: m = -1 / 0 , max: p = 1 / 0  } = t && o && o[n.axis] || {};
    return isNaN(c) || isNaN(l) || c < m || l > p ? !0 : z(n, {
        min: c,
        max: l
    }, o, t);
}
function N1(n, e, o) {
    return A1(n, e, o, !0);
}
var C = {
    category: cn,
    default: rn1
}, Y1 = {
    default: ln1
}, k = {
    category: dn,
    default: A1,
    logarithmic: N1,
    timeseries: N1
};
function pn(n, e, o) {
    let { id: t , options: { min: i , max: s  }  } = n;
    if (!e[t] || !o[t]) return !0;
    let a = o[t];
    return a.min !== i || a.max !== s;
}
function B2(n, e) {
    Rn1(n, (o, t)=>{
        e[t] || delete n[t];
    });
}
function E2(n, e) {
    let { scales: o  } = n, { originalScaleLimits: t , updatedScaleLimits: i  } = e;
    return Rn1(o, function(s) {
        pn(s, t, i) && (t[s.id] = {
            min: {
                scale: s.min,
                options: s.options.min
            },
            max: {
                scale: s.max,
                options: s.options.max
            }
        });
    }), B2(t, o), B2(i, o), t;
}
function I1(n, e, o, t) {
    let i = C[n.type] || C.default;
    Pn1(i, [
        n,
        e,
        o,
        t
    ]);
}
function K2(n, e, o, t, i) {
    let s = Y1[n.type] || Y1.default;
    Pn1(s, [
        n,
        e,
        o,
        t,
        i
    ]);
}
function gn(n) {
    let e = n.chartArea;
    return {
        x: (e.left + e.right) / 2,
        y: (e.top + e.bottom) / 2
    };
}
function X2(n, e, o = "none") {
    let { x: t = 1 , y: i = 1 , focalPoint: s = gn(n)  } = typeof e == "number" ? {
        x: e,
        y: e
    } : e, a = u(n), { options: { limits: r , zoom: f  }  } = a;
    E2(n, a);
    let c = t !== 1, l = i !== 1, m = _1(f, s, n);
    Rn1(m || n.scales, function(p) {
        p.isHorizontal() && c ? I1(p, t, s, r) : !p.isHorizontal() && l && I1(p, i, s, r);
    }), n.update(o), Pn1(f.onZoom, [
        {
            chart: n
        }
    ]);
}
function q2(n, e, o, t = "none") {
    let i = u(n), { options: { limits: s , zoom: a  }  } = i, { mode: r = "xy"  } = a;
    E2(n, i);
    let f = w1(r, "x", n), c = w1(r, "y", n);
    Rn1(n.scales, function(l) {
        l.isHorizontal() && f ? K2(l, e.x, o.x, s) : !l.isHorizontal() && c && K2(l, e.y, o.y, s);
    }), n.update(t), Pn1(a.onZoom, [
        {
            chart: n
        }
    ]);
}
function xn1(n, e, o, t = "none") {
    E2(n, u(n));
    let i = n.scales[e];
    z(i, o, void 0, !0), n.update(t);
}
function yn1(n, e = "default") {
    let o = u(n), t = E2(n, o);
    Rn1(n.scales, function(i) {
        let s = i.options;
        t[i.id] ? (s.min = t[i.id].min.options, s.max = t[i.id].max.options) : (delete s.min, delete s.max);
    }), n.update(e), Pn1(o.options.zoom.onZoomComplete, [
        {
            chart: n
        }
    ]);
}
function bn1(n, e) {
    let o = n.originalScaleLimits[e];
    if (!o) return;
    let { min: t , max: i  } = o;
    return T1(i.options, i.scale) - T1(t.options, t.scale);
}
function wn1(n) {
    let e = u(n), o = 1, t = 1;
    return Rn1(n.scales, function(i) {
        let s = bn1(e, i.id);
        if (s) {
            let a = Math.round(s / (i.max - i.min) * 100) / 100;
            o = Math.min(o, a), t = Math.max(t, a);
        }
    }), o < 1 ? o : t;
}
function V1(n, e, o, t) {
    let { panDelta: i  } = t, s = i[n.id] || 0;
    ge1(s) === ge1(e) && (e += s);
    let a = k[n.type] || k.default;
    Pn1(a, [
        n,
        e,
        o
    ]) ? i[n.id] = 0 : i[n.id] = e;
}
function G1(n, e, o, t = "none") {
    let { x: i = 0 , y: s = 0  } = typeof e == "number" ? {
        x: e,
        y: e
    } : e, a = u(n), { options: { pan: r , limits: f  }  } = a, { onPan: c  } = r || {};
    E2(n, a);
    let l = i !== 0, m = s !== 0;
    Rn1(o || n.scales, function(p) {
        p.isHorizontal() && l ? V1(p, i, f, a) : !p.isHorizontal() && m && V1(p, s, f, a);
    }), n.update(t), Pn1(c, [
        {
            chart: n
        }
    ]);
}
function J2(n) {
    let e = u(n), o = {};
    for (let t of Object.keys(n.scales)){
        let { min: i , max: s  } = e.originalScaleLimits[t] || {
            min: {},
            max: {}
        };
        o[t] = {
            min: i.scale,
            max: s.scale
        };
    }
    return o;
}
function Sn1(n) {
    let e = J2(n);
    for (let o of Object.keys(n.scales)){
        let { min: t , max: i  } = e[o];
        if (t !== void 0 && n.scales[o].min !== t || i !== void 0 && n.scales[o].max !== i) return !0;
    }
    return !1;
}
function g(n, e) {
    let { handlers: o  } = u(n), t = o[e];
    t && t.target && (t.target.removeEventListener(e, t), delete o[e]);
}
function P1(n, e, o, t) {
    let { handlers: i , options: s  } = u(n), a = i[o];
    a && a.target === e || (g(n, o), i[o] = (r)=>t(n, r, s), i[o].target = e, e.addEventListener(o, i[o]));
}
function zn1(n, e) {
    let o = u(n);
    o.dragStart && (o.dragging = !0, o.dragEnd = e, n.update("none"));
}
function Mn1(n, e) {
    let o = u(n);
    !o.dragStart || e.key !== "Escape" || (g(n, "keydown"), o.dragging = !1, o.dragStart = o.dragEnd = null, n.update("none"));
}
function Q1(n, e, o) {
    let { onZoomStart: t , onZoomRejected: i  } = o;
    if (t) {
        let { left: s , top: a  } = e.target.getBoundingClientRect(), r = {
            x: e.clientX - s,
            y: e.clientY - a
        };
        if (Pn1(t, [
            {
                chart: n,
                event: e,
                point: r
            }
        ]) === !1) return Pn1(i, [
            {
                chart: n,
                event: e
            }
        ]), !1;
    }
}
function Pn2(n, e) {
    let o = u(n), { pan: t , zoom: i = {}  } = o.options;
    if (e.button !== 0 || W2(O(t), e) || H1(O(i.drag), e)) return Pn1(i.onZoomRejected, [
        {
            chart: n,
            event: e
        }
    ]);
    Q1(n, e, i) !== !1 && (o.dragStart = e, P1(n, n.canvas, "mousemove", zn1), P1(n, window.document, "keydown", Mn1));
}
function $1(n, e, o, t) {
    let { left: i , top: s  } = o.target.getBoundingClientRect(), a = w1(e, "x", n), r = w1(e, "y", n), { top: f , left: c , right: l , bottom: m , width: p , height: y  } = n.chartArea;
    a && (c = Math.min(o.clientX, t.clientX) - i, l = Math.max(o.clientX, t.clientX) - i), r && (f = Math.min(o.clientY, t.clientY) - s, m = Math.max(o.clientY, t.clientY) - s);
    let x = l - c, b = m - f;
    return {
        left: c,
        top: f,
        right: l,
        bottom: m,
        width: x,
        height: b,
        zoomX: a && x ? 1 + (p - x) / p : 1,
        zoomY: r && b ? 1 + (y - b) / y : 1
    };
}
function On1(n, e) {
    let o = u(n);
    if (!o.dragStart) return;
    g(n, "mousemove");
    let { mode: t , onZoomComplete: i , drag: { threshold: s = 0  }  } = o.options.zoom, a = $1(n, t, o.dragStart, e), r = w1(t, "x", n) ? a.width : 0, f = w1(t, "y", n) ? a.height : 0, c = Math.sqrt(r * r + f * f);
    if (o.dragStart = o.dragEnd = null, c <= s) {
        o.dragging = !1, n.update("none");
        return;
    }
    q2(n, {
        x: a.left,
        y: a.top
    }, {
        x: a.right,
        y: a.bottom
    }, "zoom"), setTimeout(()=>o.dragging = !1, 500), Pn1(i, [
        {
            chart: n
        }
    ]);
}
function En1(n, e, o) {
    if (H1(O(o.wheel), e)) {
        Pn1(o.onZoomRejected, [
            {
                chart: n,
                event: e
            }
        ]);
        return;
    }
    if (Q1(n, e, o) !== !1 && (e.cancelable && e.preventDefault(), e.deltaY !== void 0)) return !0;
}
function Ln1(n, e) {
    let { handlers: { onZoomComplete: o  } , options: { zoom: t  }  } = u(n);
    if (!En1(n, e, t)) return;
    let i = e.target.getBoundingClientRect(), s = 1 + (e.deltaY >= 0 ? -t.wheel.speed : t.wheel.speed), a = {
        x: s,
        y: s,
        focalPoint: {
            x: e.clientX - i.left,
            y: e.clientY - i.top
        }
    };
    X2(n, a), o && o();
}
function Dn1(n, e, o, t) {
    o && (u(n).handlers[e] = on1(()=>Pn1(o, [
            {
                chart: n
            }
        ]), t));
}
function Rn2(n, e) {
    let o = n.canvas, { wheel: t , drag: i , onZoomComplete: s  } = e.zoom;
    t.enabled ? (P1(n, o, "wheel", Ln1), Dn1(n, "onZoomComplete", s, 250)) : g(n, "wheel"), i.enabled ? (P1(n, o, "mousedown", Pn2), P1(n, o.ownerDocument, "mouseup", On1)) : (g(n, "mousedown"), g(n, "mousemove"), g(n, "mouseup"), g(n, "keydown"));
}
function Zn1(n) {
    g(n, "mousedown"), g(n, "mousemove"), g(n, "mouseup"), g(n, "wheel"), g(n, "click"), g(n, "keydown");
}
function Cn1(n, e) {
    return function(o, t) {
        let { pan: i , zoom: s = {}  } = e.options;
        if (!i || !i.enabled) return !1;
        let a = t && t.srcEvent;
        return a && !e.panning && t.pointerType === "mouse" && (H1(O(i), a) || W2(O(s.drag), a)) ? (Pn1(i.onPanRejected, [
            {
                chart: n,
                event: t
            }
        ]), !1) : !0;
    };
}
function Yn1(n, e) {
    let o = Math.abs(n.clientX - e.clientX), t = Math.abs(n.clientY - e.clientY), i = o / t, s, a;
    return i > .3 && i < 1.7 ? s = a = !0 : o > t ? s = !0 : a = !0, {
        x: s,
        y: a
    };
}
function nn1(n, e, o) {
    if (e.scale) {
        let { center: t , pointers: i  } = o, s = 1 / e.scale * o.scale, a = o.target.getBoundingClientRect(), r = Yn1(i[0], i[1]), f = e.options.zoom.mode, c = {
            x: r.x && w1(f, "x", n) ? s : 1,
            y: r.y && w1(f, "y", n) ? s : 1,
            focalPoint: {
                x: t.x - a.left,
                y: t.y - a.top
            }
        };
        X2(n, c), e.scale = o.scale;
    }
}
function kn1(n, e) {
    e.options.zoom.pinch.enabled && (e.scale = 1);
}
function vn1(n, e, o) {
    e.scale && (nn1(n, e, o), e.scale = null, Pn1(e.options.zoom.onZoomComplete, [
        {
            chart: n
        }
    ]));
}
function en1(n, e, o) {
    let t = e.delta;
    t && (e.panning = !0, G1(n, {
        x: o.deltaX - t.x,
        y: o.deltaY - t.y
    }, e.panScales), e.delta = {
        x: o.deltaX,
        y: o.deltaY
    });
}
function Hn1(n, e, o) {
    let { enabled: t , onPanStart: i , onPanRejected: s  } = e.options.pan;
    if (!t) return;
    let a = o.target.getBoundingClientRect(), r = {
        x: o.center.x - a.left,
        y: o.center.y - a.top
    };
    if (Pn1(i, [
        {
            chart: n,
            event: o,
            point: r
        }
    ]) === !1) return Pn1(s, [
        {
            chart: n,
            event: o
        }
    ]);
    e.panScales = _1(e.options.pan, r, n), e.delta = {
        x: 0,
        y: 0
    }, clearTimeout(e.panEndTimeout), en1(n, e, o);
}
function Xn1(n, e) {
    e.delta = null, e.panning && (e.panEndTimeout = setTimeout(()=>e.panning = !1, 500), Pn1(e.options.pan.onPanComplete, [
        {
            chart: n
        }
    ]));
}
var v1 = new WeakMap;
function hn(n, e) {
    let o = u(n), t = n.canvas, { pan: i , zoom: s  } = e, a = new je1.Manager(t);
    s && s.pinch.enabled && (a.add(new je1.Pinch), a.on("pinchstart", ()=>kn1(n, o)), a.on("pinch", (r)=>nn1(n, o, r)), a.on("pinchend", (r)=>vn1(n, o, r))), i && i.enabled && (a.add(new je1.Pan({
        threshold: i.threshold,
        enable: Cn1(n, o)
    })), a.on("panstart", (r)=>Hn1(n, o, r)), a.on("panmove", (r)=>en1(n, o, r)), a.on("panend", ()=>Xn1(n, o))), v1.set(n, a);
}
function Fn1(n) {
    let e = v1.get(n);
    e && (e.remove("pinchstart"), e.remove("pinch"), e.remove("pinchend"), e.remove("panstart"), e.remove("pan"), e.remove("panend"), e.destroy(), v1.delete(n));
}
var Tn1 = "2.0.0";
function L2(n, e, o) {
    let t = o.zoom.drag, { dragStart: i , dragEnd: s  } = u(n);
    if (t.drawTime !== e || !s) return;
    let { left: a , top: r , width: f , height: c  } = $1(n, o.zoom.mode, i, s), l = n.ctx;
    l.save(), l.beginPath(), l.fillStyle = t.backgroundColor || "rgba(225,225,225,0.3)", l.fillRect(a, r, f, c), t.borderWidth > 0 && (l.lineWidth = t.borderWidth, l.strokeStyle = t.borderColor || "rgba(225,225,225)", l.strokeRect(a, r, f, c)), l.restore();
}
var Bn1 = {
    id: "zoom",
    version: Tn1,
    defaults: {
        pan: {
            enabled: !1,
            mode: "xy",
            threshold: 10,
            modifierKey: null
        },
        zoom: {
            wheel: {
                enabled: !1,
                speed: .1,
                modifierKey: null
            },
            drag: {
                enabled: !1,
                drawTime: "beforeDatasetsDraw",
                modifierKey: null
            },
            pinch: {
                enabled: !1
            },
            mode: "xy"
        }
    },
    start: function(n, e, o) {
        let t = u(n);
        t.options = o, Object.prototype.hasOwnProperty.call(o.zoom, "enabled") && console.warn("The option `zoom.enabled` is no longer supported. Please use `zoom.wheel.enabled`, `zoom.drag.enabled`, or `zoom.pinch.enabled`."), (Object.prototype.hasOwnProperty.call(o.zoom, "overScaleMode") || Object.prototype.hasOwnProperty.call(o.pan, "overScaleMode")) && console.warn("The option `overScaleMode` is deprecated. Please use `scaleMode` instead (and update `mode` as desired)."), je1 && hn(n, o), n.pan = (i, s, a)=>G1(n, i, s, a), n.zoom = (i, s)=>X2(n, i, s), n.zoomRect = (i, s, a)=>q2(n, i, s, a), n.zoomScale = (i, s, a)=>xn1(n, i, s, a), n.resetZoom = (i)=>yn1(n, i), n.getZoomLevel = ()=>wn1(n), n.getInitialScaleBounds = ()=>J2(n), n.isZoomedOrPanned = ()=>Sn1(n);
    },
    beforeEvent (n) {
        let e = u(n);
        if (e.panning || e.dragging) return !1;
    },
    beforeUpdate: function(n, e, o) {
        let t = u(n);
        t.options = o, Rn2(n, o);
    },
    beforeDatasetsDraw (n, e, o) {
        L2(n, "beforeDatasetsDraw", o);
    },
    afterDatasetsDraw (n, e, o) {
        L2(n, "afterDatasetsDraw", o);
    },
    beforeDraw (n, e, o) {
        L2(n, "beforeDraw", o);
    },
    afterDraw (n, e, o) {
        L2(n, "afterDraw", o);
    },
    stop: function(n) {
        Zn1(n), je1 && Fn1(n), sn1(n);
    },
    panFunctions: k,
    zoomFunctions: C,
    zoomRectFunctions: Y1
};
nn.register(...dc, Bn1);
function renderTimetable({ stations , trains  }) {
    let currentHeight = 0;
    const stationToHeight = stations.map(({ interval  })=>{
        const graphInterval = interval === Infinity ? 1 : interval;
        return (currentHeight -= graphInterval) + graphInterval;
    });
    const heightToStation = Object.fromEntries(stationToHeight.map((height, i)=>[
            height,
            i
        ]));
    const datasets = [];
    for (const [trainIndex, train] of trains.entries()){
        const color = colorCodeFromTrainName(train);
        let trainArray = [];
        for (const [i, station] of train.timetable.entries()){
            if (station.type === "outOfRoute") {
                if (trainArray.length) {
                    datasets.push({
                        label: trainIndex.toString(),
                        data: trainArray,
                        showLine: true,
                        borderColor: color,
                        backgroundColor: color,
                        borderWidth: 2,
                        pointRadius: 2
                    });
                    trainArray = [];
                }
                continue;
            }
            if (station.arrival) {
                const timeIndex = (station.arrival.hour * 60 + station.arrival.minute + 20 * 60) % (24 * 60);
                trainArray.push({
                    x: timeIndex,
                    y: stationToHeight[i]
                });
            }
            if (station.departure && (station.departure.hour !== station.arrival?.hour || station.departure.minute !== station.arrival?.minute)) {
                const timeIndex1 = (station.departure.hour * 60 + station.departure.minute + 20 * 60) % (24 * 60);
                trainArray.push({
                    x: timeIndex1,
                    y: stationToHeight[i]
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
            pointRadius: 2
        });
    }
    const el = document.createElement("canvas");
    new nn(el, {
        type: "scatter",
        options: {
            scales: {
                x: {
                    type: "linear",
                    position: "top",
                    ticks: {
                        callback (v) {
                            const time = +v + 4 * 60;
                            const minute = `${Math.floor(time % 60)}`.padStart(2, "0");
                            return `${Math.floor(time / 60)}:${minute}`;
                        },
                        stepSize: 10,
                        autoSkip: true
                    }
                },
                y: {
                    type: "linear",
                    ticks: {
                        callback (v) {
                            return stations[heightToStation[v]]?.name ?? null;
                        },
                        stepSize: 1,
                        autoSkip: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                zoom: {
                    pan: {
                        enabled: true,
                        mode: "xy"
                    },
                    zoom: {
                        wheel: {
                            enabled: true
                        },
                        pinch: {
                            enabled: true
                        },
                        mode: "xy",
                        scaleMode: "xy"
                    }
                },
                tooltip: {
                    callbacks: {
                        label (ctx) {
                            const station = stations[heightToStation[ctx.parsed.y]];
                            const targetTrain = trains[+(ctx.dataset.label ?? "")];
                            const { trackNumber ="" , arrival , departure , note  } = targetTrain.timetable[heightToStation[ctx.parsed.y]];
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
                        }
                    }
                }
            }
        },
        data: {
            datasets
        },
        plugins: [
            {
                id: "custom_canvas_background_color",
                beforeDraw (chart) {
                    const ctx = chart.canvas.getContext("2d");
                    if (!ctx) {
                        return;
                    }
                    ctx.save();
                    ctx.globalCompositeOperation = "destination-over";
                    ctx.fillStyle = "white";
                    ctx.fillRect(0, 0, chart.width, chart.height);
                    ctx.restore();
                }
            }
        ]
    });
    return el;
}
function render(table) {
    const timetable = getTimetable(table);
    return renderTimetable(timetable);
}
export { getTimetable as getTimetable };
export { renderTimetable as renderTimetable };
export { render as render };
