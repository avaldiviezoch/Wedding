(() => {
  /*
   * INVITACIÓN 5 — EFECTOS VISUALES
   * ---------------------------------
   * Regla: este archivo no modifica geometría de títulos.
   * El efecto usa únicamente propiedades de pintura (opacity/text-shadow/color)
   * durante la animación. No toca tamaño, márgenes, ancho, transform ni layout.
   */

  if(!document.getElementById('inv5-layout-loader')){
    const layoutScript=document.createElement('script');
    layoutScript.id='inv5-layout-loader';
    layoutScript.src='./layout_5.js?v=20260818-1317';
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

  function installTitleEffectStyle(doc){
    doc.getElementById('inv5-title-effect-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv5-title-effect-style';
    style.textContent=`
      .inv5-title-effect-safe{
        opacity:1;
        visibility:visible;
        overflow:visible;
      }
      .inv5-title-effect-safe.inv5-title-effect-play{
        animation:inv5TitleInkArrival 1.05s cubic-bezier(.18,.72,.22,1) both;
      }
      @keyframes inv5TitleInkArrival{
        0%{
          opacity:.24;
          color:rgba(88,105,78,.42);
          text-shadow:0 0 1px rgba(88,105,78,.15),0 0 18px rgba(88,105,78,.62),0 0 34px rgba(179,143,116,.32);
        }
        42%{
          opacity:.82;
          color:rgba(88,105,78,.88);
          text-shadow:0 0 2px rgba(88,105,78,.28),0 0 11px rgba(88,105,78,.42),0 0 22px rgba(179,143,116,.20);
        }
        72%{
          opacity:1;
          color:currentColor;
          text-shadow:0 0 5px rgba(88,105,78,.24);
        }
        100%{
          opacity:1;
          color:currentColor;
          text-shadow:none;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  function cleanupOldEffect(el){
    el.classList.remove(
      'inv5-title-arrival-v4','inv5-title-arrival-v3','inv5-title-arrival-v2',
      'inv5-title-arrival','inv5-title-pulse','is-title-visible',
      'inv5-title-effect','inv5-title-effect-play'
    );
    [
      'opacity','visibility','clip-path','filter','letter-spacing','text-shadow',
      'transition','transition-delay','animation','animation-delay','color'
    ].forEach(prop=>el.style.removeProperty(prop));
    el.classList.add('inv5-title-effect-safe');
  }

  function play(el){
    if(!el || el.dataset.inv5TitleEffectDone==='1') return;
    el.dataset.inv5TitleEffectDone='1';
    el.classList.remove('inv5-title-effect-play');
    void el.offsetWidth;
    el.classList.add('inv5-title-effect-play');
    el.addEventListener('animationend',()=>{
      el.classList.remove('inv5-title-effect-play');
      el.style.removeProperty('opacity');
      el.style.removeProperty('color');
      el.style.removeProperty('text-shadow');
    },{once:true});
  }

  function titleCandidates(doc){
    return [...new Set(doc.querySelectorAll(TITLE_SELECTORS))];
  }

  function prepareTitleEffects(doc){
    installTitleEffectStyle(doc);
    const win=doc.defaultView;
    const prepareCurrent=()=>{
      titleCandidates(doc).forEach(el=>{
        if(!el.classList.contains('inv5-title-effect-safe')) cleanupOldEffect(el);
      });
    };
    let raf=0;
    const scan=()=>{
      if(raf) return;
      raf=win.requestAnimationFrame(()=>{
        raf=0;
        prepareCurrent();
        const h=win.innerHeight||doc.documentElement.clientHeight;
        titleCandidates(doc).forEach(el=>{
          if(el.dataset.inv5TitleEffectDone==='1') return;
          const r=el.getBoundingClientRect();
          if(r.top < h*.84 && r.bottom > h*.10) play(el);
        });
      });
    };
    if(!win.__inv5TitleEffectScrollBound){
      win.__inv5TitleEffectScrollBound=true;
      win.addEventListener('scroll',scan,{passive:true});
      win.addEventListener('resize',scan,{passive:true});
      doc.addEventListener('scroll',scan,{passive:true,capture:true});
    }
    if(!win.__inv5TitleEffectMutation){
      win.__inv5TitleEffectMutation=new win.MutationObserver(()=>{
        prepareCurrent();
        scan();
      });
      win.__inv5TitleEffectMutation.observe(doc.body,{childList:true,subtree:true});
    }
    prepareCurrent();
    scan();
    win.setTimeout(scan,250);
    win.setTimeout(scan,750);
    win.setTimeout(scan,1500);
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
