# MPHTTPX

The `mphttpx` library aims to provide a more ES6-styled [Blob.js][0], 
along with a [fetch][1] polyfill that works seamlessly with the Blob-polyfill. 
This allows web code to be reused in other environments (such as mini-programs).

## Table of Contents

- [MPHTTPX](#mphttpx)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Mini-Program Support](#mini-program-support)
  - [Usage](#usage)
    - [TextEncoder](#textencoder)
      - [Example](#example)
      - [Compatibility](#compatibility)
    - [TextDecoder](#textdecoder)
      - [Example](#example-1)
      - [Compatibility](#compatibility-1)
    - [Blob](#blob)
      - [Example](#example-2)
      - [Compatibility](#compatibility-2)
    - [File](#file)
      - [Example](#example-3)
      - [Compatibility](#compatibility-3)
    - [FileReader](#filereader)
      - [Example](#example-4)
      - [Compatibility](#compatibility-4)
    - [URLSearchParams](#urlsearchparams)
      - [Example](#example-5)
      - [Compatibility](#compatibility-5)
    - [FormData](#formdata)
      - [Example](#example-6)
      - [Compatibility](#compatibility-6)
    - [fetch](#fetch)
      - [Example](#example-7)
      - [Compatibility](#compatibility-7)
    - [Request](#request)
      - [Example](#example-8)
      - [Compatibility](#compatibility-8)
    - [Response](#response)
      - [Example](#example-9)
      - [Compatibility](#compatibility-9)
    - [Headers](#headers)
      - [Example](#example-10)
      - [Compatibility](#compatibility-10)
    - [AbortController](#abortcontroller)
      - [Example](#example-11)
      - [Compatibility](#compatibility-11)
    - [EventTarget](#eventtarget)
      - [Example](#example-12)
      - [Compatibility](#compatibility-12)
    - [XMLHttpRequest (mini-programs)](#xmlhttprequest-mini-programs)
      - [Example](#example-13)
      - [Compatibility](#compatibility-13)
    - [WebSocket (mini-programs, since 1.1.0)](#websocket-mini-programs-since-110)
      - [Example](#example-14)
      - [Compatibility](#compatibility-14)
  - [Auto Import](#auto-import)
  - [UniApp \& Taro](#uniapp--taro)
  - [Node.js](#nodejs)
  - [License](#license)

## Features

- **TextEncoder** 
- **TextDecoder** 
- **Blob** 
- **File** 
- **FileReader** 
- **URLSearchParams** 
- **FormData** 
- **fetch** 
- **Headers** 
- **Request** 
- **Response** 
- **AbortController** 
- **EventTarget**
- **XMLHttpRequest (mini-programs)**
- **WebSocket (mini-programs, since 1.1.0)**
- **Supports tree-shaking (since 2.0.0)**

## Installation

```
npm install mphttpx
```

## Mini-Program Support

| WeChat | Alipay | Baidu | ByteDance | QQ | Kwai | JD | RedNote |
|:------:|:------:|:-----:|:---------:|:--:|:----:|:--:|:-------:|
| Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ | Latest ✔ |

Note: Modern browsers such as Chrome, Firefox, Edge, and Safari do not need these polyfills; 
the relevant implementations imported from the mphttpx library will directly return the native functions of the browser.

## Usage

Note: Every module in mphttpx has a corresponding version with the same name ending in the letter P. 
The difference between them is that the versions ending in P are polyfill implementations.

For example:

```javascript
// mphttpx does not modify globalThis in any way.
import { TextEncoder } from "mphttpx";  // returns the global object first; falls back to the polyfill if unavailable.
import { TextEncoderP } from "mphttpx"; // returns the polyfill directly.
```

### TextEncoder

#### Example

```javascript
import { TextEncoder } from "mphttpx";

const encoder = new TextEncoder();
const encoded = encoder.encode("€");

console.log(encoded); // Uint8Array(3) [226, 130, 172]
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| encoding  | ✔ | utf-8 |

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| encode(string)                 | ✔ | 
| encodeInto(string, uint8Array) | ✔ | 

### TextDecoder

#### Example

```javascript
import { TextDecoder } from "mphttpx";

const utf8decoder = new TextDecoder(); // default 'utf-8'
const encodedText = new Uint8Array([240, 160, 174, 183]);

console.log(utf8decoder.decode(encodedText)); // 𠮷
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| encoding  | ✔ | only utf-8 |
| fatal     | ✔ | 
| ignoreBOM | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| decode()                | ✔ | 
| decode(buffer)          | ✔ | 
| decode(buffer, options) | ✔ | 

### Blob

#### Example

Creating a blob

```javascript
import { Blob, fetch } from "mphttpx";

const obj = { hello: "world" };
const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
});

const another_blob = new Blob(["Hello, World!"], {
    type: "text/plain"
});

fetch("https://www.test.com/blob", {
    method: "POST",
    body: another_blob,
});
```

Extracting data from a blob

```javascript
import { Blob, FileReader, fetch } from "mphttpx";

const blob = new Blob([JSON.stringify({ foo: "bar" })], {
    type: "application/json",
});

const reader = new FileReader();
reader.addEventListener("loadend", () => {
  // reader.result contains the contents of blob as a typed array
});
reader.readAsArrayBuffer(blob);

fetch("https://www.test.com/blob", {
    method: "POST",
    body: blob,
})
    .then(r => r.blob())
    .then(r => {
        const reader2 = new FileReader();
        reader2.onload = () => {
            // reader2.result
        }
        reader2.readAsDataURL(r);   // base64
    });
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| size | ✔ | 
| type | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| arrayBuffer()                  | ✔ | 
| bytes()                        | ✔ | 
| slice()                        | ✔ | 
| slice(start)                   | ✔ | 
| slice(start, end)              | ✔ | 
| slice(start, end, contentType) | ✔ | 
| stream()                       | ✖ | 
| text()                         | ✔ | 

### File

#### Example

```javascript
import { File } from "mphttpx";

const file = new File(["foo"], "foo.txt", {
    type: "text/plain",
});
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| lastModified       | ✔ | 
| name               | ✔ | 
| webkitRelativePath | ✖ | 

### FileReader

#### Example

```javascript
import { File, FileReader } from "mphttpx";

const file = new File([JSON.stringify({ foo: "bar" })], "test.json", {
    type: "application/json",
});

// Read the file
const reader = new FileReader();
reader.onload = () => {
    console.log(reader.result);
};
reader.readAsText(file);
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| error      | ✔ | 
| readyState | ✔ | 
| result     | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| abort()              | ✔ | simulated |
| readAsArrayBuffer()  | ✔ | 
| readAsBinaryString() | ✔ | 
| readAsDataURL()      | ✔ | 
| readAsText()         | ✔ | only utf-8 | 

### URLSearchParams

#### Example

```javascript
import { URLSearchParams, fetch } from "mphttpx";

const paramsString = "q=URLUtils.searchParams&topic=api";
const searchParams = new URLSearchParams(paramsString);

// Iterating the search parameters
for (const p of searchParams) {
    console.log(p);
}

console.log(searchParams.has("topic")); // true
console.log(searchParams.has("topic", "fish")); // false
console.log(searchParams.get("topic") === "api"); // true
console.log(searchParams.getAll("topic")); // ["api"]
console.log(searchParams.get("foo") === null); // true
console.log(searchParams.append("topic", "webdev"));
console.log(searchParams.toString()); // "q=URLUtils.searchParams&topic=api&topic=webdev"
console.log(searchParams.set("topic", "More webdev"));
console.log(searchParams.toString()); // "q=URLUtils.searchParams&topic=More+webdev"
console.log(searchParams.delete("topic"));
console.log(searchParams.toString()); // "q=URLUtils.searchParams"

// GET
fetch("https://www.test.com/get" + `?${searchParams.toString()}`);

// POST
fetch("https://www.test.com/post", {
    method: "POST",
    body: searchParams,
});
```

Search parameters can also be an object.

```javascript
import { URLSearchParams } from "mphttpx";

const paramsObj = { foo: "bar", baz: "bar" };
const searchParams = new URLSearchParams(paramsObj);

console.log(searchParams.toString()); // "foo=bar&baz=bar"
console.log(searchParams.has("foo")); // true
console.log(searchParams.get("foo")); // "bar"
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| size | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| append(name, value)        | ✔ | 
| delete(name)               | ✔ | 
| delete(name, value)        | ✔ | 
| entries()                  | ✔ | 
| forEach(callback)          | ✔ | 
| forEach(callback, thisArg) | ✔ | 
| get(name)                  | ✔ | 
| getAll(name)               | ✔ | 
| has(name)                  | ✔ | 
| has(name, value)           | ✔ | 
| keys()                     | ✔ | 
| set(name, value)           | ✔ | 
| sort()                     | ✔ | 
| toString()                 | ✔ | 
| values()                   | ✔ | 

### FormData

#### Example

```javascript
import { FormData, fetch } from "mphttpx";

const formData = new FormData();
formData.append("username", "Chris");

const file = new File(["Hello, World!"], "file.txt", {
    type: "text/plain",
});
formData.append("file", file);

fetch("https://www.test.com/formdata", {
    method: "POST",
    body: formData,
});
```

#### Compatibility

Constructors

| Constructor | Available  | Description  |
| ----------- | ---------  | -------------|
| new FormData()                | ✔ | 
| new FormData(form)            | ✖ | 
| new FormData(form, submitter) | ✖ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| append(name, value)           | ✔ | 
| append(name, value, filename) | ✔ | 
| delete(name)                  | ✔ | 
| entries()                     | ✔ | 
| get(name)                     | ✔ | 
| getAll(name)                  | ✔ | 
| has(name)                     | ✔ | 
| keys()                        | ✔ | 
| set(name, value)              | ✔ | 
| set(name, value, filename)    | ✔ | 
| values()                      | ✔ | 

### fetch

#### Example

```javascript
import { fetch } from "mphttpx";

fetch("http://example.com/movies.json")
    .then((response) => response.json())
    .then((data) => console.log(data));
```

Using fetch() to POST JSON data

```javascript
import { fetch } from "mphttpx";

const data = { username: "example" };

fetch("https://example.com/profile", {
    method: "POST", // or 'PUT'
    headers: {
        "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
})
    .then((response) => response.json())
    .then((data) => {
        console.log("Success:", data);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
```

Uploading files

```javascript
import { fetch, File, FormData } from "mphttpx";

const formData = new FormData();

formData.append("username", "abc123");
formData.append("file", new File(["foo"], "foo.txt", { type: "text/plain" }));

fetch("https://example.com/profile/avatar", {
    method: "PUT",
    body: formData,
})
    .then((response) => response.json())
    .then((result) => {
        console.log("Success:", result);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
```

Note: The fetch method of mphttpx is implemented based on XMLHttpRequest, and this underlying implementation is replaceable.

```javascript
import { setXMLHttpRequest } from "mphttpx";
setXMLHttpRequest(another_XMLHttpRequest);  // custom XMLHttpRequest implementation
```

| Syntax  | Available  | Description  |
| ------- | ---------  | -------------|
| fetch(resource)          | ✔ | 
| fetch(resource, options) | ✔ | 

#### Compatibility

Refer to Request below.

### Request

#### Example

```javascript
import { fetch, Request } from "mphttpx";

const request = new Request("https://www.mozilla.org/favicon.ico");

const url = request.url;
const method = request.method;
const credentials = request.credentials;

fetch(request)
    .then((response) => response.blob())
    .then((blob) => {
        console.log(blob);
    });
```

```javascript
import { fetch, Request } from "mphttpx";

const request = new Request("https://example.com", {
    method: "POST",
    body: '{"foo": "bar"}',
});

const url = request.url;
const method = request.method;
const credentials = request.credentials;
const bodyUsed = request.bodyUsed;

fetch(request)
    .then((response) => {
        if (response.status === 200) {
            return response.json();
        } else {
            throw new Error("Something went wrong on API server!");
        }
    })
    .then((response) => {
        console.debug(response);
        // …
    })
    .catch((error) => {
        console.error(error);
    });
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| body           | ✖ | 
| bodyUsed       | ✔ | 
| cache          | ✔ | 
| credentials    | ✔ | 
| destination    | ✖ | 
| headers        | ✔ | 
| integrity      | ✖ | 
| keepalive      | ✖ | 
| method         | ✔ | 
| mode           | ✖ | 
| redirect       | ✖ | 
| referrer       | ✖ | 
| referrerPolicy | ✖ | 
| signal         | ✔ | 
| url            | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| arrayBuffer() | ✔ | 
| blob()        | ✔ | 
| bytes()       | ✔ | 
| clone()       | ✔ | 
| formData()    | ✔ | 
| json()        | ✔ | 
| text()        | ✔ | 

### Response

#### Example

```javascript
import { Response, Blob, fetch } from "mphttpx";

const myBlob = new Blob();
const myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
const myResponse = new Response(myBlob, myOptions);
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| body       | ✖ | 
| bodyUsed   | ✔ | 
| headers    | ✔ | 
| ok         | ✔ | 
| redirected | ✖ | 
| status     | ✔ | 
| statusText | ✔ | 
| type       | ✖ | 
| url        | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| arrayBuffer() | ✔ | 
| blob()        | ✔ | 
| bytes()       | ✔ | 
| clone()       | ✔ | 
| formData()    | ✔ | 
| json()        | ✔ | 
| text()        | ✔ | 

### Headers

#### Example

```javascript
import { Headers, fetch } from "mphttpx";

const myHeaders = new Headers();

myHeaders.append("Content-Type", "text/plain");
myHeaders.get("Content-Type"); // should return 'text/plain'

fetch("https://www.test.com/headers", {
    headers: myHeaders,
});
```

The same can be achieved by passing an array of arrays or an object literal to the constructor:

```javascript
import { Headers } from "mphttpx";

let myHeaders = new Headers({
    "Content-Type": "text/plain",
});

// or, using an array of arrays:
myHeaders = new Headers([["Content-Type", "text/plain"]]);

myHeaders.get("Content-Type"); // should return 'text/plain'
```

#### Compatibility

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| append(name, value)          | ✔ | 
| delete(name)                 | ✔ | 
| entries()                    | ✔ | 
| forEach(callbackFn)          | ✔ | 
| forEach(callbackFn, thisArg) | ✔ | 
| get(name)                    | ✔ | 
| getSetCookie()               | ✔ | 
| has(name)                    | ✔ | 
| keys()                       | ✔ | 
| set(name, value)             | ✔ | 
| values()                     | ✔ | 

### AbortController

#### Example

```javascript
import { AbortController, fetch } from "mphttpx";

const controller = new AbortController();

fetch("https://www.test.com/abort", {
    signal: controller.signal,
});
```

```javascript
import { AbortController, AbortSignal, Request, fetch } from "mphttpx";

async function get() {
    const controller = new AbortController();
    const request = new Request("https://example.org/get", {
        signal: controller.signal,
    });

    const response = await fetch(request);
    controller.abort();
    // The next line will throw `AbortError`
    const text = await response.text();
    console.log(text);
}
```

#### Compatibility

AbortController Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| signal | ✔ | 

AbortController Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| abort()       | ✔ | 
| abort(reason) | ✔ | 

AbortSignal Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| aborted | ✔ | 
| reason  | ✔ | 

AbortSignal Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| throwIfAborted() | ✔ | 

### EventTarget

#### Example

```javascript
import { EventTarget, Event, CustomEvent } from "mphttpx";

const target = new EventTarget();

target.addEventListener("foo", function (evt) {
    console.log(evt);
});

const evt = new Event("foo");
target.dispatchEvent(evt);

target.addEventListener("animalfound", function (evt) {
    console.log(evt.detail.name);
});

const catFound = new CustomEvent("animalfound", {
    detail: {
        name: "cat",
    },
});
target.dispatchEvent(catFound);
```

#### Compatibility

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| addEventListener(type, listener)                | ✔ | 
| addEventListener(type, listener, options)       | ✔ | 
| addEventListener(type, listener, useCapture)    | ✔ | 
| dispatchEvent(event)                            | ✔ | 
| removeEventListener(type, listener)             | ✔ | 
| removeEventListener(type, listener, options)    | ✔ | 
| removeEventListener(type, listener, useCapture) | ✔ | 

### XMLHttpRequest (mini-programs)

#### Example

GET

```javascript
import { XMLHttpRequest } from "mphttpx";

const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/server?foo=bar&lorem=ipsum");

xhr.onload = () => {
    // Request finished. Do processing here.
};

xhr.send();
```

POST

```javascript
import { XMLHttpRequest } from "mphttpx";

const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com/server");

// Send the proper header information along with the request
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

xhr.onreadystatechange = () => {
    // Call a function when the state changes.
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        // Request finished. Do processing here.
    }
};

xhr.send(JSON.stringify({ foo: "bar", lorem: "ipsum" }));
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| readyState      | ✔ | 2, 3: simulated |
| response        | ✔ | 
| responseText    | ✔ | 
| responseType    | ✔ | The `"document"` is not supported |
| responseURL     | ✔ | The `responseURL` returns the URL used in the original request. |
| responseXML     | ✖ | 
| status          | ✔ | 
| statusText      | ✔ | 
| timeout         | ✔ | This value must be less than the default timeout of mini-programs. | 
| upload          | ✔ | simulated |
| withCredentials | ✖ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| abort()                                  | ✔ | 
| getAllResponseHeaders()                  | ✔ | 
| getResponseHeader(headerName)            | ✔ | 
| open(method, url)                        | ✔ | 
| open(method, url, async)                 | ✔ | 
| open(method, url, async, user)           | ✔ | 
| open(method, url, async, user, password) | ✔ | 
| overrideMimeType(mimeType)               | ✖ | 
| send()                                   | ✔ | 
| send(body)                               | ✔ | 
| setRequestHeader(header, value)          | ✔ | 

### WebSocket (mini-programs, since 1.1.0)

#### Example

```javascript
import { WebSocket } from "mphttpx";

// Create WebSocket connection.
const socket = new WebSocket("wss://example.com:8080");

// Change binary type from "blob" to "arraybuffer"
socket.binaryType = "arraybuffer";

// Listen for messages
socket.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
        // binary frame
        const view = new DataView(event.data);
        console.log(view.getInt32(0));
    } else {
        // text frame
        console.log(event.data);
    }
});
```

#### Compatibility

Properties

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| binaryType     | ✔ | 
| bufferedAmount | ✖ | 
| extensions     | ✖ | 
| protocol       | ✔ | 
| readyState     | ✔ | 
| url            | ✔ | 

Methods

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| close()             | ✔ | 
| close(code)         | ✔ | 
| close(code, reason) | ✔ | 
| send(data)          | ✔ | 

## Auto Import

See [unplugin-auto-import][2] for more details.

```javascript
// for reference only
AutoImport({
    // other configs

    imports: [
        // other imports

        {
            "mphttpx": [
                "TextEncoder",
                "TextDecoder",

                "Blob",
                "File",
                "FileReader",

                "URLSearchParams",
                "FormData",

                "fetch",
                "Headers",
                "Request",
                "Response",

                "AbortController",
                "AbortSignal",

                "EventTarget",
                "Event",
                "CustomEvent",

                "XMLHttpRequest",   // mini-programs
                "WebSocket",        // mini-programs
            ],
        },

        // other imports
    ],

    // other configs
});
```

Note for `UniApp` developers: If your project is a UniApp mini-program created via HBuilderX using the legacy Vue2 template, 
try installing an older version of the unplugin-auto-import plugin that supports CMD, such as version 0.16.7.

## UniApp & Taro

```javascript
import { setRequest } from "mphttpx";
import { setConnectSocket } from "mphttpx";

setRequest(uni.request);
// setRequest(Taro.request);

setConnectSocket(uni.connectSocket);
// setConnectSocket(Taro.connectSocket);
```

Note: When using in UniApp or Taro, if `fetch`, `XMLHttpRequest` or `WebSocket` fails to work, try explicitly setting the request/connectSocket function.

## Node.js

```bash
npm install xhr2
```

```javascript
import XMLHttpRequest from "xhr2";
import { setXMLHttpRequest } from "mphttpx";

setXMLHttpRequest(XMLHttpRequest);
```

## License

MIT

[0]: https://github.com/eligrey/Blob.js
[1]: https://github.com/github/fetch
[2]: https://www.npmjs.com/package/unplugin-auto-import
