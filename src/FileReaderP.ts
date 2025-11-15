import { TextDecoderP } from "./TextDecoderP";
import { BlobP, u8array2base64 } from "./BlobP";
import { ProgressEventP } from "./ProgressEventP";
import { EventTargetP, eventTargetState, attachFn, executeFn } from "./EventTargetP";
import { g, state as internalState, polyfill, isPolyfillType, defineStringTag } from "./isPolyfill";

const state = Symbol("FileReaderState");

export class FileReaderP extends EventTargetP implements FileReader {
    static readonly EMPTY = 0;
    static readonly LOADING = 1;
    static readonly DONE = 2;

    constructor() {
        super();
        this[state] = new FileReaderState(this);
    }

    [state]: FileReaderState;

    get readyState() { return this[state].readyState; }
    get result() { return this[state].result; }

    readonly EMPTY = 0;
    readonly LOADING = 1;
    readonly DONE = 2;

    get error() { return this[state].error; }

    abort(): void {
        if (this.readyState === FileReaderP.LOADING) {
            this[state].readyState = FileReaderP.DONE;
            this[state].result = null;

            this[state].emitProcessEvent("abort");
        }
    }

    readAsArrayBuffer = (blob: Blob) => {
        this[state].read("readAsArrayBuffer", blob, () => {
            this[state].result = (blob as BlobP)[internalState]._u8array.buffer.slice(0);
        });
    }

    readAsBinaryString = (blob: Blob) => {
        this[state].read("readAsBinaryString", blob, () => {
            this[state].result = (blob as BlobP)[internalState]._u8array.reduce((acc, cur) => {
                acc += String.fromCharCode(cur);
                return acc;
            }, "");
        });
    }

    readAsDataURL = (blob: Blob) => {
        this[state].read("readAsDataURL", blob, () => {
            this[state].result = "data:" + blob.type + ";base64," + u8array2base64((blob as BlobP)[internalState]._u8array);
        });
    }

    readAsText = (blob: Blob, encoding?: string) => {
        this[state].read("readAsText", blob, () => {
            this[state].result = (new TextDecoderP(encoding)).decode((blob as BlobP)[internalState]._u8array);
        });
    }

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

    toString() { return "[object FileReader]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["FileReader", "EventTarget"] }; }
}

defineStringTag(FileReaderP, "FileReader");

class FileReaderState {
    constructor(target: FileReaderP) {
        this.target = target;
    }

    target: FileReaderP;

    readyState: FileReader["readyState"] = FileReaderP.EMPTY;
    result: string | ArrayBuffer | null = null;

    error: DOMException | null = null;

    read(kind: string, blob: Blob, setResult: () => void) {
        if (!isPolyfillType<Blob>("Blob", blob)) {
            throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.");
        }

        this.error = null;
        this.readyState = FileReaderP.LOADING;
        this.emitProcessEvent("loadstart", 0, blob.size);

        setTimeout(() => {
            if (this.readyState === FileReaderP.LOADING) {
                this.readyState = FileReaderP.DONE;

                try {
                    setResult();
                    this.emitProcessEvent("load", blob.size, blob.size);
                } catch (e: unknown) {
                    this.result = null;
                    this.error = e as DOMException;
                    this.emitProcessEvent("error", 0, blob.size);
                }
            }

            this.emitProcessEvent("loadend", !!this.result ? blob.size : 0, blob.size);
        });
    }

    emitProcessEvent(type: string, loaded = 0, total = 0) {
        const event = new ProgressEventP(type, {
            lengthComputable: total > 0,
            loaded,
            total,
        });

        event[internalState].target = this.target;
        event[internalState].isTrusted = true;
        this.target[eventTargetState].fire(event);
    }

    attach(type: keyof FileReaderEventMap) {
        const cb = this[("on" + type) as `on${typeof type}`];
        const listener = this[("_on" + type) as `_on${typeof type}`] as EventListener;
        attachFn.call(this.target, type, cb, listener);
    }

    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    _onabort = (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onabort, ev); }

    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    _onerror = (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onerror, ev); }

    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    _onload = (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onload, ev); }

    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    _onloadend = (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onloadend, ev); }

    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    _onloadstart = (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onloadstart, ev); }

    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    _onprogress = (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onprogress, ev); }
}

const FileReaderE = g["Blob"] ? g["FileReader"] : FileReaderP;
export { FileReaderE as FileReader };
