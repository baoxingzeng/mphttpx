import { BlobP } from "./BlobP";
import { g, polyfill, defineStringTag } from "./isPolyfill";

const state = Symbol(/* "FileState" */);

export class FileP extends BlobP implements File {
    constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
        super(fileBits, options);
        this[state] = new FileState();

        this[state].lastModified = +(options?.lastModified ? new Date(options.lastModified) : new Date());
        this[state].name = fileName.replace(/\//g, ":");
    }

    [state]: FileState;

    get lastModified() { return this[state].lastModified; }
    get name() { return this[state].name; }
    get webkitRelativePath() { return ""; }

    toString() { return "[object File]"; }
    get isPolyfill() { return { symbol: polyfill, hierarchy: ["File", "Blob"] }; }
}

defineStringTag(FileP, "File");

class FileState {
    lastModified = 0;
    name = "";
}

const FileE = g["Blob"] ? g["File"] : FileP;
export { FileE as File };
