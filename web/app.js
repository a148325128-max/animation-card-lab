const $=id=>document.getElementById(id);
let state, card, ref, parent=null, time=1.65, playing=false,last=0,dirty=true;
const defaults={schemaVersion:1,kind:'emphasis',name:'词条数字 · 淡入强调',brand:'LEI / KNOWLEDGE NOTES',title:'一份中文解释手册',value:'246',unit:'个词条',subtitle:'把陌生名词，变成看得懂的知识',footer:'自制视频结构提炼 · 可编辑动画草稿',rows:[{label:'修改前',value:'30',unit:'分钟 · 示例数据'},{label:'修改后',value:'8',unit:'分钟 · 示例数据'}],steps:['选取参考','调整动画','保存复用'],logo:'',background:'#f7f5ea',accent:'#d7e6a0',ink:'#253f35',aspect:'16:9',duration:4,layout:{font:92,scale:1,x:0,y:0},motion:{style:'rise',enter:.4,exit:.35,easing:'easeOut',stagger:.3},trigger:{mode:'time',time:1,phrase:'246',occurrence:1},cues:[{time:0,text:'一份中文解释手册'},{time:1,text:'246个词条'}],chapter:{focusAt:.65,swapAt:2,settleAt:2.65,zoom:1.22,selected:1},referenceId:null,interpretation:'以数字后出现的视觉顺序为参考；布局和曲线是独立设计。'};
function status(s,error=false){$('status').textContent=s;$('status').className=error?'error':'';}
async function api(path,body){const r=await fetch(path,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});const data=await r.json();if(!r.ok)throw Error(data.error);return data;}
function dirtyMark(){if($('exportResult'))$('exportResult').hidden=true;dirty=true;$('dirty').textContent='未保存修改';}
function fields(){
 for(const k of ['name','brand','title','value','unit','subtitle','footer','background','accent','ink','aspect','duration'])$(k).value=card[k];
 for(const k of ['font','scale','x','y'])$(k).value=card.layout[k];
 for(const k of ['style','enter','exit','stagger','easing'])$(k).value=card.motion[k];
 for(const k of ['mode','phrase','occurrence'])$(k).value=card.trigger[k];
 $('triggerTime').value=card.trigger.time;
 $('cues').value=card.cues.map(x=>`${x.time} | ${x.text}`).join('\n');
 $('rows').value=card.rows.map(x=>`${x.label} | ${x.value} | ${x.unit}`).join('\n');$('steps').value=card.steps.join('\n');
 for(const kind of ['emphasis','compare','steps','chapter'])$(kind+'Fields').hidden=card.kind!==kind;
 if(card.kind==='chapter'){$('emphasisFields').hidden=false;$('stepsFields').hidden=false;}
 for(const k of ['focusAt','swapAt','settleAt','zoom'])$(k).value=card.chapter[k];$('selected').value=Number(card.chapter.selected)+1;
 document.querySelectorAll('[data-kind]').forEach(b=>b.classList.toggle('active',b.dataset.kind===card.kind));
 $('seek').max=card.duration;render();
}
function problems(){
 const issues=[];
 if(card.kind==='chapter'){const p=card.chapter;if(card.steps.length!==4)issues.push('目录转章节需要四个目录项');if(!(p.focusAt<p.swapAt&&p.swapAt<p.settleAt&&p.settleAt+.5+Number(CardRenderer.triggerTime(card).time||0)<=card.duration-card.motion.exit))issues.push('阶段须按聚焦→替换→缩回排序，并在退场前结束');}
 const tr=CardRenderer.triggerTime(card);
 if(!tr.resolved)issues.push('找不到触发词句，请调整词句或时间标记');
 if(tr.resolved&&(tr.time<0||tr.time+card.motion.enter+(card.kind==='steps'?2*card.motion.stagger:0)>card.duration-card.motion.exit))issues.push('入场与退场时间重叠，请延长时长或提前触发');
 if(card.kind==='compare'&&(card.rows.length!==2||card.rows.some(r=>!r.label||!r.value)))issues.push('数据对比需要两行名称与数值');
 if(card.kind==='steps'&&(card.steps.length!==3||card.steps.some(s=>!s)))issues.push('流程卡需要三个步骤');
 if(card.cues.some(x=>!Number.isFinite(x.time)||x.time<0||x.time>=card.duration))issues.push('词句时间标记超出卡片时长');
 if(!card.title.trim()||!card.name.trim())issues.push('请填写卡片名称与主标题');
 return issues;
}
function render(){
 time=Math.max(0,Math.min(card.duration,time));$('preview').className=card.aspect==='9:16'?'vertical':'';$('preview').innerHTML=CardRenderer.renderCard(card,time);
 $('seek').value=time;$('clock').textContent=`${time.toFixed(2)} / ${Number(card.duration).toFixed(2)} s`;
 const tr=CardRenderer.triggerTime(card),left=(tr.time||0)/card.duration*100,width=card.motion.enter/card.duration*100;
 $('track').innerHTML=`<i style="left:${left}%;width:${width}%"></i><i style="right:0;width:${card.motion.exit/card.duration*100}%;opacity:.4"></i>`;
 if($('previewTitle'))$('previewTitle').textContent=card.name;const issues=problems();if(issues.length)status(issues.join('；'),true);
}
function change(){
 for(const k of ['name','brand','title','value','unit','subtitle','footer','background','accent','ink','aspect'])card[k]=$(k).value;
 for(const [k,lo,hi] of [['focusAt',0,10],['swapAt',0,15],['settleAt',0,18],['zoom',1,1.35]])card.chapter[k]=clamp(+$(k).value,lo,hi);card.chapter.selected=clamp(+$('selected').value-1,0,3);
 card.duration=clamp(+$('duration').value||4,1,20);
 for(const [k,lo,hi] of [['font',40,130],['scale',.5,1.1],['x',-10,10],['y',-8,8]])card.layout[k]=clamp(+$(k).value,lo,hi);
 for(const [k,lo,hi] of [['enter',.1,3],['exit',.1,3],['stagger',0,2]])card.motion[k]=clamp(+$(k).value,lo,hi);
 for(const k of ['style','easing'])card.motion[k]=$(k).value;
 for(const k of ['mode','phrase'])card.trigger[k]=$(k).value;
 card.trigger.time=+$('triggerTime').value;card.trigger.occurrence=Math.max(1,+$('occurrence').value);
 card.cues=$('cues').value.split('\n').filter(s=>s.trim()).map(s=>{const i=s.indexOf('|');return {time:i<0?NaN:Number(s.slice(0,i).trim()),text:i<0?'':s.slice(i+1).trim()};});
 card.rows=$('rows').value.split('\n').filter(s=>s.trim()).map(s=>{const [label='',value='',unit='']=s.split('|').map(x=>x.trim());return {label,value,unit};});
 card.steps=$('steps').value.split('\n').filter(s=>s.trim());$('seek').max=card.duration;dirtyMark();status('预览已更新，修改尚未入库。');render();
}
function showRef(r){
 if(!r){ref=null;$('reference').removeAttribute('src');$('reference').removeAttribute('poster');$('frames').replaceChildren();$('provenance').textContent='尚未选择参考，可直接使用原创基础卡。';return;}ref=r;$('references').value=r.id;$('reference').poster=r.frames[0]?.file||'';$('reference').src=r.clip;$('referenceOpen').href=r.clip;$('notes').value=r.observations;$('start').value=r.start;$('end').value=r.end;$('source').value=r.source;
 $('provenance').textContent=`源片 ${r.start.toFixed(2)}–${r.end.toFixed(2)} 秒 · ${r.width}×${r.height} · ${r.fps} fps · SHA ${r.sha256.slice(0,12)}`;
 $('observations').textContent=(r.source_url?'来源：'+r.source_url+'\n':'')+r.observations||'未填写人工观察，尚不能判断动画结构。';$('pending').replaceChildren();r.pending.forEach(s=>{const li=document.createElement('li');li.textContent=s;$('pending').append(li);});
 $('frames').replaceChildren();r.frames.forEach(f=>{const b=document.createElement('button'),img=document.createElement('img');img.src=f.file;img.alt=`源片 ${f.source_time.toFixed(3)} 秒`;b.append(img,document.createTextNode(f.source_time.toFixed(2)+'s'));b.onclick=()=>{$('reference').currentTime=f.relative_time;};$('frames').append(b);});
}
function list(){
 $('references').replaceChildren();state.references.forEach(r=>{const o=document.createElement('option');o.value=r.id;o.textContent=`${r.start}–${r.end}s · ${r.id.slice(-6)}`;$('references').append(o);});
 $('library').replaceChildren();if(!state.cards.length)$('library').textContent='尚无已保存卡片';
 [...state.cards].reverse().forEach(entry=>{const b=document.createElement('button');b.className='library-item';b.textContent=entry.card.name;const small=document.createElement('small');small.textContent=`${entry.card.aspect} · ${entry.card.duration}s · ${entry.id.slice(0,6)}`;b.append(small);b.onclick=()=>{if(dirty&&!confirm('打开已保存卡片将替换当前未保存修改，继续？'))return;card=structuredClone(entry.card);card.chapter ||= structuredClone(defaults.chapter);parent=entry.id;showRef(state.references.find(r=>r.id===card.referenceId));dirty=false;$('dirty').textContent='已保存版本';playing=false;fields();status('已从磁盘卡片库恢复，可继续编辑并另存版本。');};$('library').append(b);});
}
function download(name,content,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function safeName(){return card.name.replace(/[\/\\:*?"<>|]/g,'-').slice(0,80)||'animation-card';}
function validate(){const issues=problems();if(issues.length){status(issues.join('；'),true);return false;}return true;}
async function init(){
 state=await api('/api/state');list();card=structuredClone(state.startup?.card||defaults);
 if(state.references.length){showRef(state.references.find(r=>r.id===card.referenceId)||state.references[0]);}else $('source').value=state.default_source;
 fields();status('选择卡片，替换内容，即可导出。');window.dispatchEvent(new Event('labready'));
 document.querySelectorAll('.controls input:not([type=file]),.controls textarea,.controls select,#aspect').forEach(e=>e.addEventListener('input',change));
 document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{card.kind=b.dataset.kind;if(card.kind==='chapter'){card=structuredClone(state.startup?.card||card);card.kind='chapter';showRef(state.references.find(r=>r.id===card.referenceId)||ref);dirtyMark();fields();status('目录转章节：来自指定参考的动作观察，参数为独立重建。');return;}card.steps=['选取参考','调整动画','保存复用'];if(card.kind==='emphasis'){card.value='246';card.unit='个词条';card.title='一份中文解释手册';card.subtitle='把陌生名词，变成看得懂的知识';card.trigger.time=1;card.cues=structuredClone(defaults.cues);card.trigger.mode='time';}card.name={emphasis:'词条数字 · 淡入强调',compare:'双列数据 · 对比卡',steps:'三步流程 · 顺序出现'}[card.kind];if(card.kind!=='emphasis'){card.title=card.kind==='compare'?'同一件事，两种效率':'把一个想法，变成可复用卡片';card.subtitle=card.kind==='compare'?'演示数据，可替换为已核对的实测值':'一张做通，再扩展成库';card.trigger.time=.15;card.interpretation='独立扩展设计，未从该参考片测得对应布局。';}dirtyMark();fields();status('已切换卡片结构，当前为独立扩展草稿。');});
 $('play').onclick=()=>{if(!playing&&time>=card.duration)time=0;playing=!playing;if(!playing)$('reference').pause();last=performance.now();$('play').textContent=playing?'Ⅱ':'▶';};
 $('comparePlay').onclick=()=>{time=0;playing=true;last=performance.now();$('reference').currentTime=0;$('reference').play().catch(()=>status('原片未能自动播放，可手动点击左侧播放',true));$('play').textContent='Ⅱ';};
 $('seek').oninput=()=>{time=+$('seek').value;playing=false;$('reference').pause();$('play').textContent='▶';render();};
 $('references').onchange=()=>{showRef(state.references.find(r=>r.id===$('references').value));card.referenceId=ref.id;dirtyMark();};
 $('analyze').onclick=async()=>{const b=$('analyze');b.disabled=true;status('正在保存选段与 15 张时间证据…');try{const r=await api('/api/analyze',{source:$('source').value,start:$('start').value,end:$('end').value,notes:$('notes').value});state.references.push(r);list();showRef(r);card.referenceId=r.id;dirtyMark();status('选段与抽帧已保存。请按新证据调整卡片内容和动作，不会自动推断成模板。');}catch(e){status(e.message,true);}finally{b.disabled=false;}};
 $('save').onclick=async()=>{if(!validate())return;$('save').disabled=true;try{const result=await api('/api/save',{card,parent});state.cards.push(result);parent=result.id;dirty=false;$('dirty').textContent='已保存版本';list();$('references').value=ref?.id||'';status('已入库：'+card.name+'。每次保存保留独立版本。');}catch(e){status(e.message,true);}finally{$('save').disabled=false;}};
 $('logo').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(!/^image\/(png|jpeg|webp)$/.test(f.type)||f.size>2_000_000){status('请选择 2 MB 以内的 PNG/JPEG/WebP',true);return;}const fr=new FileReader();fr.onload=()=>{card.logo=fr.result;dirtyMark();render();status('Logo 已替换，保存卡片可一并入库。');};fr.readAsDataURL(f);};
 $('clearLogo').onclick=()=>{card.logo='';$('logo').value='';dirtyMark();render();};
 $('json').onclick=()=>{if(validate())download(safeName()+'.json',JSON.stringify({card,reference:ref},null,2),'application/json');};
 $('svg').onclick=()=>download(safeName()+'.svg',CardRenderer.renderCard(card,time),'image/svg+xml');
 $('html').onclick=async()=>{if(!validate())return;const renderer=await(await fetch('/renderer.js')).text();const json=JSON.stringify(card).replace(/</g,'\\u003c');download(safeName()+'.html',`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>动画卡片</title><style>body{margin:0;background:#202b25;display:grid;place-items:center;min-height:100vh}#stage{max-width:100vw;max-height:100vh}svg{max-width:100vw;max-height:100vh;display:block}</style><div id="stage"></div><script>${renderer}\nconst card=${json};let start=performance.now();function tick(now){document.getElementById('stage').innerHTML=renderCard(card,((now-start)/1000)%card.duration);requestAnimationFrame(tick)}requestAnimationFrame(tick);<\/script></html>`,'text/html');status('已导出独立 HTML，可离线播放；卡片参数在文件内。');};
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 function tick(now){if(playing){time+=(now-last)/1000;if(time>=card.duration){time=card.duration;playing=false;$('play').textContent='▶';}render();}last=now;requestAnimationFrame(tick);}requestAnimationFrame(tick);
}
window.Lab={getCard:()=>structuredClone(card),getReference:()=>ref,setTime:t=>{playing=false;time=t;render();},loadCard:c=>{card=structuredClone(c);card.chapter ||= structuredClone(defaults.chapter);parent=null;time=Math.min(1.65,card.duration);playing=false;dirtyMark();fields();},issues:problems,getState:()=>state,defaults:()=>structuredClone(defaults),showReference:showRef,api,status,markDirty:dirtyMark,refreshLibrary:list};
init().catch(e=>status(e.message,true));
