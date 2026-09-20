# 依赖记录 · v0.4

| 功能 | 运行依赖 |
|---|---|
| HTTP、文件与参数 | Python3.10+标准库 |
| 免费手工拉片、编码 | FFmpeg与ffprobe |
| 12种基础卡片预览/导出 | 现代浏览器；导出PNG再交FFmpeg |
| 3种高级动画预览 | 现代浏览器，CSS backdrop-filter、Canvas2D |
| 3种高级动画导出 | Node.js20+、Playwright1.62.1、Chrome或Chromium；FFmpeg |

scripts/setup-advanced.py安装到.runtime，不全局安装；分发包不包含运行时/二进制/字体。使用系统字体，不同系统外观可能不同。Playwright为Apache-2.0，Python为PSF，FFmpeg授权依所装构建，详见THIRD_PARTY_NOTICES.md。

第三方抖音原片、截图、音频、个人AI Logo库不分发。免费默认图案与三张风景SVG是自有代码绘制。用户可上传Logo，来源由使用者保留。yt-dlp仅为开发参考获取工具，不是运行依赖。

安装检测不替代实际运行验证；同机清洁解压实际导出结果见本次发行说明。跨电脑验收仍待外部试用。
