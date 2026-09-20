const fs=require('fs'),path=require('path');
function runtime(root=__dirname){
 let pw;try{pw=require(path.join(root,'.runtime','node_modules','playwright'));}catch{throw Error('缺少高级渲染组件。请运行 python3 scripts/setup-advanced.py');}
 const candidates=[process.env.ANIMATION_CARD_BROWSER,'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',process.env.PROGRAMFILES&&path.join(process.env.PROGRAMFILES,'Google/Chrome/Application/chrome.exe'),process.env.LOCALAPPDATA&&path.join(process.env.LOCALAPPDATA,'Google/Chrome/Application/chrome.exe'),'/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser',pw.chromium.executablePath()].filter(Boolean);
 const executablePath=candidates.find(p=>fs.existsSync(p));if(!executablePath)throw Error('未找到渲染浏览器，请运行 python3 scripts/setup-advanced.py 安装 Chromium，或设置 ANIMATION_CARD_BROWSER。');
 return {chromium:pw.chromium,executablePath};
}
module.exports=runtime;if(require.main===module){try{runtime();console.log(JSON.stringify({ready:true}));}catch(e){console.log(JSON.stringify({ready:false,message:e.message}));}}
