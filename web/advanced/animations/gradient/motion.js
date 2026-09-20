(() => {
'use strict';
const BASE={duration:10,title:'灵感，开始成形',subtitle:'把想法变成作品',showText:true,accent:'#39f6d2'};
let cfg={...BASE};
const canvas=document.getElementById('stage'); canvas.width=720;canvas.height=1280;
const ctx=canvas.getContext('2d',{alpha:false});
const PI=Math.PI,TAU=PI*2;
const clamp=x=>Math.max(0,Math.min(1,x));
const ease=x=>{x=clamp(x);return x*x*(3-2*x);};
const out=x=>1-Math.pow(1-clamp(x),3);
const mix=(a,b,t)=>a+(b-a)*t;
const rgba=(c,a)=>`rgba(${c[0]},${c[1]},${c[2]},${a})`;
const rgb=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
function dot(x,y,r=6,a=1){ctx.save();ctx.globalAlpha=a;ctx.shadowBlur=15;ctx.shadowColor='#a9f7ff';ctx.fillStyle='#f8fffe';ctx.beginPath();ctx.arc(x,y,r,0,TAU);ctx.fill();ctx.restore();}
function txt(text,x,y,size,alpha=1,color='#f2f8ff',weight=400,align='center'){
 if(!cfg.showText||alpha<=0)return;ctx.save();ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.font=`${weight} ${size}px "PingFang SC", "Microsoft YaHei", sans-serif`;ctx.textAlign=align;ctx.textBaseline='middle';ctx.fillText(text,x,y);ctx.restore();
}
function fittedText(text,x,y,maxWidth,size,alpha,color,weight,align='center'){
 text=String(text);ctx.font=`${weight} ${size}px "PingFang SC",sans-serif`;while(ctx.measureText(text).width>maxWidth&&size>18){size--;ctx.font=`${weight} ${size}px "PingFang SC",sans-serif`;}
 const lines=[];let line='';for(const ch of Array.from(text)){if(line&&ctx.measureText(line+ch).width>maxWidth){lines.push(line);line=ch;}else line+=ch;}if(line)lines.push(line);
 lines.forEach((value,i)=>txt(value,x,y+(i-(lines.length-1)/2)*(size*1.4),size,alpha,color,weight,align));
}
function glowEllipse(x,y,rx,ry,a=1){
 ctx.save();ctx.globalAlpha=a;ctx.translate(x,y);ctx.scale(1,ry/rx);
 const g=ctx.createRadialGradient(0,0,rx*.10,0,0,rx);g.addColorStop(0,'rgba(181,255,255,.92)');g.addColorStop(.36,'rgba(31,242,239,.9)');g.addColorStop(.65,'rgba(26,83,255,.66)');g.addColorStop(1,'rgba(12,30,255,0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,rx,0,TAU);ctx.fill();ctx.restore();
}
function bezPoint(a,b,c,d,t){const s=1-t;return{x:s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,y:s*s*s*a.y+3*s*s*t*b.y+3*s*t*t*c.y+t*t*t*d.y};}
function shapePoints(radius,morph,angle=0){
 const pts=[],k=.5522848;
 for(let q=0;q<4;q++){
  const a={x:0,y:-radius},b={x:mix(k*radius,0,morph),y:mix(-radius,-radius*.24,morph)},c={x:mix(radius,radius*.24,morph),y:mix(-k*radius,0,morph)},d={x:radius,y:0};
  for(let j=0;j<48;j++){const p=bezPoint(a,b,c,d,j/48),theta=q*PI/2+angle;pts.push({x:p.x*Math.cos(theta)-p.y*Math.sin(theta),y:p.x*Math.sin(theta)+p.y*Math.cos(theta)});}
 }return pts;
}
function path(points,x,y){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(x+p.x,y+p.y):ctx.moveTo(x+p.x,y+p.y));ctx.closePath();}
function ribbon(x,y,r,morph,t,alpha=1,rotation=0,nodes=true){
 const pts=shapePoints(r,morph,rotation),n=pts.length,accent=rgb(cfg.accent);
 ctx.save();ctx.globalAlpha=alpha;
 const glow=ctx.createLinearGradient(x-r,y-r,x+r,y+r);glow.addColorStop(0,'#0925ff');glow.addColorStop(.5,cfg.accent);glow.addColorStop(1,'#1536ff');
 path(pts,x,y);ctx.strokeStyle=glow;ctx.lineWidth=7;ctx.shadowBlur=26;ctx.shadowColor=cfg.accent;ctx.globalAlpha=alpha*.3;ctx.stroke();ctx.shadowBlur=0;ctx.globalAlpha=alpha;
 const edge=pts.map((p,i)=>{
  const before=pts[(i+n-1)%n],after=pts[(i+1)%n];let nx=after.y-before.y,ny=before.x-after.x,len=Math.hypot(nx,ny)||1;nx/=len;ny/=len;
  const wave=.5+.5*Math.sin(i/n*TAU*3-t*1.9),width=(2.5+17*Math.pow(wave,1.4))*Math.min(1,r/180);
  return {inner:{x:x+p.x-nx*.5,y:y+p.y-ny*.5},outer:{x:x+p.x+nx*width,y:y+p.y+ny*width},wave};
 });
 for(let i=0;i<n;i++){
  const a=edge[i],b=edge[(i+1)%n],f=.5+.5*Math.sin(i/n*TAU*3-t*1.9+.4),col=[Math.round(mix(14,accent[0],f)),Math.round(mix(29,accent[1],f)),Math.round(mix(255,accent[2],f))];
  const g=ctx.createLinearGradient(a.inner.x,a.inner.y,a.outer.x,a.outer.y);g.addColorStop(0,rgba(col,.14));g.addColorStop(.62,rgba(col,.9));g.addColorStop(1,rgba(col,.0));
  ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(a.inner.x,a.inner.y);ctx.lineTo(b.inner.x,b.inner.y);ctx.lineTo(b.outer.x,b.outer.y);ctx.lineTo(a.outer.x,a.outer.y);ctx.closePath();ctx.fill();
 }
 path(pts,x,y);ctx.lineWidth=.7;ctx.strokeStyle='rgba(125,203,255,.34)';ctx.stroke();
 if(nodes)for(let q=0;q<4;q++){const p=pts[q*48];dot(x+p.x,y+p.y,5.5,1);}
 ctx.restore();
}
function intro(t){
 const fade=1-ease((t-1.6)/.7),grow=out(t/1.25);ctx.save();ctx.globalAlpha=fade;
 // Fine paths trace the motion before broad pools of light arrive.
 const y0=mix(1020,320,grow),y1=mix(1170,1010,grow);
 ctx.strokeStyle='rgba(207,230,255,.5)';ctx.lineWidth=1;
 ctx.beginPath();ctx.moveTo(360,y0);ctx.lineTo(360,y1);ctx.stroke();
 ctx.beginPath();ctx.moveTo(395,y0+45);ctx.bezierCurveTo(100,y0+180,615,y1-260,290,y1);ctx.stroke();
 for(let j=0;j<3;j++){
  const p=((t*.62+j*.34)%1);const y=mix(1060,300,p),rx=mix(265,80,p);glowEllipse(360,y,rx,rx*.27,.9*Math.sin(PI*p));
 }
 dot(360,y0,6);dot(395,y0+45,4);dot(360,mix(y0,y1,.52),3.5);
 txt('从一个想法开始',360,238,26,ease(t/.6),'#a8b7c9',400);
 ctx.restore();
}
function beam(t){
 const opening=out((t-6.0)/1.15),w=mix(25,606,opening),h=mix(25,242,opening),x=360-w/2,y=650-h/2;
 ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,mix(12,34,opening));ctx.clip();
 const g=ctx.createLinearGradient(x-60,y,x+w+60,y+h);g.addColorStop(0,'#06103a');g.addColorStop(.21,'#1016dd');g.addColorStop(.48,'#126aff');g.addColorStop(.82,cfg.accent);g.addColorStop(1,'#cefdf7');ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
 // Soft longitudinal light streaks sweep across the card, then settle.
 const sweep=mix(x-180,x+w+130,ease((t-6.25)/1.6));
 const light=ctx.createLinearGradient(sweep-110,0,sweep+110,0);light.addColorStop(0,'rgba(230,255,255,0)');light.addColorStop(.5,'rgba(220,255,255,.35)');light.addColorStop(1,'rgba(230,255,255,0)');ctx.fillStyle=light;ctx.fillRect(x,y,w,h);
 const sheen=ctx.createLinearGradient(0,y,0,y+h);sheen.addColorStop(0,'rgba(255,255,255,.22)');sheen.addColorStop(.32,'rgba(255,255,255,0)');sheen.addColorStop(1,'rgba(0,0,0,.15)');ctx.fillStyle=sheen;ctx.fillRect(x,y,w,h);ctx.restore();
 ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,mix(12,34,opening));ctx.strokeStyle='rgba(172,225,255,.5)';ctx.lineWidth=1;ctx.stroke();ctx.restore();
 const logoX=mix(360,cfg.showText?142:360,ease((t-6.7)/.9)),logoR=mix(42,cfg.showText?52:78,ease((t-6.4)/.9));
 ribbon(logoX,650,logoR,1,t,1,-PI*.06,false);
 const reveal=ease((t-7.1)/.9);
 fittedText(cfg.title,232,630,372,34,reveal,'#f7fcff',500,'left');
 fittedText(cfg.subtitle,232,681,372,21,reveal*.84,'#e1f8ff',400,'left');
 txt('让灵感，有自己的形状',360,845,23,ease((t-7.8)/.8),'#8b9eaf',400);
}
function renderAt(seconds){
 const duration=Number(cfg.duration)||10,t=((Number(seconds)%duration)+duration)%duration*10/duration;
 ctx.resetTransform();ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.shadowBlur=0;ctx.fillStyle='#020306';ctx.fillRect(0,0,720,1280);
 // A restrained studio atmosphere preserves the reference's large black negative space.
 const ambience=ctx.createRadialGradient(360,635,0,360,635,475);ambience.addColorStop(0,'rgba(7,21,48,.23)');ambience.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ambience;ctx.fillRect(0,0,720,1280);
 if(t<2.3)intro(t);
 if(t>=1.65&&t<6.18){
  const emerge=out((t-1.65)/.75),morph=ease((t-3.7)/1.25),contract=ease((t-5.0)/1.1),r=mix(mix(55,258,emerge),43,contract);
  const alpha=ease((t-1.65)/.5)*(1-ease((t-6.0)/.18));
  ribbon(360,650,r,morph,t,alpha,mix(-.18,0,emerge)+mix(0,PI*.44,contract),contract<.85);
  txt('让想法彼此连接',360,650,26,(1-ease((t-4.5)/.55))*ease((t-2.3)/.4),'#ddebf4',400);
  txt('轮廓，逐渐清晰',360,820,23,ease((t-4.6)/.4)*(1-ease((t-5.8)/.3)),'#91a5b8',400);
 }
 if(t>=6.0)beam(t);
}
window.Motion={defaults:()=>({...BASE}),setConfig:async value=>{cfg={...BASE,...value};if(!/^#[\da-f]{6}$/i.test(cfg.accent))cfg.accent=BASE.accent;cfg.duration=Math.min(16,Math.max(6,Number(cfg.duration)||10));renderAt(0);return{...cfg};},renderAt};
renderAt(0);
})();
