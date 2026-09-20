"""Deterministic browser-rendered PNG frames -> local FFmpeg MP4, no Node runtime."""
import hashlib,json,math,re,struct,subprocess,threading,uuid
from datetime import datetime,timezone
from pathlib import Path
LOCK=threading.Lock()

def validate_card(c):
    if not isinstance(c,dict) or c.get('kind') not in ('emphasis','compare','steps','chapter','quote','checklist','timeline','bars','progress','typewriter','lowerthird','metrics'):raise ValueError('卡片类型无效')
    for key in ('name','title','brand','value','unit','subtitle','footer'):
        if not isinstance(c.get(key),str) or len(c[key])>1000:raise ValueError('文字字段无效或超过1000字')
    if not c['name'].strip() or not c['title'].strip():raise ValueError('请填写名称和标题')
    if c.get('aspect') not in ('16:9','9:16'):raise ValueError('画幅无效')
    for key in ('background','ink','accent'):
        if not re.fullmatch(r'#[a-fA-F0-9]{6}',str(c.get(key,''))):raise ValueError('颜色无效')
    def number(value,low,high):
        if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or not low<=value<=high:raise ValueError('数值参数超出范围')
        return value
    duration=number(c.get('duration'),1,20)
    for k,lo,hi in [('font',40,130),('scale',.5,1.1),('x',-10,10),('y',-8,8)]:number(c['layout'][k],lo,hi)
    for k,lo,hi in [('enter',.1,3),('exit',.1,3),('stagger',0,2)]:number(c['motion'][k],lo,hi)
    if c['motion']['style'] not in ('rise','fade','scale') or c['motion']['easing'] not in ('easeOut','linear'):raise ValueError('动作参数无效')
    for cue in c['cues']:
        number(cue['time'],0,duration-.001)
        if not isinstance(cue['text'],str):raise ValueError('词句格式无效')
    tr=c['trigger'];time=number(tr['time'],0,duration)
    if tr['mode']=='phrase':
        phrase=tr['phrase'];occ=number(tr['occurrence'],1,20)
        if not isinstance(phrase,str) or not phrase or occ!=int(occ):raise ValueError('词句匹配参数无效')
        matches=[x for x in c['cues'] if phrase in x['text']]
        if len(matches)<occ:raise ValueError('找不到触发词句')
        time=matches[int(occ)-1]['time']
    elif tr['mode']!='time':raise ValueError('触发方式无效')
    if time+c['motion']['enter']+(2*c['motion']['stagger'] if c['kind'] in ('steps','checklist','timeline','bars','metrics') else 0)>duration-c['motion']['exit']:raise ValueError('入场和退场重叠')
    if c['kind'] in ('steps','chapter','checklist','timeline'):
        count=4 if c['kind']=='chapter' else 3
        if len(c['steps'])!=count or any(not isinstance(x,str) or not x.strip() or len(x)>200 for x in c['steps']):raise ValueError(f'请填写{count}项内容')
    if c['kind'] in ('compare','bars','metrics'):
        count=2 if c['kind']=='compare' else 3
        if len(c['rows'])!=count:raise ValueError(f'请填写{count}行数据')
        for row in c['rows']:
            if any(not isinstance(row.get(k),str) or len(row[k])>200 for k in ('label','value','unit')) or not row['label'].strip() or not row['value'].strip():raise ValueError('对比数据无效')
    def numeric(v):return re.fullmatch(r'[0-9]+(?:\.[0-9]+)?',v.strip()) and math.isfinite(float(v))
    if c['kind']=='bars' and (any(not numeric(r['value']) for r in c['rows']) or len({r['unit'].strip() for r in c['rows']})!=1):raise ValueError('条形数据须为非负数字，且三行单位一致')
    if c['kind']=='progress' and (not numeric(c['value']) or float(c['value'])>100):raise ValueError('环形进度须填写0–100的数字')
    if c['kind'] in ('emphasis','chapter','quote','progress','typewriter','lowerthird') and not c['value'].strip():raise ValueError('请填写主要内容')
    if c['kind']=='chapter':
        p=c['chapter']
        for k,lo,hi in [('focusAt',0,10),('swapAt',0,15),('settleAt',0,18),('zoom',1,1.35),('selected',0,3)]:number(p[k],lo,hi)
        if int(p['selected'])!=p['selected'] or not p['focusAt']<p['swapAt']<p['settleAt'] or p['settleAt']+.5+time>duration-c['motion']['exit']:raise ValueError('阶段顺序或结束时间无效')
    logo=c.get('logo','')
    if not isinstance(logo,str) or len(logo)>3_000_000 or (logo and not re.fullmatch(r'data:image/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+',logo)):raise ValueError('图片格式无效')
    return c

def persist(path,obj):
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(obj,ensure_ascii=False,indent=2));tmp.replace(path)

def create(data,card):
    validate_card(card);jid=uuid.uuid4().hex;folder=data/'exports'/jid;folder.mkdir(parents=True)
    width,height=(1280,720) if card['aspect']=='16:9' else (720,1280)
    job={'id':jid,'status':'receiving','width':width,'height':height,'fps':24,'frame_count':round(card['duration']*24),'received':0,'card':card,'created_at':datetime.now(timezone.utc).isoformat(),'format':'H264 MP4 / 无声 / 实色背景'}
    (folder/'frames').mkdir();persist(folder/'job.json',job);return job

def folder_for(data,jid):
    if not re.fullmatch(r'[0-9a-f]{32}',jid):raise ValueError('导出任务无效')
    folder=data/'exports'/jid
    if not (folder/'job.json').exists():raise ValueError('导出任务不存在')
    return folder

def frame(data,jid,index,raw):
    with LOCK:
        folder=folder_for(data,jid);job=json.loads((folder/'job.json').read_text())
        if job['status']!='receiving' or index!=job['received'] or not 0<=index<job['frame_count']:raise ValueError('帧顺序不正确，请重新导出')
        if len(raw)<24 or raw[:8]!=b'\x89PNG\r\n\x1a\n' or raw[12:16]!=b'IHDR' or struct.unpack('>II',raw[16:24])!=(job['width'],job['height']):raise ValueError('图像尺寸或PNG格式不正确')
        (folder/'frames'/f'{index:04}.png').write_bytes(raw);job['received']+=1;persist(folder/'job.json',job)
    return {'received':job['received']}

def finish(data,jid):
    with LOCK:
        folder=folder_for(data,jid);job=json.loads((folder/'job.json').read_text())
        if job['status']=='done':return job
        if job['status']!='receiving' or job['received']!=job['frame_count']:raise ValueError('画面尚未传完，不能生成视频')
        job['status']='encoding';persist(folder/'job.json',job)
    try:
        subprocess.run(['ffmpeg','-v','error','-nostdin','-y','-framerate','24','-i',str(folder/'frames/%04d.png'),'-c:v','libx264','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',str(folder/'card.mp4')],check=True,capture_output=True,timeout=120)
        probe=json.loads(subprocess.run(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',str(folder/'card.mp4')],check=True,capture_output=True,timeout=20).stdout)
        s=probe['streams'][0]
        if int(s['nb_read_frames'])!=job['frame_count'] or (s['width'],s['height'])!=(job['width'],job['height']):raise ValueError('导出帧数或尺寸校验失败')
        job.update(status='done',url=f'/data/exports/{jid}/card.mp4',duration=float(probe['format']['duration']),sha256=hashlib.sha256((folder/'card.mp4').read_bytes()).hexdigest(),completed_at=datetime.now(timezone.utc).isoformat())
    except Exception:
        job.update(status='failed',error='视频编码未完成。检查FFmpeg，重试将创建新任务。');persist(folder/'job.json',job);raise ValueError(job['error'])
    persist(folder/'job.json',job);return job
