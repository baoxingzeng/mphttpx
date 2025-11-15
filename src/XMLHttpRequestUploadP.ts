import { state, polyfill, defineStringTag } from "./isPolyfill";
import { EventTargetState, eventTargetState } from "./EventTargetP";
import { XMLHttpRequestEventTargetP, XMLHttpRequestEventTargetState } from "./XMLHttpRequestEventTargetP";

export class XMLHttpRequestUploadP extends XMLHttpRequestEventTargetP implements XMLHttpRequestUpload {
    constructor() {
        if (new.target === XMLHttpRequestUploadP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestUpload': Illegal constructor");
        }

        super();
    }

    toString() { return "[object XMLHttpRequestUpload]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequestUpload", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

defineStringTag(XMLHttpRequestUploadP, "XMLHttpRequestUpload");

export function createXMLHttpRequestUploadP() {
    const instance: XMLHttpRequestUploadP = Object.create(XMLHttpRequestUploadP.prototype);
    instance[eventTargetState] = new EventTargetState(instance);
    instance[state] = new XMLHttpRequestEventTargetState(instance);
    return instance;
}
