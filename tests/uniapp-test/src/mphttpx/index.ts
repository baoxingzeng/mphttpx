// @ts-nocheck
import "../../../TextEncoderTest";
import "../../../TextDecoderTest";

import "../../../BlobTest";
import "../../../FileTest";
import "../../../FileReaderTest";

import "../../../URLSearchParamsTest";
import "../../../FormDataTest";
import "../../../HeadersTest";

import "../../../RequestTest";
import "../../../ResponseTest";

import "../../../AbortControllerTest";
import "../../../EventTargetTest";

import fetch_suite from "../../../fetchTest";
import WebSocket_suite from "../../../WebSocketTest";

fetch_suite.run();
WebSocket_suite.run();
