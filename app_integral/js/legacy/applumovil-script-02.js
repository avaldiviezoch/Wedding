
(() => {
  const toolPanel=document.querySelector('.layout > aside.panel:not(.right-panel)');
  const detailPanel=document.querySelector('.right-panel');
  const actionsPanel=document.querySelector('.top-actions');
  const backdrop=document.getElementById('mobileBackdrop');
  const navButtons=[...document.querySelectorAll('.mobile-nav-button')];
  const fabDock=document.getElementById('mobileMapDock');
  const fabMain=document.getElementById('mobileMapFabMain');
  const fabActions=[...document.querySelectorAll('.mobile-map-action')];
  const btnMeasure=document.getElementById('btnMeasure');
  const btnPresentation=document.getElementById('btnPresentation');
  const btnProposals=document.getElementById('btnProposals');

  if(!toolPanel || !detailPanel || !actionsPanel || !backdrop) return;

  // Se mueve fuera del encabezado para evitar que el apilamiento del header
  // oculte el panel de acciones detrás del fondo móvil.
  document.body.appendChild(actionsPanel);

  function addSheetHeader(panel,title){
    if(panel.querySelector(':scope > .mobile-sheet-head')) return;

    const head=document.createElement('div');
    head.className='mobile-sheet-head';
    head.innerHTML=`
      <strong>${title}</strong>
      <button type="button" class="mobile-sheet-close" aria-label="Cerrar">×</button>
    `;

    panel.prepend(head);
    head.querySelector('button').addEventListener('click',closeSheets);
  }

  addSheetHeader(toolPanel,'Elementos y configuración');
  addSheetHeader(detailPanel,'Detalles, revisión, capas e invitados');
  addSheetHeader(actionsPanel,'Diseño, propuestas y archivos');

  function updateFabMenuDirection(){
    if(!fabDock) return;

    const menu=fabDock.querySelector('.mobile-map-fab-menu');
    const button=fabMain||fabDock;
    const rect=button.getBoundingClientRect();

    const estimatedMenuHeight=Math.max(
      210,
      menu?.scrollHeight||0
    );

    const availableAbove=rect.top-12;
    const availableBelow=window.innerHeight-rect.bottom-12;

    // En la parte inferior, el menú sale hacia arriba.
    // Cuando el botón sube por la apertura de un panel y ya no hay
    // espacio suficiente arriba, las opciones salen hacia abajo.
    const shouldOpenDown=
      availableAbove<estimatedMenuHeight &&
      availableBelow>availableAbove;

    fabDock.classList.toggle('menu-down',shouldOpenDown);
    fabDock.classList.toggle('menu-up',!shouldOpenDown);
  }

  function setFabOpen(force){
    if(!fabDock) return;
    const nextState=force!==undefined ? force : !fabDock.classList.contains('open');

    if(nextState){
      updateFabMenuDirection();
    }

    fabDock.classList.toggle('open',nextState);

    if(fabMain){
      fabMain.classList.toggle('active',nextState);
      fabMain.textContent=nextState ? '×' : '☰';
    }
  }

  function setActiveNav(name){
    navButtons.forEach(button=>{
      button.classList.toggle(
        'active',
        button.dataset.mobilePanel===name
      );
    });

    fabActions.forEach(button=>{
      const action=button.dataset.mobileAction;
      button.classList.toggle('active',action===name);
    });
  }

  function resetFabPosition(){
    if(!fabDock) return;

    fabDock.style.top='auto';
    fabDock.style.bottom='calc(env(safe-area-inset-bottom) + 12px)';
    fabDock.classList.remove('menu-down');
    fabDock.classList.add('menu-up');
  }

  function positionFabAboveSheet(panel){
    if(!fabDock || !panel) return;

    requestAnimationFrame(()=>{
      const rect=panel.getBoundingClientRect();
      const desiredBottom=Math.max(
        12,
        window.innerHeight-rect.top+10
      );

      // Evita que el botón se pierda por la parte superior cuando
      // el panel ocupa casi toda la pantalla.
      const minimumTop=88;
      const buttonHeight=fabMain?.offsetHeight||54;
      const maximumBottom=Math.max(
        12,
        window.innerHeight-minimumTop-buttonHeight
      );

      const finalBottom=Math.min(
        desiredBottom,
        maximumBottom
      );

      fabDock.style.top='auto';
      fabDock.style.bottom=`${finalBottom}px`;

      updateFabMenuDirection();
    });
  }

  function closeSheets(){
    [toolPanel,detailPanel,actionsPanel].forEach(panel=>{
      panel.classList.remove('sheet-open');
    });

    backdrop.classList.remove('active');
    document.body.classList.remove('mobile-sheet-visible');
    setActiveNav('plan');
    setFabOpen(false);
    resetFabPosition();
  }

  function openSheet(name){
    closeSheets();

    const panel=
      name==='tools' ? toolPanel :
      name==='details' ? detailPanel :
      name==='actions' ? actionsPanel :
      null;

    if(!panel) return;

    panel.classList.add('sheet-open');
    backdrop.classList.add('active');
    document.body.classList.add('mobile-sheet-visible');
    setActiveNav(name);
    setFabOpen(false);

    // El botón negro acompaña al panel y queda justo encima
    // cuando la herramienta sube desde la parte inferior.
    positionFabAboveSheet(panel);
  }

  navButtons.forEach(button=>{
    button.addEventListener('click',()=>{
      const name=button.dataset.mobilePanel;
      if(name==='plan') closeSheets();
      else openSheet(name);
    });
  });

  resetFabPosition();

  if(fabMain){
    fabMain.addEventListener('click',()=>setFabOpen());
  }

  fabActions.forEach(button=>{
    button.addEventListener('click',()=>{
      const action=button.dataset.mobileAction;

      if(action==='tools' || action==='details' || action==='actions'){
        openSheet(action);
        return;
      }

      if(action==='proposals' && btnProposals){
        btnProposals.click();
        setFabOpen(false);
      }
    });
  });

  backdrop.addEventListener('click',closeSheets);

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape') closeSheets();
  });

  toolPanel.querySelectorAll(
    '[data-add],#btnDrawTent,#btnMeasure'
  ).forEach(button=>{
    button.addEventListener('click',()=>{
      window.setTimeout(closeSheets,120);
    });
  });

  [
    'btnSave',
    'btnSaveAs',
    'btnExport',
    'btnJson',
    'btnImport',
    'btnProposals',
    'btnPresentation'
  ].forEach(id=>{
    const button=document.getElementById(id);
    if(button){
      button.addEventListener('click',()=>{
        window.setTimeout(closeSheets,180);
      });
    }
  });


})();
