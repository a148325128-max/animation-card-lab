import math,re
def validate_orbit(c):
    if not isinstance(c,dict):raise ValueError('参数须为对象')
    c={**c,'variant':c.get('variant','player')}
    if c['variant'] not in ('player','logos'):raise ValueError('动画样式无效')
    if not isinstance(c.get('labels'),list) or len(c.get('labels',[]))!=6 or any(not isinstance(x,str) or not x.strip() or len(x)>24 for x in c['labels']):raise ValueError('请填写六个标题，每个不超过24字')
    for key,lo,hi in [('period',4,16),('radius',195,290),('blur',0,24),('opacity',.06,.35),('subjectScale',.5,1.5)]:
        x=c.get(key)
        if isinstance(x,bool) or not isinstance(x,(int,float)) or not math.isfinite(x) or not lo<=x<=hi:raise ValueError('参数超出范围：'+key)
    if c.get('direction') not in (-1,1) or c.get('aspect') not in ('3:4','9:16','16:9') or c.get('subject') not in ('none','product','image'):raise ValueError('方向、画幅或主体类型无效')
    if not re.fullmatch('#[a-fA-F0-9]{6}',c.get('accent','')):raise ValueError('颜色无效')
    img=c.get('subjectImage','')
    if not isinstance(img,str) or len(img)>6_000_000 or (img and not re.fullmatch(r'data:image/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+',img)):raise ValueError('主体图片格式无效')
    if c['subject']=='image' and not img:raise ValueError('请先上传主体图片')
    imgs=c.get('logoImages',[])
    if not isinstance(imgs,list) or len(imgs)>6 or any(x is not None and (not isinstance(x,str) or len(x)>1400000 or (x and not re.fullmatch(r'data:image/(png|jpeg|webp);base64,[a-zA-Z0-9+/=]+',x))) for x in imgs):raise ValueError('图标格式或大小无效')
    c['logoImages']=imgs
    return {k:c[k] for k in ['logoImages','variant','labels','period','radius','blur','opacity','subjectScale','direction','aspect','subject','subjectImage','accent']}

def validate_studies(c):
 if not isinstance(c,dict) or c.get('kind') not in ['carousel','gradient']:raise ValueError('模板无效')
 s=c.get('settings');kind=c['kind']
 if not isinstance(s,dict):raise ValueError('参数无效')
 d=s.get('duration')
 if isinstance(d,bool) or not isinstance(d,(int,float)) or not math.isfinite(d) or not 6<=d<=16:raise ValueError('时长需为6–16秒')
 out={'duration':d,'showText':s.get('showText',False)}
 if not isinstance(out['showText'],bool):raise ValueError('文字开关无效')
 if kind=='carousel':
  imgs=s.get('images');titles=s.get('titles')
  if not isinstance(imgs,list) or len(imgs)!=3 or any(not isinstance(x,str) or len(x)>6000000 or not re.match(r'^data:image/(png|jpeg|webp|svg\+xml)[;,]',x) for x in imgs):raise ValueError('需要三张有效图片')
  if not isinstance(titles,list) or len(titles)!=3 or any(not isinstance(x,str) or len(x)>40 for x in titles):raise ValueError('需要三个标题，每个不超过40字')
  out.update(images=imgs,titles=titles)
 else:
  for k in ['title','subtitle']:
   if not isinstance(s.get(k),str) or len(s[k])>40:raise ValueError('文案需在40字以内')
   out[k]=s[k]
 if 'accent' in s:
  if not isinstance(s['accent'],str) or not re.fullmatch('#[a-fA-F0-9]{6}',s['accent']):raise ValueError('颜色无效')
  out['accent']=s['accent']
 return {'kind':kind,'settings':out}
