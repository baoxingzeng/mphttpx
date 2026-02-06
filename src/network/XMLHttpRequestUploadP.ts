import { SymbolP, setState } from "../utils";
import { EventTargetState } from "../event-system/EventTargetP";
import { XMLHttpRequestEventTargetP, XMLHttpRequestEventTargetState } from "./XMLHttpRequestEventTargetP";

export class XMLHttpRequestUploadP extends XMLHttpRequestEventTargetP implements XMLHttpRequestUpload {
    /** @internal */
    constructor() {
        if (new.target === XMLHttpRequestUploadP) {
            throw new TypeError("Failed to construct 'XMLHttpRequestUpload': Illegal constructor");
        }
        super();
    }

    /** @internal */ toString() { return "[object XMLHttpRequestUpload]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "XMLHttpRequestUpload"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["XMLHttpRequestUpload", "XMLHttpRequestEventTarget", "EventTarget"] }; }
}

/** @internal */
export function createXMLHttpRequestUpload(): XMLHttpRequestUpload {
    let upload = Object.create(XMLHttpRequestUploadP.prototype) as XMLHttpRequestUploadP;
    setState(upload, "__EventTarget__", new EventTargetState());
    setState(upload, "__XMLHttpRequestEventTarget__", new XMLHttpRequestEventTargetState(upload));
    return upload;
}
