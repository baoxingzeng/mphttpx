import run from "./test-run.js";
import server from "./mock-server.js";
import XMLHttpRequest from "xhr2";
import { _test as fetch_suite } from "./fetchTest.js";
import { setXMLHttpRequest } from "../dist/esm/index.js";

run();

setXMLHttpRequest(XMLHttpRequest);
fetch_suite.after(() => server.close());
fetch_suite.run();
