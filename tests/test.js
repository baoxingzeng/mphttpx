import run from "./test-run.js";
import server from "./mock-server.js";
import XMLHttpRequest from "xhr2";
import { _test as fetch_suite } from "./fetchTest.js";
import { setXMLHttpRequestClass } from "../dist/esm/index.js";

run();

setXMLHttpRequestClass(XMLHttpRequest);
fetch_suite.after(() => server.close());
fetch_suite.run();
