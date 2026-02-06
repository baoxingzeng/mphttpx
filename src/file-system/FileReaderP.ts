import { isBlob } from "../helpers/isBlob";
import { attachFn, executeFn } from "../helpers/handlers";
import { Uint8Array_toBase64 } from "../helpers/toBase64";
import { EventTargetP } from "../event-system/EventTargetP";
import { emitProgressEvent } from "../helpers/emitProgressEvent";
import { g, SymbolP, DOMExceptionP, setState, checkArgsLength } from "../utils";

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
        if (this.readyState === 1 /* LOADING */) {
            state(this).readyState = 2 /* DONE */;
            state(this).result = null;
            state(this).error = new DOMExceptionP("An ongoing operation was aborted, typically with a call to abort().", "AbortError");
            emitProgressEvent(this, "abort");
        }
    }

    readAsArrayBuffer(blob: Blob): void {
        const kind = "readAsArrayBuffer";
        checkArgs(kind, arguments.length, blob);
        read(this, kind, blob, () => blob.arrayBuffer());
    }

    readAsBinaryString(blob: Blob): void {
        const kind = "readAsBinaryString";
        checkArgs(kind, arguments.length, blob);
        read(this, kind, blob, () => {
            return blob.arrayBuffer().then(res => {
                let str: string[] = [];
                let buf = new Uint8Array(res);
                for (let i = 0; i < buf.length; ++i) {
                    str.push(String.fromCharCode(buf[i]!));
                }
                return str.join("");
            });
        });
    }

    readAsDataURL(blob: Blob): void {
        const kind = "readAsDataURL";
        checkArgs(kind, arguments.length, blob);
        read(this, kind, blob, () => {
            return blob.arrayBuffer().then(res => {
                return "data:" + (blob.type || "application/octet-stream") + ";base64," + Uint8Array_toBase64(new Uint8Array(res));
            });
        });
    }

    readAsText(blob: Blob, encoding?: string): void {
        const kind = "readAsText";
        checkArgs(kind, arguments.length, blob);
        if (encoding !== undefined) {
            let _encoding = "" + encoding;
            if (["utf-8", "utf8", "unicode-1-1-utf-8"].indexOf(_encoding.toLowerCase()) === -1) {
                console.warn(`Ignoring the execution of 'readAsText' on 'FileReader': encoding ('${_encoding}') not implemented.`);
            }
        }
        read(this, kind, blob, () => blob.text());
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

function checkArgs(kind: string, actual: number, blob: Blob) {
    checkArgsLength(actual, 1, "FileReader", kind);
    if (!isBlob(blob)) throw new TypeError("Failed to execute '" + kind + "' on 'FileReader': parameter 1 is not of type 'Blob'.");
}

function read(reader: FileReaderP, kind: string, blob: Blob, getResult: () => Promise<string | ArrayBuffer>) {
    if (state(reader).readyState === 1 /* LOADING */) {
        throw new DOMExceptionP(`Failed to execute '${kind}' on 'FileReader': The object is already busy reading Blobs.`, "InvalidStateError");
    }

    state(reader).error = null;
    state(reader).readyState = 1 /* LOADING */;
    emitProgressEvent(reader, "loadstart", 0, blob.size);

    const guard = () => {
        let ok = reader.readyState === 1 /* LOADING */;
        if (ok) state(reader).readyState = 2 /* DONE */;
        return ok;
    }

    const success = (result: string | ArrayBuffer) => {
        if (!guard()) return;
        state(reader).result = result;
        emitProgressEvent(reader, "load", blob.size, blob.size);
        complete();
    }

    const fail = (err: unknown) => {
        if (!guard()) return;
        state(reader).result = null;
        state(reader).error = err as DOMException;
        emitProgressEvent(reader, "error", 0, blob.size);
        complete();
    }

    const complete = () => {
        emitProgressEvent(reader, "loadend", reader.result ? blob.size : 0, blob.size);
    }

    getResult().then(success).catch(fail);
}

const FileReaderE = g.Blob ? g.FileReader : FileReaderP;
export { FileReaderE as FileReader };
