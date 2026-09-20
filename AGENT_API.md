# 其他AI agent调用说明 · API v1

任何能执行本机Shell或HTTP请求的agent均可调用，无须专属插件、AI账号或API密钥。先按AGENTS.md启动本工具并安装所需渲染组件。仅监听127.0.0.1，不是远程公开API，也不是MCP服务器。

## 命令行

在包目录执行，默认服务http://127.0.0.1:5198。不同端口用 `--url http://127.0.0.1:5220`（放在子命令前）。所有成功结果输出JSON，失败返回非零退出码。

```sh
python3 scripts/agent-cli.py templates
python3 scripts/agent-cli.py environment
python3 scripts/agent-cli.py defaults gradient
python3 scripts/agent-cli.py render gradient --params gradient.json --wait
python3 scripts/agent-cli.py job TASK_ID
python3 scripts/agent-cli.py upload example.mp4
python3 scripts/agent-cli.py analyze --source SOURCE_FROM_UPLOAD --start 0 --end 4 --notes "观察节点与转场"
```

`gradient.json`示例：

```json
{"title":"我的创作工作台","subtitle":"让想法动起来","accent":"#39f6d2","duration":8}
```

render的params是模板参数覆盖对象，不是defaults返回的整条元数据。defaults结果的parameters给出所有字段；嵌套对象需要给完整对象。轮播图片参数images是三张data URI；环绕图标logoImages最多六张PNG/JPEG/WebP data URI，中央图片subjectImage另设。

templates列出15个id。agent渲染统一经Playwright逐帧导出30fps，均需要高级渲染环境；基础卡片在网页上的原有24fps导出仍无Node依赖。模板本身免费，不依赖付费模型。

## HTTP

- GET /api/agent/templates：15个模板的id、name、engine、free；不返回私人卡库。
- GET /api/agent/defaults/{id}：默认参数。
- GET /api/advanced/environment：本机渲染依赖状态。
- POST /api/agent/render：`{"template":"gradient","parameters":{"title":"新的标题"}}`，返回任务id。
- GET /api/advanced/jobs/{id}：queued/rendering/encoding/done/failed；done含本地下载url、帧数、尺寸、时长、SHA256。
- POST /api/upload：原始视频字节，X-File-Name为URL编码文件名，≤250MB；返回source。
- POST /api/analyze：source/start/end/notes，片段≤12秒，返回15帧及元数据。超出范围返回错误，不伪造分析成功。

无`--wait`时渲染返回即结束；后续用job查询。超时或断线先查原任务，不盲目重提。参数/帧/成片写在data/advanced-exports。上传和抽帧写data/imports与references。不得将用户原视频、Cookie、数据或.runtime公开上传。

当前拉片接口只执行导入、剪选段、抽帧、记录人工观察；没有语义理解、图层恢复或新动画代码生成。调用agent可以自行分析抽帧，但那不是工作台内置已实现能力。未来付费模板和参考案例库尚未接入付费鉴权。
