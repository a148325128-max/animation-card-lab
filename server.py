#!/usr/bin/env python3
"""Local-only animation card lab. Python standard library + installed FFmpeg."""
import argparse, hashlib, json, math, mimetypes, os, re, subprocess, uuid, shutil
import export_service, advanced_service
from datetime import datetime, timezone
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit
ROOT = Path(__file__).resolve().parent
PROJECT = ROOT.parent.parent if (ROOT.parent.parent/'migration').is_dir() else ROOT
DATA = ROOT / 'data'
SOURCE = PROJECT / 'content/2026-09-15-ai-coding-glossary/animation-preview-v1/AI术语手册-动画预览-v1.mp4'
def run(args):
    return subprocess.run(args, check=True, capture_output=True, timeout=90).stdout

def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2))
    temp.replace(path)

def analyze(source, start, end, notes=''):
    source = Path(source).resolve()
    if not source.is_relative_to(PROJECT) or source.suffix.lower() not in ('.mp4','.mov','.webm') or not source.is_file():
        raise ValueError('请选择本项目内的 MP4/MOV/WebM 文件')
    probe = json.loads(run(['ffprobe','-v','quiet','-show_streams','-show_format','-of','json',str(source)]))
    duration = float(probe['format']['duration'])
    if not all(math.isfinite(v) for v in (start,end)) or not 0 <= start < end <= duration + .01 or end-start > 12:
        raise ValueError('选段须位于视频内，长度不超过 12 秒')
    rid = 'ref-' + uuid.uuid4().hex[:12]
    folder = DATA/'references'/rid
    folder.mkdir(parents=True)
    run(['ffmpeg','-v','error','-ss',str(start),'-i',str(source),'-t',str(end-start),'-an','-vf','scale=960:-2','-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart',str(folder/'clip.mp4')])
    # Dense frame evidence, with requested absolute timestamps and frame quantization disclosed.
    times = [round(start+i*(end-start)/15,4) for i in range(15)]
    frames=[]
    for i,t in enumerate(times):
        fn=f'frame-{i:02}.jpg'
        run(['ffmpeg','-v','error','-ss',str(t),'-i',str(source),'-frames:v','1','-vf','scale=480:-2',str(folder/fn)])
        frames.append({'file':f'/data/references/{rid}/{fn}','source_time':t,'relative_time':round(t-start,4)})
    stream=next(s for s in probe['streams'] if s['codec_type']=='video')
    result={'id':rid,'source':str(source.relative_to(PROJECT)),'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
        'start':start,'end':end,'source_duration':duration,'width':stream['width'],'height':stream['height'],'fps':stream['avg_frame_rate'],
        'created_at':datetime.now(timezone.utc).isoformat(),'clip':f'/data/references/{rid}/clip.mp4','frames':frames,
        'method':'FFprobe 元数据 + FFmpeg 等间隔抽帧；语义和动作由人工观察录入，不自动识别文字/图层/缓动。',
        'timing_note':'source_time 是请求抽帧时间，实际图像按源视频帧率量化。','observations':notes,
        'pending':['精确缓动曲线待调整','图层坐标与入场时长为重建参数，非源码恢复','自动词级对齐尚未接入']}
    write_json(folder/'analysis.json',result)
    return result

class Handler(BaseHTTPRequestHandler):
    def json(self, obj, status=200):
        raw=json.dumps(obj,ensure_ascii=False).encode(); self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Content-Length',str(len(raw))); self.end_headers(); self.wfile.write(raw)
    def do_GET(self):
        if self.headers.get('Host','').split(':')[0] not in ('localhost','127.0.0.1'):return self.json({'error':'仅允许本机访问'},403)
        url=unquote(urlsplit(self.path).path)
        if url=='/api/agent/templates':
            catalog=json.loads((ROOT/'web/advanced/catalog.json').read_text());return self.json({'apiVersion':1,'templates':[{k:v for k,v in c.items() if k!='parameters'} for c in catalog],'automatic_video_reconstruction':False})
        if url.startswith('/api/agent/defaults/'):
            tid=url.rsplit('/',1)[-1];catalog=json.loads((ROOT/'web/advanced/catalog.json').read_text());item=next((x for x in catalog if x['id']==tid),None)
            return self.json(item if item else {'error':'模板不存在'},200 if item else 404)
        if url=='/api/advanced/environment':return self.json(advanced_service.environment())
        if url.startswith('/api/advanced/jobs/'):
            try:return self.json(advanced_service.job(DATA,url.rsplit('/',1)[-1]))
            except ValueError as e:return self.json({'error':str(e)},404)
        if url=='/api/state':
            refs=[json.loads(p.read_text()) for p in sorted((DATA/'references').glob('*/analysis.json'))]
            cards=[json.loads(p.read_text()) for p in sorted((DATA/'library').glob('*.json'))]
            cards.sort(key=lambda c:c.get('saved_at','')); refs.sort(key=lambda r:r.get('created_at',''))
            return self.json({'app':'animation-card-lab','instance_id':hashlib.sha256(str(ROOT).encode()).hexdigest()[:16],'references':refs,'cards':cards,'default_source':str(SOURCE.relative_to(PROJECT)) if SOURCE.exists() else '', 'version':'0.4.0', 'capabilities':{'ffmpeg':bool(shutil.which('ffmpeg')),'ffprobe':bool(shutil.which('ffprobe'))}, 'startup':json.loads((DATA/'startup-card.json').read_text()) if (DATA/'startup-card.json').exists() else None})
        if url.startswith('/data/'):
            path=(ROOT/url.lstrip('/')).resolve(); allowed=DATA
        elif url.startswith('/qa/'):
            path=(ROOT/url.lstrip('/')).resolve(); allowed=ROOT/'qa'
        else:
            path=(ROOT/'web'/('index.html' if url=='/' else url.lstrip('/'))).resolve(); allowed=ROOT/'web'
        if not path.is_relative_to(allowed) or not path.is_file(): return self.json({'error':'文件不存在'},404)
        size=path.stat().st_size; start=0; end=size-1
        byte_range=self.headers.get('Range','')
        if byte_range:
            match=re.fullmatch(r'bytes=(\d+)-(\d*)',byte_range)
            if not match: return self.json({'error':'Unsupported byte range'},416)
            start=int(match[1]); end=min(int(match[2]) if match[2] else size-1,size-1)
            if start>end: return self.json({'error':'Invalid byte range'},416)
        self.send_response(206 if byte_range else 200)
        self.send_header('Content-Type',mimetypes.guess_type(path)[0] or 'application/octet-stream')
        self.send_header('Accept-Ranges','bytes')
        if byte_range:self.send_header('Content-Range',f'bytes {start}-{end}/{size}')
        self.send_header('Content-Length',str(end-start+1));self.end_headers()
        with path.open('rb') as f:
            f.seek(start);remaining=end-start+1
            try:
                while remaining:
                    chunk=f.read(min(65536,remaining));self.wfile.write(chunk);remaining-=len(chunk)
            except (BrokenPipeError,ConnectionResetError):pass
    def do_POST(self):
        try:
            # Same-origin local writes. No public binding, no CORS, no external service.
            if self.headers.get('Host','').split(':')[0] not in ('localhost','127.0.0.1'):raise ValueError('仅允许本机访问')
            origin=self.headers.get('Origin')
            if origin and origin != 'http://'+self.headers.get('Host',''): raise ValueError('仅允许工作台同源写入')
            n=int(self.headers.get('Content-Length',0))
            if self.path=='/api/upload':
                if not 0<n<=250_000_000:raise ValueError('请选择250 MB以内的视频')
                name=Path(unquote(self.headers.get('X-File-Name','video.mp4'))).name
                if Path(name).suffix.lower() not in ('.mp4','.mov','.webm'):raise ValueError('请选择MP4、MOV或WebM')
                folder=DATA/'imports'/uuid.uuid4().hex;folder.mkdir(parents=True)
                path=folder/('source'+Path(name).suffix.lower());remaining=n
                with path.open('wb') as f:
                    while remaining:
                        chunk=self.rfile.read(min(65536,remaining))
                        if not chunk:raise ValueError('上传中断，请重新选择视频')
                        f.write(chunk);remaining-=len(chunk)
                try:
                    probe=json.loads(run(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(path)]))
                    stream=next(x for x in probe['streams'] if x['codec_type']=='video');duration=float(probe['format']['duration'])
                except Exception:
                    path.unlink(missing_ok=True);raise ValueError('无法读取该视频，请尝试标准MP4文件')
                result={'source':str(path.relative_to(PROJECT)),'name':name,'duration':duration,'width':stream['width'],'height':stream['height'],'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'url':'/data/'+str(path.relative_to(DATA))}
                write_json(folder/'source.json',result);return self.json(result,201)
            if self.path=='/api/agent/render':
                if not 0<n<19_000_000:raise ValueError('参数超过大小限制')
                obj=json.loads(self.rfile.read(n));catalog=json.loads((ROOT/'web/advanced/catalog.json').read_text());item=next((x for x in catalog if x['id']==obj.get('template')),None)
                if not item:raise ValueError('模板不存在')
                overrides=obj.get('parameters',{})
                if not isinstance(overrides,dict):raise ValueError('parameters须为对象')
                params={**item['parameters'],**overrides};config={'kind':item['id'],'settings':params} if item['engine']=='studies' else params
                return self.json(advanced_service.create(DATA,item['engine'],config,self.server.server_port),201)
            advanced=re.fullmatch(r'/api/advanced/(orbit|studies|basic)/(validate|render)',self.path)
            if advanced:
                if not 0<n<19_000_000:raise ValueError('参数超过大小限制')
                obj=json.loads(self.rfile.read(n))
                if advanced[2]=='validate':return self.json(advanced_service.validate(advanced[1],obj))
                return self.json(advanced_service.create(DATA,advanced[1],obj,self.server.server_port),201)
            match=re.fullmatch(r'/api/export/([0-9a-f]{32})/frame/(\d+)',self.path)
            if match:
                if not 0<n<8_000_000:raise ValueError('图像超过大小限制')
                return self.json(export_service.frame(DATA,match[1],int(match[2]),self.rfile.read(n)))
            if not 0<n<8_000_000: raise ValueError('请求为空或超过 8 MB')
            obj=json.loads(self.rfile.read(n))
            if self.path=='/api/export/start':return self.json(export_service.create(DATA,obj['card']),201)
            if self.path=='/api/export/finish':return self.json(export_service.finish(DATA,obj['id']))
            if self.path=='/api/analyze':
                return self.json(analyze(PROJECT/obj['source'],float(obj['start']),float(obj['end']),str(obj.get('notes',''))[:6000]))
            if self.path=='/api/save':
                card=export_service.validate_card(obj['card'])
                dur=float(card['duration'])
                if not math.isfinite(dur) or not 1<=dur<=20: raise ValueError('时长须为 1–20 秒')
                ref=card.get('referenceId')
                if ref is not None and (not re.fullmatch(r'ref-[a-f0-9]{12}',str(ref)) or not (DATA/'references'/ref/'analysis.json').is_file()): raise ValueError('缺少有效参考证据')
                cid=uuid.uuid4().hex[:12]
                record={'id':cid,'saved_at':datetime.now(timezone.utc).isoformat(),'status':'技术草稿，视觉待用户验收','parent':obj.get('parent'),'card':card}
                write_json(DATA/'library'/f'{cid}.json',record)
                return self.json(record,201)
            return self.json({'error':'接口不存在'},404)
        except (ValueError, KeyError, StopIteration, subprocess.SubprocessError) as exc:
            return self.json({'error':str(exc)[:500]},400)
        except Exception:
            return self.json({'error':'本地处理失败，请查看终端'},500)
    def log_message(self, fmt, *args): pass

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--port',type=int,default=5198);p.add_argument('--seed',action='store_true');args=p.parse_args()
    if args.seed and SOURCE.exists() and not list((DATA/'references').glob('*/analysis.json')):
        analyze(SOURCE,8,12,'人工观察：8.00 秒页面标题/手册画面淡入；8.875 秒数字尚未出现；9.00 秒附近数字 246、单位与黄色标签开始淡入上移；约 9.25 秒已稳定。先后顺序来自 8–10 秒 8fps 抽帧；精确曲线、位移与时长待调整。只提炼数字强调结构，不复制整页。')
    print(f'Animation Card Lab: http://127.0.0.1:{args.port}',flush=True)
    ThreadingHTTPServer(('127.0.0.1',args.port),Handler).serve_forever()
