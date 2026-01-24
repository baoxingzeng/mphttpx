import { _test as TextEncoder_suite } from "./TextEncoderTest.js";
import { _test as TextDecoder_suite } from "./TextDecoderTest.js";

import { _test as Blob_suite } from "./BlobTest.js";
import { _test as File_suite } from "./FileTest.js";
import { _test as FileReader_suite } from "./FileReaderTest.js";

import { _test as URLSearchParams_suite } from "./URLSearchParamsTest.js";
import { _test as FormData_suite } from "./FormDataTest.js";

import { _test as Headers_suite } from "./HeadersTest.js";
import { _test as Request_suite } from "./RequestTest.js";
import { _test as Response_suite } from "./ResponseTest.js";

import { _test as AbortController_suite } from "./AbortControllerTest.js";
import { _test as EventTarget_suite } from "./EventTargetTest.js";

export default function run() {
    TextEncoder_suite.run();
    TextDecoder_suite.run();

    Blob_suite.run();
    File_suite.run();
    FileReader_suite.run();

    URLSearchParams_suite.run();
    FormData_suite.run();

    Headers_suite.run();
    Request_suite.run();
    Response_suite.run();

    AbortController_suite.run();
    EventTarget_suite.run();
}
