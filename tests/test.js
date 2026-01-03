import "./TextEncoderTest.js";
import "./TextDecoderTest.js";

import "./BlobTest.js";
import "./FileTest.js";
import "./FileReaderTest.js";

import "./URLSearchParamsTest.js";
import "./FormDataTest.js";

import "./HeadersTest.js";
import "./RequestTest.js";
import "./ResponseTest.js";

import "./AbortControllerTest.js";
import "./EventTargetTest.js";

import fetch_suite from "./fetchTest.js";
import server from "./mock-server.js";
import XMLHttpRequest from "xhr2";
import { setXMLHttpRequest } from "../dist/index.esm.js";
setXMLHttpRequest(XMLHttpRequest);
fetch_suite.after(() => server.close());
fetch_suite.run();
