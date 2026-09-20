# 安装与使用本工具

先读开始使用.md、LICENSE.md、THIRD_PARTY_NOTICES.md及DEPENDENCIES.md。

1. 基础环境：Python3.10+、ffmpeg、ffprobe、现代浏览器。启动 python3 scripts/open-lab.py。启动器只检查不自动安装，不能把缺依赖当作成功启动。
2. 3种高级动画导出额外需要Node.js20+和Playwright1.62.1。用户要使用此导出时，在本目录执行 python3 scripts/setup-advanced.py。它会联网安装到.runtime，现有Chrome不可用时下载Chromium；不要全局安装、不要复制开发者路径。
3. GET /api/advanced/environment 返回ready；之后应真实导出一个样片，不把依赖安装成功当作功能验收。高级模板可先免费预览，导出失败需报告真实原因。
4. 免费包含15模板及手工拉片。手工拉片是导入→选段→15帧观察，不能描述为自动理解/源码恢复。所有文字/图片/参数允许正常编辑，程序源码修改和二次出售按LICENSE约束。
5. 不上传用户视频、Cookie、私人数据或.runtime到公开仓库；原视频保留。用户上传图片和Logo按其授权使用。

其他agent可读AGENT_API.md，通过scripts/agent-cli.py或HTTP使用。先列模板/检查环境，再渲染与查任务；失败和超时不得声称成功。

制作整条视频前，阅读docs/完整视频制作指南.md。先核对用户文案/配音/分镜和素材，再批量渲染；保留参数和镜头清单。当前工作台仅动画片段与手工拉片，配音/字幕/音乐/整片剪辑需要外部能力。未经实际合成检查，不得把已导出动画片段报告为完整成片。
