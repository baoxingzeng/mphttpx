import { BlobP } from "./BlobP";
import { g, polyfill, Class_setStringTag } from "./isPolyfill";

/** @internal */
const state = Symbol(/* "FileState" */);

/********************************************************/
/*                      File Class                      */
/********************************************************/
export class FileP extends BlobP implements File {
    constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
        super(fileBits, options);
        this[state] = new FileState();

        this[state].lastModified = +(options?.lastModified ? new Date(options.lastModified) : new Date());
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
