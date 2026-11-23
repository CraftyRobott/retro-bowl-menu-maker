/* Retro Bowl Menu Maker — source-backed hierarchy scanner */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const state = { repo: "ReznorsRevenge1/retro-bowl-college", branch: "main", source: "", nodes: [], selected: null, loadedAt: null };
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  const human = s => s.replace(/^gml_(Global)?Script_/, "").replace(/^btn_click_/, "").replace(/^s_/, "").replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());
  const groupFor = n => {
    const s=n.toLowerCase();
    if (/choose|league|team|conference|admission|college/.test(s)) return "Team & League Selection";
    if (/roster|player|profile|freeagent|hire|staff|training|frontoffice|facility|draft/.test(s)) return "Franchise Management";
    if (/schedule|playoff|season|record|hof|halloffame|stats|review/.test(s)) return "Season & Records";
    if (/option|control|sound|weather|difficulty|autorun|scanline|zoom|editor|uniform|kit|helmet|logo/.test(s)) return "Options & Customization";
    if (/pause|resume|play|kick|pass|run|audible|timeout|match|game/.test(s)) return "Game & Match";
    if (/continue|home|back|details|menu|title|newgame|reject/.test(s)) return "Main Navigation";
    return "Other Game Actions";
  };
  function setStatus(msg, bad) { const el=$("sourceStatus"); if(el){el.textContent=msg;el.style.color=bad?"#ff9c9c":"#9aa7b7";} }
  function addNode(parent, id, label, kind, detail, children) { return {id,parent,label,kind,detail,children:children||[]}; }
  function scan(source) {
    const fnRe=/function\s+([A-Za-z_$][\w$]*)\s*\(/g, names=new Set(); let m;
    while((m=fnRe.exec(source))) names.add(m[1]);
    const clickNames=[...names].filter(n=>/^gml_(?:Global)?Script_btn_click_/.test(n));
    const clickGroups={};
    clickNames.forEach(n=>{const label=n.replace(/^gml_(?:Global)?Script_btn_click_/,"");const g=groupFor(label);(clickGroups[g]||(clickGroups[g]=[])).push(addNode("","action:"+label,human(label),"button","Callback: "+n));});
    const screenNames=[...names].filter(n=>/^gml_(?:Global)?Script_/.test(n) && /(?:draw_gui|set_up_.*screen|title_(?:create|goto)|debug_room_init|goto_room|init_rm|create_title|destroy_rm)/i.test(n));
    const builderNames=new Set();
    clickNames.forEach(n=>{
      const start=source.indexOf("function "+n+"(");
      if(start<0)return;
      const next=source.indexOf("\nfunction ",start+10);
      const body=source.slice(start,next<0?Math.min(source.length,start+18000):next);
      const refs=body.match(/gml_(?:Global)?Script_s_[A-Za-z0-9_$]+/g)||[];
      refs.forEach(ref=>{if(/(?:room|title|screen|league|team|menu|init|create|setup|set_up)/i.test(ref))builderNames.add(ref);});
    });
    const uniqueScreens=[...new Set(screenNames)].sort();
    const screenGroups={};
    uniqueScreens.forEach(n=>{
      let g="Other Screens";
      if(/title|debug_room_init/.test(n))g="Startup & Title";
      else if(/college|league|team|choose/.test(n))g="College & Team Screens";
      else if(/hof|record|season|schedule|playoff/.test(n))g="Season & History Screens";
      else if(/edit|uniform|profile/.test(n))g="Editor & Profile Screens";
      else if(/pause|match|game/.test(n))g="In-game Screens";
      else if(/screen/.test(n))g="Setup Screens";
      (screenGroups[g]||(screenGroups[g]=[])).push(addNode("","screen:"+n,human(n),"screen","GameMaker function: "+n));
    });
    const builderNodes=[...builderNames].sort().map(n=>addNode("root:builders","builder:"+n,human(n),"screen","Referenced by one or more button callbacks: "+n));
    const roots=[];
    roots.push(addNode(null,"root:builders","Room / screen builders referenced by buttons","folder",builderNodes.length+" referenced functions",builderNodes));
    roots.push(addNode(null,"root:screens","Screen-related functions","folder",uniqueScreens.length+" source functions",Object.entries(screenGroups).sort().map(([g,items])=>addNode("root:screens","screen-group:"+g,g,"folder",items.length+" functions",items))));
    roots.push(addNode(null,"root:actions","Button callbacks","folder",clickNames.length+" source callbacks",Object.entries(clickGroups).sort().map(([g,items])=>addNode("root:actions","action-group:"+g,g,"folder",items.length+" callbacks",items.sort((a,b)=>a.label.localeCompare(b.label))))));
    const roomFns=[...names].filter(n=>/^gml_Object_.*_(?:Create|Step|Draw)_\d+$/.test(n));
    const objectGroups={};
    roomFns.forEach(n=>{const obj=n.replace(/^gml_Object_/,"").replace(/_(?:Create|Step|Draw)_\d+$/,"");(objectGroups[obj]||(objectGroups[obj]=[])).push(n)});
    const objects=Object.entries(objectGroups).filter(([name])=>/button|room|menu|title|controller|panel|text|select/i.test(name)).sort((a,b)=>a[0].localeCompare(b[0])).map(([name,items])=>addNode("root:objects","object:"+name,human(name),"object",items.join("\n")));
    roots.push(addNode(null,"root:objects","Menu-related GameMaker objects","folder",objects.length+" objects",objects));
    return {roots,counts:{functions:names.size,clicks:clickNames.length,screens:uniqueScreens.length,builders:builderNodes.length,objects:objects.length}};
  }
  function flatten(nodes,out=[]){nodes.forEach(n=>{out.push(n);flatten(n.children||[],out)});return out;}
  function renderTree() {
    const host=$("gameHierarchy"); if(!host)return;
    if(!state.nodes.length){host.innerHTML='<div class="empty">Load the source repository to discover its menus, screen functions, button callbacks, and UI objects.</div>';return;}
    function row(n,depth){const open=window.__rbmmOpenGroups?.has(n.id)??(depth<2);const has=n.children&&n.children.length;return '<div class="tree-row '+(state.selected===n.id?'chosen':'')+'" style="--depth:'+depth+'" data-node="'+esc(n.id)+'"><span class="tree-toggle">'+(has?(open?'▾':'▸'):'')+'</span><span class="tree-icon">'+(n.kind==='folder'?'▰':n.kind==='button'?'▱':n.kind==='object'?'▦':'▣')+'</span><span class="tree-label">'+esc(n.label)+'</span><span class="tree-count">'+(has?n.children.length:'')+'</span></div>'+(has&&open?n.children.map(c=>row(c,depth+1)).join(''):'');}
    host.innerHTML=state.nodes.map(n=>row(n,0)).join("");
    host.querySelectorAll(".tree-row").forEach(el=>el.addEventListener("click",()=>{const id=el.dataset.node;const node=flatten(state.nodes).find(n=>n.id===id);if(!node)return;if(node.children?.length){window.__rbmmOpenGroups=window.__rbmmOpenGroups||new Set();window.__rbmmOpenGroups.has(id)?window.__rbmmOpenGroups.delete(id):window.__rbmmOpenGroups.add(id);renderTree();}state.selected=id;renderTree();renderDetail(node);}));
  }
  function renderDetail(n) {
    const box=$("hierarchyDetails");if(!box)return;
    box.innerHTML='<div class="detail-kind">'+esc(n.kind.toUpperCase())+'</div><h3>'+esc(n.label)+'</h3><p>'+esc(n.detail||"Discovered from the game's JavaScript source.")+'</p><div class="detail-meta">ID: <code>'+esc(n.id)+'</code></div>'+(n.kind==="screen"?'<button id="makeMenuFromNode" class="primary" style="margin-top:12px">＋ Create editable menu workspace</button>':'');
    const b=$("makeMenuFromNode");if(b)b.onclick=()=>{if(!window.RetroBowlMenuMaker){alert("Editor is not ready.");return;}const p=window.RetroBowlMenuMaker.project;const name=n.label+" (source)";if(!p.menus.some(m=>m.name===name)){p.menus.push({id:"source_"+Date.now(),name,background:"#e8e8e8",scroll:false,elements:[],sourceFunction:n.detail.replace(/^GameMaker function: /,"")});}window.RetroBowlMenuMaker.refresh?.();alert("Created an editable workspace. Source layout still needs runtime capture; this creates the editing canvas, not a pixel-perfect extraction.");};
  }
  async function loadSource(){
    const repo=($("sourceRepo")?.value||state.repo).trim().replace(/^https?:\/\/github\.com\//,"").replace(/\.git$/,"");
    const branch=($("sourceBranch")?.value||"main").trim()||"main";
    if(!/^[\w.-]+\/[\w.-]+$/.test(repo)){setStatus("Enter owner/repository.",true);return;}
    state.repo=repo;state.branch=branch;
    const btn=$("loadGameSource");if(btn){btn.disabled=true;btn.textContent="Scanning…";}
    setStatus("Fetching "+repo+" @ "+branch+" …");
    try{
      const url="https://raw.githubusercontent.com/"+repo+"/"+encodeURIComponent(branch)+"/html5game/RetroBowl.js";
      const response=await fetch(url,{cache:"no-store"});
      if(!response.ok)throw new Error("Could not fetch html5game/RetroBowl.js (HTTP "+response.status+"). Check repository and branch.");
      const source=await response.text();
      if(source.length<100000||!source.includes("GameMaker_Init"))throw new Error("The downloaded file does not look like the expected GameMaker game script.");
      const result=scan(source);state.nodes=result.roots;state.loadedAt=new Date();
      window.__rbmmOpenGroups=new Set(["root:screens","root:actions","root:objects"]);
      renderTree();
      $("hierarchySummary").textContent=result.counts.functions.toLocaleString()+" functions · "+result.counts.screens+" screen-related functions · "+result.counts.builders+" room builders · "+result.counts.clicks+" button callbacks · "+result.counts.objects+" UI objects";
      setStatus("Source scanned successfully · "+(source.length/1048576).toFixed(1)+" MB");
      renderDetail(addNode(null,"loaded","Source analysis complete","info","Repository: "+repo+"\nBranch: "+branch+"\nEntry: html5game/RetroBowl.js\nFunctions: "+result.counts.functions+"\nButton callbacks: "+result.counts.clicks));
    }catch(err){setStatus(err.message,true);$("hierarchySummary").textContent="Source scan failed";console.error("[Menu Maker]",err);}
    finally{if(btn){btn.disabled=false;btn.textContent="Load / rescan source";}}
  }
  function init(){
    if(!$("gameHierarchy"))return;
    $("sourceRepo").value=state.repo;$("sourceBranch").value=state.branch;
    $("loadGameSource").addEventListener("click",loadSource);
    $("sourceBranch").addEventListener("keydown",e=>{if(e.key==="Enter")loadSource();});
    $("sourceRepo").addEventListener("keydown",e=>{if(e.key==="Enter")loadSource();});
    renderTree();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
  window.RetroBowlMenuHierarchy={load:loadSource,getTree:()=>state.nodes};
})();