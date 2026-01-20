# MPHTTPX 中文文档

`mphttpx`旨在为小程序提供与浏览器一致的请求开发体验，通过引入此库即可在小程序中使用XMLHttpRequest、fetch和FormData等浏览器请求相关功能。

## 目录

- [MPHTTPX 中文文档](#mphttpx-中文文档)
  - [目录](#目录)
  - [功能](#功能)
  - [安装](#安装)
  - [小程序支持情况](#小程序支持情况)
  - [使用](#使用)
    - [TextEncoder](#textencoder)
      - [示例](#示例)
      - [兼容性](#兼容性)
    - [TextDecoder](#textdecoder)
      - [示例](#示例-1)
      - [兼容性](#兼容性-1)
    - [Blob](#blob)
      - [示例](#示例-2)
      - [兼容性](#兼容性-2)
    - [File](#file)
      - [示例](#示例-3)
      - [兼容性](#兼容性-3)
    - [FileReader](#filereader)
      - [示例](#示例-4)
      - [兼容性](#兼容性-4)
    - [URLSearchParams](#urlsearchparams)
      - [示例](#示例-5)
      - [兼容性](#兼容性-5)
    - [FormData](#formdata)
      - [示例](#示例-6)
      - [兼容性](#兼容性-6)
    - [fetch](#fetch)
      - [示例](#示例-7)
      - [兼容性](#兼容性-7)
    - [Request](#request)
      - [示例](#示例-8)
      - [兼容性](#兼容性-8)
    - [Response](#response)
      - [示例](#示例-9)
      - [兼容性](#兼容性-9)
    - [Headers](#headers)
      - [示例](#示例-10)
      - [兼容性](#兼容性-10)
    - [AbortController](#abortcontroller)
      - [示例](#示例-11)
      - [兼容性](#兼容性-11)
    - [EventTarget](#eventtarget)
      - [示例](#示例-12)
      - [兼容性](#兼容性-12)
    - [XMLHttpRequest (小程序)](#xmlhttprequest-小程序)
      - [示例](#示例-13)
      - [兼容性](#兼容性-13)
    - [WebSocket (小程序, 从1.1.0之后)](#websocket-小程序-从110之后)
      - [示例](#示例-14)
      - [兼容性](#兼容性-14)
  - [自动导入](#自动导入)
  - [UniApp \& Taro](#uniapp--taro)
  - [Node.js](#nodejs)
  - [开源协议](#开源协议)

## 功能

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
- **XMLHttpRequest (小程序)**
- **WebSocket (小程序, 从1.1.0之后)**

## 安装

```
npm install mphttpx
```

## 小程序支持情况

| 微信 | 支付宝 | 百度 | 抖音 | QQ | 快手 | 京东 | 小红书 |
|:---:|:------:|:----:|:---:|:--:|:----:|:---:|:------:|
| ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |

注意：在现代浏览器中，并不需要这些填充功能，在浏览器中从mphttpx导入的函数会直接返回浏览器本地的函数。

## 使用

注意：mphttpx中所有的模块都有一个与之对应的以字母P结尾的版本，两者的区别在于以字母P结尾的版本是polyfill的。

举个例子:

```javascript
// mphttpx不对globalThis做任何修改
import { TextEncoder } from "mphttpx";  // 优先返回全局对象，如果不存在则返回polyfill实现
import { TextEncoderP } from "mphttpx"; // 直接返回polyfill实现
```

### TextEncoder

#### 示例

```javascript
import { TextEncoder } from "mphttpx";

const encoder = new TextEncoder();
const encoded = encoder.encode("€");

console.log(encoded); // Uint8Array(3) [226, 130, 172]
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| encoding  | ✔ | utf-8 |

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| encode(string)                 | ✔ | 
| encodeInto(string, uint8Array) | ✔ | 

### TextDecoder

#### 示例

```javascript
import { TextDecoder } from "mphttpx";

const utf8decoder = new TextDecoder(); // 默认 'utf-8'
const encodedText = new Uint8Array([240, 160, 174, 183]);

console.log(utf8decoder.decode(encodedText)); // 𠮷
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| encoding  | ✔ | 仅utf-8 |
| fatal     | ✔ | 
| ignoreBOM | ✔ | 

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| decode()                | ✔ | 
| decode(buffer)          | ✔ | 
| decode(buffer, options) | ✔ | 

### Blob

#### 示例

创建blob

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

从blob提取数据

```javascript
import { Blob, FileReader, fetch } from "mphttpx";

const blob = new Blob([JSON.stringify({ foo: "bar" })], {
    type: "application/json",
});

const reader = new FileReader();
reader.addEventListener("loadend", () => {
  // reader.result中包含了ArrayBuffer数据格式的内容 
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

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| size | ✔ | 
| type | ✔ | 

方法

| 方法    | 可用性      | 描述         |
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

#### 示例

```javascript
import { File } from "mphttpx";

const file = new File(["foo"], "foo.txt", {
    type: "text/plain",
});
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| lastModified       | ✔ | 
| name               | ✔ | 
| webkitRelativePath | ✖ | 

### FileReader

#### 示例

```javascript
import { File, FileReader } from "mphttpx";

const file = new File([JSON.stringify({ foo: "bar" })], "test.json", {
    type: "application/json",
});

// 读取file
const reader = new FileReader();
reader.onload = () => {
    console.log(reader.result);
};
reader.readAsText(file);
```

#### 兼容性 

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| error      | ✔ | 
| readyState | ✔ | 
| result     | ✔ | 

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| abort()              | ✔ | 模拟实现 |
| readAsArrayBuffer()  | ✔ | 
| readAsBinaryString() | ✔ | 
| readAsDataURL()      | ✔ | 
| readAsText()         | ✔ | 仅utf-8 | 

### URLSearchParams

#### 示例

```javascript
import { URLSearchParams, fetch } from "mphttpx";

const paramsString = "q=URLUtils.searchParams&topic=api";
const searchParams = new URLSearchParams(paramsString);

// 迭代搜索参数
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

搜索参数也可以通过对象构造

```javascript
import { URLSearchParams } from "mphttpx";

const paramsObj = { foo: "bar", baz: "bar" };
const searchParams = new URLSearchParams(paramsObj);

console.log(searchParams.toString()); // "foo=bar&baz=bar"
console.log(searchParams.has("foo")); // true
console.log(searchParams.get("foo")); // "bar"
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| size | ✔ | 

方法

| 方法    | 可用性      | 描述         |
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

#### 示例

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

#### 兼容性

构造函数

| 构造函数    | 可用性      | 描述         |
| ----------- | ---------  | -------------|
| new FormData()                | ✔ | 
| new FormData(form)            | ✖ | 
| new FormData(form, submitter) | ✖ | 

方法

| 方法    | 可用性      | 描述         |
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

#### 示例

```javascript
import { fetch } from "mphttpx";

fetch("http://example.com/movies.json")
    .then((response) => response.json())
    .then((data) => console.log(data));
```

通过fetch发送JSON数据

```javascript
import { fetch } from "mphttpx";

const data = { username: "example" };

fetch("https://example.com/profile", {
    method: "POST", // 或 'PUT'
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

上传文件

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

注意：fetch基于下层XMLHttpRequest实现，且这个下层实现是可以替换的。

```javascript
import { setXMLHttpRequest } from "mphttpx";
setXMLHttpRequest(another_XMLHttpRequest);  // 自定义XMLHttpRequest实现
```

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| fetch(resource)          | ✔ | 
| fetch(resource, options) | ✔ | 

#### 兼容性

参考下方Request

### Request

#### 示例

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

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
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

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| arrayBuffer() | ✔ | 
| blob()        | ✔ | 
| bytes()       | ✔ | 
| clone()       | ✔ | 
| formData()    | ✔ | 
| json()        | ✔ | 
| text()        | ✔ | 

### Response

#### 示例

```javascript
import { Response, Blob, fetch } from "mphttpx";

const myBlob = new Blob();
const myOptions = { status: 200, statusText: "SuperSmashingGreat!" };
const myResponse = new Response(myBlob, myOptions);
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
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

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| arrayBuffer() | ✔ | 
| blob()        | ✔ | 
| bytes()       | ✔ | 
| clone()       | ✔ | 
| formData()    | ✔ | 
| json()        | ✔ | 
| text()        | ✔ | 

### Headers

#### 示例

```javascript
import { Headers, fetch } from "mphttpx";

const myHeaders = new Headers();

myHeaders.append("Content-Type", "text/plain");
myHeaders.get("Content-Type"); // 应当返回'text/plain'

fetch("https://www.test.com/headers", {
    headers: myHeaders,
});
```

通过传递数组的数组或普通对象也可进行构造：

```javascript
import { Headers } from "mphttpx";

let myHeaders = new Headers({
    "Content-Type": "text/plain",
});

// 或：使用数组的数组:
myHeaders = new Headers([["Content-Type", "text/plain"]]);

myHeaders.get("Content-Type"); // 应当返回'text/plain'
```

#### 兼容性

方法

| 方法    | 可用性      | 描述         |
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

#### 示例

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
    // 下一行将会抛出`AbortError`异常
    const text = await response.text();
    console.log(text);
}
```

#### 兼容性

AbortController属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| signal | ✔ | 

AbortController方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| abort()       | ✔ | 
| abort(reason) | ✔ | 

AbortSignal属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| aborted | ✔ | 
| reason  | ✔ | 

AbortSignal方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| throwIfAborted() | ✔ | 

### EventTarget

#### 示例

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

#### 兼容性

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| addEventListener(type, listener)                | ✔ | 
| addEventListener(type, listener, options)       | ✔ | 
| addEventListener(type, listener, useCapture)    | ✔ | 
| dispatchEvent(event)                            | ✔ | 
| removeEventListener(type, listener)             | ✔ | 
| removeEventListener(type, listener, options)    | ✔ | 
| removeEventListener(type, listener, useCapture) | ✔ | 

### XMLHttpRequest (小程序)

#### 示例

GET

```javascript
import { XMLHttpRequest } from "mphttpx";

const xhr = new XMLHttpRequest();
xhr.open("GET", "https://example.com/server?foo=bar&lorem=ipsum");

xhr.onload = () => {
    // 请求完成。在此处理业务。
};

xhr.send();
```

POST

```javascript
import { XMLHttpRequest } from "mphttpx";

const xhr = new XMLHttpRequest();
xhr.open("POST", "https://example.com/server");

// 在请求时携带合适的头信息
xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

xhr.onreadystatechange = () => {
    // 当状态变化时调用函数
    if (xhr.readyState === XMLHttpRequest.DONE && xhr.status === 200) {
        // 请求完成。在此处理业务。
    }
};

xhr.send(JSON.stringify({ foo: "bar", lorem: "ipsum" }));
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| readyState      | ✔ | 2, 3: 模拟实现 |
| response        | ✔ | 
| responseText    | ✔ | 
| responseType    | ✔ | 不支持`"document"` |
| responseURL     | ✔ | `responseURL`将原样返回请求中的URL地址 |
| responseXML     | ✖ | 
| status          | ✔ | 
| statusText      | ✔ | 
| timeout         | ✔ | 该值必须小于小程序的默认超时时间 | 
| upload          | ✔ | 模拟实现 |
| withCredentials | ✖ | 

方法

| 方法    | 可用性      | 描述         |
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

### WebSocket (小程序, 从1.1.0之后)

#### 示例

```javascript
import { WebSocket } from "mphttpx";

// 创建WebSocket连接
const socket = new WebSocket("wss://example.com:8080");

// 将二进制类型从"blob"改为"arraybuffer"
socket.binaryType = "arraybuffer";

// 监听消息
socket.addEventListener("message", (event) => {
    if (event.data instanceof ArrayBuffer) {
        // 二进制帧
        const view = new DataView(event.data);
        console.log(view.getInt32(0));
    } else {
        // 文本帧
        console.log(event.data);
    }
});
```

#### 兼容性

属性

| 属性      | 可用性      | 描述         |
| --------- | ---------  | -------------|
| binaryType     | ✔ | 
| bufferedAmount | ✖ | 
| extensions     | ✖ | 
| protocol       | ✔ | 
| readyState     | ✔ | 
| url            | ✔ | 

方法

| 方法    | 可用性      | 描述         |
| ------- | ---------  | -------------|
| close()             | ✔ | 
| close(code)         | ✔ | 
| close(code, reason) | ✔ | 
| send(data)          | ✔ | 

## 自动导入

查看[unplugin-auto-import][2]获取更多信息。

```javascript
// 仅参考
AutoImport({
    // 其他配置

    imports: [
        // 其他导入

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

                "XMLHttpRequest",   // 小程序
                "WebSocket",        // 小程序
            ],
        },

        // 其他导入
    ],

    // 其他配置
});
```

注意（UniApp开发者）：如果你的项目是通过HBuilderX以老式Vue2为模板创建的，尝试安装老版本的unplugin-auto-import以支持CMD模块，比如0.16.7版本。

## UniApp & Taro

```javascript
import { setRequest } from "mphttpx";
import { setConnectSocket } from "mphttpx";

setRequest(uni.request);
// setRequest(Taro.request);

setConnectSocket(uni.connectSocket);
// setConnectSocket(Taro.connectSocket);
```

注意：使用UniApp或Taro时，如果`fetch`, `XMLHttpRequest`或`WebSocket`无法正常工作，尝试显式设置request/connectSocket函数。

## Node.js

```bash
npm install xhr2
```

```javascript
import XMLHttpRequest from "xhr2";
import { setXMLHttpRequest } from "mphttpx";

setXMLHttpRequest(XMLHttpRequest);
```

## 开源协议

MIT

[0]: https://github.com/eligrey/Blob.js
[1]: https://github.com/github/fetch
[2]: https://www.npmjs.com/package/unplugin-auto-import
