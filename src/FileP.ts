import { BlobP } from "./BlobP";
import { g, polyfill, Class_setStringTag, checkArgsLength } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "FileState" */);

/** @type {typeof globalThis.File} */
export class FileP extends BlobP implements File {
    constructor(...args: [BlobPart[], string, FilePropertyBag?]) {
        const [fileBits, fileName, options] = args;
        checkArgsLength(args, 2, "File");

        super(fileBits, options);
        this[state] = new FileState();

        this[state].lastModified = +(options?.lastModified ? new Date(options.lastModified) : new Date()) || 0;
        this[state].name = "" + fileName;
    }

    /** @internal */
    [state]: FileState;

    get lastModified() { return this[state].lastModified; }
    get name() { return this[state].name; }
    get webkitRelativePath() { return ""; }

    /** @internal */ toString() { return "[object File]"; }
    /** @internal */ get isPolyfill() { return { symbol: polyfill, hierarchy: ["File", "Blob"] }; }
}

Class_setStringTag(FileP, "File");

/** @internal */
class FileState {
    lastModified = 0;
    name = "";
}

const FileE = g["Blob"] ? g["File"] : FileP;
export { FileE as File };
