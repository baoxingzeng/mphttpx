import type { uvu, Context } from "uvu";

let log = true;
let timeout = 10 * 1000;

let results = new Map<string, [boolean, string][]>();

export function ui_rec(title: string, name: string, test: uvu.Callback<Context>) {
    function ui_test(context: Context & uvu.Crumbs) {
        const setR = (value: boolean) => { setResult(title, value, name); };
        return Promise.race(
            [
                new Promise((resolve, reject) => { setTimeout(() => { reject(); }, timeout); }),
                new Promise((resolve, reject) => { try { resolve(test(context)); } catch (e) { reject(e); } }),
            ]
        )
            .then(() => {
                setR(true);
            })
            .catch(e => {
                setR(false);
                throw e;
            });
    }

    return [name, ui_test] as [string, (context: Context & uvu.Crumbs) => Promise<void>];
}

function setResult(title: string,  value: boolean, name: string) {
    let array: [boolean, string][];
    if (results.has(title)) {
        array = results.get(title)!;
    } else {
        array = [];
        results.set(title, array);
    }
    array.push([value, name]);

    updateUI();
    print(`${title}: ${value} ${value ? " " : ""}// ${name}`);
}

function print(...data: any[]) {
    if (log) console.log(...data);
}

type TListener = (v: [string, [boolean, string][]][]) => any;

export class Notify {
    static listeners: TListener[] = [];
    static subscribe(f: TListener) {
        Notify.listeners.push(f);
        updateUI();
        return {
            unsubscribe: function () {
                Notify.listeners = Notify.listeners.filter(x => x !== f);
            },
        };
    }
}

function updateUI() {
    let r = Array.from(results.entries());
    for (const f of Notify.listeners) {
        try { f(r); }
        catch (e) { console.error(e); }
    }
}
