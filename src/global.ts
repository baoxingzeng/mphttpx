import { g } from "./isPolyfill";

import { TextEncoder } from "./TextEncoderP";
import { TextDecoder } from "./TextDecoderP";

import { Event } from "./EventP";
import { EventTarget } from "./EventTargetP";
import { CustomEvent } from "./CustomEventP";
import { ProgressEvent } from "./ProgressEventP";

import { Blob } from "./BlobP";
import { File } from "./FileP";
import { FileReader } from "./FileReaderP";

import { FormData } from "./FormDataP";
import { URLSearchParams } from "./URLSearchParamsP";

import { AbortSignal } from "./AbortSignalP";
import { AbortController } from "./AbortControllerP";

import { XMLHttpRequest } from "./XMLHttpRequestP";
import { fetch } from "./fetchP";
import { Headers } from "./HeadersP";
import { Request } from "./RequestP";
import { Response } from "./ResponseP";

(function assign() {
    const globalVals = {
        TextEncoder,
        TextDecoder,

        Event,
        EventTarget,
        CustomEvent,
        ProgressEvent,

        Blob,
        File,
        FileReader,

        FormData,
        URLSearchParams,

        AbortSignal,
        AbortController,

        XMLHttpRequest,
        fetch,
        Headers,
        Request,
        Response,
    };

    for (const [key, value] of Object.entries(globalVals)) {
        if (!(key in g)) {
            Object.assign(g, { [key]: value });
        }
    }
})();
