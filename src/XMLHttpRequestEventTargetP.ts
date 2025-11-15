import { state, polyfill, defineStringTag } from "./isPolyfill";
import { EventTargetP, attachFn, executeFn } from "./EventTargetP";

export class XMLHttpRequestEventTargetP extends EventTargetP implements XMLHttpRequestEventTarget {
    constructor() {
        if (new.target === XMLHttpRequestEventTargetP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestEventTarget': Illegal constructor");
        }

        super();
        this[state] = new XMLHttpRequestEventTargetState(this);
    }

    [state]: XMLHttpRequestEventTargetState;

    get onabort() { return this[state].onabort; }
    set onabort(value) { this[state].onabort = value; this[state].attach("abort"); }

    get onerror() { return this[state].onerror; }
    set onerror(value) { this[state].onerror = value; this[state].attach("error"); }

    get onload() { return this[state].onload; }
    set onload(value) { this[state].onload = value; this[state].attach("load"); }

    get onloadend() { return this[state].onloadend; }
    set onloadend(value) { this[state].onloadend = value; this[state].attach("loadend"); }

    get onloadstart() { return this[state].onloadstart; }
    set onloadstart(value) { this[state].onloadstart = value; this[state].attach("loadstart"); }

    get onprogress() { return this[state].onprogress; }
    set onprogress(value) { this[state].onprogress = value; this[state].attach("progress"); }

    get ontimeout() { return this[state].ontimeout; }
    set ontimeout(value) { this[state].ontimeout = value; this[state].attach("timeout"); }

    toString() { return "[object XMLHttpRequestEventTarget]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequestEventTarget", "EventTarget"] }; }
}

defineStringTag(XMLHttpRequestEventTargetP, "XMLHttpRequestEventTarget");

export class XMLHttpRequestEventTargetState {
    /**
     * @param _target XMLHttpRequestEventTargetP
     */
    constructor(_target: unknown) {
        this.target = _target as XMLHttpRequest;
    }

    target: XMLHttpRequest;

    attach(type: keyof XMLHttpRequestEventTargetEventMap) {
        const cb = this[("on" + type) as `on${keyof XMLHttpRequestEventTargetEventMap}`];
        const listener = this[("_on" + type) as `_on${keyof XMLHttpRequestEventTargetEventMap}`] as EventListener;
        attachFn.call(this.target, type, cb, listener);
    }

    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _onabort = (ev: ProgressEvent) => { executeFn.call(this.target, this.onabort, ev); }

    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _onerror = (ev: ProgressEvent) => { executeFn.call(this.target, this.onerror, ev); }

    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _onload = (ev: ProgressEvent) => { executeFn.call(this.target, this.onload, ev); }

    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _onloadend = (ev: ProgressEvent) => { executeFn.call(this.target, this.onloadend, ev); }

    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _onloadstart = (ev: ProgressEvent) => { executeFn.call(this.target, this.onloadstart, ev); }

    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _onprogress = (ev: ProgressEvent) => { executeFn.call(this.target, this.onprogress, ev); }

    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    _ontimeout = (ev: ProgressEvent) => { executeFn.call(this.target, this.ontimeout, ev); }
}
