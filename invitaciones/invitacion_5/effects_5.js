(() => {
  /*
   * INVITACIÓN 5 — EFECTOS VISUALES
   * ---------------------------------
   * Este archivo NO modifica geometría.
   * No toca: font-size, line-height, width, height, margin, padding,
   * transform, translate, scale, position, display, white-space ni layout.
   *
   * Los ajustes estructurales/locales viven en layout_5.js.
   */

  if(!document.getElementById('inv5-layout-loader')){
    const layoutScript=document.createElement('script');
    layoutScript.id='inv5-layout-loader';
    layoutScript.src='./layout_5.js?v=20260818-0850';
    document.head.appendChild(layoutScript);
  }

  const TITLE_SELECTORS = [
    'section h2',
    '.section-title',
    '.photo-story-title',
    '.final-title',
    '.location-title',
    '.dresscode-title',
    '.inv5-dress-code',
    '.rsvp-title',
    '.faq-title',
    '.gift-title',
    '.gift-stage-title',
    '.music-title',
    '.confirmation-title',
    '.questions-title',
    '.itinerary-title',
    '.itinerario-title',
    '.timeline-title'
  ].join(',');

  function cleanupLegacyTitleEffects(el){
    el.classList.remove(
      'inv5-title-arrival-v4','inv5-title-arrival-v3','inv5-title-arrival-v2',
      'inv5-title-arrival','inv5-title-pulse','is-title-visible',
      'inv5-title-effect','inv5-title-effect-play'
    );
    [
      'opacity','visibility','clip-path','filter','letter-spacing','text-shadow',
      'transition','transition-delay','animation','animation-delay'
    ].forEach(prop=>el.style.removeProperty(prop));
  }

  function playTitleInkEffect(doc,el){
    if(!el || el.dataset.inv5TitleEffectDone==='1') return;
    el.dataset.inv5TitleEffectDone='1';

    cleanupLegacyTitleEffects(el);

    const win=doc.defaultView;
    if(win.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    /*
     * Web Animations API: solo anima text-shadow (pintura), nunca la caja.
     * Por eso el título mantiene exactamente tamaño, posición y saltos de línea.
     */
    try{
      el.animate([
        {textShadow:'0 0 0 rgba(91,108,80,0), 0 0 0 rgba(151,128,105,0)'},
        {textShadow:'0 0 12px rgba(91,108,80,.58), 0 0 28px rgba(151,128,105,.30)',offset:.30},
        {textShadow:'0 0 5px rgba(91,108,80,.32), 0 0 14px rgba(151,128,105,.16)',offset:.62},
        {textShadow:'0 0 0 rgba(91,108,80,0), 0 0 0 rgba(151,128,105,0)'}
      ],{
        duration:1350,
        easing:'cubic-bezier(.22,.72,.2,1)',
        fill:'none'
      });
    }catch(e){
      /* Fallback seguro: no alterar geometría si WAAPI no está disponible. */
      el.style.textShadow='0 0 8px rgba(91,108,80,.25)';
      win.setTimeout(()=>el.style.removeProperty('text-shadow'),650);
    }
  }

  function titleCandidates(doc){
    return [...new Set(doc.querySelectorAll(TITLE_SELECTORS))];
  }

  function ensureTitleObserver(doc){
    const win=doc.defaultView;
    if(win.__inv5TitleEffectState) return win.__inv5TitleEffectState;

    const state={observer:null,observed:new WeakSet(),mutation:null};

    if('IntersectionObserver' in win){
      state.observer=new win.IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting) return;
          playTitleInkEffect(doc,entry.target);
          state.observer.unobserve(entry.target);
        });
      },{
        threshold:.30,
        rootMargin:'0px 0px -8% 0px'
      });
    }

    const observeCurrentTitles=()=>{
      titleCandidates(doc).forEach(el=>{
        cleanupLegacyTitleEffects(el);
        if(el.dataset.inv5TitleEffectDone==='1' || state.observed.has(el)) return;
        state.observed.add(el);
        if(state.observer){
          state.observer.observe(el);
        }
      });
    };

    const fallbackScan=()=>{
      if(state.observer) return;
      const h=win.innerHeight||doc.documentElement.clientHeight;
      titleCandidates(doc).forEach(el=>{
        if(el.dataset.inv5TitleEffectDone==='1') return;
        const r=el.getBoundingClientRect();
        if(r.top<h*.88 && r.bottom>h*.08) playTitleInkEffect(doc,el);
      });
    };

    state.observeCurrentTitles=observeCurrentTitles;
    state.fallbackScan=fallbackScan;

    /*
     * Importante: layout_5.js crea/reordena algunos títulos después de cargar.
     * MutationObserver hace que esos títulos nuevos también reciban el efecto.
     */
    state.mutation=new win.MutationObserver(()=>{
      observeCurrentTitles();
      fallbackScan();
    });
    state.mutation.observe(doc.body,{childList:true,subtree:true});

    if(!state.observer){
      win.addEventListener('scroll',fallbackScan,{passive:true});
      win.addEventListener('resize',fallbackScan,{passive:true});
    }

    win.__inv5TitleEffectState=state;
    return state;
  }

  function prepareTitleEffects(doc){
    const state=ensureTitleObserver(doc);
    state.observeCurrentTitles();
    state.fallbackScan();

    /* Captura cambios tardíos de fuentes/layout sin recrear listeners. */
    setTimeout(()=>state.observeCurrentTitles(),250);
    setTimeout(()=>state.observeCurrentTitles(),900);
  }

  function expandPetals(doc){
    const wrap=doc.getElementById('petals');
    if(!wrap) return;
    const target=55;
    for(let i=wrap.querySelectorAll('.petal').length;i<target;i++){
      const p=doc.createElement('span');
      p.className='petal';
      const delay=-Math.random()*22;
      p.style.left=(Math.random()*100)+'vw';
      p.style.animationDuration=`${9+Math.random()*11}s, ${2.6+Math.random()*3.6}s, ${5+Math.random()*6}s`;
      p.style.animationDelay=`${delay}s, ${delay}s, ${delay}s`;
      p.style.opacity=(.34+Math.random()*.46).toFixed(2);
      wrap.appendChild(p);
    }
  }

  window.inv5ApplyVisualEffects=(doc)=>{
    try{
      prepareTitleEffects(doc);
      expandPetals(doc);
    }catch(e){
      console.warn('[Invitación 5] No se pudieron aplicar efectos visuales:',e);
    }
  };
})();
