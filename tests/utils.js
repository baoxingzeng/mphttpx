// @ts-check

/**
 * @typedef {import("uvu").uvu.Crumbs} Crumbs
 */

/**
 * @template T
 * @typedef {import("uvu").uvu.Callback<T>} Callback<T>
 */

/**
 * @typedef {import("uvu").Context} Context
 */

export const config = {
    log: false,
    timeout: 10 * 1000,
    api_prefix: "http://localhost:3000",
    ws_url: "ws://localhost:3001",
};

/**
 * @type {Map<string, [boolean, string][]>}
 */
let results = new Map();

/**
 * @param {string} title 
 * @param {string} name 
 * @param {Callback<Context>} test 
 * @returns {[string, (context: Context & Crumbs) => Promise<void>]}
 */
export function ui_rec(title, name, test) {
    /**
     * @param {Context & Crumbs} context 
     */
    function ui_test(context) {
        /**
         * @param {boolean} value 
         */
        const setR = (value) => { setResult(title, value, name); };
        return Promise.race(
            [
                new Promise((resolve, reject) => { setTimeout(() => { reject(); }, config.timeout); }),
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

    return [name, ui_test];
}

/**
 * @param {string} title 
 * @param {boolean} value 
 * @param {string} name 
 */
function setResult(title,  value, name) {
    /**
     * @type {[boolean, string][]}
     */
    let array;
    if (results.has(title)) {
        // @ts-ignore
        array = results.get(title);
    } else {
        array = [];
        results.set(title, array);
    }
    array.push([value, name]);

    updateUI();
    print(`${title}: ${value} ${value ? " " : ""}// ${name}`);
}

/**
 * @param  {...any} data 
 */
function print(...data) {
    if (config.log) console.log(...data);
}

/**
 * @typedef {(v: [string, [boolean, string][]][]) => any} TListener
 */

export class Notify {
    /**
     * @type {TListener[]}
     */
    static listeners = [];

    /**
     * @param {TListener} f 
     */
    static subscribe(f) {
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
    if (Notify.listeners.length > 0) {
        let r = Array.from(results.entries());
        for (const f of Notify.listeners) {
            try { f(r); }
            catch (e) { console.error(e); }
        }
    }
}
