const VERSION='20260829-bg-persistence1';
const STORAGE_KEY='migrandia_distribucion_background_v1';
const MIGRATION_KEY='migrandia_distribucion_background_visibility_migration_v1';
const XLink='http://www.w3.org/1999/xlink';
const bound=new WeakMap();

function isDistribution(doc){
  return Boolean(doc?.getElementById('planner')&&doc.getElementById('bgImage')&&doc.getElementById('toggleBg')&&doc.getElementById('proposalModal'));
}

function activeProposal(win){
  try{return win.localStorage.getItem('eventPlannerActiveProposalIdV1')||'__default__'}catch(_){return'__default__'}
}

function readMap(win,key){
  try{const value=JSON.parse(win.localStorage.getItem(key)||'{}');return value&&typeof value==='object'?value:{}}catch(_){return{}}
}

function writeMap(win,key,value){
  try{win.localStorage.setItem(key,JSON.stringify(value))}catch(_){}
}

function imageSource(image){
  if(!image)return'';
  return String(
    image.getAttribute('href')||
    image.getAttributeNS?.(XLink,'href')||
    image.getAttribute('xlink:href')||
    image.getAttribute('src')||
    image.href?.baseVal||
    image.dataset?.src||''
  ).trim();
}

function setImageSource(image,src){
  if(!image||!src)return;
  image.setAttribute('href',src);
  try{image.setAttributeNS(XLink,'xlink:href',src)}catch(_){}
  if(image.hasAttribute('src'))image.setAttribute('src',src);
}

function remember(win,proposal,image){
  const src=imageSource(image);
  if(!src)return'';
  const map=readMap(win,STORAGE_KEY);
  if(map[proposal]!==src){map[proposal]=src;writeMap(win,STORAGE_KEY,map)}
  return src;
}

function restore(win,proposal,image){
  const current=imageSource(image);
  if(current)return current;
  const saved=readMap(win,STORAGE_KEY)[proposal]||'';
  if(saved)setImageSource(image,saved);
  return saved;
}

function migrateVisibleOnce(win,proposal,doc,image,toggle){
  const migration=readMap(win,MIGRATION_KEY);
  if(migration[proposal])return;
  const src=imageSource(image);
  if(!src)return;
  migration[proposal]=VERSION;
  writeMap(win,MIGRATION_KEY,migration);
  const opacity=Number(image.getAttribute('opacity')??1);
  const asksToShow=/mostrar\s+plano/i.test(String(toggle.textContent||''));
  if(opacity===0||asksToShow){
    try{toggle.click()}catch(_){
      image.setAttribute('opacity','1');
      toggle.textContent='Ocultar plano';
    }
  }
}

function bind(frame){
  if(!(frame instanceof HTMLIFrameElement))return;
  let doc,win;
  try{doc=frame.contentDocument;win=frame.contentWindow}catch(_){return}
  if(!isDistribution(doc)||!win)return;
  const previous=bound.get(frame);
  if(previous?.doc===doc)return;
  if(previous?.timer)clearInterval(previous.timer);

  const state={doc,proposal:'',timer:0};
  bound.set(frame,state);

  const sync=()=>{
    if(!frame.isConnected){clearInterval(state.timer);return}
    const image=doc.getElementById('bgImage');
    const toggle=doc.getElementById('toggleBg');
    if(!image||!toggle)return;
    const proposal=activeProposal(win);
    if(proposal!==state.proposal)state.proposal=proposal;
    restore(win,proposal,image);
    remember(win,proposal,image);
    migrateVisibleOnce(win,proposal,doc,image,toggle);
  };

  doc.addEventListener('click',(event)=>{
    if(event.target?.closest?.('#toggleBg'))setTimeout(sync,0);
  },true);
  doc.addEventListener('change',()=>setTimeout(sync,0),true);
  state.timer=setInterval(sync,900);
  sync();
}

function scan(){
  document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach((frame)=>{
    if(frame.dataset.mgdDistBgLoad!==VERSION){
      frame.dataset.mgdDistBgLoad=VERSION;
      frame.addEventListener('load',()=>setTimeout(()=>bind(frame),40));
    }
    bind(frame);
  });
}

function start(){
  const workspace=document.getElementById('unifiedWorkspace');
  if(!workspace)return;
  new MutationObserver(scan).observe(workspace,{childList:true});
  scan();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
else start();

window.MiGranDiaDistributionBackgroundPersistence=Object.freeze({version:VERSION,scan});
