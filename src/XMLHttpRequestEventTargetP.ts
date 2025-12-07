import { polyfill, defineStringTag } from "./isPolyfill";
import { EventTargetP, attachFn, executeFn } from "./EventTargetP";

const state = Symbol(/* "XMLHttpRequestEventTargetState" */);
export { state as xhrEventTargetState };

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
    set onabort(value) { this[state].onabort = value; attach.call(this[state], "abort"); }

    get onerror() { return this[state].onerror; }
    set onerror(value) { this[state].onerror = value; attach.call(this[state], "error"); }

    get onload() { return this[state].onload; }
    set onload(value) { this[state].onload = value; attach.call(this[state], "load"); }

    get onloadend() { return this[state].onloadend; }
    set onloadend(value) { this[state].onloadend = value; attach.call(this[state], "loadend"); }

    get onloadstart() { return this[state].onloadstart; }
    set onloadstart(value) { this[state].onloadstart = value; attach.call(this[state], "loadstart"); }

    get onprogress() { return this[state].onprogress; }
    set onprogress(value) { this[state].onprogress = value; attach.call(this[state], "progress"); }

    get ontimeout() { return this[state].ontimeout; }
    set ontimeout(value) { this[state].ontimeout = value; attach.call(this[state], "timeout"); }

    toString() { return "[object XMLHttpRequestEventTarget]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequestEventTarget", "EventTarget"] }; }
}

defineStringTag(XMLHttpRequestEventTargetP, "XMLHttpRequestEventTarget");

const _handlers = Symbol();

export class XMLHttpRequestEventTargetState {
    /**
     * @param _target XMLHttpRequestEventTargetP
     */
    constructor(_target: unknown) {
        this.target = _target as XMLHttpRequest;
    }

    target: XMLHttpRequest;

    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;

    [_handlers] = getHandlers.call(this);
}

function attach(this: XMLHttpRequestEventTargetState, type: keyof XMLHttpRequestEventTargetEventMap) {
    const fnName = ("on" + type) as `on${keyof XMLHttpRequestEventTargetEventMap}`;
    const cb = this[fnName];
    const listener = this[_handlers][fnName];
    attachFn.call(this.target, type, cb, listener as EventListener);
}

function getHandlers(this: XMLHttpRequestEventTargetState) {
    return {
        onabort: (ev: ProgressEvent) => { executeFn.call(this.target, this.onabort, ev); },
        onerror: (ev: ProgressEvent) => { executeFn.call(this.target, this.onerror, ev); },
        onload: (ev: ProgressEvent) => { executeFn.call(this.target, this.onload, ev); },
        onloadend: (ev: ProgressEvent) => { executeFn.call(this.target, this.onloadend, ev); },
        onloadstart: (ev: ProgressEvent) => { executeFn.call(this.target, this.onloadstart, ev); },
        onprogress: (ev: ProgressEvent) => { executeFn.call(this.target, this.onprogress, ev); },
        ontimeout: (ev: ProgressEvent) => { executeFn.call(this.target, this.ontimeout, ev); },
    };
}
