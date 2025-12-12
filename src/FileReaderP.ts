import { TextDecoderP } from "./TextDecoderP";
import { emitProcessEvent } from "./ProgressEventP";
import { EventTargetP, attachFn, executeFn } from "./EventTargetP";
import { BlobP, blobState, u8array2base64 } from "./BlobP";
import { g, polyfill, isPolyfillType, defineStringTag } from "./isPolyfill";

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
        read.call(this[state], "readAsArrayBuffer", blob, () => {
            this[state].result = (blob as BlobP)[blobState].toArrayBuffer().slice(0);
        });
    }

    readAsBinaryString(blob: Blob) {
        read.call(this[state], "readAsBinaryString", blob, () => {
            this[state].result = (blob as BlobP)[blobState].toUint8Array().reduce((acc, cur) => {
                acc += String.fromCharCode(cur);
                return acc;
            }, "");
        });
    }

    readAsDataURL(blob: Blob) {
        read.call(this[state], "readAsDataURL", blob, () => {
            this[state].result = "data:" + (blob.type || "application/octet-stream") + ";base64," + u8array2base64((blob as BlobP)[blobState].toUint8Array());
        });
    }

    readAsText(blob: Blob, encoding?: string) {
        read.call(this[state], "readAsText", blob, () => {
            this[state].result = (new TextDecoderP(encoding)).decode((blob as BlobP)[blobState].toUint8Array());
        });
    }

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

defineStringTag(FileReaderP, "FileReader");

/** @internal */
const _handlers = Symbol();

/** @internal */
class FileReaderState {
    constructor(target: FileReaderP) {
        this.target = target;
    }

    target: FileReaderP;

    readyState: FileReader["readyState"] = FileReaderP.EMPTY;
    result: string | ArrayBuffer | null = null;

    error: DOMException | null = null;

    [_handlers] = getHandlers.call(this);
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
}

function read(this: FileReaderState, kind: string, blob: Blob, setResult: () => void) {
    if (!isPolyfillType<Blob>("Blob", blob)) {
        throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.");
    }

    this.error = null;
    this.readyState = FileReaderP.LOADING;
    emitProcessEvent(this.target, "loadstart", 0, blob.size);

    setTimeout(() => {
        if (this.readyState === FileReaderP.LOADING) {
            this.readyState = FileReaderP.DONE;

            try {
                setResult();
                emitProcessEvent(this.target, "load", blob.size, blob.size);
            } catch (e: unknown) {
                this.result = null;
                this.error = e as DOMException;
                emitProcessEvent(this.target, "error", 0, blob.size);
            }
        }

        emitProcessEvent(this.target, "loadend", !!this.result ? blob.size : 0, blob.size);
    });
}

function attach(this: FileReaderState, type: keyof FileReaderEventMap) {
    const fnName = ("on" + type) as `on${typeof type}`;
    const cb = this[fnName];
    const listener = this[_handlers][fnName];
    attachFn.call(this.target, type, cb, listener as EventListener);
}

function getHandlers(this: FileReaderState) {
    return {
        onabort: (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onabort, ev); },
        onerror: (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onerror, ev); },
        onload: (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onload, ev); },
        onloadend: (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onloadend, ev); },
        onloadstart: (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onloadstart, ev); },
        onprogress: (ev: ProgressEvent<FileReader>) => { executeFn.call(this.target, this.onprogress, ev); },
    };
}

const FileReaderE = g["Blob"] ? g["FileReader"] : FileReaderP;
export { FileReaderE as FileReader };
