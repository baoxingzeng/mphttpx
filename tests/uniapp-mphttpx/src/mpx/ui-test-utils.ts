// @ts-ignore

const results = new Map<string, Map<string, [boolean, string]>>();
export type TResolveCB = (r: boolean) => void;

let log = true;
let timeout = 10 * 1000;

const serial = { value: 0 };
const cur = () => serial.value++;

function print(...args: any[]) {
    if (log) console.log(...args);
}

export function describe(type: string, subtype: string, description: string, callback: (f: TResolveCB) => any) {
    let setted = false;
    let setR = (r: boolean) => {
        if (typeof r !== "boolean") setR(false);
        if (setted) return;
        setted = true;
        setResult(type, `${cur()}: ${subtype}`, r, description);
        updateUI();
    }
    setTimeout(() => { setR(false); }, timeout);
    try { callback(setR); }
    catch (e) { setR(false); console.error(e); }
}

function setResult(type: string, subtype: string, value: boolean, description: string) {
    let subtypeMap: Map<string, [boolean, string]>;

    if (results.has(type)) {
        subtypeMap = results.get(type)!;
    } else {
        subtypeMap = new Map();
        results.set(type, subtypeMap);
    }

    subtypeMap.set(subtype, [value, description]);
    print(type, "-", subtype, "-", value, "-", description);
}

export type TUIDateFormat = [string, [string, boolean, string]][];

export class Notify {
    static listeners: ((v: TUIDateFormat) => any)[] = [];
    static subscribe(fn: (v: TUIDateFormat) => any) {
        Notify.listeners.push(fn);
        return {
            unsubscribe() {
                Notify.listeners = Notify.listeners.filter(f => f !== fn);
            },
        };
    }
}

function updateUI() {
    let r: TUIDateFormat = [];

    results.entries().forEach(([type, subtypeMap]) => {
        subtypeMap.entries().forEach(([subtype, pair]) => {
            r.push([type, [subtype, pair[0], pair[1]]]);
        });
    });

    for (const cb of Notify.listeners) {
        try { cb(r); }
        catch (e) { console.error(e); }
    }
}
