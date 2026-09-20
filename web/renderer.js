/* Original deterministic SVG renderer. No third-party runtime. */
const esc = v => String(v ?? '').replace(/[&<>"']/g, s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[s]));
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
function triggerTime(c){
 if(c.trigger.mode!=='phrase') return {time:Number(c.trigger.time)||0,resolved:true};
 const matches=c.cues.filter(x=>x.text.includes(c.trigger.phrase) && c.trigger.phrase);
 const cue=matches[Math.max(0,Number(c.trigger.occurrence)-1)];
 return {time:cue?Number(cue.time):null,resolved:!!cue};
}
function renderCard(c,t){
 const vertical=c.aspect==='9:16', w=vertical?720:1280,h=vertical?1280:720;
 const trigger=triggerTime(c); const local=trigger.resolved?t-trigger.time:-1;
 const entrance=clamp(local/Math.max(.1,c.motion.enter));
 const smooth=c.motion.easing==='linear'?entrance:1-Math.pow(1-entrance,3);
 const out=clamp((c.duration-t)/Math.max(.1,c.motion.exit));
 const alpha=(local<0?0:smooth)*out;
 const shift=c.motion.style==='rise'?(1-smooth)*65:0;
 const zoom=c.motion.style==='scale'?.84+.16*smooth:1;
 const x=w/2+Number(c.layout.x)*w/100,y=h/2+Number(c.layout.y)*h/100;
 const width=vertical?592:1120, font=Number(c.layout.font), unit=vertical?.8:1;
 function text(v,xx,yy,size,color=c.ink,weight=500,anchor='middle',max=width){
  // Deterministic soft wrapping and fit for long CJK/Latin text.
  const chars=Array.from(String(v)), estimate=s=>Array.from(s).reduce((n,a)=>n+(/[\x00-\x7F]/.test(a)?.56:1),0);
  const lines=[];let line='';for(const char of chars){if(char==='\n'||estimate(line+char)*size>max){lines.push(line);line=char==='\n'?'':char;}else line+=char;}lines.push(line);
  const display=lines.slice(0,4);if(lines.length>4)display[3]=display[3].slice(0,-1)+'…';
  return `<text data-card-text="1" fill="${esc(color)}" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}">${display.map((l,i)=>`<tspan x="${xx}" y="${yy+i*size*1.23}">${esc(l)}</tspan>`).join('')}</text>`;
 }
 let inner='';
 if(c.kind==='emphasis'){
  inner+=text(c.title,0,vertical?-330:-176,Math.min(font*.5,42),c.ink,600);
  const size=Math.min(font*2.25*unit,(width-60)/Math.max(1,Array.from(c.value).reduce((n,a)=>n+(/[\x00-\x7F]/.test(a)?.6:1),0)));
  inner+=text(c.value,0,vertical?-40:42,size,c.ink,750);
  inner+=text(c.unit,0,vertical?55:106,30,c.ink,500);
  inner+=`<rect x="${-width*.35}" y="${vertical?143:145}" width="${width*.7}" height="80" rx="20" fill="${esc(c.accent)}"/>`;
  inner+=text(c.subtitle,0,vertical?191:194,Math.min(27,font*.33),c.ink,600,'middle',width*.64);
 }else if(c.kind==='compare'){
  inner+=text(c.title,0,vertical?-435:-208,Math.min(font*.5,42),c.ink,600);
  const items=c.rows.slice(0,2);items.forEach((r,i)=>{
   const xx=vertical?0:(i?285:-285), yy=vertical?-290+i*320:-130,bw=vertical?560:530;
   inner+=`<rect x="${xx-bw/2}" y="${yy}" width="${bw}" height="270" rx="28" fill="${i===1?esc(c.accent):'#ffffff'}"/>`;
   inner+=text(r.label,xx,yy+60,28,c.ink,500,'middle',bw-50);
   inner+=text(r.value,xx,yy+165,Math.min(font, (bw-60)/Math.max(1,String(r.value).length*.62)),c.ink,700,'middle',bw-50);
   inner+=text(r.unit,xx,yy+226,22,c.ink,500,'middle',bw-50);
  });
  inner+=text(c.subtitle,0,vertical?420:228,24,c.ink,500);
 }else if(c.kind==='steps'){
  inner+=text(c.title,0,vertical?-430:-205,Math.min(font*.5,42),c.ink,600);
  c.steps.slice(0,3).forEach((s,i)=>{
   const xx=vertical?0:(i-1)*370,yy=vertical?-320+i*245:-115,bw=vertical?560:345;
   const a=clamp((local-i*c.motion.stagger)/Math.max(.1,c.motion.enter));
   inner+=`<g opacity="${a}"><rect x="${xx-bw/2}" y="${yy}" width="${bw}" height="${vertical?215:260}" rx="26" fill="${i===2?esc(c.accent):'#ffffff'}"/>`;
   inner+=text('0'+(i+1),xx,yy+63,34,c.ink,750);
   inner+=text(s,xx,yy+125,28,c.ink,600,'middle',bw-50)+'</g>';
  });inner+=text(c.subtitle,0,vertical?465:226,24,c.ink,500);
 }
 if(c.kind==='chapter'){
  const phase=c.chapter||{focusAt:.65,swapAt:2,settleAt:2.65,zoom:1.22,selected:1};
  const ease=n=>1-Math.pow(1-clamp(n),3);
  const focus=ease((local-phase.focusAt)/.45), settle=ease((local-phase.settleAt)/.5);
  const scale=1+(phase.zoom-1)*focus*(1-settle);
  const swap=ease((local-phase.swapAt)/.38);
  const pw=vertical?550:950,ph=vertical?800:445,px=-pw/2,py=-ph/2;
  inner=`<g transform="scale(${scale})"><rect x="${px+6}" y="${py+14}" width="${pw}" height="${ph}" rx="22" fill="#253f35" opacity=".1"/><rect x="${px}" y="${py}" width="${pw}" height="${ph}" rx="22" fill="#fffef9" stroke="${esc(c.accent)}" stroke-width="2"/><path d="M ${px} ${py+42} h ${pw}" stroke="${esc(c.accent)}"/><circle cx="${px+22}" cy="${py+21}" r="4" fill="${esc(c.accent)}"/><circle cx="${px+37}" cy="${py+21}" r="4" fill="#d5ddcd"/><circle cx="${px+52}" cy="${py+21}" r="4" fill="#e7ebdf"/>`;
  inner+=`<g opacity="${1-swap}" transform="translate(0 ${-swap*28})">`;
  inner+=text(c.title,0,vertical?-275:-78,Math.min(font*.48,44),c.ink,700,'middle',pw-80);
  c.steps.slice(0,4).forEach((s,i)=>{
   const bw=vertical?420:198,bh=vertical?105:92,xx=vertical?-210:-pw/2+43+i*222,yy=vertical?-132+i*122:14;
   const selected=i===Number(phase.selected),select=selected?focus*(1-settle):0;
   inner+=`<rect x="${xx}" y="${yy}" width="${bw}" height="${bh}" rx="12" fill="${selected&&focus>.6?esc(c.accent):'#eff2e9'}" stroke="${selected&&focus>.6?esc(c.ink):'none'}" stroke-width="1"/>`;
   inner+=text(String(i+1).padStart(2,'0'),xx+17,yy+25,12,c.ink,500,'start',bw-30);
   inner+=text(s,xx+bw/2,yy+58,Math.min(22,font*.25),c.ink,600,'middle',bw-24);
   if(select>0)inner+=`<circle cx="${xx+bw*.75}" cy="${yy+bh*.75}" r="${10+4*Math.sin(clamp((local-phase.focusAt)/.5)*Math.PI)}" fill="none" stroke="${esc(c.ink)}" stroke-width="2" opacity="${select}"/>`;
  });inner+='</g>';
  inner+=`<g opacity="${swap}" transform="translate(0 ${(1-swap)*35})">`;
  inner+=text('CHAPTER '+String(Number(phase.selected)+1).padStart(2,'0'),0,vertical?-210:-108,18,c.ink,500,'middle',pw-80);
  inner+=text(c.value,0,vertical?-105:-28,Math.min(font*.62,56),c.ink,750,'middle',pw-100);
  inner+=text(c.unit,0,vertical?52:65,24,c.ink,400,'middle',pw-100);
  inner+=`<rect x="${-pw*.34}" y="${vertical?165:113}" width="${pw*.68}" height="64" rx="16" fill="${esc(c.accent)}"/>`;
  inner+=text(c.subtitle,0,vertical?205:153,22,c.ink,600,'middle',pw*.62);
  inner+='</g></g>';
 }
 const safeLogo=/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(c.logo||'')?c.logo:null;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif"><rect width="${w}" height="${h}" fill="${esc(c.background)}"/><circle cx="${w*.9}" cy="${h*.13}" r="${w*.21}" fill="${esc(c.accent)}" opacity=".12"/><path d="M ${w*.08} ${h*.13} H ${w*.92}" stroke="${esc(c.ink)}" opacity=".12"/>${text(c.brand,w*.08,h*.087,20,c.ink,600,'start',w*.65)}${safeLogo?`<image href="${esc(safeLogo)}" x="${w-125}" y="${h*.035}" width="62" height="62" preserveAspectRatio="xMidYMid meet"/>`:''}<g opacity="${alpha}" transform="translate(${x} ${y+shift}) scale(${zoom*c.layout.scale})">${inner}</g>${text(c.footer,w/2,h*.937,18,c.ink,400,'middle',w*.84)}</svg>`;
}
if(typeof window!=='undefined') window.CardRenderer={renderCard,triggerTime};
