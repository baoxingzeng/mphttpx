import { BlobP } from "./BlobP";
import { g, SymbolP, setState, checkArgsLength } from "../utils";

export class FileP extends BlobP implements File, MPObject {
    constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
        checkArgsLength(arguments.length, 2, "File");
        super(fileBits, options);
        setState(this, "__File__", new FileState());
        state(this).lastModified = +(options?.lastModified ? new Date(options.lastModified) : new Date()) || 0;
        state(this).name = "" + fileName;
    }

    /** @internal */ declare readonly __File__: FileState;

    get lastModified() { return state(this).lastModified; }
    get name() { return state(this).name; }
    get webkitRelativePath() { return ""; }

    /** @internal */ toString() { return "[object File]"; }
    /** @internal */ get [SymbolP.toStringTag]() { return "File"; }
    /** @internal */ get __MPHTTPX__() { return { chain: ["File", "Blob"] }; }
}

/** @internal */
class FileState {
    lastModified = 0;
    name = "";
}

function state(target: FileP) {
    return target.__File__;
}

const FileE = g.Blob ? g.File : FileP;
export { FileE as File };
