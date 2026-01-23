import { dts } from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

const config = {
    input: {
        "index": "src/index.ts",

        "TextEncoderP": "src/TextEncoderP.ts",
        "TextDecoderP": "src/TextDecoderP.ts",

        "BlobP": "src/BlobP.ts",
        "FileP": "src/FileP.ts",
        "FileReaderP": "src/FileReaderP.ts",

        "URLSearchParamsP": "src/URLSearchParamsP.ts",
        "FormDataP": "src/FormDataP.ts",

        "fetchP": "src/fetchP.ts",
        "HeadersP": "src/HeadersP.ts",
        "RequestP": "src/RequestP.ts",
        "ResponseP": "src/ResponseP.ts",

        "AbortControllerP": "src/AbortControllerP.ts",
        "AbortSignalP": "src/AbortSignalP.ts",

        "EventTargetP": "src/EventTargetP.ts",
        "EventP": "src/EventP.ts",
        "CustomEventP": "src/CustomEventP.ts",

        "XMLHttpRequestP": "src/mini-program/XMLHttpRequestImpl.ts",
        "WebSocketP": "src/mini-program/WebSocketImpl.ts",

        "isPolyfill": "src/isPolyfill.ts",
        "platform": "src/mini-program/platform.ts",
        "convertor": "src/convertor.ts",
        "BodyImpl": "src/BodyImpl.ts",
        "ProgressEventP": "src/ProgressEventP.ts",
        "CloseEventP": "src/CloseEventP.ts",
        "MessageEventP": "src/MessageEventP.ts",
    },
    treeshake: {
        moduleSideEffects: false,
    },
};

export default [
    {
        ...config,
        output:
        {
            dir: "dist/cjs",
            format: "cjs",
        },
        plugins: [
            typescript({
                outDir: "dist/cjs",
                declarationDir: "dist/cjs/types",
            }),
        ],
    },
    {
        ...config,
        output:
        {
            dir: "dist/esm",
            format: "es",
        },
        plugins: [
            typescript({
                outDir: "dist/esm",
                declarationDir: "dist/esm/types",
            }),
        ],
    },
    {
        input: "dist/esm/types/index.d.ts",
        output: {
            file: "dist/index.d.ts",
            format: "es",
        },
        plugins: [dts()],
    },
];
