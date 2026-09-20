# 第三方软件与许可说明

本文件对应 v0.4 免费源码分发包，核对日期 2026-09-20。项目自己的使用规则见 [LICENSE.md](LICENSE.md)，不覆盖或替换以下第三方许可证。

## 运行时依赖

| 组件 | 使用方式 | 上游许可来源 |
| --- | --- | --- |
| Python 3.10+ 标准库 | 调用用户已安装的解释器及标准库；不随包分发 Python | [Python 许可及第三方声明](https://docs.python.org/3/license.html)：PSF License Version 2 及所含组件的各自许可 |
| FFmpeg / FFprobe | 作为用户已安装的独立可执行程序调用，处理视频；不随包分发二进制或链接库 | [FFmpeg 官方许可说明](https://ffmpeg.org/legal.html)：主要为 LGPL 2.1+，启用特定组件的构建可能适用 GPL 等条款，以实际构建为准 |
| 浏览器、系统字体 | 使用用户现有浏览器与系统字体；不附带浏览器或字体文件 | 各自供应商的许可证及使用条款 |

可以运行 `ffmpeg -L`、`ffmpeg -buildconf` 查看所安装构建的信息。本包不随附第三方JavaScript库，但高级动画导出需要通过安装脚本另行安装Playwright1.62.1到.runtime。

## 开发工具与素材

- Playwright用于高级动画MP4导出及开发验证，不随源码ZIP提供。用户可运行scripts/setup-advanced.py安装；基础功能和预览不要求它。其 [上游许可证为 Apache-2.0](https://github.com/microsoft/playwright/blob/main/LICENSE)。
- yt-dlp 仅曾用于开发过程的授权参考素材获取，不属于本工具的运行依赖，不随包提供。
- 参考视频、截图、音频、测试素材、开发者私人卡库与运行记录均不进入分发包。用户自行导入的素材仍须按原有权利范围使用。

本文件是当前分发范围和来源说明，不是所列第三方软件的许可证全文。若未来捆绑运行时、字体或第三方代码，发布者须按实际加入的组件及版本补齐其要求的许可证、声明及其他分发材料；不能仅沿用本文件中的链接。

Node.js是高级渲染的执行环境，不随包提供；[Node.js许可](https://github.com/nodejs/node/blob/main/LICENSE)。浏览器使用现有Chrome或Playwright下载的Chromium，各依供应商许可。默认图标为自制抽象图案，不随包提供开发者私人AI品牌Logo库。
