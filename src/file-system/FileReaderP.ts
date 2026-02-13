import { isBlob } from "../helpers/isBlob";
import { attachFn, executeFn } from "../helpers/handlers";
import { Uint8Array_toBase64 } from "../helpers/toBase64";
import { EventTargetP } from "../event-system/EventTargetP";
import { emitProgressEvent } from "../helpers/emitProgressEvent";
import { SymbolP, DOMExceptionP, setState, checkArgsLength } from "../utils";

const enum FRCycle {
    EMPTY,
    LOADSTART,
    LOADING,
    DONE,
    LOAD,
    ABORT,
    ERROR,
    LOADEND
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

    get error(): DOMException | null { return state(this).error as (DOMException | null); }
    get readyState(): 0 | 1 | 2 { return state(this).readyState; }
    get result(): string | ArrayBuffer | null { return state(this).result; }

    abort(): void {
        if (state(this).pos === FRCycle.LOADING)
            execAbort(this);
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

    pos: FRCycle = FRCycle.EMPTY;

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

function read(reader: FileReaderP, size: number, launch: () => Promise<string | ArrayBuffer>) {
    execLoadstart(reader, size, launch);
}

function execLoadstart(reader: FileReaderP, size: number, launch: () => Promise<string | ArrayBuffer>) {
    let s = state(reader);
    s.pos = FRCycle.LOADSTART;
    s.error = null;
    s.result = null;
    const callback = () => { emitProgressEvent(reader, "loadstart", 0, size); return launch(); }
    return execLoading(reader, size, callback);
}

function execLoading(reader: FileReaderP, size: number, launch: () => Promise<string | ArrayBuffer>) {
    let s = state(reader);
    s.pos = FRCycle.LOADING;
    s.readyState = 1 /* LOADING */;
    return Promise.resolve().then(() => {
        if (s.pos !== FRCycle.LOADING) return;
        return launch().then(r => execDone(reader, size, r)).catch(err => execError(reader, err));
    });
}

function execDone(reader: FileReaderP, size: number, result: string | ArrayBuffer) {
    let s = state(reader);
    if (s.pos !== FRCycle.LOADING) return;
    s.pos = FRCycle.DONE;
    s.result = result;
    s.readyState = 2 /* DONE */
    execLoad(reader, size);
}

function execLoad(reader: FileReaderP, size: number) {
    state(reader).pos = FRCycle.LOAD;
    emitProgressEvent(reader, "load", size, size);
    execLoadend(reader, size);
}

function execAbort(reader: FileReaderP) {
    let s = state(reader);
    s.pos = FRCycle.ABORT;
    s.error = new DOMExceptionP("An ongoing operation was aborted, typically with a call to abort().", "AbortError");
    s.result = null;
    s.readyState = 2 /* DONE */;
    emitProgressEvent(reader, "abort");
    execLoadend(reader);
}

function execError(reader: FileReaderP, err: unknown) {
    let s = state(reader);
    if (s.pos !== FRCycle.LOADING) return;
    s.pos = FRCycle.ERROR;
    s.error = err as DOMException;
    s.result = null;
    s.readyState = 2 /* DONE */;
    emitProgressEvent(reader, "error");
    execLoadend(reader);
}

function execLoadend(reader: FileReaderP, size = 0) {
    state(reader).pos = FRCycle.LOADEND;
    emitProgressEvent(reader, "loadend", size, size);
}

const FileReaderE = (typeof FileReader !== "undefined" && FileReader) || FileReaderP;
export { FileReaderE as FileReader };
