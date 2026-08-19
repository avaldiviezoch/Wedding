
(() => {
  const svg = document.getElementById('planner');
  const layer = document.getElementById('itemsLayer');
  const drawLayer = document.getElementById('drawLayer');
  const measureLayer = document.getElementById('measureLayer');
  const guideLayer = document.getElementById('guideLayer');
  const btnDrawTent = document.getElementById('btnDrawTent');
  const tentDrawHint = document.getElementById('tentDrawHint');
  const bgImage = document.getElementById('bgImage');
  const gridLayer = document.getElementById('gridLayer');

  const scaleInput = document.getElementById('scaleInput');
  const showClearance = document.getElementById('showClearance');
  const showLabels = document.getElementById('showLabels');
  const showGuestLabels = document.getElementById('showGuestLabels');
  const showGrid = document.getElementById('showGrid');

  const selectionForm = document.getElementById('selectionForm');
  const selectionEmpty = document.getElementById('selectionEmpty');
  const selLabel = document.getElementById('selLabel');
  const selX = document.getElementById('selX');
  const selY = document.getElementById('selY');
  const selW = document.getElementById('selW');
  const selH = document.getElementById('selH');
  const selRot = document.getElementById('selRot');
  const dimensionLimitNote = document.getElementById('dimensionLimitNote');
  const tentStyleFields = document.getElementById('tentStyleFields');
  const tentFillColor = document.getElementById('tentFillColor');
  const tentTransparencyRange = document.getElementById('tentTransparencyRange');
  const tentTransparencyNumber = document.getElementById('tentTransparencyNumber');
  const seatEditorWrap = document.getElementById('seatEditorWrap');
  const seatEditor = document.getElementById('seatEditor');
  const guestList = document.getElementById('guestList');
  const guestSearch = document.getElementById('guestSearch');
  const newGuestName = document.getElementById('newGuestName');
  const bulkGuests = document.getElementById('bulkGuests');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const btnPresentation = document.getElementById('btnPresentation');
  const btnMeasure = document.getElementById('btnMeasure');
  const btnClearMeasures = document.getElementById('btnClearMeasures');
  const measureModeNote = document.getElementById('measureModeNote');
  const measureToolbarChip = document.getElementById('measureToolbarChip');
  const multiToolbarChip = document.getElementById('multiToolbarChip');
  const btnToggleLock = document.getElementById('btnToggleLock');
  const btnBringFront = document.getElementById('btnBringFront');
  const btnSendBack = document.getElementById('btnSendBack');
  const btnAlignNow = document.getElementById('btnAlignNow');
  const btnShowAllLayers = document.getElementById('btnShowAllLayers');
  const btnUnlockAllLayers = document.getElementById('btnUnlockAllLayers');
  const layerList = document.getElementById('layerList');
  const validationBox = document.getElementById('validationBox');
  const selectionTag = document.getElementById('selectionTag');
  const lockedNote = document.getElementById('lockedNote');

  const autosaveStatus = document.getElementById('autosaveStatus');
  const autosaveTitle = document.getElementById('autosaveTitle');
  const autosaveSubtitle = document.getElementById('autosaveSubtitle');
  const proposalModal = document.getElementById('proposalModal');
  const proposalList = document.getElementById('proposalList');
  const proposalCount = document.getElementById('proposalCount');
  const proposalToast = document.getElementById('proposalToast');

  let elements = [];
  let selectedId = null;
  let drag = null;
  let uid = 1;
  let zoom = 1;
  let bgVisible = true;
  let drawingTent = false;
  let tentDraft = [];
  let tentHoverPoint = null;

  const PLANNER_DB_NAME = 'AntonioEventPlannerMemory';
  const PLANNER_DB_VERSION = 1;
  const PROPOSAL_STORE = 'proposals';
  const META_STORE = 'meta';
  const LOCAL_MEMORY_KEY = 'eventPlannerProposalMemoryV1';
  const EMERGENCY_BACKUP_KEY = 'eventPlannerLatestEmergencyBackupV5';
  const MAX_PROPOSALS = 20;

  let plannerDb = null;
  let storageBackend = 'indexeddb';
  let storageReady = false;
  let autosaveEnabled = false;
  let autosaveTimer = null;
  let autosaveInProgress = false;
  let autosaveQueued = false;
  let currentProposalId = null;
  let currentProposalName = 'Propuesta principal';
  let lastSavedAt = null;
  let lastThumbnailAt = 0;
  let toastTimer = null;
  let selectedIds = [];
  let measureMode = false;
  let measureDraft = null;
  let measurements = [];
  let measureUid = 1;
  let hiddenLayers = {};
  let lockedLayers = {};
  let guideLines = {vertical:null,horizontal:null};
  let historyPast = [];
  let historyFuture = [];
  let historyRecordTimer = null;
  let suppressHistory = false;
  let copiedPlannerItems = [];
  let pasteSequence = 0;

  const defaultGuestOptions = [];
  const defaultGuestNames = defaultGuestOptions.map(option=>option.name);
  let guests = defaultGuestOptions.map(option=>({id:option.id,name:option.name}));
  let guestUid = Math.max(1,...guests.map(guest=>guest.id+1));
  let guestVersion = 1;
  let lastSeatEditorKey = '';

  const typeDefaults = {
    table:  {label:'Mesa 10 personas', widthM:3.4, heightM:3.4, capacity:10, color:'#d9b978', shape:'table'},
    dance:  {label:'Pista de baile 5 × 5 m', widthM:5, heightM:5, color:'#8f6642', shape:'rect'},
    couple: {label:'Mesa de novios', widthM:3, heightM:1.2, color:'#d79aa7', shape:'rect'},
    bar:    {label:'Barra', widthM:4, heightM:1.2, color:'#7a9e87', shape:'rect'},
    dj:     {label:'DJ / sonido', widthM:3, heightM:2, color:'#7e7f9a', shape:'rect'},
    altar:  {label:'Altar', widthM:4, heightM:2, color:'#e3d3ae', shape:'rect'},
    cake:   {label:'Mesa de torta', widthM:1.8, heightM:1.8, color:'#cfa9c7', shape:'circle'},
    photo:  {label:'Photobooth', widthM:3, heightM:2, color:'#6f95aa', shape:'rect'},
    mirror: {label:'Espejo', widthM:1, heightM:.2, color:'#dfeaf0', shape:'rect'}
  };

  const esc = (s='') => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));

  function createId(){
    if(window.crypto && typeof window.crypto.randomUUID==='function'){
      return window.crypto.randomUUID();
    }
    return `proposal-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function cloneData(value){
    if(typeof structuredClone==='function'){
      try{return structuredClone(value);}catch(error){}
    }
    return JSON.parse(JSON.stringify(value));
  }

  function setAutosaveStatus(state,title,subtitle=''){
    autosaveStatus.dataset.state=state;
    autosaveTitle.textContent=title;
    autosaveSubtitle.textContent=subtitle;
  }

  function showProposalToast(message){
    proposalToast.textContent=message;
    proposalToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>proposalToast.classList.remove('show'),2200);
  }

  function formatSavedTime(value){
    if(!value) return 'Pendiente de guardado';
    const date=new Date(value);
    return date.toLocaleString('es-PE',{
      day:'2-digit',
      month:'short',
      hour:'2-digit',
      minute:'2-digit'
    });
  }

  function buildPlannerSnapshot(){
    return {
      version:6,
      elements:cloneData(elements),
      uid,
      scale:mScale(),
      guests:cloneData(guests),
      guestUid,
      measurements:cloneData(measurements),
      measureUid,
      hiddenLayers:cloneData(hiddenLayers),
      lockedLayers:cloneData(lockedLayers),
      settings:{
        showClearance:Boolean(showClearance.checked),
        showLabels:Boolean(showLabels.checked),
        showGuestLabels:Boolean(showGuestLabels.checked),
        showGrid:Boolean(showGrid.checked),
        bgVisible:Boolean(bgVisible)
      }
    };
  }

  function writeEmergencyBackup(){
    if(!currentProposalId) return;
    try{
      localStorage.setItem(EMERGENCY_BACKUP_KEY,JSON.stringify({
        id:currentProposalId,
        name:currentProposalName,
        savedAt:new Date().toISOString(),
        data:buildPlannerSnapshot()
      }));
    }catch(error){}
  }

  function readLocalMemory(){
    try{
      const parsed=JSON.parse(localStorage.getItem(LOCAL_MEMORY_KEY)||'');
      if(parsed && Array.isArray(parsed.proposals)){
        return parsed;
      }
    }catch(error){}
    return {activeProposalId:null,proposals:[]};
  }

  function writeLocalMemory(memory){
    localStorage.setItem(LOCAL_MEMORY_KEY,JSON.stringify(memory));
  }

  function openPlannerDatabase(){
    return new Promise((resolve,reject)=>{
      if(!window.indexedDB){
        reject(new Error('IndexedDB no disponible'));
        return;
      }

      const request=indexedDB.open(PLANNER_DB_NAME,PLANNER_DB_VERSION);

      request.onupgradeneeded=()=>{
        const db=request.result;

        if(!db.objectStoreNames.contains(PROPOSAL_STORE)){
          const proposals=db.createObjectStore(PROPOSAL_STORE,{keyPath:'id'});
          proposals.createIndex('updatedAt','updatedAt',{unique:false});
        }

        if(!db.objectStoreNames.contains(META_STORE)){
          db.createObjectStore(META_STORE,{keyPath:'key'});
        }
      };

      request.onsuccess=()=>resolve(request.result);
      request.onerror=()=>reject(request.error||new Error('No se pudo abrir IndexedDB'));
      request.onblocked=()=>reject(new Error('La base de datos está bloqueada por otra pestaña'));
    });
  }

  function dbOperation(storeName,mode,callback){
    return new Promise((resolve,reject)=>{
      try{
        const transaction=plannerDb.transaction(storeName,mode);
        const store=transaction.objectStore(storeName);
        const request=callback(store);

        transaction.oncomplete=()=>resolve(request?.result);
        transaction.onerror=()=>reject(transaction.error||request?.error);
        transaction.onabort=()=>reject(transaction.error||new Error('Operación cancelada'));
      }catch(error){
        reject(error);
      }
    });
  }

  async function storagePutProposal(record){
    if(plannerDb){
      try{
        await dbOperation(PROPOSAL_STORE,'readwrite',store=>store.put(record));
        return;
      }catch(error){
        plannerDb=null;
        storageBackend='localStorage';
      }
    }

    const memory=readLocalMemory();
    const index=memory.proposals.findIndex(item=>item.id===record.id);

    if(index>=0) memory.proposals[index]=record;
    else memory.proposals.push(record);

    memory.activeProposalId=currentProposalId||record.id;
    writeLocalMemory(memory);
  }

  async function storageGetProposal(id){
    if(!id) return null;

    if(plannerDb){
      try{
        return await dbOperation(PROPOSAL_STORE,'readonly',store=>store.get(id))||null;
      }catch(error){
        plannerDb=null;
        storageBackend='localStorage';
      }
    }

    return readLocalMemory().proposals.find(item=>item.id===id)||null;
  }

  async function storageListProposals(){
    let list=[];

    if(plannerDb){
      try{
        list=await dbOperation(PROPOSAL_STORE,'readonly',store=>store.getAll())||[];
      }catch(error){
        plannerDb=null;
        storageBackend='localStorage';
      }
    }

    if(!plannerDb){
      list=readLocalMemory().proposals;
    }

    return list.sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
  }

  async function storageDeleteProposal(id){
    if(plannerDb){
      try{
        await dbOperation(PROPOSAL_STORE,'readwrite',store=>store.delete(id));
      }catch(error){
        plannerDb=null;
        storageBackend='localStorage';
      }
    }

    if(!plannerDb){
      const memory=readLocalMemory();
      memory.proposals=memory.proposals.filter(item=>item.id!==id);
      if(memory.activeProposalId===id) memory.activeProposalId=null;
      writeLocalMemory(memory);
    }
  }

  async function storageSetActiveProposal(id){
    try{localStorage.setItem('eventPlannerActiveProposalIdV1',id||'');}catch(error){}

    if(plannerDb){
      try{
        await dbOperation(META_STORE,'readwrite',store=>store.put({
          key:'activeProposalId',
          value:id
        }));
        return;
      }catch(error){
        plannerDb=null;
        storageBackend='localStorage';
      }
    }

    const memory=readLocalMemory();
    memory.activeProposalId=id;
    writeLocalMemory(memory);
  }

  async function storageGetActiveProposalId(){
    if(plannerDb){
      try{
        const result=await dbOperation(META_STORE,'readonly',store=>store.get('activeProposalId'));
        if(result?.value) return result.value;
      }catch(error){
        plannerDb=null;
        storageBackend='localStorage';
      }
    }

    const memory=readLocalMemory();
    if(memory.activeProposalId) return memory.activeProposalId;

    try{return localStorage.getItem('eventPlannerActiveProposalIdV1')||null;}
    catch(error){return null;}
  }

  function applyPlannerSnapshot(snapshot={}){
    autosaveEnabled=false;
    drawingTent=false;
    tentDraft=[];
    tentHoverPoint=null;
    drawLayer.replaceChildren();
    drawLayer.setAttribute('display','none');

    elements=normalizeLoadedElements(Array.isArray(snapshot.elements)?cloneData(snapshot.elements):[]);
    uid=Number(snapshot.uid)||Math.max(1,...elements.map(item=>Number(item.id)+1));

    if(Array.isArray(snapshot.guests)){
      guests=cloneData(snapshot.guests);
    }

    guestUid=Number(snapshot.guestUid)||Math.max(1,...guests.map(guest=>Number(guest.id)+1));
    scaleInput.value=Number(snapshot.scale)||32;
    measurements=Array.isArray(snapshot.measurements)?cloneData(snapshot.measurements):[];
    measureUid=Number(snapshot.measureUid)||Math.max(1,...measurements.map(item=>Number(item.id)+1),1);
    hiddenLayers=snapshot.hiddenLayers && typeof snapshot.hiddenLayers==='object' ? cloneData(snapshot.hiddenLayers) : {};
    lockedLayers=snapshot.lockedLayers && typeof snapshot.lockedLayers==='object' ? cloneData(snapshot.lockedLayers) : {};

    const settings=snapshot.settings||{};
    showClearance.checked=settings.showClearance!==undefined ? Boolean(settings.showClearance) : showClearance.checked;
    showLabels.checked=settings.showLabels!==undefined ? Boolean(settings.showLabels) : showLabels.checked;
    showGuestLabels.checked=settings.showGuestLabels!==undefined ? Boolean(settings.showGuestLabels) : showGuestLabels.checked;
    showGrid.checked=settings.showGrid!==undefined ? Boolean(settings.showGrid) : showGrid.checked;
    bgVisible=settings.bgVisible!==undefined ? Boolean(settings.bgVisible) : true;

    gridLayer.setAttribute('opacity',showGrid.checked?'.72':'0');
    bgImage.setAttribute('opacity',bgVisible?'1':'0');
    document.getElementById('toggleBg').textContent=bgVisible?'Ocultar plano':'Mostrar plano';

    selectedId=null;
    selectedIds=[];
    guideLines={vertical:null,horizontal:null};
    guestVersion++;
    lastSeatEditorKey='';
    renderGuestManager();
    renderMeasureLayer();
    render();
  }

  function createThumbnail(){
    return new Promise(resolve=>{
      try{
        const clone=svg.cloneNode(true);
        clone.setAttribute('width','1448');
        clone.setAttribute('height','1086');
        clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
        clone.querySelectorAll('.rotate-ui,.vertex-handle').forEach(node=>node.remove());

        const temporaryDrawLayer=clone.querySelector('#drawLayer');
        if(temporaryDrawLayer) temporaryDrawLayer.innerHTML='';

        const xml=new XMLSerializer().serializeToString(clone);
        const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
        const url=URL.createObjectURL(blob);
        const image=new Image();

        image.onload=()=>{
          try{
            const canvas=document.createElement('canvas');
            canvas.width=360;
            canvas.height=270;
            const context=canvas.getContext('2d');
            context.fillStyle='#ffffff';
            context.fillRect(0,0,canvas.width,canvas.height);
            context.drawImage(image,0,0,canvas.width,canvas.height);
            resolve(canvas.toDataURL('image/jpeg',.72));
          }catch(error){
            resolve(null);
          }finally{
            URL.revokeObjectURL(url);
          }
        };

        image.onerror=()=>{
          URL.revokeObjectURL(url);
          resolve(null);
        };

        image.src=url;
      }catch(error){
        resolve(null);
      }
    });
  }

  function queueThumbnailUpdate(proposalId,force=false){
    const now=Date.now();
    if(!force && now-lastThumbnailAt<20000) return;
    lastThumbnailAt=now;

    const run=async()=>{
      const thumbnail=await createThumbnail();
      if(!thumbnail) return;

      const record=await storageGetProposal(proposalId);
      if(!record) return;

      record.thumbnail=thumbnail;
      await storagePutProposal(record);

      if(!proposalModal.classList.contains('hidden')){
        renderProposalList();
      }
    };

    if('requestIdleCallback' in window){
      requestIdleCallback(run,{timeout:2500});
    }else{
      setTimeout(run,250);
    }
  }

  async function saveCurrentProposal({
    silent=true,
    forceThumbnail=false
  }={}){
    if(!storageReady || !currentProposalId) return;

    if(autosaveInProgress){
      autosaveQueued=true;
      return;
    }

    autosaveInProgress=true;
    autosaveQueued=false;
    clearTimeout(autosaveTimer);

    setAutosaveStatus('saving','Guardando…',currentProposalName);

    try{
      const existing=await storageGetProposal(currentProposalId);
      const now=new Date().toISOString();

      const record={
        id:currentProposalId,
        name:currentProposalName||'Propuesta sin nombre',
        createdAt:existing?.createdAt||now,
        updatedAt:now,
        thumbnail:existing?.thumbnail||null,
        data:buildPlannerSnapshot()
      };

      await storagePutProposal(record);
      await storageSetActiveProposal(currentProposalId);

      lastSavedAt=now;
      writeEmergencyBackup();

      setAutosaveStatus(
        'saved',
        `Guardado · ${currentProposalName}`,
        storageBackend==='indexeddb' ? 'Memoria del navegador' : 'Copia local de respaldo'
      );

      if(!silent) showProposalToast('Propuesta guardada correctamente');
      queueThumbnailUpdate(currentProposalId,forceThumbnail);
    }catch(error){
      setAutosaveStatus('error','No se pudo guardar','Se conserva una copia de emergencia');
      writeEmergencyBackup();
      if(!silent) alert('No se pudo completar el guardado, pero se creó una copia local de emergencia.');
    }finally{
      autosaveInProgress=false;

      if(autosaveQueued){
        autosaveQueued=false;
        setTimeout(()=>saveCurrentProposal({silent:true}),80);
      }
    }
  }

  function scheduleAutosave(delay=850){
    if(!autosaveEnabled || !storageReady || !currentProposalId) return;

    clearTimeout(autosaveTimer);
    setAutosaveStatus('saving','Cambios pendientes…',currentProposalName);

    autosaveTimer=setTimeout(()=>{
      saveCurrentProposal({silent:true});
    },delay);
  }

  async function loadProposalRecord(record,{announce=true}={}){
    if(!record) return;

    autosaveEnabled=false;
    clearTimeout(autosaveTimer);

    currentProposalId=record.id;
    currentProposalName=record.name||'Propuesta sin nombre';
    lastSavedAt=record.updatedAt||null;

    applyPlannerSnapshot(record.data||{});
    await storageSetActiveProposal(currentProposalId);

    autosaveEnabled=true;
    if(!suppressHistory){historyPast=[];historyFuture=[];}

    setAutosaveStatus(
      'saved',
      `Guardado · ${currentProposalName}`,
      storageBackend==='indexeddb' ? 'Memoria del navegador' : 'Copia local de respaldo'
    );

    if(!suppressHistory){pushHistorySnapshot(); updateHistoryButtons();}
    if(announce) showProposalToast(`Abierta: ${currentProposalName}`);
  }

  function createBlankSnapshot(){
    const snapshot=buildPlannerSnapshot();
    snapshot.elements=[];
    snapshot.uid=1;
    return snapshot;
  }

  async function saveCurrentAsNewProposal(){
    const proposals=await storageListProposals();

    if(proposals.length>=MAX_PROPOSALS){
      alert(`Puedes guardar como máximo ${MAX_PROPOSALS} propuestas. Elimina una para crear otra.`);
      return;
    }

    await saveCurrentProposal({silent:true});

    const suggestedName=`${currentProposalName} copia`;
    const name=prompt('Guardar distribución como:',suggestedName);

    if(name===null) return;

    const cleanName=name.trim()||suggestedName;
    const now=new Date().toISOString();

    const record={
      id:createId(),
      name:cleanName,
      createdAt:now,
      updatedAt:now,
      thumbnail:null,
      data:buildPlannerSnapshot()
    };

    await storagePutProposal(record);
    await loadProposalRecord(record,{announce:false});
    await saveCurrentProposal({silent:true,forceThumbnail:true});

    showProposalToast(`Guardado como: ${cleanName}`);
  }

  async function createProposal({duplicate=false}={}){
    const proposals=await storageListProposals();

    if(proposals.length>=MAX_PROPOSALS){
      alert(`Puedes guardar como máximo ${MAX_PROPOSALS} propuestas. Elimina una para crear otra.`);
      return;
    }

    await saveCurrentProposal({silent:true});

    const suggestedName=duplicate
      ? `${currentProposalName} copia`
      : `Propuesta ${proposals.length+1}`;

    const name=prompt(
      duplicate?'Nombre de la propuesta duplicada:':'Nombre de la nueva propuesta:',
      suggestedName
    );

    if(name===null) return;

    const cleanName=name.trim()||suggestedName;
    const now=new Date().toISOString();
    const record={
      id:createId(),
      name:cleanName,
      createdAt:now,
      updatedAt:now,
      thumbnail:null,
      data:duplicate ? buildPlannerSnapshot() : createBlankSnapshot()
    };

    await storagePutProposal(record);
    await loadProposalRecord(record,{announce:false});
    await saveCurrentProposal({silent:true,forceThumbnail:true});

    closeProposalModal();
    showProposalToast(duplicate?'Propuesta duplicada':'Nueva propuesta creada');
  }

  async function renderProposalList(){
    proposalList.innerHTML='<div class="proposal-loading">Cargando propuestas…</div>';

    try{
      const proposals=await storageListProposals();
      proposalCount.textContent=`${proposals.length} de ${MAX_PROPOSALS} propuestas`;

      if(!proposals.length){
        proposalList.innerHTML='<div class="proposal-empty">Todavía no hay propuestas guardadas.</div>';
        return;
      }

      proposalList.innerHTML=proposals.map(record=>{
        const data=record.data||{};
        const itemList=Array.isArray(data.elements)?data.elements:[];
        const tableCount=itemList.filter(item=>item.type==='table').length;
        const guestCount=Array.isArray(data.guests)?data.guests.length:0;
        const isActive=record.id===currentProposalId;

        return `
          <article class="proposal-card ${isActive?'active':''}" data-proposal-card="${esc(record.id)}">
            <div class="proposal-preview">
              ${record.thumbnail
                ? `<img src="${record.thumbnail}" alt="Vista previa de ${esc(record.name)}">`
                : `<div class="proposal-preview-placeholder">
                    <strong>▧</strong>
                    Vista previa en preparación
                  </div>`}
            </div>

            <div class="proposal-card-body">
              <div class="proposal-card-title-row">
                <h3 title="${esc(record.name)}">${esc(record.name)}</h3>
                ${isActive?'<span class="proposal-active-badge">ACTIVA</span>':''}
              </div>

              <div class="proposal-meta">
                ${tableCount} mesas · ${guestCount} invitados<br>
                Modificada: ${esc(formatSavedTime(record.updatedAt))}
              </div>

              <div class="proposal-card-actions">
                <button class="open-proposal" data-proposal-action="open" data-proposal-id="${esc(record.id)}">
                  ${isActive?'Abierta':'Abrir'}
                </button>
                <button data-proposal-action="rename" data-proposal-id="${esc(record.id)}">Renombrar</button>
                <button data-proposal-action="duplicate" data-proposal-id="${esc(record.id)}">Duplicar</button>
                <button class="delete-proposal" data-proposal-action="delete" data-proposal-id="${esc(record.id)}">Eliminar</button>
              </div>
            </div>
          </article>`;
      }).join('');
    }catch(error){
      proposalList.innerHTML='<div class="proposal-empty">No se pudieron leer las propuestas guardadas.</div>';
    }
  }

  async function openProposalModal(){
    await saveCurrentProposal({silent:true});
    proposalModal.classList.remove('hidden');
    await renderProposalList();
  }

  function closeProposalModal(){
    proposalModal.classList.add('hidden');
  }

  async function initializePlannerStorage(){
    setAutosaveStatus('saving','Preparando memoria…','Buscando propuestas guardadas');

    try{
      plannerDb=await openPlannerDatabase();
      storageBackend='indexeddb';

      if(navigator.storage?.persist){
        navigator.storage.persist().catch(()=>false);
      }
    }catch(error){
      plannerDb=null;
      storageBackend='localStorage';
    }

    storageReady=true;
    autosaveEnabled=false;

    let activeId=await storageGetActiveProposalId();
    let record=activeId ? await storageGetProposal(activeId) : null;

    if(!record){
      const proposals=await storageListProposals();
      record=proposals[0]||null;
    }

    if(record){
      await loadProposalRecord(record,{announce:false});
      return;
    }

    let initialSnapshot=null;

    try{
      const oldSave=JSON.parse(localStorage.getItem('eventPlannerLayout')||'null');
      if(oldSave && Array.isArray(oldSave.elements)){
        initialSnapshot=oldSave;
      }
    }catch(error){}

    if(!initialSnapshot){
      try{
        const emergency=JSON.parse(localStorage.getItem(EMERGENCY_BACKUP_KEY)||'null');
        if(emergency?.data) initialSnapshot=emergency.data;
      }catch(error){}
    }

    if(initialSnapshot){
      applyPlannerSnapshot(initialSnapshot);
    }else{
      autoLayout();
    }

    currentProposalId=createId();
    currentProposalName='Propuesta principal';
    autosaveEnabled=true;

    await saveCurrentProposal({silent:true,forceThumbnail:true});
  }


  const layerDefinitions = {
    table:{label:'Mesas'},
    dance:{label:'Pistas'},
    couple:{label:'Mesa de novios'},
    bar:{label:'Barras'},
    dj:{label:'DJ / sonido'},
    altar:{label:'Altares'},
    cake:{label:'Mesas de torta'},
    photo:{label:'Photobooth'},
    mirror:{label:'Espejos'},
    tent:{label:'Toldos'}
  };

  function layerLabel(type){ return layerDefinitions[type]?.label || type; }
  function getVisibleElements(){ return elements.filter(item=>!hiddenLayers[item.type]); }
  function isSelected(id){ return selectedIds.includes(id); }

  function setSelection(ids=[],primary=null){
    const valid=[...new Set(ids.filter(id=>getItem(id) && !hiddenLayers[getItem(id).type]))];
    selectedIds=valid;
    selectedId=primary && valid.includes(primary) ? primary : (valid[0] ?? null);
    updateSelectionHints();
  }

  function clearSelection(){
    selectedIds=[];
    selectedId=null;
    updateSelectionHints();
  }

  function updateSelectionHints(){
    if(selectedIds.length>1){
      selectionTag.classList.remove('hidden');
      selectionTag.textContent=`${selectedIds.length} elementos seleccionados`;
      multiToolbarChip.classList.remove('hidden');
      multiToolbarChip.textContent=`${selectedIds.length} elementos seleccionados`;
    }else if(selectedIds.length===1){
      selectionTag.classList.remove('hidden');
      selectionTag.textContent='1 elemento seleccionado';
      multiToolbarChip.classList.add('hidden');
    }else{
      selectionTag.classList.add('hidden');
      multiToolbarChip.classList.add('hidden');
    }
  }


  function clonePlannerItemForClipboard(item){
    return {
      ...cloneData(item),
      pointsM:item.type==='tent'
        ? (item.pointsM||[]).map(point=>({...point}))
        : item.pointsM,
      seats:item.type==='table'
        ? Array(10).fill(null)
        : item.seats
    };
  }

  function copySelectedPlannerItems(){
    const ids=selectedIds.length
      ? selectedIds
      : (selectedId ? [selectedId] : []);

    const items=ids
      .map(id=>getItem(id))
      .filter(Boolean);

    if(!items.length) return false;

    copiedPlannerItems=items.map(clonePlannerItemForClipboard);
    pasteSequence=0;

    showProposalToast(
      items.length===1
        ? 'Objeto copiado'
        : `${items.length} objetos copiados`
    );

    return true;
  }

  function pasteCopiedPlannerItems(){
    if(!copiedPlannerItems.length) return false;

    pasteSequence+=1;
    const offset=28*pasteSequence;
    const pastedIds=[];

    copiedPlannerItems.forEach(sourceItem=>{
      const copy=clonePlannerItemForClipboard(sourceItem);

      copy.id=uid++;
      copy.label=`${sourceItem.label} copia`;
      copy.x=Math.max(0,Math.min(1448,(Number(sourceItem.x)||0)+offset));
      copy.y=Math.max(0,Math.min(1086,(Number(sourceItem.y)||0)+offset));
      copy.locked=false;

      if(copy.type==='table'){
        copy.seats=Array(10).fill(null);
      }

      if(copy.type==='tent'){
        copy.pointsM=(sourceItem.pointsM||[]).map(point=>({...point}));
        hiddenLayers.tent=false;
      }

      elements.push(copy);
      pastedIds.push(copy.id);
    });

    setSelection(pastedIds,pastedIds[0]||null);
    guestVersion++;
    lastSeatEditorKey='';
    renderGuestManager();
    commitMutation();

    showProposalToast(
      pastedIds.length===1
        ? 'Objeto pegado'
        : `${pastedIds.length} objetos pegados`
    );

    return true;
  }

  function updateHistoryButtons(){
    btnUndo.disabled=historyPast.length<=1;
    btnRedo.disabled=!historyFuture.length;
  }

  function currentHistorySnapshot(){
    return JSON.stringify({
      data:buildPlannerSnapshot(),
      selectedId,
      selectedIds:cloneData(selectedIds)
    });
  }

  function pushHistorySnapshot(){
    if(suppressHistory) return;
    const snapshot=currentHistorySnapshot();
    if(historyPast[historyPast.length-1]===snapshot) return;
    historyPast.push(snapshot);
    if(historyPast.length>80) historyPast.shift();
    historyFuture=[];
    updateHistoryButtons();
  }

  function scheduleHistoryRecord(delay=240){
    if(suppressHistory) return;
    clearTimeout(historyRecordTimer);
    historyRecordTimer=setTimeout(pushHistorySnapshot,delay);
  }

  function restoreHistorySnapshot(raw){
    if(!raw) return;
    suppressHistory=true;
    const parsed=JSON.parse(raw);
    applyPlannerSnapshot(parsed.data||{});
    setSelection(parsed.selectedIds||[],parsed.selectedId||null);
    suppressHistory=false;
    render();
    updateHistoryButtons();
  }

  function undoHistory(){
    if(historyPast.length<=1) return;
    const current=historyPast.pop();
    historyFuture.push(current);
    restoreHistorySnapshot(historyPast[historyPast.length-1]);
  }

  function redoHistory(){
    if(!historyFuture.length) return;
    const next=historyFuture.pop();
    historyPast.push(next);
    restoreHistorySnapshot(next);
  }

  function commitMutation(){
    render();
    scheduleHistoryRecord();
  }

  function updateMeasureUI(){
    btnMeasure.classList.toggle('primary',measureMode);
    measureModeNote.classList.toggle('hidden',!measureMode);
    measureToolbarChip.classList.toggle('hidden',!measureMode);
  }

  function toggleMeasureMode(force=null){
    measureMode = force===null ? !measureMode : Boolean(force);
    if(measureMode){
      drawingTent=false;
      cancelTentDrawing();
    }
    measureDraft=null;
    updateMeasureUI();
    renderMeasureLayer();
  }

  function formatMeasureDistance(px){
    const meters=px/mScale();
    return `${(Math.round(meters*100)/100).toFixed(2).replace(/\.?0+$/,'')} m`;
  }

  function measureLabelMarkup(p1,p2){
    const midpointX=(p1.x+p2.x)/2;
    const midpointY=(p1.y+p2.y)/2;
    let angle=Math.atan2(p2.y-p1.y,p2.x-p1.x)*180/Math.PI;
    if(angle>90) angle-=180;
    if(angle<-90) angle+=180;
    const distance=Math.hypot(p2.x-p1.x,p2.y-p1.y);
    return `<g transform="translate(${midpointX.toFixed(2)} ${midpointY.toFixed(2)}) rotate(${angle.toFixed(2)})"><text class="measure-label" text-anchor="middle" y="-6">${formatMeasureDistance(distance)}</text></g>`;
  }

  function renderMeasureLayer(){
    let markup='';
    measurements.forEach(item=>{
      markup += `<line class="measure-line" x1="${item.x1}" y1="${item.y1}" x2="${item.x2}" y2="${item.y2}"/>`;
      markup += `<circle class="measure-end" cx="${item.x1}" cy="${item.y1}" r="5"/><circle class="measure-end" cx="${item.x2}" cy="${item.y2}" r="5"/>`;
      markup += measureLabelMarkup({x:item.x1,y:item.y1},{x:item.x2,y:item.y2});
    });
    if(measureMode && measureDraft?.start && measureDraft?.end){
      markup += `<line class="measure-line" x1="${measureDraft.start.x}" y1="${measureDraft.start.y}" x2="${measureDraft.end.x}" y2="${measureDraft.end.y}"/>`;
      markup += `<circle class="measure-end" cx="${measureDraft.start.x}" cy="${measureDraft.start.y}" r="5"/><circle class="measure-end" cx="${measureDraft.end.x}" cy="${measureDraft.end.y}" r="5"/>`;
      markup += measureLabelMarkup(measureDraft.start,measureDraft.end);
    }
    measureLayer.innerHTML=markup;
  }

  function renderGuideLayer(){
    let markup='';
    if(guideLines.vertical!==null){
      markup += `<line class="svg-guide-line" x1="${guideLines.vertical}" x2="${guideLines.vertical}" y1="0" y2="1086"/>`;
    }
    if(guideLines.horizontal!==null){
      markup += `<line class="svg-guide-line" x1="0" x2="1448" y1="${guideLines.horizontal}" y2="${guideLines.horizontal}"/>`;
    }
    guideLayer.innerHTML=markup;
  }

  function selectedItems(){
    return selectedIds.map(id=>getItem(id)).filter(Boolean);
  }

  function bringSelectedFront(){
    const ids=new Set(selectedIds);
    const chosen=elements.filter(item=>ids.has(item.id));
    const rest=elements.filter(item=>!ids.has(item.id));
    elements=[...rest,...chosen];
    commitMutation();
  }

  function sendSelectedBack(){
    const ids=new Set(selectedIds);
    const chosen=elements.filter(item=>ids.has(item.id));
    const rest=elements.filter(item=>!ids.has(item.id));
    elements=[...chosen,...rest];
    commitMutation();
  }

  function toggleLockSelected(){
    const items=selectedItems();
    if(!items.length) return;
    const next=!items.every(item=>item.locked);
    items.forEach(item=>item.locked=next);
    commitMutation();
  }

  function alignSelectedGroup(){
    const items=selectedItems();
    if(items.length<2) return;
    const base=getItem(selectedId)||items[0];
    items.forEach(item=>{ if(item.id!==base.id) item.y=base.y; });
    commitMutation();
  }

  function layerCounts(){
    const counts={};
    elements.forEach(item=> counts[item.type]=(counts[item.type]||0)+1);
    return counts;
  }

  function renderLayerPanel(){
    const counts=layerCounts();
    const types=Object.keys(counts);
    if(!types.length){
      layerList.innerHTML='<div class="validation-item">Todavía no hay elementos en el plano.</div>';
      return;
    }
    layerList.innerHTML=types.map(type=>{
      const hidden=Boolean(hiddenLayers[type]);
      const locked=Boolean(lockedLayers[type]);
      return `<div class="layer-row ${hidden?'dimmed':''}">
        <div>
          <strong>${layerLabel(type)}</strong>
          <small>${counts[type]} elemento(s)</small>
        </div>
        <div class="layer-row-actions">
          <button type="button" data-layer-action="toggle-visibility" data-layer-type="${type}" title="Mostrar u ocultar">${hidden?'🙈':'👁'}</button>
          <button type="button" data-layer-action="toggle-lock" data-layer-type="${type}" title="Bloquear categoría">${locked?'🔒':'🔓'}</button>
        </div>
      </div>`;
    }).join('');
  }

  function validationMessages(conflicts=conflictIds()){
    const messages=[];
    const capacity=elements.reduce((sum,item)=>sum+(item.capacity||0),0);
    const assigned=guestAssignmentMap().size;
    const unassigned=guests.length-assigned;

    if(conflicts.size){
      messages.push({type:'bad',text:`Hay ${conflicts.size} elemento(s) involucrados en superposición.`});
    }else{
      messages.push({type:'good',text:'No se detectaron superposiciones entre mobiliarios.'});
    }

    if(unassigned>0){
      messages.push({type:'warn',text:`Quedan ${unassigned} invitado(s) sin asignar.`});
    }else if(guests.length){
      messages.push({type:'good',text:'Todos los invitados ya tienen asignación o están listos para asignarse.'});
    }

    if(guests.length>capacity){
      messages.push({type:'bad',text:`La capacidad total (${capacity}) es menor al número de invitados (${guests.length}).`});
    }else{
      messages.push({type:'good',text:`La capacidad total (${capacity}) es suficiente para ${guests.length} invitado(s).`});
    }

    // Esta advertencia se calcula únicamente entre mesas.
    // Margen adicional: 0.60 m entre sus áreas de circulación.
    const tableItems=getVisibleElements().filter(item=>item.type==='table');
    const tableClearanceMarginM=0.60;
    let closeTables=0;

    for(let i=0;i<tableItems.length;i++){
      for(let j=i+1;j<tableItems.length;j++){
        const A=tableItems[i];
        const B=tableItems[j];
        const minimumCenterDistance=(
          ((A.widthM+B.widthM)/2)+tableClearanceMarginM
        )*mScale();
        const actualCenterDistance=Math.hypot(A.x-B.x,A.y-B.y);

        if(actualCenterDistance<minimumCenterDistance && actualCenterDistance>5){
          closeTables++;
        }
      }
    }

    if(closeTables){
      messages.push({
        type:'warn',
        text:`Se detectaron ${closeTables} pares de mesas con menos de 60 cm libres entre sus áreas de circulación.`
      });
    }

    return messages;
  }

  function renderValidationPanel(){
    const messages=validationMessages();
    validationBox.innerHTML=messages.map(msg=>`<div class="validation-item ${msg.type}">${msg.text}</div>`).join('');
  }

  function applySmartGuides(targetX,targetY,ignoreIds=[]){
    const ignore=new Set(ignoreIds);
    const threshold=9;
    let nextX=targetX, nextY=targetY;
    guideLines={vertical:null,horizontal:null};
    const candidates=[724,...getVisibleElements().filter(item=>!ignore.has(item.id)).map(item=>item.x)];
    let bestX=null,bestY=null;
    candidates.forEach(value=>{
      const dx=Math.abs(targetX-value);
      const dy=Math.abs(targetY-(value===724?543:value));
      if(dx<=threshold && (bestX===null || dx<bestX.diff)) bestX={value,diff:dx};
      if(value!==724){
        const ddy=Math.abs(targetY-value);
        if(ddy<=threshold && (bestY===null || ddy<bestY.diff)) bestY={value,diff:ddy};
      }
    });
    const centerY=543;
    if(Math.abs(targetY-centerY)<=threshold) bestY={value:centerY,diff:Math.abs(targetY-centerY)};
    if(bestX){ nextX=bestX.value; guideLines.vertical=bestX.value; }
    if(bestY){ nextY=bestY.value; guideLines.horizontal=bestY.value; }
    return {x:nextX,y:nextY};
  }

  function mScale(){ return Number(scaleInput.value) || 32; }


  function maxDimensionFor(item){
    return item && (item.type==='tent' || item.type==='dance') ? Infinity : 5;
  }

  function clampDimension(item,value){
    const parsed=Number(value);
    const safe=Number.isFinite(parsed) ? parsed : .1;
    return Math.max(.1,Math.min(maxDimensionFor(item),safe));
  }

  function polygonDimensions(pointsM=[]){
    if(!pointsM.length) return {widthM:0,heightM:0};
    const xs=pointsM.map(point=>point.x);
    const ys=pointsM.map(point=>point.y);
    return {
      widthM:Math.max(...xs)-Math.min(...xs),
      heightM:Math.max(...ys)-Math.min(...ys)
    };
  }

  function refreshTentDimensions(item){
    if(!item || item.type!=='tent') return;
    const dimensions=polygonDimensions(item.pointsM);
    item.widthM=Math.max(.1,dimensions.widthM);
    item.heightM=Math.max(.1,dimensions.heightM);
  }

  function scaleTent(item,newWidthM,newHeightM){
    if(!item || item.type!=='tent' || !Array.isArray(item.pointsM)) return;
    const oldWidth=Math.max(.0001,item.widthM);
    const oldHeight=Math.max(.0001,item.heightM);
    const scaleX=Math.max(.1,newWidthM)/oldWidth;
    const scaleY=Math.max(.1,newHeightM)/oldHeight;
    item.pointsM=item.pointsM.map(point=>({
      x:point.x*scaleX,
      y:point.y*scaleY
    }));
    refreshTentDimensions(item);
  }

  function normalizeReadableAngle(angle){
    let normalized=((angle+180)%360+360)%360-180;

    if(normalized>90) normalized-=180;
    if(normalized<-90) normalized+=180;

    return normalized;
  }

  function formatEdgeDistance(meters){
    const rounded=Math.round(Number(meters)*100)/100;
    return `${rounded.toFixed(2).replace(/\.?0+$/,'')} m`;
  }

  function edgeMeasurementLabels(points,{
    metersPerUnit=1,
    closePolygon=false,
    parentRotation=0
  }={}){
    if(!Array.isArray(points) || points.length<2) return '';

    const segmentCount=closePolygon ? points.length : points.length-1;
    let labels='';

    for(let index=0;index<segmentCount;index++){
      const start=points[index];
      const end=points[(index+1)%points.length];
      const dx=end.x-start.x;
      const dy=end.y-start.y;
      const distanceUnits=Math.hypot(dx,dy);

      if(distanceUnits<1) continue;

      const midpointX=(start.x+end.x)/2;
      const midpointY=(start.y+end.y)/2;
      const localAngle=Math.atan2(dy,dx)*180/Math.PI;
      const globalAngle=localAngle+parentRotation;
      const readableGlobalAngle=normalizeReadableAngle(globalAngle);
      const readableLocalAngle=readableGlobalAngle-parentRotation;
      const distanceMeters=distanceUnits*metersPerUnit;

      labels+=`
        <g transform="translate(${midpointX.toFixed(2)} ${midpointY.toFixed(2)})
                      rotate(${readableLocalAngle.toFixed(2)})"
           pointer-events="none">
          <text x="0" y="-7"
            text-anchor="middle"
            dominant-baseline="middle"
            font-size="13"
            font-weight="800"
            fill="#34322e"
            stroke="#ffffff"
            stroke-width="4"
            paint-order="stroke">
            ${formatEdgeDistance(distanceMeters)}
          </text>
        </g>`;
    }

    return labels;
  }

  function renderTentDraft(){
    if(!drawingTent || !tentDraft.length){
      drawLayer.replaceChildren();
      drawLayer.setAttribute('display','none');
      return;
    }

    drawLayer.removeAttribute('display');

    const previewPoints=[
      ...tentDraft,
      ...(tentHoverPoint ? [tentHoverPoint] : [])
    ];

    const pointString=previewPoints.map(point=>`${point.x},${point.y}`).join(' ');
    const edgeLabels=edgeMeasurementLabels(previewPoints,{
      metersPerUnit:1/mScale(),
      closePolygon:false,
      parentRotation:0
    });
    const vertices=tentDraft.map((point,index)=>`
      <g>
        <circle cx="${point.x}" cy="${point.y}" r="${index===0?9:7}"
          fill="${index===0?'#6f8f55':'#ffffff'}"
          stroke="#476039" stroke-width="3"/>
        ${index===0?`<text x="${point.x+13}" y="${point.y-11}" font-size="12" font-weight="800"
          fill="#3f5334" stroke="#ffffff" stroke-width="4" paint-order="stroke">Cerrar aquí</text>`:''}
      </g>`).join('');

    drawLayer.innerHTML=`
      <polyline points="${pointString}" fill="none" stroke="#66814f"
        stroke-width="4" stroke-dasharray="10 7"/>
      ${edgeLabels}
      ${vertices}`;
  }

  function startTentDrawing(){
    drawLayer.replaceChildren();
    drawLayer.removeAttribute('display');
    drawingTent=true;
    tentDraft=[];
    tentHoverPoint=null;
    clearSelection();
    svg.classList.add('drawing-tent');
    btnDrawTent.classList.add('active');
    btnDrawTent.innerHTML='<strong>✓</strong>Finalizar toldo<br>mínimo 3 puntos';
    tentDrawHint.classList.remove('hidden');
    renderTentDraft();
    render();
  }

  function cancelTentDrawing(){
    drawingTent=false;
    tentDraft=[];
    tentHoverPoint=null;
    svg.classList.remove('drawing-tent');
    btnDrawTent.classList.remove('active');
    btnDrawTent.innerHTML='<strong>⬡</strong>Dibujar toldo<br>por vértices';
    tentDrawHint.classList.add('hidden');

    // Se elimina directamente toda la geometría provisional.
    // Así, al mover el toldo terminado, no queda ninguna base
    // ni contorno temporal en su posición original.
    drawLayer.replaceChildren();
    drawLayer.setAttribute('display','none');
  }

  function finishTentDrawing(){
    if(tentDraft.length<3){
      alert('El toldo necesita como mínimo tres vértices.');
      return;
    }

    // Guardar primero una copia independiente de los vértices.
    const closedPoints=tentDraft.map(point=>({
      x:Number(point.x),
      y:Number(point.y)
    }));

    const centroid={
      x:closedPoints.reduce((sum,point)=>sum+point.x,0)/closedPoints.length,
      y:closedPoints.reduce((sum,point)=>sum+point.y,0)/closedPoints.length
    };

    const scale=mScale();
    const pointsM=closedPoints.map(point=>({
      x:(point.x-centroid.x)/scale,
      y:(point.y-centroid.y)/scale
    }));

    const item={
      id:uid++,
      type:'tent',
      label:'Toldo',
      x:centroid.x,
      y:centroid.y,
      widthM:1,
      heightM:1,
      rotation:0,
      capacity:0,
      color:'#ffffff',
      fillColor:'#ffffff',
      transparency:85,
      outlineColor:'#555555',
      shape:'polygon',
      locked:false,
      pointsM
    };

    refreshTentDimensions(item);

    // El toldo definitivo se agrega al itemsLayer antes de retirar
    // la guía punteada. Además, su categoría queda visible.
    hiddenLayers.tent=false;
    elements.push(item);
    setSelection([item.id],item.id);

    // Finalizar únicamente el modo de dibujo provisional.
    drawingTent=false;
    tentDraft=[];
    tentHoverPoint=null;
    svg.classList.remove('drawing-tent');
    btnDrawTent.classList.remove('active');
    btnDrawTent.innerHTML='<strong>⬡</strong>Dibujar toldo<br>por vértices';
    tentDrawHint.classList.add('hidden');
    drawLayer.replaceChildren();
    drawLayer.setAttribute('display','none');

    // Renderizar inmediatamente el polígono final.
    render();
    scheduleHistoryRecord(0);
  }

  function addElement(type, x=1080, y=520){
    const d = typeDefaults[type];
    const item = {
      id: uid++,
      type,
      label: d.label,
      x, y,
      widthM:d.widthM,
      heightM:d.heightM,
      rotation:0,
      capacity:d.capacity || 0,
      color:d.color,
      shape:d.shape,
      locked:false,
      seats:type==='table' ? Array(10).fill(null) : undefined
    };
    elements.push(item);
    setSelection([item.id], item.id);
    render();
  }

  function autoLayout(){
    elements = [];
    uid = 1;
    addElement('dance', 735,520);
    addElement('altar', 620,265);
    addElement('dj', 780,370);
    addElement('bar', 1025,295);
    addElement('couple', 820,775);
    clearSelection();
    renderGuestManager();
    render();
  }

  function getItem(id){ return elements.find(e => e.id === id); }

  function isItemLocked(item){ return Boolean(item && (item.locked || lockedLayers[item.type])); }

  function ensureTableSeats(item){
    if(item && item.type==='table'){
      if(!Array.isArray(item.seats)) item.seats=Array(10).fill(null);
      item.seats=item.seats.slice(0,10);
      while(item.seats.length<10) item.seats.push(null);
    }
    return item;
  }

  function guestById(id){
    return guests.find(g=>g.id===Number(id));
  }

  function guestAssignmentMap(){
    const map=new Map();
    elements.filter(e=>e.type==='table').forEach(table=>{
      ensureTableSeats(table);
      table.seats.forEach((guestId,seatIndex)=>{
        if(guestId!==null && guestId!=='' && guestId!==undefined){
          map.set(Number(guestId),{
            tableId:table.id,
            tableLabel:table.label,
            seatIndex,
            seatNumber:seatIndex+1
          });
        }
      });
    });
    return map;
  }

  function clearGuestFromAllSeats(guestId){
    const id=Number(guestId);
    elements.filter(e=>e.type==='table').forEach(table=>{
      ensureTableSeats(table);
      table.seats=table.seats.map(value=>Number(value)===id?null:value);
    });
  }

  function assignGuestToSeat(tableId,seatIndex,guestId){
    const table=getItem(tableId);
    if(!table || table.type!=='table') return;
    ensureTableSeats(table);
    const id=guestId==='' || guestId===null ? null : Number(guestId);
    if(id!==null) clearGuestFromAllSeats(id);
    table.seats[seatIndex]=id;
    guestVersion++;
    renderGuestManager();
    lastSeatEditorKey='';
    render();
  }

  function assignGuestsSequentially(showMessage=true){
    const tables=elements.filter(e=>e.type==='table').sort((a,b)=>a.id-b.id);
    tables.forEach(table=>{
      ensureTableSeats(table);
      table.seats=Array(10).fill(null);
    });
    let index=0;
    tables.forEach(table=>{
      for(let seat=0;seat<10 && index<guests.length;seat++){
        table.seats[seat]=guests[index++].id;
      }
    });
    guestVersion++;
    lastSeatEditorKey='';
    renderGuestManager();
    render();
    if(showMessage){
      const capacity=tables.length*10;
      alert(`Se asignaron ${Math.min(guests.length,capacity)} invitados por orden de lista.`);
    }
  }

  function clearAllAssignments(){
    elements.filter(e=>e.type==='table').forEach(table=>{
      ensureTableSeats(table);
      table.seats=Array(10).fill(null);
    });
    guestVersion++;
    lastSeatEditorKey='';
    renderGuestManager();
    render();
  }

  function compactGuestName(name,max=18){
    const value=String(name||'').trim();
    return value.length>max ? value.slice(0,max-1)+'…' : value;
  }

  function itemBounds(item){
    const s = mScale();
    const w = item.widthM*s;
    const h = item.heightM*s;
    return {x:item.x-w/2, y:item.y-h/2, w, h, cx:item.x, cy:item.y, r:Math.max(w,h)/2};
  }

  function rectPolygon(item){
    const s=mScale(), hw=item.widthM*s/2, hh=item.heightM*s/2;
    const angle=(item.rotation||0)*Math.PI/180;
    const cos=Math.cos(angle), sin=Math.sin(angle);
    return [[-hw,-hh],[hw,-hh],[hw,hh],[-hw,hh]].map(([x,y])=>({
      x:item.x+x*cos-y*sin,
      y:item.y+x*sin+y*cos
    }));
  }

  function axesFor(poly){
    const axes=[];
    for(let i=0;i<poly.length;i++){
      const a=poly[i], b=poly[(i+1)%poly.length];
      const ex=b.x-a.x, ey=b.y-a.y;
      const len=Math.hypot(ex,ey)||1;
      axes.push({x:-ey/len,y:ex/len});
    }
    return axes;
  }

  function project(poly,axis){
    const values=poly.map(p=>p.x*axis.x+p.y*axis.y);
    return {min:Math.min(...values),max:Math.max(...values)};
  }

  function polygonIntersectsPolygon(a,b){
    for(const axis of [...axesFor(a),...axesFor(b)]){
      const A=project(a,axis), B=project(b,axis);
      if(A.max<=B.min+3 || B.max<=A.min+3) return false;
    }
    return true;
  }

  function pointInPolygon(point,poly){
    let inside=false;
    for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const xi=poly[i].x, yi=poly[i].y;
      const xj=poly[j].x, yj=poly[j].y;
      const crossing=((yi>point.y)!=(yj>point.y)) &&
        (point.x < (xj-xi)*(point.y-yi)/((yj-yi)||1e-9)+xi);
      if(crossing) inside=!inside;
    }
    return inside;
  }

  function pointSegmentDistance(p,a,b){
    const vx=b.x-a.x, vy=b.y-a.y;
    const len2=vx*vx+vy*vy || 1;
    const t=Math.max(0,Math.min(1,((p.x-a.x)*vx+(p.y-a.y)*vy)/len2));
    return Math.hypot(p.x-(a.x+t*vx),p.y-(a.y+t*vy));
  }

  function circleIntersectsPolygon(circle,poly){
    if(pointInPolygon(circle,poly)) return true;
    for(let i=0;i<poly.length;i++){
      if(pointSegmentDistance(circle,poly[i],poly[(i+1)%poly.length]) < circle.r-3) return true;
    }
    return false;
  }

  function circleGeom(item){
    const b=itemBounds(item);
    return {x:item.x,y:item.y,r:b.r};
  }

  function intersects(a,b){
    const aCircle=a.shape==='table' || a.shape==='circle';
    const bCircle=b.shape==='table' || b.shape==='circle';

    if(aCircle && bCircle){
      const A=circleGeom(a), B=circleGeom(b);
      return Math.hypot(A.x-B.x,A.y-B.y) < A.r+B.r-5;
    }
    if(!aCircle && !bCircle){
      return polygonIntersectsPolygon(rectPolygon(a),rectPolygon(b));
    }
    const circle=aCircle?circleGeom(a):circleGeom(b);
    const poly=aCircle?rectPolygon(b):rectPolygon(a);
    return circleIntersectsPolygon(circle,poly);
  }

  function conflictIds(){
    const ids = new Set();
    const visible=getVisibleElements();
    for(let i=0;i<visible.length;i++){
      for(let j=i+1;j<visible.length;j++){
        if(visible[i].type==='tent' || visible[j].type==='tent') continue;
        if(intersects(visible[i],visible[j])){
          ids.add(visible[i].id); ids.add(visible[j].id);
        }
      }
    }
    return ids;
  }

  function chairMarkup(tableRadius){
    const chairR = Math.max(7, tableRadius*.12);
    const orbit = tableRadius*1.33;
    let out='';
    for(let i=0;i<10;i++){
      const a = (Math.PI*2*i/10)-Math.PI/2;
      const x = Math.cos(a)*orbit;
      const y = Math.sin(a)*orbit;
      out += `
        <g>
          <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${chairR.toFixed(1)}" fill="#f5efe5" stroke="#785e45" stroke-width="2"/>
          <text x="${x.toFixed(1)}" y="${(y+3).toFixed(1)}" text-anchor="middle" font-size="8" font-weight="800" fill="#684d34">${i+1}</text>
        </g>`;
    }
    return out;
  }

  function guestLabelsMarkup(item,tableRadius){
    if(!showGuestLabels.checked) return '';
    ensureTableSeats(item);
    const labelOrbit=tableRadius*2.18;
    let out='';
    for(let i=0;i<10;i++){
      const guest=guestById(item.seats[i]);
      if(!guest) continue;
      const a=(Math.PI*2*i/10)-Math.PI/2;
      const x=Math.cos(a)*labelOrbit;
      const y=Math.sin(a)*labelOrbit;
      const cos=Math.cos(a);
      const anchor=cos>.28?'start':cos<-.28?'end':'middle';
      const dx=cos>.28?5:cos<-.28?-5:0;
      const label=`${i+1}. ${compactGuestName(guest.name)}`;
      out += `
        <g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${-item.rotation})" pointer-events="none">
          <title>Asiento ${i+1}: ${esc(guest.name)}</title>
          <text x="${dx}" y="3" text-anchor="${anchor}" font-size="9.5" font-weight="800"
            fill="#2d2924" stroke="#ffffff" stroke-width="4" paint-order="stroke">${esc(label)}</text>
        </g>`;
    }
    return out;
  }

  function rotationHandleMarkup(item,topDistance,selected){
    if(!selected || isItemLocked(item)) return '';
    const y1=-topDistance;
    const y2=-(topDistance+28);
    const cy=-(topDistance+42);
    return `
      <g class="rotate-ui">
        <line x1="0" y1="${y1}" x2="0" y2="${y2}" stroke="#d59b3c" stroke-width="4" pointer-events="none"/>
        <circle class="rotate-handle" data-id="${item.id}" cx="0" cy="${cy}" r="14"
          fill="#d59b3c" stroke="#ffffff" stroke-width="4" style="cursor:grab"/>
        <path d="M -5 ${cy} A 6 6 0 1 1 4 ${cy-5}" fill="none" stroke="#ffffff" stroke-width="2.5" pointer-events="none"/>
        <path d="M 3 ${cy-8} L 8 ${cy-6} L 4 ${cy-2}" fill="#ffffff" pointer-events="none"/>
      </g>`;
  }

  function render(){
    if(!drawingTent){
      drawLayer.replaceChildren();
      drawLayer.setAttribute('display','none');
    }

    const s = mScale();
    const conflicts = conflictIds();
    const visibleElements=getVisibleElements();
    layer.innerHTML = visibleElements.map(item => {
      const w=item.widthM*s, h=item.heightM*s;
      const selected = isSelected(item.id);
      const danger = conflicts.has(item.id);
      const stroke = danger ? '#c84242' : selected ? '#d59b3c' : '#3d3a35';
      const strokeW = selected ? 5 : danger ? 5 : 3;
      const labelDisplay = showLabels.checked ? 'block' : 'none';

      if(item.type==='tent'){
        const points=(item.pointsM||[]).map(point=>({
          x:point.x*s,
          y:point.y*s
        }));
        const pointString=points.map(point=>`${point.x},${point.y}`).join(' ');
        const edgeLabels=showLabels.checked ? edgeMeasurementLabels(points,{
          metersPerUnit:1/s,
          closePolygon:true,
          parentRotation:item.rotation
        }) : '';
        const fillOpacity=Math.max(0,Math.min(1,1-(Number(item.transparency??85)/100)));
        const tentStroke=selected ? '#d59b3c' : (item.outlineColor||'#555555');
        const vertexHandles=selected ? points.map((point,index)=>`
          <circle class="vertex-handle tent-vertex" data-id="${item.id}" data-vertex-index="${index}"
            cx="${point.x}" cy="${point.y}" r="9"
            fill="#ffffff" stroke="#d59b3c" stroke-width="4"/>`).join('') : '';

        return `
        <g class="draggable" data-id="${item.id}"
          transform="translate(${item.x} ${item.y}) rotate(${item.rotation})"
          style="cursor:grab">
          <polygon points="${pointString}"
            fill="${item.fillColor||'#ffffff'}"
            fill-opacity="${fillOpacity}"
            stroke="${tentStroke}"
            stroke-width="${selected?5:4}"
            stroke-linejoin="round"/>
          ${edgeLabels}
          <text style="display:${labelDisplay}" text-anchor="middle" y="-5"
            font-size="18" font-weight="850" fill="#34322e"
            stroke="#ffffff" stroke-width="4" paint-order="stroke">${esc(item.label)}</text>
          <text style="display:${labelDisplay}" text-anchor="middle" y="18"
            font-size="13" fill="#34322e"
            stroke="#ffffff" stroke-width="3" paint-order="stroke">
            ${item.widthM.toFixed(1)} × ${item.heightM.toFixed(1)} m
          </text>
          ${vertexHandles}
          ${selected && isItemLocked(item) ? '<text class="locked-mark" text-anchor="middle" y="34">🔒</text>' : ''}
          ${rotationHandleMarkup(item,Math.max(h/2,25),selected)}
        </g>`;
      }

      if(item.shape==='table'){
        const clearR = w/2;
        const tableR = .915*s;
        return `
        <g class="draggable" data-id="${item.id}" transform="translate(${item.x} ${item.y}) rotate(${item.rotation})" style="cursor:grab" filter="url(#softShadow)">
          <circle r="${clearR}" fill="${item.color}" fill-opacity=".16" stroke="${stroke}" stroke-width="${strokeW}" stroke-dasharray="${showClearance.checked?'9 7':'0'}"/>
          ${showClearance.checked ? chairMarkup(tableR) : ''}
          ${guestLabelsMarkup(item,tableR)}
          <circle r="${tableR}" fill="${item.color}" stroke="#755e43" stroke-width="3"/>
          <circle r="${tableR*.55}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="2"/>
          <text style="display:${labelDisplay}" text-anchor="middle" y="-3" font-size="18" font-weight="800" fill="#342a20">${esc(item.label)}</text>
          <text style="display:${labelDisplay}" text-anchor="middle" y="20" font-size="14" fill="#342a20">10 personas</text>
          ${rotationHandleMarkup(item,clearR,selected)}
        </g>`;
      }

      if(item.shape==='circle'){
        return `
        <g class="draggable" data-id="${item.id}" transform="translate(${item.x} ${item.y}) rotate(${item.rotation})" style="cursor:grab" filter="url(#softShadow)">
          <ellipse rx="${w/2}" ry="${h/2}" fill="${item.color}" fill-opacity=".84" stroke="${stroke}" stroke-width="${strokeW}"/>
          <text style="display:${labelDisplay}" text-anchor="middle" y="5" font-size="15" font-weight="800" fill="#2f2924">${esc(item.label)}</text>
          ${rotationHandleMarkup(item,h/2,selected)}
        </g>`;
      }

      const isMirror=item.type==='mirror';
      const mirrorLabelY=-h/2-9;
      return `
      <g class="draggable" data-id="${item.id}" transform="translate(${item.x} ${item.y}) rotate(${item.rotation})" style="cursor:grab" filter="url(#softShadow)">
        <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${isMirror?2:10}"
          fill="${item.color}" fill-opacity="${isMirror?.72:.88}"
          stroke="${stroke}" stroke-width="${strokeW}"/>
        ${isMirror
          ? `<line x1="${-w/2+3}" y1="0" x2="${w/2-3}" y2="0" stroke="#ffffff" stroke-width="2" stroke-opacity=".85"/>`
          : `<path d="M ${-w/2+12} ${-h/2+12} L ${w/2-12} ${h/2-12} M ${w/2-12} ${-h/2+12} L ${-w/2+12} ${h/2-12}" stroke="#ffffff" stroke-opacity=".18" stroke-width="3"/>`}
        <text style="display:${labelDisplay}" text-anchor="middle"
          y="${isMirror?mirrorLabelY:-2}" font-size="${isMirror?11:17}"
          font-weight="800" fill="#2c2723"
          stroke="${isMirror?'#ffffff':'none'}" stroke-width="${isMirror?3:0}"
          paint-order="stroke">${esc(item.label)}</text>
        <text style="display:${labelDisplay}" text-anchor="middle"
          y="${isMirror?mirrorLabelY+13:21}" font-size="${isMirror?9:13}"
          fill="#2c2723" stroke="${isMirror?'#ffffff':'none'}"
          stroke-width="${isMirror?3:0}" paint-order="stroke">
          ${item.widthM.toFixed(1)} × ${item.heightM.toFixed(1)} m
        </text>
        ${selected && isItemLocked(item) ? '<text class="locked-mark" text-anchor="middle" y="18">🔒</text>' : ''}
        ${rotationHandleMarkup(item,Math.max(h/2,isMirror?12:0),selected)}
      </g>`;
    }).join('');

    renderMeasureLayer();
    renderGuideLayer();
    updateStats(conflicts);
    updateSelectionPanel();
    updateSelectionHints();
    scheduleAutosave();
  }

  function updateStats(conflicts=conflictIds()){
    const visible=getVisibleElements();
    const tables = visible.filter(e=>e.type==='table').length;
    const people = visible.reduce((n,e)=>n+(e.capacity||0),0);
    document.getElementById('statTables').textContent=tables;
    document.getElementById('statPeople').textContent=people;
    document.getElementById('statItems').textContent=visible.length;
    document.getElementById('statConflicts').textContent=conflicts.size;
    const assigned=guestAssignmentMap().size;
    document.getElementById('statGuests').textContent=guests.length;
    document.getElementById('statAssigned').textContent=assigned;

    const box=document.getElementById('statusBox');
    if(conflicts.size){
      box.className='status bad';
      box.textContent=`Hay ${conflicts.size} elemento(s) involucrados en superposiciones. Muévelos hasta que dejen de aparecer en rojo.`;
    }else{
      box.className='status ok';
      box.textContent='La distribución no presenta superposiciones entre mobiliarios.';
    }
    renderValidationPanel();
    renderLayerPanel();
  }

  function updateSelectionPanel(){
    const item=getItem(selectedId);
    if(!item){
      selectionForm.classList.add('hidden');
      selectionEmpty.classList.remove('hidden');
      tentStyleFields.classList.add('hidden');
      lockedNote.classList.add('hidden');
      renderSeatEditor();
      return;
    }
    selectionForm.classList.remove('hidden');
    selectionEmpty.classList.add('hidden');
    selLabel.value=item.label;
    selX.value=Math.round(item.x);
    selY.value=Math.round(item.y);
    selW.value=Number(item.widthM).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    selH.value=Number(item.heightM).toFixed(2).replace(/0+$/,'').replace(/\.$/,'');
    selRot.value=item.rotation;

    const locked=isItemLocked(item);
    [selLabel,selX,selY,selW,selH,selRot,btnBringFront,btnSendBack,btnAlignNow].forEach(ctrl=>ctrl.disabled=locked);
    btnDelete.disabled=locked;
    btnDuplicate.disabled=locked;
    btnToggleLock.textContent=locked ? '🔓 Desbloquear' : '🔒 Bloquear';
    lockedNote.classList.toggle('hidden',!locked);

    const unlimited=item.type==='tent' || item.type==='dance';
    if(unlimited){
      selW.removeAttribute('max');
      selH.removeAttribute('max');
      dimensionLimitNote.textContent='Sin límite de 5 m para este elemento.';
    }else{
      selW.max='5';
      selH.max='5';
      dimensionLimitNote.textContent='Máximo permitido para este elemento: 5 m por lado.';
    }

    const isTent=item.type==='tent';
    tentStyleFields.classList.toggle('hidden',!isTent);
    if(isTent){
      tentFillColor.value=item.fillColor||'#ffffff';
      const transparency=Math.round(Number(item.transparency??85));
      tentTransparencyRange.value=transparency;
      tentTransparencyNumber.value=transparency;
    }

    renderSeatEditor();
  }

  function renderSeatEditor(){
    const table=getItem(selectedId);
    if(!table || table.type!=='table'){
      seatEditorWrap.classList.add('hidden');
      seatEditor.innerHTML='';
      lastSeatEditorKey='';
      return;
    }
    ensureTableSeats(table);
    seatEditorWrap.classList.remove('hidden');
    const key=`${table.id}:${guestVersion}:${table.label}`;
    if(key===lastSeatEditorKey) return;
    lastSeatEditorKey=key;
    const assignments=guestAssignmentMap();

    seatEditor.innerHTML=table.seats.map((guestId,index)=>{
      const options=[
        '<option value="">— Sin asignar —</option>',
        ...guests.map(guest=>{
          const location=assignments.get(guest.id);
          const elsewhere=location && !(location.tableId===table.id && location.seatIndex===index);
          const suffix=elsewhere?` — ${location.tableLabel}, A${location.seatNumber}`:'';
          return `<option value="${guest.id}" ${Number(guestId)===guest.id?'selected':''}>${esc(guest.name+suffix)}</option>`;
        })
      ].join('');
      return `<div class="seat-row">
        <label>Asiento ${index+1}</label>
        <select data-table-id="${table.id}" data-seat-index="${index}">${options}</select>
      </div>`;
    }).join('');
  }

  function renderGuestManager(){
    const assignments=guestAssignmentMap();
    const query=(guestSearch?.value||'').trim().toLocaleLowerCase('es');
    const filtered=guests.filter(g=>g.name.toLocaleLowerCase('es').includes(query));
    document.getElementById('guestCountText').textContent=`${guests.length} invitados`;
    document.getElementById('guestPendingText').textContent=`${Math.max(0,guests.length-assignments.size)} sin asignar`;

    guestList.innerHTML=filtered.length ? filtered.map((guest,index)=>{
      const originalIndex=guests.findIndex(g=>g.id===guest.id)+1;
      const location=assignments.get(guest.id);
      const locationText=location?`${location.tableLabel} · Asiento ${location.seatNumber}`:'Sin asignar';
      return `<div class="guest-row" data-guest-id="${guest.id}">
        <div class="guest-num">${originalIndex}</div>
        <div class="guest-main">
          <input type="text" value="${esc(guest.name)}" data-guest-name="${guest.id}" aria-label="Nombre del invitado ${originalIndex}">
          <div class="guest-location">${esc(locationText)}</div>
        </div>
        <button class="guest-delete danger" data-delete-guest="${guest.id}" title="Eliminar invitado">×</button>
      </div>`;
    }).join('') : '<div class="guest-empty">No se encontraron invitados.</div>';
  }

  function addGuestNames(names){
    const clean=names.map(name=>String(name).trim()).filter(Boolean);
    if(!clean.length) return;
    clean.forEach(name=>guests.push({id:guestUid++,name}));
    guestVersion++;
    lastSeatEditorKey='';
    renderGuestManager();
    render();
  }

  function svgPoint(evt){
    const p=svg.createSVGPoint();
    p.x=evt.clientX; p.y=evt.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }

  svg.addEventListener('pointerdown', e=>{
    if(measureMode){
      e.preventDefault();
      const point=svgPoint(e);
      if(!measureDraft?.start){
        measureDraft={start:point,end:point};
      }else{
        measurements.push({id:measureUid++,x1:measureDraft.start.x,y1:measureDraft.start.y,x2:point.x,y2:point.y});
        measureDraft=null;
        commitMutation();
      }
      renderMeasureLayer();
      return;
    }

    if(drawingTent){
      e.preventDefault();
      const point=svgPoint(e);

      if(tentDraft.length>=3){
        const first=tentDraft[0];
        if(Math.hypot(point.x-first.x,point.y-first.y)<=18){
          finishTentDrawing();
          return;
        }
      }

      tentDraft.push({x:point.x,y:point.y});
      tentHoverPoint=null;
      renderTentDraft();
      return;
    }

    const vertexHandle=e.target.closest('.vertex-handle');
    if(vertexHandle){
      e.preventDefault();
      const id=Number(vertexHandle.dataset.id);
      const item=getItem(id);
      if(!item || item.type!=='tent' || isItemLocked(item)) return;
      setSelection([id],id);
      drag={mode:'vertex',id,vertexIndex:Number(vertexHandle.dataset.vertexIndex),pointerId:e.pointerId};
      svg.setPointerCapture(e.pointerId);
      render();
      return;
    }

    const rotateHandle=e.target.closest('.rotate-handle');
    if(rotateHandle){
      e.preventDefault();
      const id=Number(rotateHandle.dataset.id);
      const item=getItem(id);
      if(!item || isItemLocked(item)) return;
      setSelection(isSelected(id)?selectedIds:[id],id);
      const p=svgPoint(e);
      drag={mode:'rotate',id,startAngle:Math.atan2(p.y-item.y,p.x-item.x),startRotation:item.rotation||0,pointerId:e.pointerId};
      svg.setPointerCapture(e.pointerId);
      render();
      return;
    }

    const g=e.target.closest('.draggable');
    if(!g){
      clearSelection();
      render();
      return;
    }
    e.preventDefault();
    const id=Number(g.dataset.id);
    const item=getItem(id);
    if(!item || isItemLocked(item)) return;

    if(e.ctrlKey || e.metaKey){
      if(isSelected(id)){
        const remaining=selectedIds.filter(value=>value!==id);
        setSelection(remaining, remaining[0]||null);
      }else{
        setSelection([...selectedIds,id],id);
      }
      render();
      return;
    }

    if(!isSelected(id)) setSelection([id],id);
    const group=selectedItems();
    const p=svgPoint(e);
    drag={
      mode:'move',
      id,
      dx:p.x-item.x,
      dy:p.y-item.y,
      pointerId:e.pointerId,
      group:group.map(entry=>({id:entry.id,startX:entry.x,startY:entry.y})),
      originX:item.x,
      originY:item.y
    };
    svg.setPointerCapture(e.pointerId);
    render();
  });

  svg.addEventListener('pointermove', e=>{
    if(measureMode && measureDraft?.start){
      measureDraft.end=svgPoint(e);
      renderMeasureLayer();
      return;
    }

    if(drawingTent && !drag){
      tentHoverPoint=svgPoint(e);
      renderTentDraft();
      return;
    }

    if(!drag) return;
    const item=getItem(drag.id);
    if(!item) return;
    const p=svgPoint(e);

    if(drag.mode==='vertex' && item.type==='tent'){
      const angle=-(item.rotation||0)*Math.PI/180;
      const dx=p.x-item.x;
      const dy=p.y-item.y;
      const localX=dx*Math.cos(angle)-dy*Math.sin(angle);
      const localY=dx*Math.sin(angle)+dy*Math.cos(angle);
      item.pointsM[drag.vertexIndex]={x:localX/mScale(),y:localY/mScale()};
      refreshTentDimensions(item);
      render();
      return;
    }

    if(drag.mode==='rotate'){
      const currentAngle=Math.atan2(p.y-item.y,p.x-item.x);
      let rotation=drag.startRotation+(currentAngle-drag.startAngle)*180/Math.PI;
      if(e.shiftKey) rotation=Math.round(rotation/15)*15;
      item.rotation=Math.round(rotation*10)/10;
      render();
      return;
    }

    const intendedX=Math.max(0,Math.min(1448,p.x-drag.dx));
    const intendedY=Math.max(0,Math.min(1086,p.y-drag.dy));
    const snapped=applySmartGuides(intendedX,intendedY,drag.group.map(entry=>entry.id));
    const shiftX=snapped.x-drag.originX;
    const shiftY=snapped.y-drag.originY;

    drag.group.forEach(entry=>{
      const current=getItem(entry.id);
      if(!current) return;
      current.x=Math.max(0,Math.min(1448,entry.startX+shiftX));
      current.y=Math.max(0,Math.min(1086,entry.startY+shiftY));
    });
    render();
  });

  function endDrag(e){
    if(drag && e.pointerId===drag.pointerId){
      drag=null;
      guideLines={vertical:null,horizontal:null};
      try{svg.releasePointerCapture(e.pointerId)}catch(_){}
      render();
      scheduleHistoryRecord(0);
    }
  }
  svg.addEventListener('pointerup',endDrag);
  svg.addEventListener('pointercancel',endDrag);

  btnDrawTent.addEventListener('click',()=>{
    if(!drawingTent){
      startTentDrawing();
    }else{
      finishTentDrawing();
    }
  });

  document.querySelectorAll('[data-add]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const type=btn.dataset.add;
      const index=elements.length;
      addElement(type, 950+(index%3)*70, 500+(index%4)*60);
    });
  });

  selLabel.addEventListener('input',()=>{
    const item=getItem(selectedId); if(!item || isItemLocked(item))return;
    item.label=selLabel.value;
    commitMutation();
  });

  selX.addEventListener('input',()=>{
    const item=getItem(selectedId); if(!item || isItemLocked(item))return;
    item.x=Number(selX.value)||0;
    commitMutation();
  });

  selY.addEventListener('input',()=>{
    const item=getItem(selectedId); if(!item || isItemLocked(item))return;
    item.y=Number(selY.value)||0;
    commitMutation();
  });

  selRot.addEventListener('input',()=>{
    const item=getItem(selectedId); if(!item || isItemLocked(item))return;
    item.rotation=Number(selRot.value)||0;
    commitMutation();
  });

  selW.addEventListener('input',()=>{
    const item=getItem(selectedId); if(!item || isItemLocked(item))return;
    const nextWidth=clampDimension(item,selW.value);

    if(item.type==='tent'){
      scaleTent(item,nextWidth,item.heightM);
    }else if(item.type==='table'){
      item.widthM=nextWidth;
      item.heightM=nextWidth;
      selH.value=nextWidth;
    }else{
      item.widthM=nextWidth;
    }

    selW.value=item.widthM;
    commitMutation();
  });

  selH.addEventListener('input',()=>{
    const item=getItem(selectedId); if(!item || isItemLocked(item))return;
    const nextHeight=clampDimension(item,selH.value);

    if(item.type==='tent'){
      scaleTent(item,item.widthM,nextHeight);
    }else if(item.type==='table'){
      item.widthM=nextHeight;
      item.heightM=nextHeight;
      selW.value=nextHeight;
    }else{
      item.heightM=nextHeight;
    }

    selH.value=item.heightM;
    commitMutation();
  });

  function updateTentTransparency(value){
    const item=getItem(selectedId);
    if(!item || item.type!=='tent' || isItemLocked(item)) return;
    const transparency=Math.max(0,Math.min(100,Number(value)||0));
    item.transparency=transparency;
    tentTransparencyRange.value=transparency;
    tentTransparencyNumber.value=transparency;
    commitMutation();
  }

  tentFillColor.addEventListener('input',()=>{
    const item=getItem(selectedId);
    if(!item || item.type!=='tent' || isItemLocked(item)) return;
    item.fillColor=tentFillColor.value;
    commitMutation();
  });

  tentTransparencyRange.addEventListener('input',()=>updateTentTransparency(tentTransparencyRange.value));
  tentTransparencyNumber.addEventListener('input',()=>updateTentTransparency(tentTransparencyNumber.value));

  selLabel.addEventListener('change',()=>{guestVersion++;lastSeatEditorKey='';renderGuestManager();render();});

  document.getElementById('btnRotLeft').onclick=()=>{const i=getItem(selectedId);if(i && !isItemLocked(i)){i.rotation-=15;commitMutation();}};
  document.getElementById('btnRotRight').onclick=()=>{const i=getItem(selectedId);if(i && !isItemLocked(i)){i.rotation+=15;commitMutation();}};
  document.getElementById('btnDelete').onclick=()=>{
    if(!selectedIds.length) return;
    const ids=new Set(selectedIds);
    elements=elements.filter(e=>!ids.has(e.id));
    clearSelection();
    guestVersion++;lastSeatEditorKey='';renderGuestManager();commitMutation();
  };
  document.getElementById('btnDuplicate').onclick=()=>{
    const i=getItem(selectedId); if(!i || isItemLocked(i))return;
    const copy={
      ...i,
      id:uid++,
      x:i.x+35,
      y:i.y+35,
      label:i.label+' copia',
      seats:i.type==='table'?Array(10).fill(null):i.seats,
      pointsM:i.type==='tent'?(i.pointsM||[]).map(point=>({...point})):i.pointsM,
      locked:false
    };
    elements.push(copy);setSelection([copy.id],copy.id);commitMutation();
  };
  btnToggleLock.onclick=toggleLockSelected;
  btnBringFront.onclick=bringSelectedFront;
  btnSendBack.onclick=sendSelectedBack;
  btnAlignNow.onclick=alignSelectedGroup;

  scaleInput.addEventListener('input',()=>{render();scheduleHistoryRecord();});
  showClearance.addEventListener('change',()=>{render();scheduleHistoryRecord();});
  showLabels.addEventListener('change',()=>{render();scheduleHistoryRecord();});
  showGuestLabels.addEventListener('change',()=>{render();scheduleHistoryRecord();});
  showGrid.addEventListener('change',()=>{
    gridLayer.setAttribute('opacity',showGrid.checked?'.72':'0');
    scheduleAutosave();
  });

  function normalizeLoadedElements(list=[]){
    return list.map(item=>{
      let normalized=item;
      if(item.type==='buffet'){
        normalized={...item,type:'altar',label:item.label==='Buffet'?'Altar':item.label,color:'#e3d3ae',widthM:item.widthM||4,heightM:item.heightM||2};
      }
      if(normalized.type==='table'){
        normalized={...normalized,seats:Array.isArray(normalized.seats)?normalized.seats.slice(0,10):Array(10).fill(null)};
        while(normalized.seats.length<10) normalized.seats.push(null);
      }
      if(normalized.type==='tent'){
        normalized={
          ...normalized,
          shape:'polygon',
          fillColor:normalized.fillColor||normalized.color||'#ffffff',
          transparency:Number.isFinite(Number(normalized.transparency))?Number(normalized.transparency):85,
          outlineColor:normalized.outlineColor||'#555555',
          pointsM:Array.isArray(normalized.pointsM)?normalized.pointsM.map(point=>({x:Number(point.x)||0,y:Number(point.y)||0})):[]
        };
        refreshTentDimensions(normalized);
      }
      if(normalized.type!=='tent' && normalized.type!=='dance'){
        normalized.widthM=Math.min(5,Math.max(.1,Number(normalized.widthM)||.1));
        normalized.heightM=Math.min(5,Math.max(.1,Number(normalized.heightM)||.1));
      }
      normalized.locked=Boolean(normalized.locked);
      return normalized;
    });
  }

  seatEditor.addEventListener('change',e=>{
    const select=e.target.closest('select[data-seat-index]');
    if(!select) return;
    assignGuestToSeat(Number(select.dataset.tableId),Number(select.dataset.seatIndex),select.value);
  });

  document.getElementById('btnAssignGuests').addEventListener('click',()=>assignGuestsSequentially(true));
  document.getElementById('btnClearAssignments').addEventListener('click',()=>{
    if(confirm('¿Desasignar a todos los invitados de las mesas?')) clearAllAssignments();
  });

  document.getElementById('btnAddGuest').addEventListener('click',()=>{
    addGuestNames([newGuestName.value]);
    newGuestName.value='';
    newGuestName.focus();
  });
  newGuestName.addEventListener('keydown',e=>{
    if(e.key==='Enter'){
      e.preventDefault();
      document.getElementById('btnAddGuest').click();
    }
  });

  document.getElementById('btnAddBulkGuests').addEventListener('click',()=>{
    addGuestNames(bulkGuests.value.split(/\r?\n/));
    bulkGuests.value='';
  });

  guestSearch.addEventListener('input',renderGuestManager);

  guestList.addEventListener('input',e=>{
    const input=e.target.closest('input[data-guest-name]');
    if(!input) return;
    const guest=guestById(input.dataset.guestName);
    if(!guest) return;
    guest.name=input.value;
    guestVersion++;
    lastSeatEditorKey='';
    render();
  });

  guestList.addEventListener('change',e=>{
    const input=e.target.closest('input[data-guest-name]');
    if(input) renderGuestManager();
  });

  guestList.addEventListener('click',e=>{
    const button=e.target.closest('[data-delete-guest]');
    if(!button) return;
    const id=Number(button.dataset.deleteGuest);
    const guest=guestById(id);
    if(!guest) return;
    if(!confirm(`¿Eliminar a "${guest.name}" de la lista?`)) return;
    clearGuestFromAllSeats(id);
    guests=guests.filter(g=>g.id!==id);
    guestVersion++;
    lastSeatEditorKey='';
    renderGuestManager();
    render();
  });

  document.addEventListener('keydown',e=>{
    const tag=(document.activeElement?.tagName||'').toLowerCase();
    const editingText=
      tag==='input' ||
      tag==='select' ||
      tag==='textarea' ||
      document.activeElement?.isContentEditable;

    if(!editingText && (e.ctrlKey || e.metaKey)){
      const key=e.key.toLowerCase();

      if(key==='c'){
        if(copySelectedPlannerItems()){
          e.preventDefault();
        }
        return;
      }

      if(key==='v'){
        if(pasteCopiedPlannerItems()){
          e.preventDefault();
        }
        return;
      }
    }

    if(drawingTent){
      if(e.key==='Enter'){
        e.preventDefault();
        finishTentDrawing();
      }else if(e.key==='Escape'){
        e.preventDefault();
        cancelTentDrawing();
      }
      return;
    }

    if(editingText) return;
    const item=getItem(selectedId);
    if(!item) return;

    if(e.key==='Delete' || e.key==='Backspace'){
      const removableIds=new Set(
        (selectedIds.length?selectedIds:[selectedId])
          .filter(id=>{
            const selectedItem=getItem(id);
            return selectedItem && !isItemLocked(selectedItem);
          })
      );

      if(!removableIds.size) return;

      e.preventDefault();
      elements=elements.filter(element=>!removableIds.has(element.id));
      clearSelection();
      guestVersion++;
      lastSeatEditorKey='';
      renderGuestManager();
      commitMutation();
    }else if(e.key.toLowerCase()==='r'){
      e.preventDefault();
      if(isItemLocked(item)) return;
      item.rotation+=(e.shiftKey?-15:15);
      commitMutation();
    }else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)){
      e.preventDefault();
      const step=e.shiftKey?10:2;
      if(e.key==='ArrowUp') item.y-=step;
      if(e.key==='ArrowDown') item.y+=step;
      if(isItemLocked(item)) return;
      if(e.key==='ArrowLeft') item.x-=step;
      if(e.key==='ArrowRight') item.x+=step;
      commitMutation();
    }
  });

  document.getElementById('btnAuto').onclick=autoLayout;

  document.getElementById('btnSave').onclick=async()=>{
    await saveCurrentProposal({silent:false,forceThumbnail:true});
  };

  document.getElementById('btnSaveAs').onclick=async()=>{
    await saveCurrentAsNewProposal();
  };

  document.getElementById('btnClear').onclick=()=>{
    if(confirm('¿Eliminar todos los elementos colocados?')){
      elements=[];clearSelection();measurements=[];guestVersion++;lastSeatEditorKey='';renderGuestManager();commitMutation();
    }
  };

  document.getElementById('btnJson').onclick=()=>{
    const safeName=(currentProposalName||'distribucion_evento')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9_-]+/g,'_')
      .replace(/^_+|_+$/g,'')
      .toLowerCase()||'distribucion_evento';

    const blob=new Blob([JSON.stringify(buildPlannerSnapshot(),null,2)],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);
    a.download=`${safeName}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  document.getElementById('btnImport').onclick=()=>document.getElementById('fileImport').click();
  document.getElementById('fileImport').addEventListener('change',e=>{
    const file=e.target.files[0]; if(!file)return;
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const d=JSON.parse(reader.result);
        applyPlannerSnapshot(d);
        autosaveEnabled=true;
        scheduleAutosave(50);
        historyPast=[];historyFuture=[];pushHistorySnapshot(); showProposalToast('Respaldo importado y guardado automáticamente');
      }catch(err){alert('El archivo no contiene un diseño válido.');}
    };
    reader.readAsText(file);
    e.target.value='';
  });

  document.getElementById('btnExport').onclick=()=>{
    const clone=svg.cloneNode(true);
    clone.setAttribute('width','1448');
    clone.setAttribute('height','1086');
    clone.setAttribute('xmlns','http://www.w3.org/2000/svg');
    clone.querySelectorAll('.rotate-ui').forEach(node=>node.remove());
    clone.querySelectorAll('.vertex-handle').forEach(node=>node.remove());
    const temporaryDrawLayer=clone.querySelector('#drawLayer');
    if(temporaryDrawLayer) temporaryDrawLayer.innerHTML='';

    const xml=new XMLSerializer().serializeToString(clone);
    const blob=new Blob([xml],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(blob);
    const img=new Image();
    img.onload=()=>{
      const canvas=document.createElement('canvas');
      canvas.width=1448;canvas.height=1086;
      const ctx=canvas.getContext('2d');
      ctx.fillStyle='#ffffff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img,0,0);
      URL.revokeObjectURL(url);
      const a=document.createElement('a');
      a.download='plano_distribucion_evento.png';
      a.href=canvas.toDataURL('image/png');
      a.click();
    };
    img.onerror=()=>{URL.revokeObjectURL(url);alert('No fue posible exportar la imagen.');};
    img.src=url;
  };

  document.getElementById('zoomIn').onclick=()=>{
    zoom=Math.min(1.8,zoom+.1);
    svg.style.width=(zoom*100)+'%';
    document.getElementById('zoomReset').textContent=Math.round(zoom*100)+'%';
  };
  document.getElementById('zoomOut').onclick=()=>{
    zoom=Math.max(.6,zoom-.1);
    svg.style.width=(zoom*100)+'%';
    document.getElementById('zoomReset').textContent=Math.round(zoom*100)+'%';
  };
  document.getElementById('zoomReset').onclick=()=>{
    zoom=1;svg.style.width='100%';document.getElementById('zoomReset').textContent='100%';
  };
  document.getElementById('toggleBg').onclick=e=>{
    bgVisible=!bgVisible;
    bgImage.setAttribute('opacity',bgVisible?'1':'0');
    e.target.textContent=bgVisible?'Ocultar plano':'Mostrar plano';
    scheduleAutosave();
    scheduleHistoryRecord();
  };

  btnUndo.addEventListener('click',undoHistory);
  btnRedo.addEventListener('click',redoHistory);
  btnPresentation.addEventListener('click',()=>{
    document.body.classList.toggle('presentation-mode');
    btnPresentation.textContent=document.body.classList.contains('presentation-mode') ? 'Salir vista' : 'Vista final';
  });
  btnMeasure.addEventListener('click',()=>toggleMeasureMode());
  btnClearMeasures.addEventListener('click',()=>{measurements=[];measureDraft=null;renderMeasureLayer();scheduleHistoryRecord();});
  btnShowAllLayers.addEventListener('click',()=>{hiddenLayers={};render();scheduleHistoryRecord();});
  btnUnlockAllLayers.addEventListener('click',()=>{lockedLayers={};elements.forEach(item=>item.locked=false);render();scheduleHistoryRecord();});

  layerList.addEventListener('click',event=>{
    const button=event.target.closest('[data-layer-action]');
    if(!button) return;
    const action=button.dataset.layerAction;
    const type=button.dataset.layerType;
    if(action==='toggle-visibility'){
      hiddenLayers[type]=!hiddenLayers[type];
      if(hiddenLayers[type]){
        setSelection(selectedIds.filter(id=>getItem(id)?.type!==type), selectedId && getItem(selectedId)?.type!==type ? selectedId : null);
      }
      render();
      scheduleHistoryRecord();
    }
    if(action==='toggle-lock'){
      lockedLayers[type]=!lockedLayers[type];
      render();
      scheduleHistoryRecord();
    }
  });

  document.getElementById('btnProposals').addEventListener('click',openProposalModal);
  document.getElementById('btnCloseProposals').addEventListener('click',closeProposalModal);
  document.getElementById('btnNewProposal').addEventListener('click',()=>createProposal({duplicate:false}));
  document.getElementById('btnDuplicateCurrent').addEventListener('click',()=>createProposal({duplicate:true}));

  proposalModal.addEventListener('click',event=>{
    if(event.target===proposalModal) closeProposalModal();
  });

  proposalList.addEventListener('click',async event=>{
    const button=event.target.closest('[data-proposal-action]');
    if(!button) return;

    const action=button.dataset.proposalAction;
    const id=button.dataset.proposalId;
    const record=await storageGetProposal(id);

    if(!record) return;

    if(action==='open'){
      if(id===currentProposalId){
        closeProposalModal();
        return;
      }

      await saveCurrentProposal({silent:true});
      await loadProposalRecord(record,{announce:true});
      closeProposalModal();
      return;
    }

    if(action==='rename'){
      const name=prompt('Nuevo nombre de la propuesta:',record.name||'Propuesta');
      if(name===null) return;

      record.name=name.trim()||record.name||'Propuesta';
      record.updatedAt=new Date().toISOString();
      await storagePutProposal(record);

      if(id===currentProposalId){
        currentProposalName=record.name;
        setAutosaveStatus('saved',`Guardado · ${currentProposalName}`,'Memoria del navegador');
      }

      await renderProposalList();
      showProposalToast('Propuesta renombrada');
      return;
    }

    if(action==='duplicate'){
      const proposals=await storageListProposals();

      if(proposals.length>=MAX_PROPOSALS){
        alert(`Puedes guardar como máximo ${MAX_PROPOSALS} propuestas.`);
        return;
      }

      const name=prompt('Nombre de la copia:',`${record.name} copia`);
      if(name===null) return;

      const now=new Date().toISOString();
      const copy={
        id:createId(),
        name:name.trim()||`${record.name} copia`,
        createdAt:now,
        updatedAt:now,
        thumbnail:record.thumbnail||null,
        data:cloneData(record.data)
      };

      await storagePutProposal(copy);
      await renderProposalList();
      showProposalToast('Propuesta duplicada');
      return;
    }

    if(action==='delete'){
      if(!confirm(`¿Eliminar la propuesta "${record.name}"?`)) return;

      await storageDeleteProposal(id);
      const remaining=await storageListProposals();

      if(id===currentProposalId){
        if(remaining.length){
          await loadProposalRecord(remaining[0],{announce:false});
        }else{
          currentProposalId=createId();
          currentProposalName='Propuesta principal';
          applyPlannerSnapshot(createBlankSnapshot());
          autosaveEnabled=true;
          await saveCurrentProposal({silent:true,forceThumbnail:true});
        }
      }

      await renderProposalList();
      showProposalToast('Propuesta eliminada');
    }
  });

  document.querySelectorAll('.action-menu button').forEach(button=>{
    button.addEventListener('click',()=>{
      button.closest('.action-menu')?.removeAttribute('open');
    });
  });

  document.addEventListener('click',event=>{
    document.querySelectorAll('.action-menu[open]').forEach(menu=>{
      if(!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });

  document.addEventListener('keydown',event=>{
    if((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='z' && !event.shiftKey){
      event.preventDefault();
      undoHistory();
      return;
    }
    if(((event.ctrlKey || event.metaKey) && event.key.toLowerCase()==='y') || ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase()==='z')){
      event.preventDefault();
      redoHistory();
      return;
    }
    if(event.key==='Escape' && measureMode){
      toggleMeasureMode(false);
      return;
    }
    if(event.key==='Escape' && !proposalModal.classList.contains('hidden')){
      closeProposalModal();
    }
  });

  document.addEventListener('visibilitychange',()=>{
    if(document.visibilityState==='hidden'){
      writeEmergencyBackup();
      saveCurrentProposal({silent:true});
    }
  });

  window.addEventListener('pagehide',()=>{
    writeEmergencyBackup();
    saveCurrentProposal({silent:true});
  });

  initializePlannerStorage().then(()=>{
    updateMeasureUI();
    pushHistorySnapshot();
    updateHistoryButtons();
  });
})();
