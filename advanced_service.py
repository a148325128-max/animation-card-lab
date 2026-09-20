"""Portable optional browser renderer for the three free advanced templates."""
import json,uuid,threading,subprocess,shutil,re,time
from pathlib import Path
from advanced_validation import validate_orbit,validate_studies
from export_service import validate_card
ROOT=Path(__file__).resolve().parent
LOCK=threading.Lock();_cached=(0,None)
def environment():
 global _cached
 if time.monotonic()-_cached[0]<5 and _cached[1] is not None:return _cached[1]
 status={'ready':False,'message':'高级动画预览免费可用；MP4导出需Node.js20+和Playwright。运行 python3 scripts/setup-advanced.py 安装。'}
 if shutil.which('node'):
  try:status=json.loads(subprocess.check_output(['node',str(ROOT/'browser-runtime.cjs')],text=True,timeout=10))
  except Exception:pass
 if not shutil.which('ffmpeg') or not shutil.which('ffprobe'):status={'ready':False,'message':'缺少FFmpeg/FFprobe，请先安装视频处理环境。'}
 _cached=(time.monotonic(),status);return status

def validate(kind,c):
 if kind=='basic':return validate_card(c)
 if kind=='orbit':return validate_orbit(c)
 if kind=='studies':return validate_studies(c)
 raise ValueError('动画类型无效')
def folder(data,jid):
 if not re.fullmatch('[a-f0-9]{12}',jid):raise ValueError('任务编号无效')
 return data/'advanced-exports'/jid

def job(data,jid):
 p=folder(data,jid)/'job.json'
 if not p.is_file():raise ValueError('任务不存在')
 return json.loads(p.read_text())

def run(data,jid,port):
 f=folder(data,jid)
 try:
  with (f/'render.log').open('w') as log:subprocess.run(['node',str(ROOT/'advanced-render.cjs'),str(f),str(port)],stdout=log,stderr=log,check=True,timeout=1200)
 except Exception:
  p=f/'job.json';j=json.loads(p.read_text());j.update(status='failed',error='高级动画导出失败，请检查渲染环境及任务render.log。');p.write_text(json.dumps(j,ensure_ascii=False))
 finally:LOCK.release()

def create(data,kind,c,port):
 config=validate(kind,c);env=environment()
 if not env['ready']:raise ValueError(env.get('message','请安装高级导出组件'))
 if not LOCK.acquire(False):raise ValueError('已有高级动画在导出，请稍候')
 try:
  jid=uuid.uuid4().hex[:12];f=folder(data,jid);f.mkdir(parents=True)
  (f/'config.json').write_text(json.dumps({'engine':kind,'config':config},ensure_ascii=False))
  duration=config['duration'] if kind=='basic' else config['period'] if kind=='orbit' else config['settings']['duration']
  j={'id':jid,'status':'queued','engine':kind,'frames':0,'total':round(duration*30)};(f/'job.json').write_text(json.dumps(j))
  threading.Thread(target=run,args=(data,jid,port),daemon=True).start();return j
 except Exception:LOCK.release();raise
