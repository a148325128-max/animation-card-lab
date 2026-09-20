#!/usr/bin/env python3
"""Local JSON interface for any AI agent with a shell/HTTP client; no API key required."""
import argparse,json,sys,time,urllib.request,urllib.error,urllib.parse
from pathlib import Path
p=argparse.ArgumentParser(description='Animation Card Lab local agent interface')
p.add_argument('--url',default='http://127.0.0.1:5198');sub=p.add_subparsers(dest='command',required=True)
sub.add_parser('templates');sub.add_parser('environment');d=sub.add_parser('defaults');d.add_argument('template')
u=sub.add_parser('upload');u.add_argument('file');a=sub.add_parser('analyze');a.add_argument('--source',required=True);a.add_argument('--start',type=float,default=0);a.add_argument('--end',type=float,required=True);a.add_argument('--notes',default='')
r=sub.add_parser('render');r.add_argument('template');r.add_argument('--params',help='JSON object file containing template parameter overrides');r.add_argument('--wait',action='store_true');j=sub.add_parser('job');j.add_argument('id');args=p.parse_args()
base=args.url.rstrip('/');parsed=urllib.parse.urlsplit(base)
if parsed.scheme!='http' or parsed.hostname not in ('127.0.0.1','localhost'):p.error('仅支持本机HTTP服务')
def api(path,obj=None,data=None,headers=None):
 if obj is not None:data=json.dumps(obj,ensure_ascii=False).encode();headers={'Content-Type':'application/json'}
 req=urllib.request.Request(base+path,data=data,headers=headers or {})
 with urllib.request.urlopen(req,timeout=180) as f:return json.load(f)
try:
 if args.command=='templates':out=api('/api/agent/templates')
 elif args.command=='environment':out=api('/api/advanced/environment')
 elif args.command=='defaults':out=api('/api/agent/defaults/'+urllib.parse.quote(args.template,safe=''))
 elif args.command=='upload':
  f=Path(args.file)
  if f.stat().st_size>250000000:raise ValueError('文件超过250MB')
  out=api('/api/upload',data=f.read_bytes(),headers={'Content-Type':'application/octet-stream','X-File-Name':urllib.parse.quote(f.name)})
 elif args.command=='analyze':out=api('/api/analyze',{'source':args.source,'start':args.start,'end':args.end,'notes':args.notes})
 elif args.command=='job':out=api('/api/advanced/jobs/'+urllib.parse.quote(args.id,safe=''))
 elif args.command=='render':
  params=json.loads(Path(args.params).read_text()) if args.params else {}
  out=api('/api/agent/render',{'template':args.template,'parameters':params})
  if args.wait:
   deadline=time.monotonic()+1500
   while out['status'] not in ('done','failed'):
    if time.monotonic()>deadline:raise TimeoutError('等待超时，可用job命令继续查询，不重复提交')
    time.sleep(1);out=api('/api/advanced/jobs/'+out['id'])
   if out['status']=='failed':raise ValueError(out.get('error','渲染失败'))
 print(json.dumps(out,ensure_ascii=False,indent=2))
except urllib.error.HTTPError as e:
 print(e.read().decode(),file=sys.stderr);sys.exit(1)
except Exception as e:print(json.dumps({'error':str(e)},ensure_ascii=False),file=sys.stderr);sys.exit(1)
