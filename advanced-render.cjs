const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const {chromium,executablePath}=require('./browser-runtime.cjs')();
const folder=path.resolve(process.argv[2]),port=Number(process.argv[3]),bundle=JSON.parse(fs.readFileSync(path.join(folder,'config.json'))),engine=bundle.engine,config=bundle.config,params=engine==='studies'?config.settings:config;
const jobPath=path.join(folder,'job.json'),job=JSON.parse(fs.readFileSync(jobPath));
function persist(){fs.writeFileSync(jobPath+'.tmp',JSON.stringify(job,null,2));fs.renameSync(jobPath+'.tmp',jobPath);}
(async()=>{const width=engine!=='studies'&&config.aspect==='16:9'?1280:720,height=engine==='basic'?(config.aspect==='16:9'?720:1280):engine==='orbit'?(config.aspect==='16:9'?720:config.aspect==='9:16'?1280:960):1280;let browser;
 try{job.status='rendering';persist();fs.mkdirSync(path.join(folder,'frames'),{recursive:true});
  browser=await chromium.launch({executablePath,headless:true});const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});
  const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${port}`+(engine==='basic'?'/advanced/basic-render.html':engine==='orbit'?'/advanced/orbit/render.html':'/advanced/animations/'+config.kind+'/index.html'));await p.evaluate(async c=>{await (window.Orbit||window.Motion).setConfig(c);await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode()));},params);
  for(let i=0;i<job.total;i++){
   await p.evaluate(async t=>{(window.Orbit||window.Motion).renderAt(t);await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));},i/30);
   await p.screenshot({path:path.join(folder,'frames',String(i).padStart(4,'0')+'.png')});job.frames=i+1;if(i%10===0)persist();
  }
  if(errors.length)throw Error(errors.join(';'));job.status='encoding';persist();await browser.close();browser=null;
  const out=path.join(folder,'animation.mp4');execFileSync('ffmpeg',['-v','error','-y','-framerate','30','-i',path.join(folder,'frames/%04d.png'),'-c:v','libx264','-crf','18','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',out],{timeout:180000});
  const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-count_frames','-show_streams','-show_format','-of','json',out]));const s=probe.streams[0];if(s.width!==width||s.height!==height||Number(s.nb_read_frames)!==job.total)throw Error('输出尺寸或帧数校验失败');
  Object.assign(job,{status:'done',width,height,duration:Number(probe.format.duration),url:'/data/advanced-exports/'+job.id+'/animation.mp4',sha256:require('crypto').createHash('sha256').update(fs.readFileSync(out)).digest('hex'),browserErrors:errors});persist();console.log(JSON.stringify(job));
 }finally{if(browser)await browser.close();}
})().catch(e=>{job.status='failed';job.error=e.message;persist();console.error(e);process.exit(1);});
