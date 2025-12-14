import { TextDecoderP } from "./TextDecoderP";
import { Blob_toUint8Array, Uint8Array_toBase64 } from "./BlobP";
import { emitProcessEvent } from "./ProgressEventP";
import { EventTargetP, attachFn, executeFn } from "./EventTargetP";
import { g, polyfill, isPolyfillType, dfStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "FileReaderState" */);

export class FileReaderP extends EventTargetP implements FileReader {
    declare static readonly EMPTY: 0;
    declare static readonly LOADING: 1;
    declare static readonly DONE: 2;

    constructor() {
        super();
        this[state] = new FileReaderState(this);
    }

    /** @internal */
    [state]: FileReaderState;

    get readyState() { return this[state].readyState; }
    get result() { return this[state].result; }

    declare readonly EMPTY: 0;
    declare readonly LOADING: 1;
    declare readonly DONE: 2;

    get error() { return this[state].error; }

    abort(): void {
        if (this.readyState === FileReaderP.LOADING) {
            this[state].readyState = FileReaderP.DONE;
            this[state].result = null;

            emitProcessEvent(this, "abort");
        }
    }

    readAsArrayBuffer(blob: Blob) {
        read(this, "readAsArrayBuffer", blob, () => {
            this[state].result = Blob_toUint8Array(blob).buffer.slice(0);
        });
    }

    readAsBinaryString(blob: Blob) {
        read(this, "readAsBinaryString", blob, () => {
            this[state].result = Blob_toUint8Array(blob).reduce((acc, cur) => {
                acc += String.fromCharCode(cur);
                return acc;
            }, "");
        });
    }

    readAsDataURL(blob: Blob) {
        read(this, "readAsDataURL", blob, () => {
            this[state].result = "data:" + (blob.type || "application/octet-stream") + ";base64," + Uint8Array_toBase64(Blob_toUint8Array(blob));
        });
    }

    readAsText(blob: Blob, encoding?: string) {
        read(this, "readAsText", blob, () => {
            this[state].result = (new TextDecoderP(encoding)).decode(Blob_toUint8Array(blob));
        });
    }

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

    toString() { return "[object FileReader]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["FileReader", "EventTarget"] }; }
}

const properties = {
    EMPTY: { value: 0, enumerable: true },
    LOADING: { value: 1, enumerable: true },
    DONE: { value: 2, enumerable: true },
};

Object.defineProperties(FileReaderP, properties);
Object.defineProperties(FileReaderP.prototype, properties);

dfStringTag(FileReaderP, "FileReader");

/** @internal */
const _handlers = Symbol();

/** @internal */
class FileReaderState {
    constructor(target: FileReader) {
        this.target = target;
    }

    target: FileReader;

    readyState: FileReader["readyState"] = FileReaderP.EMPTY;
    result: string | ArrayBuffer | null = null;

    error: DOMException | null = null;

    readonly [_handlers] = getHandlers(this);
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
}

function read(reader: FileReader, kind: string, blob: Blob, setResult: () => void) {
    if (!isPolyfillType<Blob>("Blob", blob)) {
        throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.");
    }

    const s = (reader as FileReaderP)[state];

    s.error = null;
    s.readyState = FileReaderP.LOADING;
    emitProcessEvent(s.target, "loadstart", 0, blob.size);

    setTimeout(() => {
        if (s.readyState === FileReaderP.LOADING) {
            s.readyState = FileReaderP.DONE;

            try {
                setResult();
                emitProcessEvent(s.target, "load", blob.size, blob.size);
            } catch (e: unknown) {
                s.result = null;
                s.error = e as DOMException;
                emitProcessEvent(s.target, "error", 0, blob.size);
            }
        }

        emitProcessEvent(s.target, "loadend", !!s.result ? blob.size : 0, blob.size);
    });
}

function attach(reader: FileReader, type: keyof FileReaderEventMap) {
    const s = (reader as FileReaderP)[state];
    const fnName = ("on" + type) as `on${typeof type}`;
    const cb = s[fnName];
    const listener = s[_handlers][fnName];
    attachFn(reader, type, cb, listener as EventListener);
}

function getHandlers(s: FileReaderState) {
    return {
        onabort: (ev: ProgressEvent<FileReader>) => { executeFn(s.target, s.onabort, ev); },
        onerror: (ev: ProgressEvent<FileReader>) => { executeFn(s.target, s.onerror, ev); },
        onload: (ev: ProgressEvent<FileReader>) => { executeFn(s.target, s.onload, ev); },
        onloadend: (ev: ProgressEvent<FileReader>) => { executeFn(s.target, s.onloadend, ev); },
        onloadstart: (ev: ProgressEvent<FileReader>) => { executeFn(s.target, s.onloadstart, ev); },
        onprogress: (ev: ProgressEvent<FileReader>) => { executeFn(s.target, s.onprogress, ev); },
    };
}

const FileReaderE = g["Blob"] ? g["FileReader"] : FileReaderP;
export { FileReaderE as FileReader };
