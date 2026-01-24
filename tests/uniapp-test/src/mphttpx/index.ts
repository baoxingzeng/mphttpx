// @ts-nocheck
import run from "../../../test-run";

import { _test as fetch_suite } from "../../../fetchTest";
import { _test as WebSocket_suite } from "../../../WebSocketTest";

run();

fetch_suite.run();
WebSocket_suite.run();
