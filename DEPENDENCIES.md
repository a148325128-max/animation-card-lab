# 依赖与来源记录

2026-09-20，v0.3 更新。本目录不重新分发下列第三方软件的可执行文件；没有 npm 生产运行依赖。

正式随包的第三方来源说明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)；本项目自定义免费使用许可见 [LICENSE.md](LICENSE.md)。下表中的 `qa/` 和 `licenses/` 是开发证据路径，未随试用包分发；公开上游许可链接已列于第三方说明中。

| 用途 | 依赖 | 记录与分发边界 |
|---|---|---|
| HTTP/JSON/文件保存 | 本机 Python 3 标准库 | PSF License；仅调用已安装运行时 |
| 视频选段/抽帧/本轮样片编码 | 本机 FFmpeg/FFprobe | 当前构建授权原文及配置见 `qa/ffmpeg-license.txt`；不复制二进制进交付 |
| 自动化浏览器检查/样片 | 本机 bundled Playwright | Apache-2.0，原文见 `licenses/playwright-LICENSE`；仅开发验证，试用者无需安装 |
| 实际渲染浏览器 | 本机 Google Chrome 或用户浏览器 | 使用现有安装，不附带浏览器 |
| 用户指定抖音参考下载 | 本机 yt-dlp + 用户授权 Chrome 访问态 | 仅一次素材获取，不是原型运行依赖；未导出 Cookie |
| 字体 | 浏览器系统字体 PingFang SC / 系统 sans-serif | 未复制/打包字体文件；不同系统字形可能不同 |
| 图形/交互 | 本目录原创 SVG/JS/CSS | 未引入第三方组件、受限软件源码或模板 |
| Logo 测试 | 本轮独立 Canvas 绘制的 L 图标 | `qa/test-logo.png`，仅演示 |
| 第三方参考片 | ami.moment 视频 7680966854822759743 | 仅本地观察；原片/声音/人像/截图不嵌入可复用卡片导出 |

这是开发来源记录，并不构成整套产品商业许可或分发验收。将来打包、托管或销售之前，应按实际加入的运行时、字体、图像和素材逐项核实许可。

## v0.3 试用包

运行需要Python 3.10+、FFmpeg/FFprobe和浏览器。生产导出由当前浏览器逐帧绘制PNG，Python调用FFmpeg编码；不再依赖开发机器的Playwright/Node路径。试用ZIP未内置上述运行时，安装由用户自行完成。Playwright授权文件保留于开发目录，未随试用包分发其代码或二进制。FFmpeg具体许可证取决于用户安装的构建，原qa记录仅对应开发机器。包内代码没有纳入第三方视频/字体文件。
