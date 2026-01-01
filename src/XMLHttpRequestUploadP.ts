import { polyfill, Class_setStringTag } from "./isPolyfill";
import { EventTargetState, eventTargetState } from "./EventTargetP";
import { XMLHttpRequestEventTargetP, XMLHttpRequestEventTargetState, xhrEventTargetState } from "./XMLHttpRequestEventTargetP";

export class XMLHttpRequestUploadP extends XMLHttpRequestEventTargetP implements XMLHttpRequestUpload {
    constructor() {
        if (new.target === XMLHttpRequestUploadP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestUpload': Illegal constructor");
        }

        super();
    }

    /** @internal */ toString() { return "[object XMLHttpRequestUpload]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["XMLHttpRequestUpload", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

Class_setStringTag(XMLHttpRequestUploadP, "XMLHttpRequestUpload");

/** @internal */
export function createXMLHttpRequestUpload(): XMLHttpRequestUpload {
    let upload: XMLHttpRequestUploadP = Object.create(XMLHttpRequestUploadP.prototype);
    upload[eventTargetState] = new EventTargetState(upload);
    upload[xhrEventTargetState] = new XMLHttpRequestEventTargetState(upload);
    return upload;
}
