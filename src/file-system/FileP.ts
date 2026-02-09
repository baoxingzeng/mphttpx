import { BlobP } from "./BlobP";
import { SymbolP, setState, checkArgsLength } from "../utils";

export class FileP extends BlobP implements File {
    constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
        checkArgsLength(arguments.length, 2, "File");
        super(fileBits, options);
        setState(this, "__File__", new FileState());
        state(this).lastModified = +(options?.lastModified ? new Date(options.lastModified) : new Date()) || 0;
        state(this).name = "" + fileName;
    }

    /** @internal */ declare readonly __File__: FileState;

    get lastModified(): number { return state(this).lastModified; }
    get name(): string { return state(this).name; }
    get webkitRelativePath(): string { return ""; }

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

const FileE = (typeof File !== "undefined" && File) || FileP;
export { FileE as File };
