export const moduleId='distribucion';
const V='20260817-1535-link2';
const GK='planificador_bodas_invitados_v1';
const SK='planificador_bodas_datos_compartidos_v1';
const LK='migrandia_distribucion_invitados_link_v1';
const DB='AntonioEventPlannerMemory', PS='proposals', MS='meta';
const LM='eventPlannerProposalMemoryV1', AK='eventPlannerActiveProposalIdV1';
const MAX=16, ctl=new WeakMap();
let obs=null, lock=false, extTimer=0;
const cp=v=>{try{return structuredClone(v)}catch(_){return JSON.parse(JSON.stringify(v))}};
const id=p=>`${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2,8)}`;
const txt=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toLowerCase();
const cap=(v,hi=0)=>hi>MAX?Math.max(Number(v)||10,hi):Math.min(MAX,Math.max(1,Math.round(Number(v)||10),hi));
const seats=(old,n)=>Array.from({length:n},(_,i)=>({...((old||[])[i]||{}),id:(old||[])[i]?.id||id('seat'),index:i}));
function norm(x={}){
 const d={...x,guests:Array.isArray(x.guests)?x.guests.map(g=>({...g})):[],tables:Array.isArray(x.tables)?x.tables.map(t=>({...t})):[]};
 const hi=new Map(); d.guests.forEach(g=>{const n=Number(g.seatNumber);if(g.tableId&&Number.isInteger(n)&&n>0)hi.set(String(g.tableId),Math.max(hi.get(String(g.tableId))||0,n))});
 d.tables=d.tables.map((t,i)=>{const n=cap(t.capacity||t.seats?.length||10,hi.get(String(t.id))||0);return{...t,id:t.id||id('table'),name:String(t.name||`Mesa ${i+1}`).trim()||`Mesa ${i+1}`,type:['round','square','rectangular'].includes(String(t.type||'').toLowerCase())?String(t.type).toLowerCase():'round',capacity:n,seats:seats(t.seats,n)}});
 const tm=new Map(d.tables.map(t=>[String(t.id),t])), used=new Map();
 d.guests=d.guests.map(g=>{const z={...g},t=z.tableId?tm.get(String(z.tableId)):null;if(!t){z.tableId='';z.seatId='';z.seatNumber=null;return z}const k=String(t.id);if(!used.has(k))used.set(k,new Set());const u=used.get(k);let s=Number(z.seatNumber)-1;if(!Number.isInteger(s)||s<0||s>=t.capacity||u.has(s))s=t.seats.findIndex((_,i)=>!u.has(i));if(s<0){z.tableId='';z.seatId='';z.seatNumber=null;return z}u.add(s);z.tableId=t.id;z.seatNumber=s+1;z.seatId=t.seats[s].id;return z});
 return d;
}
function read(){try{return norm(JSON.parse(localStorage.getItem(GK)||'{}'))}catch(_){return norm({})}}
const sig=d=>JSON.stringify({guests:d.guests,tables:d.tables});
function shared(d,source){return{version:4,updatedAt:new Date().toISOString(),source,guests:d.guests.map(g=>({id:g.id,name:g.name,status:g.status,invitationSent:!!g.invitationSent,side:g.side||'ambos',relation:g.relation||'',restriction:g.restriction||'Ninguna',tableId:g.tableId||'',seatId:g.seatId||'',seatNumber:g.seatNumber??null,photoId:g.photoId||'',photoThumb:g.photoThumb||'',notes:g.notes||'',rsvpResponseId:g.rsvpResponseId||'',rsvpResponseName:g.rsvpResponseName||'',rsvpGroup:g.rsvpGroup||'',rsvpFamilyLabel:g.rsvpFamilyLabel||'',rsvpTags:Array.isArray(g.rsvpTags)?g.rsvpTags:[]})),tables:d.tables.map(t=>({...t,guestIds:d.guests.filter(g=>String(g.tableId||'')===String(t.id)).sort((a,b)=>(a.seatNumber||999)-(b.seatNumber||999)).map(g=>g.id)}))}}
function save(x,source='distribucion-link'){
 const d=norm(x), old=read(); if(sig(d)===sig(old))return old; lock=true;
 try{localStorage.setItem(GK,JSON.stringify(d));localStorage.setItem(SK,JSON.stringify(shared(d,source)));document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach(f=>{try{if(f.contentDocument?.getElementById('guestList'))f.contentWindow.postMessage({type:'MIGRANDIA_RSVP_SYNC',payload:{guests:d.guests,tables:d.tables}},'*')}catch(_){}});window.dispatchEvent(new CustomEvent('migrandia:datachange',{detail:{source,guests:d.guests.length,tables:d.tables.length}}))}finally{queueMicrotask(()=>lock=false)} return d;
}
function lread(){try{const x=JSON.parse(localStorage.getItem(LK)||'{}');return{guestIds:x.guestIds||{},proposals:x.proposals||{}}}catch(_){return{guestIds:{},proposals:{}}}}
function lsave(x){try{localStorage.setItem(LK,JSON.stringify({version:1,guestIds:x.guestIds||{},proposals:x.proposals||{}}))}catch(_){}}
function pe(l,p){return l.proposals[p]||(l.proposals[p]={initialized:false,ready:false,tables:{}})}
function guestMap(d,s,l){
 const valid=new Set(d.guests.map(g=>String(g.id))), used=new Set();
 d.guests.forEach(g=>{const k=String(g.id),n=Number(l.guestIds[k]);if(!Number.isFinite(n)||n<=0||used.has(n))delete l.guestIds[k];else used.add(n)});
 const bucket=new Map();d.guests.forEach(g=>{const k=txt(g.name);if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(String(g.id))});
 (s.guests||[]).forEach(g=>{const n=Number(g.id),src=g.sourceGuestId?String(g.sourceGuestId):'';if(Number.isFinite(n)&&src&&valid.has(src)&&!used.has(n)&&!Number.isFinite(Number(l.guestIds[src]))){l.guestIds[src]=n;used.add(n)}});
 (s.guests||[]).forEach(g=>{const n=Number(g.id);if(!Number.isFinite(n)||used.has(n))return;const a=(bucket.get(txt(g.name))||[]).filter(k=>!Number.isFinite(Number(l.guestIds[k])));if(a.length){l.guestIds[a[0]]=n;used.add(n)}});
 let n=Math.max(100000,...used,99999)+1;d.guests.forEach(g=>{const k=String(g.id);if(Number.isFinite(Number(l.guestIds[k])))return;while(used.has(n))n++;l.guestIds[k]=n;used.add(n++)});
 return new Map(d.guests.map(g=>[Number(l.guestIds[String(g.id)]),String(g.id)]));
}
const lt=s=>(s.elements||[]).filter(e=>e?.type==='table');
function nextE(s){return Math.max(Number(s.uid)||1,...(s.elements||[]).map(e=>Number(e.id)||0))+1}
function newLegacy(t,s,i){const n=cap(t.capacity||10),eid=nextE(s),e={id:eid,type:'table',label:t.name||`Mesa ${i+1}`,x:720+(i%4)*220,y:360+Math.floor(i/4)*220,widthM:3.4,heightM:3.4,rotation:Number(t.rotation)||0,capacity:n,color:'#d9b978',shape:'table',locked:false,seats:Array(n).fill(null),sharedTableId:String(t.id),sharedTableType:t.type||'round'};(s.elements||(s.elements=[])).push(e);s.uid=Math.max(Number(s.uid)||1,eid+1);return e}
function newCanon(e,d){const hi=(e.seats||[]).reduce((m,v,i)=>v!==null&&v!==''&&v!==undefined?Math.max(m,i+1):m,0),n=cap(e.capacity||e.seats?.length||10,hi);let name=String(e.label||'').trim();if(!name||/^mesa\s+\d+\s+personas$/i.test(name)){let i=1,u=new Set(d.tables.map(t=>txt(t.name)));while(u.has(txt(`Mesa ${i}`)))i++;name=`Mesa ${i}`}return{id:id('table'),name,type:'round',capacity:n,seats:seats([],n),rotation:Number(e.rotation)||0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}}
function mapTables(d,s,p,mode='union'){
 if(mode!=='union'){
  Object.entries({...p.tables}).forEach(([c,e])=>{
   const hasC=d.tables.some(t=>String(t.id)===String(c));
   const hasL=lt(s).some(x=>String(x.id)===String(e));
   if(hasC&&hasL)return;
   if(hasC&&!hasL&&mode==='pull'){
    d.guests.forEach(g=>{if(String(g.tableId||'')===String(c)){g.tableId='';g.seatId='';g.seatNumber=null}});
    d.tables=d.tables.filter(t=>String(t.id)!==String(c));
   }else if(!hasC&&hasL&&mode==='push'){
    s.elements=(s.elements||[]).filter(x=>!(x.type==='table'&&String(x.id)===String(e)));
   }else if(!hasC&&hasL&&mode==='pull'){
    /* La mesa sigue en Distribución: se recreará abajo como mesa canónica nueva. */
   }else if(hasC&&!hasL&&mode==='push'){
    /* La mesa sigue en Invitados: se recreará abajo en el plano. */
   }
   delete p.tables[c];
  });
 }
 const cb=new Map(d.tables.map(t=>[String(t.id),t])), lb=new Map(lt(s).map(e=>[String(e.id),e])), uc=new Set(),ul=new Set();
 Object.entries({...p.tables}).forEach(([c,e])=>{if(cb.has(c)&&lb.has(String(e))&&!uc.has(c)&&!ul.has(String(e))){uc.add(c);ul.add(String(e))}else delete p.tables[c]});
 lt(s).forEach(e=>{const c=e.sharedTableId?String(e.sharedTableId):'';if(c&&cb.has(c)&&!uc.has(c)&&!ul.has(String(e.id))){p.tables[c]=Number(e.id);uc.add(c);ul.add(String(e.id))}});
 d.tables.forEach(t=>{if(uc.has(String(t.id)))return;const a=lt(s).filter(e=>!ul.has(String(e.id))&&txt(e.label)===txt(t.name));if(a.length===1){p.tables[String(t.id)]=Number(a[0].id);uc.add(String(t.id));ul.add(String(a[0].id))}});
 const ca=d.tables.filter(t=>!uc.has(String(t.id))), la=lt(s).filter(e=>!ul.has(String(e.id)));for(let i=0;i<Math.min(ca.length,la.length);i++){p.tables[String(ca[i].id)]=Number(la[i].id);uc.add(String(ca[i].id));ul.add(String(la[i].id))}
 if(mode==='pull'||mode==='union')lt(s).forEach(e=>{if(ul.has(String(e.id)))return;const t=newCanon(e,d);d.tables.push(t);p.tables[String(t.id)]=Number(e.id);ul.add(String(e.id))});
 if(mode==='push'||mode==='union')d.tables.forEach((t,i)=>{if(Object.prototype.hasOwnProperty.call(p.tables,String(t.id)))return;const e=newLegacy(t,s,i);p.tables[String(t.id)]=Number(e.id)});
 return p;
}
function pullSnap(s,x,l,pid,initial=false){
 let d=norm(x);const p=pe(l,pid);mapTables(d,s,p,initial?'union':'pull');const rev=guestMap(d,s,l);
 if(p.ready)(s.guests||[]).forEach(g=>{const n=Number(g.id);if(!Number.isFinite(n)||rev.has(n)||!String(g.name||'').trim())return;const same=d.guests.find(x=>txt(x.name)===txt(g.name));if(same){l.guestIds[String(same.id)]=n;rev.set(n,String(same.id));return}const z={id:id('guest'),name:String(g.name).trim(),status:'pending',invitationSent:false,side:'ambos',relation:'',restriction:'Ninguna',tableId:'',seatId:'',seatNumber:null,notes:''};d.guests.push(z);l.guestIds[String(z.id)]=n;rev.set(n,String(z.id))});
 const controlled=new Set(Object.keys(p.tables));d.guests.forEach(g=>{if(controlled.has(String(g.tableId||''))){g.tableId='';g.seatId='';g.seatNumber=null}});
 const cm=new Map(d.tables.map(t=>[String(t.id),t])), assigned=new Set();
 Object.entries(p.tables).forEach(([cid,eid])=>{const e=lt(s).find(x=>String(x.id)===String(eid)),t=cm.get(cid);if(!e||!t)return;const a=e.seats||[],hi=a.reduce((m,v,i)=>v!==null&&v!==''&&v!==undefined?Math.max(m,i+1):m,0),n=cap(e.capacity||a.length||t.capacity,hi),nn=String(e.label||t.name).trim()||t.name;if(nn!==t.name||n!==t.capacity)t.updatedAt=new Date().toISOString();t.name=nn;t.capacity=n;t.seats=seats(t.seats,n);a.forEach((v,i)=>{if(v===null||v===''||v===undefined||i>=n)return;const gid=rev.get(Number(v));if(!gid||assigned.has(gid))return;const g=d.guests.find(q=>String(q.id)===gid);if(!g)return;g.tableId=t.id;g.seatNumber=i+1;g.seatId=t.seats[i].id;assigned.add(gid)})});
 return norm(d);
}
function pushSnap(s,x,l,pid){
 const d=norm(x),p=pe(l,pid);mapTables(d,s,p,'push');guestMap(d,s,l);s.guests=d.guests.map(g=>({id:Number(l.guestIds[String(g.id)]),name:String(g.name||'Invitado'),sourceGuestId:String(g.id)}));s.guestUid=Math.max(1,...s.guests.map(g=>g.id+1));
 const gm=new Map();d.guests.forEach(g=>{if(!g.tableId)return;const k=String(g.tableId);if(!gm.has(k))gm.set(k,[]);gm.get(k).push(g)});
 d.tables.forEach(t=>{const e=lt(s).find(x=>String(x.id)===String(p.tables[String(t.id)]));if(!e)return;const n=cap(t.capacity||10);e.type='table';e.shape='table';e.label=t.name||e.label;e.capacity=n;e.sharedTableId=String(t.id);e.sharedTableType=t.type||'round';e.seats=Array(n).fill(null);(gm.get(String(t.id))||[]).forEach(g=>{const i=Number(g.seatNumber)-1,v=Number(l.guestIds[String(g.id)]);if(Number.isInteger(i)&&i>=0&&i<n&&Number.isFinite(v)&&e.seats[i]===null)e.seats[i]=v})});p.initialized=true;p.ready=true;return s;
}
function openDb(w){return new Promise((ok,no)=>{if(!w?.indexedDB)return no();let r=w.indexedDB.open(DB),up=false;r.onupgradeneeded=()=>{up=true;try{r.transaction.abort()}catch(_){}};r.onsuccess=()=>up?(r.result.close(),no()):ok(r.result);r.onerror=()=>no(r.error)})}
const get=(db,st,k)=>new Promise((ok,no)=>{try{let q=db.transaction(st,'readonly').objectStore(st).get(k);q.onsuccess=()=>ok(q.result||null);q.onerror=()=>no(q.error)}catch(e){no(e)}});
const put=(db,st,v)=>new Promise((ok,no)=>{try{let q=db.transaction(st,'readwrite');q.objectStore(st).put(v);q.oncomplete=ok;q.onerror=()=>no(q.error);q.onabort=()=>no(q.error)}catch(e){no(e)}});
async function planner(w){try{const db=await openDb(w);try{const m=await get(db,MS,'activeProposalId'),aid=m?.value||w.localStorage.getItem(AK),r=aid?await get(db,PS,aid):null;if(r)return{b:'idb',aid:String(aid),r}}finally{db.close()}}catch(_){}try{const m=JSON.parse(w.localStorage.getItem(LM)||'{}'),a=m.activeProposalId||w.localStorage.getItem(AK),r=(m.proposals||[]).find(x=>String(x.id)===String(a))||(m.proposals||[])[0];return{b:'ls',aid:r?String(r.id):String(a||''),r:r||null}}catch(_){return{b:'ls',aid:'',r:null}}}
async function writePlan(w,p,r){const z={...r,updatedAt:new Date().toISOString()};if(p.b==='idb')try{const db=await openDb(w);try{await put(db,PS,z);return z}finally{db.close()}}catch(_){}try{const m=JSON.parse(w.localStorage.getItem(LM)||'{}'),a=Array.isArray(m.proposals)?m.proposals:[],i=a.findIndex(x=>String(x.id)===String(z.id));i>=0?a[i]=z:a.push(z);m.proposals=a;m.activeProposalId=z.id;w.localStorage.setItem(LM,JSON.stringify(m));w.localStorage.setItem(AK,String(z.id));return z}catch(_){return null}}
const proj=r=>JSON.stringify({g:r?.data?.guests||[],t:lt(r?.data||{}).map(e=>({id:e.id,label:e.label,capacity:e.capacity,seats:e.seats,sharedTableId:e.sharedTableId})),uid:r?.data?.uid||0});
async function push(c,reload=true){if(c.busy||!c.frame.isConnected)return; c.busy=true;try{const p=await planner(c.frame.contentWindow);if(!p.r?.data||!p.aid)return;const d=read(),l=lread(),before=proj(p.r),nr=cp(p.r);nr.data=cp(nr.data);pushSnap(nr.data,d,l,p.aid);lsave(l);c.aid=p.aid;if(before!==proj(nr)){const wr=await writePlan(c.frame.contentWindow,p,nr);c.last=wr?.updatedAt||'';if(reload){c.reloading=true;setTimeout(()=>{try{c.frame.contentWindow.location.reload()}catch(_){}},50)}}else c.last=p.r.updatedAt||''}finally{c.busy=false}}
async function pull(c,initial=false){if(c.busy||!c.frame.isConnected)return; c.busy=true;try{const p=await planner(c.frame.contentWindow);if(!p.r?.data||!p.aid)return;const old=read(),l=lread(),d=pullSnap(p.r.data,old,l,p.aid,initial);pe(l,p.aid).initialized=true;lsave(l);if(sig(old)!==sig(d))save(d,initial?'distribucion-migration':'distribucion-seating');c.aid=p.aid;c.last=p.r.updatedAt||''}finally{c.busy=false}}
async function init(c){if(c.init)return;c.init=true;try{let p;for(let i=0;i<15;i++){p=await planner(c.frame.contentWindow);if(p.r?.data&&p.aid)break;await new Promise(r=>setTimeout(r,160))}if(!p?.r?.data)return;let d=read(),l=lread(),x=pe(l,p.aid);if(!x.initialized){const before=sig(d);mapTables(d,p.r.data,x,'union');const rev=guestMap(d,p.r.data,l);let legacy=0;Object.values(x.tables).forEach(eid=>{const e=lt(p.r.data).find(z=>String(z.id)===String(eid));(e?.seats||[]).forEach(v=>{if(rev.has(Number(v)))legacy++})});if(!d.guests.some(g=>g.tableId)&&legacy)d=pullSnap(p.r.data,d,l,p.aid,true);x.initialized=true;lsave(l);if(sig(read())!==sig(d)||before!==sig(d))d=save(d,'distribucion-migration');c.aid=p.aid;await push(c,true);return}c.aid=p.aid;await push(c,true)}finally{c.init=false}}
function seatChange(c,s){const l=lread(),p=pe(l,c.aid||''),eid=String(s.dataset.tableId||''),i=Number(s.dataset.seatIndex),cid=Object.entries(p.tables).find(([,v])=>String(v)===eid)?.[0];if(!cid||!Number.isInteger(i)||i<0)return;let d=read(),t=d.tables.find(x=>String(x.id)===cid);if(!t||i>=t.capacity)return;guestMap(d,{guests:[]},l);const rev=new Map(Object.entries(l.guestIds).map(([g,v])=>[Number(v),g])),gid=s.value===''?'':rev.get(Number(s.value))||'';d.guests.forEach(g=>{const here=String(g.tableId||'')===cid&&Number(g.seatNumber)===i+1,sel=gid&&String(g.id)===gid;if(here&&!sel){g.tableId='';g.seatId='';g.seatNumber=null}if(sel){g.tableId=t.id;g.seatNumber=i+1;g.seatId=t.seats[i].id}});lsave(l);save(d,'distribucion-seat-change')}
async function poll(c){if(!c.frame.isConnected){clearInterval(c.timer);return}if(c.busy||c.init||c.reloading)return;const p=await planner(c.frame.contentWindow);if(!p.r?.data)return;if(c.aid&&String(p.aid)!==String(c.aid)){c.aid=String(p.aid);await pull(c,false);await push(c,true);return}if(String(p.r.updatedAt||'')===String(c.last||''))return;c.last=p.r.updatedAt||'';await pull(c,false);await push(c,true)}
function isDist(d){return!!(d?.getElementById('planner')&&d.getElementById('itemsLayer')&&d.getElementById('seatEditor')&&d.getElementById('proposalModal'))}
function bind(f){if(!(f instanceof HTMLIFrameElement))return;let d;try{d=f.contentDocument}catch(_){return}if(!isDist(d))return;let c=ctl.get(f);if(!c){c={frame:f,aid:'',last:'',busy:false,init:false,reloading:false,timer:0};ctl.set(f,c)}else c.reloading=false;if(d.documentElement.dataset.mgdDistGuestLink!==V){d.documentElement.dataset.mgdDistGuestLink=V;d.addEventListener('change',e=>{const s=e.target?.closest?.('#seatEditor select[data-seat-index]');if(s){seatChange(c,s);setTimeout(()=>poll(c),420)}},true)}clearInterval(c.timer);c.timer=setInterval(()=>poll(c).catch(console.warn),800);init(c).catch(e=>console.warn('Distribución: vínculo con Invitados',e))}
function scan(){document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach(f=>{if(f.dataset.mgdDistGuestLoad!==V){f.dataset.mgdDistGuestLoad=V;f.addEventListener('load',()=>setTimeout(()=>bind(f),40))}bind(f)})}
function external(){clearTimeout(extTimer);extTimer=setTimeout(()=>document.getElementById('unifiedWorkspace')?.querySelectorAll('iframe').forEach(f=>{const c=ctl.get(f);if(c&&!c.reloading)push(c,true)}),120)}
function start(){const w=document.getElementById('unifiedWorkspace');if(!w)return;if(!obs){obs=new MutationObserver(scan);obs.observe(w,{childList:true,subtree:true})}scan()}
window.addEventListener('migrandia:datachange',e=>{if(lock||String(e.detail?.source||'').startsWith('distribucion'))return;external()});
window.addEventListener('storage',e=>{if(e.key===GK||e.key===SK)external()});
window.MiGranDiaDistributionGuestLink=Object.freeze({version:V,syncNow(){scan();external()},readState:read});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
