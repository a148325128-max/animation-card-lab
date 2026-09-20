#!/usr/bin/env python3
"""Launch this package, never silently open a different copy using the same port."""
import argparse,hashlib,html,json,os,shutil,socket,subprocess,sys,time,urllib.request,webbrowser
from pathlib import Path
root=Path(__file__).resolve().parents[1]
# Finder-launched .command shells may omit Homebrew from PATH.
os.environ['PATH']=os.pathsep.join(['/opt/homebrew/bin','/usr/local/bin',os.environ.get('PATH','')])
p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=5198);p.add_argument('--no-browser',action='store_true');args=p.parse_args()
expected=hashlib.sha256(str(root).encode()).hexdigest()[:16]
(root/'qa').mkdir(exist_ok=True)
missing=[name for name in ('ffmpeg','ffprobe') if not shutil.which(name)]
if sys.version_info<(3,10):missing.append('Python 3.10或更新')
if missing:
    msg='缺少本机运行依赖：'+', '.join(missing)+'。本包需要Python 3.10+和FFmpeg；安装后重新打开启动器。尚未启动服务。'
    page=root/'qa/environment-check.html';page.write_text('<!doctype html><meta charset="utf-8"><title>动画卡片环境检查</title><main style="font:18px sans-serif;max-width:680px;margin:12vh auto;line-height:1.8"><h1>还差一步</h1><p>'+html.escape(msg)+'</p><p>当前为本地源码试用包，未内置Python和FFmpeg。具体步骤见包内《开始使用.md》。</p></main>')
    if not args.no_browser:webbrowser.open(page.as_uri())
    raise SystemExit(msg)

def state(port):
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{port}/api/state',timeout=1) as r:return json.load(r)
    except Exception:return None

def free(port):
    with socket.socket() as sock:
        sock.setsockopt(socket.SOL_SOCKET,socket.SO_REUSEADDR,1)
        try:sock.bind(('127.0.0.1',port));return True
        except OSError:return False

port=None;s=None
for candidate in range(args.port,args.port+20):
    current=state(candidate)
    if current and current.get('app')=='animation-card-lab' and current.get('instance_id')==expected:port=candidate;s=current;break
    if free(candidate):port=candidate;break
if port is None:raise SystemExit('找不到空闲端口；未停止其他服务。')
if not s:
    with (root/'qa/server.log').open('a') as log:
        proc=subprocess.Popen([sys.executable,str(root/'server.py'),'--port',str(port)],cwd=root,stdin=subprocess.DEVNULL,stdout=log,stderr=log,start_new_session=True)
    for _ in range(40):
        s=state(port)
        if s and s.get('instance_id')==expected:break
        if proc.poll() is not None:raise SystemExit('服务未能启动，请查看qa/server.log。')
        time.sleep(.25)
    else:raise SystemExit('服务启动超时，请查看qa/server.log。')
    (root/'qa/server-pid.txt').write_text(str(proc.pid))
url=f'http://127.0.0.1:{port}'
(root/'qa/server-state.json').write_text(json.dumps({'url':url,'instance_id':expected},indent=2))
if not args.no_browser:webbrowser.open(url)
print(url)
