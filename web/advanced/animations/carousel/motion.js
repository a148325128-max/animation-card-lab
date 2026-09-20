(() => {
  'use strict';
  const makeSVG = (content) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="724" viewBox="0 0 1280 724">${content}</svg>`);
  const artwork = [
    makeSVG(`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f2b596"/><stop offset=".58" stop-color="#8dbaca"/><stop offset="1" stop-color="#1d6584"/></linearGradient><linearGradient id="sea" x2="1" y2="1"><stop stop-color="#148ea3"/><stop offset="1" stop-color="#062e54"/></linearGradient><radialGradient id="sun"><stop stop-color="#fffbd6"/><stop offset="1" stop-color="#ffdbaf"/></radialGradient></defs><path fill="url(#sky)" d="M0 0h1280v724H0z"/><circle cx="908" cy="207" r="86" fill="url(#sun)"/><path d="M0 468 236 303 470 484 659 391 933 496 1280 374V724H0Z" fill="#486e88"/><path d="M0 517 239 422 537 542 855 452 1280 487V724H0Z" fill="#285774"/><path fill="url(#sea)" d="M0 541Q331 477 655 554T1280 527V724H0Z"/><g fill="none" stroke="#a1ecdc" stroke-width="3" opacity=".54"><path d="M566 591q177-28 346 0"/><path d="M368 634q258-37 548-3"/><path d="M658 673q189-17 387 0"/></g><path d="M0 641q169-65 280-6 133 70 214 89H0Z" fill="#072e43"/>`),
    makeSVG(`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#281d4e"/><stop offset=".65" stop-color="#78588b"/><stop offset="1" stop-color="#d18c9e"/></linearGradient><linearGradient id="hill" x2="1" y2="1"><stop stop-color="#a080d0"/><stop offset="1" stop-color="#3d3268"/></linearGradient><linearGradient id="river" x2="1" y2="1"><stop stop-color="#e9b4f8"/><stop offset="1" stop-color="#3ba0ce"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h1280v724H0z"/><circle cx="858" cy="188" r="92" fill="#eee2f5"/><circle cx="896" cy="161" r="92" fill="#483462"/><g fill="#f9dbfb"><circle cx="164" cy="106" r="3"/><circle cx="301" cy="202" r="2"/><circle cx="1078" cy="104" r="3"/><circle cx="649" cy="115" r="2"/><circle cx="1173" cy="259" r="2"/></g><path d="M0 461 187 271 355 434 604 305 868 483 1099 346 1280 451V724H0Z" fill="#514376"/><path d="M0 507Q185 369 413 451T847 474Q1103 369 1280 471V724H0Z" fill="url(#hill)"/><path d="M0 605Q212 493 411 558T852 552Q1113 470 1280 540V724H0Z" fill="#332b56"/><path d="M719 466Q600 510 739 544T659 618Q485 660 662 724H950Q748 664 822 625T821 565Q642 516 743 466Z" fill="url(#river)"/><path d="M0 724V648Q186 565 397 644T547 724Z" fill="#1d2246"/>`),
    makeSVG(`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#f5e9ce"/><stop offset="1" stop-color="#ffbb83"/></linearGradient><linearGradient id="dune" x2="0" y2="1"><stop stop-color="#ed8654"/><stop offset="1" stop-color="#c14634"/></linearGradient><linearGradient id="front" x2="1" y2="1"><stop stop-color="#733c48"/><stop offset="1" stop-color="#211f36"/></linearGradient></defs><path fill="url(#sky)" d="M0 0h1280v724H0z"/><circle cx="353" cy="190" r="98" fill="#fff5d9"/><path d="M0 493Q184 359 335 384 624 426 830 340 1119 256 1280 357V724H0Z" fill="#e9a271"/><path d="M0 532Q276 313 596 465T1280 417V724H0Z" fill="url(#dune)"/><path d="M247 461Q594 389 980 577T1280 561V724H0V641Z" fill="#a94f42"/><path d="M0 608Q243 570 447 679T837 646Q1060 472 1280 475V724H0Z" fill="url(#front)"/><g fill="none" stroke="#fac295" stroke-width="2" opacity=".35"><path d="M836 543q217-102 444-110"/><path d="M899 565q190-85 381-90"/><path d="M948 588q163-63 332-76"/></g>`)
  ];
  const defaults = () => ({duration:9, images:[...artwork],titles:['潮汐之间','月光山谷','沙丘漫游'],showText:false});
  let config=defaults(), elements=[], lastTime=0;
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const smoother=x=>x*x*x*(x*(x*6-15)+10);
  const mix=(a,b,p)=>a+(b-a)*p;
  function sourceValid(s){return typeof s==='string' && /^data:image\/(?:png|jpeg|webp|svg\+xml)(?:;[^,]*)?,/i.test(s) && s.length < 12000000;}
  async function setConfig(input={}) {
    const next={...config,...input};
    if(!Number.isFinite(Number(next.duration)) || Number(next.duration)<3 || Number(next.duration)>30) throw Error('循环时长须为 3–30 秒');
    if(!Array.isArray(next.images)||next.images.length!==3||!next.images.every(sourceValid))throw Error('请选择三张本地图片');
    next.duration=Number(next.duration);next.images=[...next.images];
    next.titles=Array.from({length:3},(_,i)=>String(next.titles?.[i]??'').slice(0,48));next.showText=next.showText===true;
    const prepared=next.images.map(src=>{const img=new Image();img.src=src;return img;});
    await Promise.all(prepared.map(img=>img.decode()));
    config=next;
    const holder=document.getElementById('cards');holder.replaceChildren();
    elements=prepared.map((img,i)=>{const card=document.createElement('article');card.className='card';img.alt=config.titles[i]||`画面 ${i+1}`;const caption=document.createElement('div');caption.className='caption';caption.textContent=config.titles[i];caption.style.display=config.showText?'block':'none';card.append(img,caption);holder.append(card);return card;});
    renderAt(lastTime);
  }
  function renderAt(seconds) {
    lastTime=Number(seconds)||0;
    const t=((lastTime%config.duration)+config.duration)%config.duration;
    const stepLength=config.duration/3, step=Math.floor(t/stepLength), local=t-step*stepLength;
    const move=Math.min(.82,stepLength*.40), p=smoother(clamp((local-(stepLength-move))/move));
    elements.forEach((card,i)=>{
      const role=(i-step+3)%3; // 0 centre, 1 lower, 2 upper/rear
      let y,scale,gray,light,alpha=1,z;
      if(role===0){y=mix(0,-298,p);scale=mix(1,.84,p);gray=p;light=mix(1,.70,p);z=20+Math.round(20*(1-p));}
      else if(role===1){y=mix(298,0,p);scale=mix(.84,1,p);gray=1-p;light=mix(.70,1,p);z=20+Math.round(20*p);}
      else {y=mix(-298,298,p);scale=.84-.19*Math.sin(p*Math.PI);gray=1;light=.70;z=1;alpha=1-.55*Math.sin(p*Math.PI);}
      card.style.transform=`translate(-50%,calc(-50% + ${y.toFixed(5)}px)) scale(${scale.toFixed(6)})`;
      card.style.filter=`grayscale(${gray.toFixed(6)}) brightness(${light.toFixed(6)})`;
      card.style.opacity=alpha.toFixed(6);card.style.zIndex=String(z);
    });
  }
  window.Motion={defaults,setConfig,renderAt,getConfig:()=>({...config,images:[...config.images],titles:[...config.titles]})};
  window.Motion.ready=setConfig(defaults());
})();
