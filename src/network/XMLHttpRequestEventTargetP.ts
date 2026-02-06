import { SymbolP, setState } from "../utils";
import { attachFn, executeFn } from "../helpers/handlers";
import { EventTargetP } from "../event-system/EventTargetP";

export class XMLHttpRequestEventTargetP extends EventTargetP implements XMLHttpRequestEventTarget, MPObject {
    /** @internal */
    constructor() {
        if (new.target === XMLHttpRequestEventTargetP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestEventTarget': Illegal constructor");
        }

        super();
        setState(this, "__XMLHttpRequestEventTarget__", new XMLHttpRequestEventTargetState(this));
    }

    /** @internal */ declare readonly __XMLHttpRequestEventTarget__: XMLHttpRequestEventTargetState;

    get onabort() { return state(this).onabort; }
    set onabort(value) { state(this).onabort = value; state(this).attach("abort"); }

    get onerror() { return state(this).onerror; }
    set onerror(value) { state(this).onerror = value; state(this).attach("error"); }

    get onload() { return state(this).onload; }
    set onload(value) { state(this).onload = value; state(this).attach("load"); }

    get onloadend() { return state(this).onloadend; }
    set onloadend(value) { state(this).onloadend = value; state(this).attach("loadend"); }

    get onloadstart() { return state(this).onloadstart; }
    set onloadstart(value) { state(this).onloadstart = value; state(this).attach("loadstart"); }

    get onprogress() { return state(this).onprogress; }
    set onprogress(value) { state(this).onprogress = value; state(this).attach("progress"); }

    get ontimeout() { return state(this).ontimeout; }
    set ontimeout(value) { state(this).ontimeout = value; state(this).attach("timeout"); }

    /** @internal */ toString() { return "[object XMLHttpRequestEventTarget]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "XMLHttpRequestEventTarget"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["XMLHttpRequestEventTarget", "EventTarget"] }; }
}

/** @internal */
export class XMLHttpRequestEventTargetState {
    /**
     * @param target XMLHttpRequestEventTarget
     */
    constructor(target: unknown) {
        this.attach = attachFn<XMLHttpRequestEventTarget, keyof XMLHttpRequestEventTargetEventMap>(target as XMLHttpRequestEventTarget, getHandlers(target as XMLHttpRequestEventTarget));
    }

    attach: (type: keyof XMLHttpRequestEventTargetEventMap) => void;
    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null = null;
}

function getHandlers(t: XMLHttpRequestEventTarget) {
    return {
        onabort: (ev: ProgressEvent) => { executeFn(t, t.onabort, ev); },
        onerror: (ev: ProgressEvent) => { executeFn(t, t.onerror, ev); },
        onload: (ev: ProgressEvent) => { executeFn(t, t.onload, ev); },
        onloadend: (ev: ProgressEvent) => { executeFn(t, t.onloadend, ev); },
        onloadstart: (ev: ProgressEvent) => { executeFn(t, t.onloadstart, ev); },
        onprogress: (ev: ProgressEvent) => { executeFn(t, t.onprogress, ev); },
        ontimeout: (ev: ProgressEvent) => { executeFn(t, t.ontimeout, ev); },
    };
}

function state(target: XMLHttpRequestEventTargetP) {
    return target.__XMLHttpRequestEventTarget__;
}
