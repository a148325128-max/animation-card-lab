#!/usr/bin/env python3
"""Install optional browser export dependency within this package, never globally."""
from pathlib import Path
import json,subprocess,shutil,sys,os
root=Path(__file__).resolve().parents[1]
os.environ['PATH']=os.pathsep.join(['/opt/homebrew/bin','/usr/local/bin',os.environ.get('PATH','')])
node=shutil.which('node');npm=shutil.which('npm')
if not node or not npm:raise SystemExit('请先安装 Node.js 20+（含 npm），再运行本脚本。基础12卡和手工拉片不受影响。')
major=int(subprocess.check_output([node,'--version'],text=True).strip().lstrip('v').split('.')[0])
if major<20:raise SystemExit('请使用 Node.js 20 或更新。')
runtime=root/'.runtime';runtime.mkdir(exist_ok=True)
(runtime/'package.json').write_text(json.dumps({'private':True,'name':'animation-card-lab-render-runtime','dependencies':{'playwright':'1.62.1'}},indent=2))
subprocess.run([npm,'install','--prefix',str(runtime),'--no-audit','--no-fund'],check=True)
status=json.loads(subprocess.check_output([node,str(root/'browser-runtime.cjs')],text=True))
if not status['ready']:
 subprocess.run([node,str(runtime/'node_modules/playwright/cli.js'),'install','chromium'],check=True)
 status=json.loads(subprocess.check_output([node,str(root/'browser-runtime.cjs')],text=True))
if not status['ready']:raise SystemExit(status.get('message','渲染环境尚未就绪'))
print('高级动画导出环境已就绪。回到工作台刷新页面即可。依赖仅保存在本目录 .runtime。')
