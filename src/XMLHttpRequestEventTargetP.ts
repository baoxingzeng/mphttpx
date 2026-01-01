import { polyfill, Class_setStringTag } from "./isPolyfill";
import { EventTargetP, attachFn, executeFn } from "./EventTargetP";

/** @internal */ const state = Symbol(/* "XMLHttpRequestEventTargetState" */);
/** @internal */ export { state as xhrEventTargetState };

export class XMLHttpRequestEventTargetP extends EventTargetP implements XMLHttpRequestEventTarget {
    constructor() {
        if (new.target === XMLHttpRequestEventTargetP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestEventTarget': Illegal constructor");
        }

        super();
        this[state] = new XMLHttpRequestEventTargetState(this);
    }

    /** @internal */
    [state]: XMLHttpRequestEventTargetState;

    get onabort() { return this[state].onabort; }
    set onabort(value) { this[state].onabort = value; attach(this, "abort"); }

    get onerror() { return this[state].onerror; }
    set onerror(value) { this[state].onerror = value; attach(this, "error"); }

    get onload() { return this[state].onload; }
    set onload(value) { this[state].onload = value; attach(this, "load"); }

    get onloadend() { return this[state].onloadend; }
    set onloadend(value) { this[state].onloadend = value; attach(this, "loadend"); }

    get onloadstart() { return this[state].onloadstart; }
    set onloadstart(value) { this[state].onloadstart = value; attach(this, "loadstart"); }

    get onprogress() { return this[state].onprogress; }
    set onprogress(value) { this[state].onprogress = value; attach(this, "progress"); }

    get ontimeout() { return this[state].ontimeout; }
    set ontimeout(value) { this[state].ontimeout = value; attach(this, "timeout"); }

    /** @internal */ toString() { return "[object XMLHttpRequestEventTarget]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequestEventTarget", "EventTarget"] }; }
}

Class_setStringTag(XMLHttpRequestEventTargetP, "XMLHttpRequestEventTarget");

/** @internal */
const _handlers = Symbol();

/** @internal */
export class XMLHttpRequestEventTargetState {
    /**
     * @param _target XMLHttpRequestEventTarget
     */
    constructor(_target: unknown) {
        this.target = _target as XMLHttpRequest;
    }

    target: XMLHttpRequest;

    readonly [_handlers] = getHandlers(this);
    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
}

function attach(target: XMLHttpRequestEventTarget, type: keyof XMLHttpRequestEventTargetEventMap) {
    const s = (target as XMLHttpRequestEventTargetP)[state];
    const fnName = ("on" + type) as `on${typeof type}`;
    const cb = s[fnName];
    const listener = s[_handlers][fnName];
    attachFn(target, type, cb, listener as EventListener);
}

function getHandlers(s: XMLHttpRequestEventTargetState) {
    return {
        onabort: (ev: ProgressEvent) => { executeFn(s.target, s.onabort, ev); },
        onerror: (ev: ProgressEvent) => { executeFn(s.target, s.onerror, ev); },
        onload: (ev: ProgressEvent) => { executeFn(s.target, s.onload, ev); },
        onloadend: (ev: ProgressEvent) => { executeFn(s.target, s.onloadend, ev); },
        onloadstart: (ev: ProgressEvent) => { executeFn(s.target, s.onloadstart, ev); },
        onprogress: (ev: ProgressEvent) => { executeFn(s.target, s.onprogress, ev); },
        ontimeout: (ev: ProgressEvent) => { executeFn(s.target, s.ontimeout, ev); },
    };
}
