# MPHTTPX

The `mphttpx` library aims to provide a more ES6-styled [Blob.js][0], 
along with a `fetch` polyfill that works seamlessly with the Blob-polyfill. 
This allows web code to be reused in other environments (such as mini-programs).

## Table of Contents

- [MPHTTPX](#mphttpx)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Installation](#installation)
  - [Mini-Program Support](#mini-program-support)
  - [Usage](#usage)
    - [TextEncoder](#textencoder)
      - [Compatibility](#compatibility)
    - [TextDecoder](#textdecoder)
      - [Compatibility](#compatibility-1)
    - [Blob](#blob)
      - [Compatibility](#compatibility-2)
    - [File](#file)
      - [Compatibility](#compatibility-3)
    - [FileReader](#filereader)
      - [Compatibility](#compatibility-4)
    - [FormData](#formdata)
      - [Compatibility](#compatibility-5)
    - [URLSearchParams](#urlsearchparams)
      - [Compatibility](#compatibility-6)
    - [fetch](#fetch)
      - [Compatibility](#compatibility-7)
    - [Headers](#headers)
      - [Compatibility](#compatibility-8)
    - [Request](#request)
      - [Compatibility](#compatibility-9)
    - [Response](#response)
      - [Compatibility](#compatibility-10)
    - [AbortController](#abortcontroller)
      - [Compatibility](#compatibility-11)
    - [AbortSignal](#abortsignal)
      - [Compatibility](#compatibility-12)
    - [EventTarget](#eventtarget)
      - [Compatibility](#compatibility-13)
    - [XMLHttpRequest (mini-programs)](#xmlhttprequest-mini-programs)
      - [Compatibility](#compatibility-14)
  - [UniApp \& Taro](#uniapp--taro)
  - [Node.js](#nodejs)
  - [License](#license)

## Features

- **TextEncoder** 
- **TextDecoder** 
- **Blob** 
- **File** 
- **FileReader** 
- **FormData** 
- **URLSearchParams** 
- **fetch** 
- **Headers** 
- **Request** 
- **Response** 
- **AbortController** 
- **AbortSignal** 
- **EventTarget**
- **XMLHttpRequest (mini-programs)**

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

### TextEncoder

```javascript
import { TextEncoder } from "mphttpx";

const encoder = new TextEncoder();
const view = encoder.encode("€");
console.log(view); // Uint8Array(3) [226, 130, 172]
```

#### Compatibility

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| encoding  | ✔ | utf-8 |

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| encode(string)                 | ✔ | 
| encodeInto(string, uint8Array) | ✔ | 

### TextDecoder

```javascript
import { TextDecoder } from "mphttpx";

const utf8decoder = new TextDecoder(); // default 'utf-8'
const encodedText = new Uint8Array([240, 160, 174, 183]);

console.log(utf8decoder.decode(encodedText));
```

#### Compatibility

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| encoding  | ✔ | utf-8 |
| fatal     | ✔ | 
| ignoreBOM | ✔ | 

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| decode()                | ✔ | 
| decode(buffer)          | ✔ | 
| decode(buffer, options) | ✔ | 

### Blob

Creating a blob

```javascript
import { Blob } from "mphttpx";

const obj = { hello: "world" };
const blob = new Blob([JSON.stringify(obj, null, 2)], {
    type: "application/json",
});
```

Extracting data from a blob

```javascript
import { Blob, FileReader } from "mphttpx";

const reader = new FileReader();
reader.addEventListener("loadend", () => {
  // reader.result contains the contents of blob as a typed array
});
reader.readAsArrayBuffer(blob);
```

#### Compatibility

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| size | ✔ | 
| type | ✔ | 

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

```javascript
import { File } from "mphttpx";

const file = new File(["foo"], "foo.txt", {
    type: "text/plain",
});
```

#### Compatibility

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| lastModified       | ✔ | 
| name               | ✔ | 
| webkitRelativePath | ✖ | 

### FileReader

```javascript
import { File, FileReader } from "mphttpx";

// Read the file
const reader = new FileReader();
reader.onload = () => {
    console.log(reader.result);
};
reader.readAsText(file);
```

#### Compatibility

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| error      | ✔ | 
| readyState | ✔ | 
| result     | ✔ | 

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| abort()              | ✔ | simulated |
| readAsArrayBuffer()  | ✔ | 
| readAsBinaryString() | ✔ | 
| readAsDataURL()      | ✔ | 
| readAsText()         | ✔ | 

### FormData

```javascript
import { FormData } from "mphttpx";

const formData = new FormData();
formData.append("username", "Chris");
```

#### Compatibility

| Constructor | Available  | Description  |
| ----------- | ---------  | -------------|
| new FormData()                | ✔ | 
| new FormData(form)            | ✖ | 
| new FormData(form, submitter) | ✖ | 

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

### URLSearchParams

```javascript
import { URLSearchParams } from "mphttpx";

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

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| size | ✔ | 

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

### fetch

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
import { fetch, File } from "mphttpx";

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

| Syntax  | Available  | Description  |
| ------- | ---------  | -------------|
| fetch(resource)          | ✔ | 
| fetch(resource, options) | ✔ | 

#### Compatibility

Refer to Request below.

### Headers

```javascript
import { Headers } from "mphttpx";

const myHeaders = new Headers();

myHeaders.append("Content-Type", "text/plain");
myHeaders.get("Content-Type"); // should return 'text/plain'
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

### Request

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

```javascript
import { Response, Blob, fetch } from "mphttpx";

const myBlob = new Blob();
const myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
const myResponse = new Response(myBlob, myOptions);
```

#### Compatibility

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

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| arrayBuffer() | ✔ | 
| blob()        | ✔ | 
| bytes()       | ✔ | 
| clone()       | ✔ | 
| formData()    | ✔ | 
| json()        | ✔ | 
| text()        | ✔ | 

### AbortController

```javascript
import { AbortController } from "mphttpx";

const controller = new AbortController();
```

#### Compatibility

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| signal | ✔ | 

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| abort()       | ✔ | 
| abort(reason) | ✔ | 

### AbortSignal

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

| Property  | Available  | Description  |
| --------- | ---------  | -------------|
| aborted | ✔ | 
| reason  | ✔ | 

| Method  | Available  | Description  |
| ------- | ---------  | -------------|
| throwIfAborted() | ✔ | 

### EventTarget

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

| Property  | Available  | Description  |
| -------- | ---------  | -------------|
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

## UniApp & Taro

```javascript
import { setRequest } from "mphttpx";

setRequest(uni.request);
// setRequest(Taro.request);
```

Note: When using in UniApp or Taro, if `fetch` or `XMLHttpRequest` fails to work, try explicitly setting the request function.

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
