/* Dashboard de portada · solo lectura/presentación.
   Nunca persiste ni modifica datos. Los valores reales se publican por boda activa
   mediante migrandia:dashboard-data; auth/context controlan aislamiento y limpieza. */
(() => {
'use strict';
const root=()=>document.getElementById('homeDashboard');
let uid='',weddingId='',epoch=0;
const GUEST_STORAGE_KEY='planificador_bodas_invitados_v1';
const $=id=>document.getElementById(id);
const n=v=>Number.isFinite(Number(v))?Number(v):0;
const pct=(a,b)=>b>0?Math.max(0,Math.min(100,Math.round(a*100/b))):0;
const money=v=>Number.isFinite(Number(v))?new Intl.NumberFormat('es-PE',{style:'currency',currency:'PEN',maximumFractionDigits:0}).format(Number(v)):'—';
function set(id,value){const el=$(id);if(el)el.textContent=value}
function ring(id,value){const el=$(id);if(el)el.style.setProperty('--p',String(Math.max(0,Math.min(100,n(value)))))}
function clear(){
 epoch++; weddingId='';
 ['dashGuestsRatio','dashGuestsPercent','dashGuestsConfirmed','dashGuestsPending','dashChecklistRatio','dashChecklistPercent','dashChecklistDone','dashChecklistPending','dashTimelineRatio','dashTimelinePercent','dashNextMilestone','dashNextDate','dashBudgetPaid','dashBudgetTotal','dashBudgetBalance','dashBudgetPercent','dashTablesRatio','dashPeoplePlaced','dashPlacedOf'].forEach(id=>set(id,'—'));
 ['dashGuestsRing','dashChecklistRing','dashTimelineRing','dashBudgetRing'].forEach(id=>ring(id,0));
 const p=$('dashBudgetProgress');if(p)p.style.width='0';
 const list=$('dashTablesList');if(list)list.innerHTML='<div class="home-empty">Cargando datos de esta boda…</div>';
 root()?.setAttribute('data-wedding-id','');
}
function visibility(){
 const r=root();if(!r)return;
 const authenticated=Boolean(window.WeddingPlannerAuthGuard?.authenticated);
 const home=!document.body.classList.contains('module-view');
 const menu=document.body.classList.contains('menu-open');
 const ready=authenticated&&home&&menu&&Boolean(weddingId);
 r.setAttribute('aria-hidden',ready?'false':'true');
}
function guestTotal(){try{const raw=localStorage.getItem(GUEST_STORAGE_KEY);const state=raw?JSON.parse(raw):{};return Array.isArray(state?.guests)?state.guests.length:0}catch(_){return 0}}
function renderGuestTotal(){if(!uid||!weddingId)return;const total=guestTotal();set('dashGuestsRatio',String(total));set('dashGuestsConfirmed','—');set('dashGuestsPending','—');set('dashGuestsPercent','—');ring('dashGuestsRing',0)}
function render(d={}){
 if(!uid||!weddingId)return;
 if(d.weddingId&&String(d.weddingId)!==weddingId)return;
 if(d.uid&&String(d.uid)!==uid)return;
 const g=d.guests||{},c=d.checklist||{},t=d.timeline||{},b=d.budget||{},dist=d.distribution||{};
 const gt=n(g.total),gc=n(g.confirmed),gp=Math.max(0,gt-gc),gpc=pct(gc,gt);
 set('dashGuestsRatio',`${gc} / ${gt}`);set('dashGuestsConfirmed',gc);set('dashGuestsPending',gp);set('dashGuestsPercent',gpc+'%');ring('dashGuestsRing',gpc);
 const ct=n(c.total),cd=n(c.completed),cp=Math.max(0,ct-cd),cpc=pct(cd,ct);
 set('dashChecklistRatio',`${cd} / ${ct}`);set('dashChecklistDone',cd);set('dashChecklistPending',cp);set('dashChecklistPercent',cpc+'%');ring('dashChecklistRing',cpc);
 const tt=n(t.total),td=n(t.completed),tpc=pct(td,tt);set('dashTimelineRatio',`${td} / ${tt} hitos`);set('dashTimelinePercent',tpc+'%');ring('dashTimelineRing',tpc);set('dashNextMilestone',t.nextName||'Sin próximo hito');set('dashNextDate',t.nextDate||'—');
 const total=n(b.total),paid=n(b.paid),balance=Math.max(0,total-paid),bpc=pct(paid,total);set('dashBudgetPaid',money(paid));set('dashBudgetTotal',money(total));set('dashBudgetBalance',money(balance));set('dashBudgetPercent',bpc+'%');ring('dashBudgetRing',bpc);const prog=$('dashBudgetProgress');if(prog)prog.style.width=bpc+'%';
 const tables=Array.isArray(dist.tables)?dist.tables:[],occupied=tables.filter(x=>n(x.occupied)>0).length,placed=tables.reduce((s,x)=>s+n(x.occupied),0);set('dashTablesRatio',`${occupied} / ${tables.length} ubicadas`);set('dashPeoplePlaced',placed);set('dashPlacedOf',`de ${gc} confirmadas`);
 const list=$('dashTablesList');if(list)list.innerHTML=tables.length?tables.map((x,i)=>{const o=n(x.occupied),cap=n(x.capacity);return `<div class="home-mini-table ${cap>0&&o>=cap?'full':''}"><i>${o}/${cap||'—'}</i><span>${String(x.name||('M'+(i+1))).replace(/[<>&]/g,'')}</span></div>`}).join(''):'<div class="home-empty">Sin datos de distribución</div>';
 visibility();
}
function context(detail){
 const next=String(detail?.id||''); if(next===weddingId)return;
 clear(); weddingId=next; root()?.setAttribute('data-wedding-id',weddingId); visibility();
 if(weddingId){renderGuestTotal();window.dispatchEvent(new CustomEvent('migrandia:dashboard-request',{detail:{uid,weddingId,epoch}}));}
}
window.addEventListener('migrandia:auth',e=>{const d=e.detail||{};if(d.authenticated!==true){uid='';clear();visibility();return}const next=String(d.uid||'');if(next!==uid){uid=next;clear()}context(window.WeddingPlannerWeddingContext||{});visibility()});
window.addEventListener('migrandia:wedding-context',e=>context(e.detail||{}));
window.addEventListener('migrandia:dashboard-data',e=>render(e.detail||{}));
window.addEventListener('migrandia:datachange',()=>{if(uid&&weddingId){renderGuestTotal();window.dispatchEvent(new CustomEvent('migrandia:dashboard-request',{detail:{uid,weddingId,epoch}}))}});
window.addEventListener('hashchange',visibility);new MutationObserver(visibility).observe(document.body,{attributes:true,attributeFilter:['class']});
document.addEventListener('DOMContentLoaded',()=>{clear();context(window.WeddingPlannerWeddingContext||{});visibility()},{once:true});
})();
