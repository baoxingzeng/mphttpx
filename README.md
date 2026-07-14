# MPHTTPX

小程序中浏览器网络 API 的完整 polyfill 实现，一次安装即可使用 `fetch`、`XMLHttpRequest`、`WebSocket` 等符合 W3C 标准的应用程序编程接口。

---

## 安装

```bash
npm install mphttpx
```

## 快速开始

```javascript
import { fetch } from "mphttpx";

fetch("https://api.example.com/data")
    .then(r => r.json())
    .then(r => console.log(r));
```

## 功能模块

| API                                          | 来源                            |
| -------------------------------------------- | ------------------------------- |
| `fetch` / `Headers` / `Request` / `Response` | fetch-xhr-shim                  |
| `Blob` / `File` / `FileReader`               | fetch-xhr-shim                  |
| `URLSearchParams` / `FormData`               | fetch-xhr-shim                  |
| `AbortController` / `AbortSignal`            | fetch-xhr-shim                  |
| `EventTarget` / `Event` / `CustomEvent`      | fetch-xhr-shim                  |
| `TextEncoder` / `TextDecoder`                | fetch-xhr-shim                  |
| `XMLHttpRequest`                             | miniprogram-xmlhttprequest-shim |
| `WebSocket`                                  | miniprogram-websocket           |

每个 API 都有对应的 `P` 后缀版本（如 `fetchP`、`BlobP`、`TextEncoderP`），始终返回 polyfill 实现，请按需使用。

```javascript
import { fetch, Blob } from "mphttpx";   // 优先返回全局对象，不存在时返回 polyfill
import { fetchP, BlobP } from "mphttpx"; // 始终返回 polyfill 实现
```

## 依赖库

| 库                                                                                               | 提供的 API                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [fetch-xhr-shim](https://www.npmjs.com/package/fetch-xhr-shim)                                   | fetch、Headers、Request、Response、<br>Blob、File、FileReader、<br>URLSearchParams、FormData、<br>AbortController、AbortSignal、<br>EventTarget、Event、CustomEvent、<br>TextEncoder、TextDecoder |
| [miniprogram-xmlhttprequest-shim](https://www.npmjs.com/package/miniprogram-xmlhttprequest-shim) | XMLHttpRequest、<br>Cookie、enableCookie                                                                                                                                                          |
| [miniprogram-websocket](https://www.npmjs.com/package/miniprogram-websocket)                     | WebSocket                                                                                                                                                                                         |

各 API 的详细文档及兼容性说明请参阅对应库的自述文档。

## 兼容性

| 微信  | 支付宝 | 百度  | 抖音  |  QQ   | 快手  | 京东  | 小红书 |
| :---: | :----: | :---: | :---: | :---: | :---: | :---: | :----: |
|   ✅   |   ✅    |   ✅   |   ✅   |   ✅   |   ✅   |   ✅   |   ✅    |

在 Chrome、Firefox、Edge、Safari 等浏览器中，所有导出均直接使用浏览器原生实现，无性能损耗。

## 注意事项

- **支付宝小程序**：`fetch`、`XMLHttpRequest`、`WebSocket` 等为保留字，导入时建议重命名：`import { fetch as fetchPolyfill } from "mphttpx";`。

## 开源协议

MIT License

Copyright (c) 2026

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
