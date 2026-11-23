/* Retro Bowl Menu Maker — instrumented GameMaker runtime capture */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const capture = { repo:"", branch:"", startedAt:null, lastUpdate:null, room:"", events:[], texts:[], sprites:[], objects:[], clicks:[] };
  const cap = (arr, item, max=350) => { arr.push(item); if (arr.length>max) arr.splice(0, arr.length-max); };
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  function render() {
    $("runtimeStatus").textContent = capture.room
      ? "Current room: " + capture.room + " · " + capture.events.length + " events · " + capture.texts.length + " text calls · " + capture.objects.length + " created objects"
      : "Game booting… captured " + capture.events.length + " events so far.";
    $("runtimeEvents").textContent = capture.events.slice(-35).map(e => "["+e.time+"] "+e.type+": "+e.label).join("\n") || "No events captured yet.";
    $("runtimeText").textContent = capture.texts.slice(-70).map(e => "["+e.x+","+e.y+"] "+e.text).join("\n") || "No text captured yet.";
    $("runtimeObjects").textContent = capture.objects.slice(-60).map(e => e.name+" @ "+e.x+","+e.y+" · "+(e.vars||[]).join(", ")).join("\n") || "No objects captured yet.";
  }
  function merge(data) {
    if (!data || typeof data !== "object") return;
    capture.lastUpdate = new Date().toISOString();
    if (data.room) capture.room = data.room;
    ["events","texts","sprites","objects","clicks"].forEach(k => {
      if (Array.isArray(data[k])) capture[k] = data[k].slice(-500);
    });
    render();
  }
  function buildDocument(repo, branch) {
    const base = "https://cdn.jsdelivr.net/gh/" + repo + "@" + encodeURIComponent(branch) + "/";
    return `<!doctype html><html><head><meta charset="utf-8"><base href="${base}">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>html,body{margin:0;background:#000;width:100%;height:100%;overflow:hidden}#gm4html5_div_id{width:100%;height:100%;display:flex;align-items:center;justify-content:center}canvas{width:min(100vw,177.7vh);height:auto;max-height:100vh;image-rendering:pixelated;touch-action:none}</style>
</head><body><div id="gm4html5_div_id"><img src="html5game/splash.png" id="GM4HTML5_loadingscreen" style="display:none"><canvas id="canvas" width="853" height="480"><p>Canvas unsupported.</p></canvas></div>
<script>
(function(){
"use strict";
var data={events:[],texts:[],sprites:[],objects:[],clicks:[],room:""},seen={texts:new Set(),sprites:new Set(),objects:new Set()};
var roomName="startup",lastSent=0;
function now(){return new Date().toLocaleTimeString();}
function add(kind,label,extra){data.events.push({time:now(),type:kind,label:String(label||""),extra:extra||null});if(data.events.length>500)data.events.shift();}
function send(){try{data.room=roomName;parent.postMessage({__rbmmCapture:data},"*");}catch(e){}}
function safeName(id){try{if(typeof room_get_name==="function")return String(room_get_name(id));}catch(e){}return String(id);}
function currentRoom(){try{if(typeof g_pBuiltIn!=="undefined"&&g_pBuiltIn&&typeof g_pBuiltIn.get_current_room==="function")return safeName(g_pBuiltIn.get_current_room());}catch(e){}try{if(typeof room!=="undefined")return safeName(room);}catch(e){}return roomName;}
function remember(arr,set,key,item,max){if(set.has(key))return;set.add(key);arr.push(item);if(arr.length>max)arr.shift();}
function wrap(name,handler){try{var original=window[name];if(typeof original!=="function"||original.__rbmmWrapped)return;var wrapped=handler(original);wrapped.__rbmmWrapped=true;window[name]=wrapped;}catch(e){}}
function install(){
window.onerror=function(msg,url,line,col,error){add("error",msg,{url:url,line:line,col:col});send();};
["gml_Script_s_goto_room","gml_Script_s_init_rm","gml_Script_s_create_button","gml_Script_s_create_title"].forEach(function(name){
wrap(name,function(original){return function(){add("game helper",name,{args:Array.prototype.slice.call(arguments,2,6).map(function(v){try{return String(v).slice(0,100)}catch(e){return "?"}})});var result=original.apply(this,arguments);setTimeout(function(){roomName=currentRoom();send();},250);return result;};});
});
wrap("room_goto",function(original){return function(id){var from=currentRoom(),to=safeName(id);add("room change",from+" → "+to,{roomId:id});var result=original.apply(this,arguments);setTimeout(function(){roomName=currentRoom();add("active room",roomName);send();},350);return result;};});
wrap("instance_create_layer",function(original){return function(x,y,layer,obj,vars){var result=original.apply(this,arguments);var name=String(obj);try{if(typeof object_get_name==="function")name=object_get_name(obj)||name;}catch(e){}var keys=[];try{if(vars&&typeof vars==="object")keys=Object.keys(vars).slice(0,20);}catch(e){}var key=roomName+"|"+name+"|"+x+"|"+y;if(seen.objects.size<1200)remember(data.objects,seen.objects,key,{name:name,x:Math.round(Number(x)||0),y:Math.round(Number(y)||0),vars:keys},350);return result;};});
function textWrap(original){return function(x,y,value){var str=String(value==null?"":value);var key=roomName+"|"+x+"|"+y+"|"+str;if(seen.texts.size<2000)remember(data.texts,seen.texts,key,{x:Math.round(Number(x)||0),y:Math.round(Number(y)||0),text:str.slice(0,180)},500);return original.apply(this,arguments);};}
["draw_text","draw_text_ext","draw_text_transformed","draw_text_ext_transformed"].forEach(function(n){wrap(n,textWrap);});
function spriteWrap(original){return function(sprite,sub,x,y){var key=roomName+"|"+sprite+"|"+sub+"|"+x+"|"+y;if(seen.sprites.size<3000)remember(data.sprites,seen.sprites,key,{sprite:String(sprite),subimage:String(sub),x:Math.round(Number(x)||0),y:Math.round(Number(y)||0)},500);return original.apply(this,arguments);};}
["draw_sprite","draw_sprite_ext","draw_sprite_stretched","draw_sprite_stretched_ext"].forEach(function(n){wrap(n,spriteWrap);});
Object.getOwnPropertyNames(window).filter(function(n){return /^gml_(?:Global)?Script_btn_click_/.test(n);}).forEach(function(n){wrap(n,function(original){return function(){add("button callback",n,{room:currentRoom()});var r=original.apply(this,arguments);send();return r;};});});
var canvas=document.getElementById("canvas");if(canvas)canvas.addEventListener("pointerdown",function(ev){var r=canvas.getBoundingClientRect();var x=Math.round((ev.clientX-r.left)*853/r.width),y=Math.round((ev.clientY-r.top)*480/r.height);data.clicks.push({time:now(),x:x,y:y,room:currentRoom()});if(data.clicks.length>150)data.clicks.shift();add("pointer",x+","+y,{room:currentRoom()});send();},true);
roomName=currentRoom();add("runtime ready","Instrumentation installed; waiting for page load");send();
setInterval(function(){roomName=currentRoom();send();},1000);
window.addEventListener("load",function(){
  add("page load","All game scripts and the document load event completed");
  if(typeof GameMaker_Init==="function"){
    try{GameMaker_Init();add("boot","GameMaker_Init called using the original no-Poki startup sequence");}
    catch(e){add("boot exception",e&&e.stack?e.stack:String(e));}
  }else{add("boot error","GameMaker_Init was not found after RetroBowl.js loaded");}
  send();
},{once:true});
}
window.__rbmmBoot=install;
window.__rbmmFail=function(url){parent.postMessage({__rbmmCapture:{events:[{time:now(),type:"load error",label:"Could not load RetroBowl.js from either CDN",extra:{attempted:url||"unknown",fallback:"https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/html5game/RetroBowl.js"}}],room:"load failed"}}, "*");};
})();
</script>
<script>
window.PokiSDK={
 init:function(){return Promise.resolve();},
 gameplayStart:function(){},gameplayStop:function(){},happyTime:function(){},
 commercialBreak:function(){return Promise.resolve();},
 rewardedBreak:function(){return Promise.resolve();},
 gameLoadingStart:function(){},gameLoadingProgress:function(){},gameLoadingFinished:function(){},
 getURLParam:function(){return null;},setDebug:function(){}
};
window.PokiSDK_OK=true;window.PokiSDK_loadState=2;
</script>
<script>\n(function(){var primary="https://cdn.jsdelivr.net/gh/${repo}@${encodeURIComponent(branch)}/html5game/RetroBowl.js";var fallback="https://raw.githubusercontent.com/${repo}/${encodeURIComponent(branch)}/html5game/RetroBowl.js";var s=document.createElement("script");s.src=primary;s.onload=function(){window.__rbmmBoot();};s.onerror=function(){var first=s.src;s.remove();var f=document.createElement("script");f.src=fallback;f.onload=function(){window.__rbmmBoot();};f.onerror=function(){window.__rbmmFail(first+" and "+f.src);};document.body.appendChild(f);};document.body.appendChild(s);})();\n</script>
</body></html>`;
  }
  function launch() {
    const repo = ($("sourceRepo").value || "ReznorsRevenge1/retro-bowl-college").trim().replace(/^https?:\/\/github\.com\//,"").replace(/\.git$/,"");
    const branch = ($("sourceBranch").value || "main").trim() || "main";
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { alert("Enter a valid owner/repository."); return; }
    capture.repo=repo;capture.branch=branch;capture.startedAt=new Date().toISOString();
    capture.events=[];capture.texts=[];capture.sprites=[];capture.objects=[];capture.clicks=[];capture.room="";
    $("runtimeModal").style.display="block";
    $("runtimeFrame").srcdoc=buildDocument(repo,branch);
    render();
  }
  function close(){ $("runtimeModal").style.display="none"; $("runtimeFrame").srcdoc=""; }
  function exportCapture(){
    const blob=new Blob([JSON.stringify(capture,null,2)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="retro-bowl-runtime-capture.json";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }
  function init(){
    $("runtimeBtn").addEventListener("click",launch);
    $("runtimeReload").addEventListener("click",launch);
    $("runtimeClose").addEventListener("click",close);
    $("runtimeExport").addEventListener("click",exportCapture);
    window.addEventListener("message",ev=>{if(ev.source!==$("runtimeFrame").contentWindow)return;if(ev.data&&ev.data.__rbmmCapture)merge(ev.data.__rbmmCapture);});
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();
