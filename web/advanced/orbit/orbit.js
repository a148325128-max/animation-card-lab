/* Independent DOM compositor: deterministic orbit projection + live backdrop glass. */
const DEFAULTS={variant:'player',logoImages:[],title:'把想法，转成看得见的作品',labels:['灵感收集','今天的创作','画面笔记','保持好奇','新的尝试','下一段故事'],accent:'#b5d9ff',period:8,direction:1,radius:252,blur:12,opacity:.16,aspect:'3:4',subject:'none',subjectImage:'',subjectScale:1};
let config=structuredClone(DEFAULTS),cards=[],ready=Promise.resolve();
const $=id=>document.getElementById(id);
const xml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
function album(index){
 const palettes=[['#8c94d8','#f4b8a7','#152542'],['#85cec4','#dbeab7','#183c43'],['#d2b6e9','#8eaeda','#2a254a'],['#f0b376','#f0d9b9','#3e3b52'],['#94d3df','#cec4e9','#1a334c'],['#d39caf','#ecd4bb','#302740']];
 const [a,b,bg]=palettes[index%palettes.length];
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${bg}"/></linearGradient><radialGradient id="s"><stop stop-color="${b}"/><stop offset="1" stop-color="${a}"/></radialGradient></defs><rect width="200" height="200" fill="url(#g)"/><circle cx="135" cy="61" r="44" fill="url(#s)"/><path d="M-20 195 L65 57 L206 220 M40 230 L152 109 L237 211" fill="none" stroke="${b}" stroke-width="19" opacity=".6"/><circle cx="35" cy="32" r="3" fill="white"/></svg>`;
 return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
const LOGOS=['openai','claude','gemini','deepseek','qwen','doubao'];
function cardHTML(index,hero){
 if(config.variant==='logos'){const key=LOGOS[index%6],src=config.logoImages?.[index%6]||album(index);return `<div class="glass-sheen"></div><img class="orbit-logo logo-${key}" src="${xml(src)}" alt="${key}" draggable="false">`;}
 const label=config.labels[index%config.labels.length];
 return `<div class="glass-sheen"></div><div class="player-head"><img class="album" src="${album(index)}" alt="原创抽象封面"><div class="track-copy"><div class="track-title">${xml(label)}</div><div class="track-note">${hero?'ANIMATION STUDY':'CREATIVE NOTES'}</div></div><span class="note-icon">♫</span></div>${hero?'<div class="progress-track"><i></i></div><div class="timecode"><span>01:28</span><span>03:40</span></div><div class="transport"><span>↶</span><span>◀◀</span><b>Ⅱ</b><span>▶▶</span><span>♡</span></div>':''}`;
}
function buildSubject(){
 const host=$('subject');host.replaceChildren();host.className='subject '+config.subject;
 if(config.subject==='product'){
  host.innerHTML='<div class="product-body"><div class="product-cap"></div><div class="product-label"><span>FORM / 01</span><b>A</b><small>DESIGN STUDY</small></div><div class="product-bottom"></div></div>';
  ready=Promise.resolve();
 }else if(config.subject==='image'&&/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(config.subjectImage)){
  const img=document.createElement('img');img.src=config.subjectImage;img.alt='自选主体';host.append(img);ready=img.decode();
 }else ready=Promise.resolve();
}
function setConfig(value){
 config={...structuredClone(DEFAULTS),...value};
 const stage=$('stage');const dims=config.aspect==='16:9'?[1280,720]:config.aspect==='9:16'?[720,1280]:[720,960];
 stage.style.width=dims[0]+'px';stage.style.height=dims[1]+'px';stage.style.setProperty('--accent',config.accent);stage.style.setProperty('--glass-alpha',config.opacity);stage.style.setProperty('--blur',config.blur+'px');
 $('cards').replaceChildren();cards=[];
 for(let row=0;row<3;row++)for(let i=0;i<6;i++){
  const hero=row===1&&i===0,el=document.createElement('div');el.className='orbit-card'+(config.variant==='logos'?' logo-card':hero?' hero':'');el.innerHTML=cardHTML(config.variant==='logos'?row*2+i:row*6+i,hero);$('cards').append(el);cards.push({el,row,i,hero});
 }
 buildSubject();renderAt(0);if(window.fitStage)window.fitStage();return ready;
}
function renderAt(t){
 const stage=$('stage'),wide=config.aspect==='16:9',tall=config.aspect==='9:16';
 const w=wide?1280:720,h=wide?720:tall?1280:960,cx=w/2,cy=h*.5;
 // Shift row phases so columns do not march in lockstep. 8 s = one complete turn.
 const cycle=((t % config.period)+config.period)%config.period;
 const phase=cycle/config.period*Math.PI*2*config.direction;
 const radius=config.radius*(wide?1.42:1),focal=1250,zRadius=145;
 for(const {el,row,i,hero} of cards){
  const a=phase+i*Math.PI/3+[.18,0,-.22][row],z=Math.cos(a)*zRadius;
  const scale=focal/(focal-z),x=Math.sin(a)*radius,y=(row-1)*(wide?165:tall?267:217);
  const yaw=Math.asin(Math.sin(a))*(-180/Math.PI)*.91;
  const floatY=Math.sin(a*2+row)*7;
  const logos=config.variant==='logos',cw=logos?132:hero?250:213,ch=logos?132:hero?172:84;
  el.style.width=cw+'px';el.style.height=ch+'px';el.style.left=(cx+x*scale)+'px';el.style.top=(cy+(y+floatY)*scale)+'px';
  el.style.transform=`translate(-50%,-50%) perspective(900px) rotateY(${yaw}deg) rotateX(${(row-1)*-4}deg) scale(${scale*(wide?1.08:1)})`;
  el.style.zIndex=String(Math.round(1000+z*3));el.style.opacity=String(z>=0?1:.64+.18*(1+z/zRadius));
  el.style.setProperty('--shine-x',(35+40*Math.sin(a))+'%');
  const hue=210+32*Math.sin(a+row);el.style.borderColor=`hsla(${hue},85%,87%,${.64+.2*Math.max(0,Math.cos(a))})`;
  const progress=el.querySelector('.progress-track i');if(progress)progress.style.width=(32+8*Math.sin(phase))+'%';
 }
 const subject=$('subject');subject.style.width=(wide?245:260)*config.subjectScale+'px';subject.style.height=(wide?410:tall?720:555)*config.subjectScale+'px';subject.style.left=cx+'px';subject.style.top=cy+'px';
 stage.dataset.time=t.toFixed(6);if($('time'))$('time').textContent=t.toFixed(2)+' s';
}
window.Orbit={defaults:()=>structuredClone(DEFAULTS),getConfig:()=>structuredClone(config),setConfig,renderAt,ready:()=>ready};
