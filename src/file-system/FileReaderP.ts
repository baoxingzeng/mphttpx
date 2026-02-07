import { isBlob } from "../helpers/isBlob";
import { attachFn, executeFn } from "../helpers/handlers";
import { Uint8Array_toBase64 } from "../helpers/toBase64";
import { EventTargetP } from "../event-system/EventTargetP";
import { emitProgressEvent } from "../helpers/emitProgressEvent";
import { SymbolP, DOMExceptionP, setState, checkArgsLength } from "../utils";

const enum FRCycle {
    READER_EMPTY,
    IDLE,           // outer
    START,          // async
    LOADSTART,      // event(async)
    READING,        // async
    LOAD,           // event
    ABORT,          // event
    ERROR,          // event
    LOADEND,        // event
    END             // outer
};

export class FileReaderP extends EventTargetP implements FileReader {
    static get EMPTY(): 0 { return 0; }
    static get LOADING(): 1 { return 1; }
    static get DONE(): 2 { return 2; }

    constructor() {
        super();
        setState(this, "__FileReader__", new FileReaderState(this));
    }

    /** @internal */ declare readonly __FileReader__: FileReaderState;

    get EMPTY(): 0 { return 0; }
    get LOADING(): 1 { return 1; }
    get DONE(): 2 { return 2; }

    get error() { return state(this).error as (DOMException | null); }
    get readyState() { return state(this).readyState; }
    get result() { return state(this).result; }

    abort(): void {
        switch (state(this).pos) {
            case FRCycle.START:
            case FRCycle.READING:
                execAbort(this);
                break;
        }
    }

    readAsArrayBuffer(blob: Blob): void {
        check(this, "readAsArrayBuffer", arguments.length, blob);
        read(this, blob.size, () => blob.arrayBuffer());
    }

    readAsBinaryString(blob: Blob): void {
        check(this, "readAsBinaryString", arguments.length, blob);
        read(this, blob.size, () => blob.arrayBuffer().then(res => {
            let str: string[] = [];
            let buf = new Uint8Array(res);
            for (let i = 0; i < buf.length; ++i) {
                str.push(String.fromCharCode(buf[i]!));
            }
            return str.join("");
        }));
    }

    readAsDataURL(blob: Blob): void {
        check(this, "readAsDataURL", arguments.length, blob);
        read(this, blob.size, () => blob.arrayBuffer().then(res => {
            return "data:" + (blob.type || "application/octet-stream") + ";base64," + Uint8Array_toBase64(new Uint8Array(res));
        }));
    }

    readAsText(blob: Blob, encoding?: string): void {
        check(this, "readAsText", arguments.length, blob);
        if (encoding !== undefined) {
            let _encoding = "" + encoding;
            if (["utf-8", "utf8", "unicode-1-1-utf-8"].indexOf(_encoding.toLowerCase()) === -1) {
                console.warn(`Ignoring the execution of 'readAsText' on 'FileReader': encoding ('${_encoding}') not implemented.`);
            }
        }
        read(this, blob.size, () => blob.text());
    }

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

    /** @internal */ toString() { return "[object FileReader]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "FileReader"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["FileReader", "EventTarget"] }; }
}

/** @internal */
class FileReaderState {
    constructor(target: FileReader) {
        this.attach = attachFn<FileReader, keyof FileReaderEventMap>(target, getHandlers(target));
    }

    pos: FRCycle = FRCycle.IDLE;

    readyState: FileReader["readyState"] = 0 /* EMPTY */;
    result: string | ArrayBuffer | null = null;
    error: DOMException | DOMExceptionP | null = null;

    attach: (type: keyof FileReaderEventMap) => void;
    onabort: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadend: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onloadstart: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
    onprogress: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
}

function getHandlers(t: FileReader) {
    return {
        onabort: (ev: ProgressEvent<FileReader>) => { executeFn(t, t.onabort, ev); },
        onerror: (ev: ProgressEvent<FileReader>) => { executeFn(t, t.onerror, ev); },
        onload: (ev: ProgressEvent<FileReader>) => { executeFn(t, t.onload, ev); },
        onloadend: (ev: ProgressEvent<FileReader>) => { executeFn(t, t.onloadend, ev); },
        onloadstart: (ev: ProgressEvent<FileReader>) => { executeFn(t, t.onloadstart, ev); },
        onprogress: (ev: ProgressEvent<FileReader>) => { executeFn(t, t.onprogress, ev); },
    };
}

function state(target: FileReaderP) {
    return target.__FileReader__;
}

function check(reader: FileReaderP, kind: string, actual: number, blob: Blob) {
    checkArgsLength(actual, 1, "FileReader", kind);
    if (!isBlob(blob)) throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.");
    if (reader.readyState === 1 /* LOADING */) throw new DOMExceptionP(`Failed to execute '${kind}' on 'FileReader': The object is already busy reading Blobs.`, "InvalidStateError");
}

function read(reader: FileReaderP, size: number, start: () => Promise<string | ArrayBuffer>) {
    execStart(reader, size, start);
}

function execStart(reader: FileReaderP, size: number, start: () => Promise<string | ArrayBuffer>) {
    state(reader).pos = FRCycle.START;
    state(reader).error = null;
    state(reader).result = null;
    state(reader).readyState = 1 /* LOADING */;
    Promise.resolve().then(() => execLoadstart(reader, size, start));
}

function execLoadstart(reader: FileReaderP, size: number, start: () => Promise<string | ArrayBuffer>) {
    if (state(reader).pos !== FRCycle.START) return;
    state(reader).pos = FRCycle.LOADSTART;
    execReading(reader, size, start);
    emitProgressEvent(reader, "loadstart", 0, size);
}

function execReading(reader: FileReaderP, size: number, start: () => Promise<string | ArrayBuffer>) {
    state(reader).pos = FRCycle.READING;
    start()
        .then(r => execLoad(reader, size, r))
        .catch(err => execError(reader, err));
}

function execLoad(reader: FileReaderP, size: number, result: string | ArrayBuffer) {
    if (state(reader).pos !== FRCycle.READING) return;
    state(reader).pos = FRCycle.LOAD;
    state(reader).result = result;
    state(reader).readyState = 2 /* DONE */;
    emitProgressEvent(reader, "load", size, size);
    execLoadend(reader, size);
}

function execAbort(reader: FileReaderP) {
    state(reader).pos = FRCycle.ABORT;
    state(reader).error = new DOMExceptionP("An ongoing operation was aborted, typically with a call to abort().", "AbortError");
    state(reader).result = null;
    state(reader).readyState = 2 /* DONE */;
    emitProgressEvent(reader, "abort");
    execLoadend(reader);
}

function execError(reader: FileReaderP, err: unknown) {
    if (state(reader).pos !== FRCycle.READING) return;
    state(reader).pos = FRCycle.ERROR;
    state(reader).error = err as DOMException;
    state(reader).result = null;
    state(reader).readyState = 2 /* DONE */;
    emitProgressEvent(reader, "error");
    execLoadend(reader);
}

function execLoadend(reader: FileReaderP, size = 0) {
    state(reader).pos = FRCycle.LOADEND;
    emitProgressEvent(reader, "loadend", size, size);
    execEnd(reader);
}

function execEnd(reader: FileReaderP) {
    state(reader).pos = FRCycle.END;
}

const FileReaderE = (typeof FileReader !== "undefined" && FileReader) || FileReaderP;
export { FileReaderE as FileReader };
