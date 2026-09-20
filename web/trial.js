/* Local trial workflows. Uses browser SVG rasterization for deterministic frames. */
let renderBusy=false,study=false;
function preset(kind){
 const c=Lab.defaults();c.kind=kind;c.referenceId=null;c.brand='YOUR BRAND';c.footer='';c.logo='';c.trigger.mode='time';
 if(kind==='chapter'){Object.assign(c,{name:'目录转章节',title:'一个想法，可以做成什么？',value:'把内容，做成可操作的页面',unit:'每一次表达，都有新的可能',subtitle:'从一张卡片开始',steps:['知识手册','演示页面','动态卡片','运营看板']});c.trigger.time=0;c.motion.style='fade';c.motion.enter=.2;c.motion.exit=.2;c.layout.font=78;}
 if(kind==='emphasis')Object.assign(c,{name:'大字强调',title:'让你的重点，被一眼看见',value:'1280',unit:'个新可能',subtitle:'数字、观点、结论，都能成为主角'});
 if(kind==='compare'){Object.assign(c,{name:'数据对比',title:'同一件事，两种效率',subtitle:'示例数据，请替换为自己的实测结果'});c.trigger.time=.15;}
 if(kind==='steps'){Object.assign(c,{name:'三步流程',title:'把一个想法，变成实际成果',subtitle:'一步一步，让复杂变简单'});c.trigger.time=.15;}
 c.interpretation='独立设计的通用卡片，未自动从当前视频识别。';return c;
}
function setMode(value){
 study=value;document.getElementById('referencePanel').hidden=!value;document.getElementById('templatePanel').hidden=value;document.getElementById('comparePlay').hidden=!value;
 document.getElementById('studyMode').classList.toggle('active',value);document.getElementById('useMode').classList.toggle('active',!value);
 document.getElementById('modeHelp').textContent=value?'导入短段、查看抽帧，再选择卡片结构并手工调整。目前尚未接入自动识别与仿写。':'改好的卡片可以保存，下次直接使用。想从视频学习新动作，打开上方「拉片制作」。';
}
async function imageFromSVG(svg){
 const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob);
 try{return await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('动画图像无法绘制'));img.src=url;});}finally{URL.revokeObjectURL(url);}
}
async function renderMP4(){
 if(renderBusy)return;
 const issues=Lab.issues();if(issues.length){Lab.status(issues.join('；'),true);return;}
 const state=Lab.getState();if(!state.capabilities.ffmpeg||!state.capabilities.ffprobe){Lab.status('导出需要本机FFmpeg，请先运行启动器查看环境检查。',true);return;}
 const snapshot=Lab.getCard();const controls=[...document.querySelectorAll('.controls input,.controls textarea,.controls select,#aspect,#save,.template-card,.library-item,#videoFile,#analyze,#studyKind')].map(e=>[e,e.disabled]);controls.forEach(([e])=>e.disabled=true);renderBusy=true;document.body.classList.add('rendering');const button=document.getElementById('mp4');button.disabled=true;const link=document.getElementById('exportResult');link.hidden=true;
 try{
  const job=await Lab.api('/api/export/start',{card:snapshot}),canvas=document.createElement('canvas');canvas.width=job.width;canvas.height=job.height;const ctx=canvas.getContext('2d');
  for(let f=0;f<job.frame_count;f++){
   const img=await imageFromSVG(CardRenderer.renderCard(snapshot,f/job.fps));ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);
   const png=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!png)throw Error('无法生成导出画面');
   const r=await fetch(`/api/export/${job.id}/frame/${f}`,{method:'POST',headers:{'Content-Type':'image/png'},body:png});if(!r.ok)throw Error((await r.json()).error);
   button.textContent=`正在导出 ${Math.round((f+1)/job.frame_count*90)}%`;Lab.status(`正在生成视频 ${f+1}/${job.frame_count} 帧，请保持当前页面打开。`);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  button.textContent='正在编码…';Lab.status('画面已完成，正在编码并校验视频…');
  const result=await Lab.api('/api/export/finish',{id:job.id});link.href=result.url;link.download=snapshot.name.replace(/[\/\\:*?"<>|]/g,'-')+'.mp4';link.hidden=false;link.textContent='下载 '+snapshot.name+'.mp4 ↓';Lab.status(`导出完成 · ${result.width}×${result.height} · ${result.duration.toFixed(2)}秒。视频已保存在本机，点击下载。`);
 }catch(e){Lab.status('导出未完成：'+e.message+'。可重新点击导出。',true);}
 finally{controls.forEach(([e,disabled])=>e.disabled=disabled);renderBusy=false;button.disabled=false;button.textContent='导出 MP4 视频 ↗';document.body.classList.remove('rendering');}
}
function setupTrial(){
 const names={chapter:'聚焦目录，再进入章节',emphasis:'突出数字或一句重要观点',compare:'让两组数据清楚对照',steps:'把过程拆成三个清晰步骤'};
 for(const kind of ['chapter','emphasis','compare','steps']){
  const c=preset(kind),b=document.createElement('button');b.className='template-card';b.dataset.template=kind;b.innerHTML=`<div class="template-thumb">${CardRenderer.renderCard(c,1.7)}</div><strong>${c.name}</strong><small>${names[kind]}</small>`;
  b.onclick=()=>{if(renderBusy)return;Lab.loadCard(preset(kind));document.querySelectorAll('.template-card').forEach(x=>x.classList.toggle('active',x===b));Lab.status('已选择'+c.name+'，修改右侧内容即可使用。');};document.getElementById('templates').append(b);
 }
 document.getElementById('studyMode').onclick=()=>setMode(true);document.getElementById('useMode').onclick=()=>setMode(false);setMode(false);
 document.getElementById('studyKind').onchange=e=>{const c=preset(e.target.value);c.referenceId=Lab.getReference()?.id||null;c.interpretation='按参考片人工选择结构，尚未自动识别原片图层或动画。';Lab.loadCard(c);Lab.status('已选择重建结构，请按参考片调整文字与动作。');};
 document.getElementById('videoFile').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;const label=document.getElementById('uploadState');
  if(file.size>250_000_000){label.textContent='视频超过250 MB，请先截取需要分析的片段。';return;}
  e.target.disabled=true;label.textContent='正在导入 '+file.name+'…';
  try{const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream','X-File-Name':encodeURIComponent(file.name)},body:file});const d=await r.json();if(!r.ok)throw Error(d.error);
   Lab.showReference(null);Lab.loadCard({...Lab.getCard(),referenceId:null});document.getElementById('source').value=d.source;document.getElementById('start').value=0;document.getElementById('end').value=Math.min(4,d.duration);document.getElementById('reference').src=d.url;document.getElementById('reference').removeAttribute('poster');document.getElementById('referenceOpen').href=d.url;document.getElementById('notes').value='';document.getElementById('frames').replaceChildren();document.getElementById('observations').textContent='新视频尚未填写观察记录。';document.getElementById('pending').replaceChildren();document.getElementById('provenance').textContent='新导入视频 · 尚未抽帧，也未关联当前卡片';label.textContent=`${d.name} · ${d.duration.toFixed(2)}秒 · ${d.width}×${d.height}。设置起止时间，再点击抽帧。`;Lab.status('视频已导入本机。选择最多12秒的片段，抽帧后观察动作。');
  }catch(err){label.textContent='导入失败：'+err.message;}finally{e.target.disabled=false;}
 };
 document.getElementById('mp4').onclick=renderMP4;
 if(!Lab.getState().startup)Lab.loadCard(preset('emphasis'));
}
if(window.Lab?.getCard())setupTrial();else window.addEventListener('labready',setupTrial,{once:true});
window.Trial={preset,setMode,isExporting:()=>renderBusy};
