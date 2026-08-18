(() => {
  /*
   * INVITACIÓN 5 — EFECTOS VISUALES
   * ---------------------------------
   * Este archivo NO modifica geometría.
   * No toca: font-size, line-height, width, height, margin, padding,
   * transform, translate, scale, position, display, white-space ni layout.
   *
   * La geometría/tamaño de títulos se resuelve en index.html antes de llamar
   * a inv5ApplyVisualEffects(). Aquí solo añadimos un acabado visual seguro.
   */

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

  function installEffectStyle(doc){
    if(doc.getElementById('inv5-title-effect-style')) return;

    const style=doc.createElement('style');
    style.id='inv5-title-effect-style';
    style.textContent=`
      /*
       * Animación segura: solo cambia text-shadow.
       * No cambia caja, posición, tamaño ni salto de línea del título.
       */
      .inv5-title-effect{
        text-shadow:none;
      }

      .inv5-title-effect.inv5-title-effect-play{
        animation:inv5TitleInkGlow 1.15s cubic-bezier(.22,.7,.24,1) both;
      }

      @keyframes inv5TitleInkGlow{
        0%{
          text-shadow:
            0 0 0 rgba(91,108,80,0),
            0 0 0 rgba(151,128,105,0);
        }
        38%{
          text-shadow:
            0 0 7px rgba(91,108,80,.30),
            0 0 20px rgba(151,128,105,.18);
        }
        68%{
          text-shadow:
            0 0 3px rgba(91,108,80,.18),
            0 0 9px rgba(151,128,105,.10);
        }
        100%{
          text-shadow:none;
        }
      }

      @media(prefers-reduced-motion:reduce){
        .inv5-title-effect.inv5-title-effect-play{
          animation:none!important;
          text-shadow:none!important;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  function titleCandidates(doc){
    return [...new Set(doc.querySelectorAll(TITLE_SELECTORS))];
  }

  function prepareTitleEffects(doc){
    installEffectStyle(doc);

    const win=doc.defaultView;
    const titles=titleCandidates(doc);

    titles.forEach(el=>{
      /* Limpiar únicamente restos de efectos anteriores; jamás geometría. */
      el.classList.remove(
        'inv5-title-arrival-v4',
        'inv5-title-arrival-v3',
        'inv5-title-arrival-v2',
        'inv5-title-arrival',
        'inv5-title-pulse',
        'is-title-visible'
      );
      el.style.removeProperty('opacity');
      el.style.removeProperty('visibility');
      el.style.removeProperty('clip-path');
      el.style.removeProperty('filter');
      el.style.removeProperty('letter-spacing');
      el.style.removeProperty('text-shadow');
      el.style.removeProperty('transition');
      el.style.removeProperty('transition-delay');
      el.classList.add('inv5-title-effect');
    });

    const scan=()=>{
      const h=win.innerHeight||doc.documentElement.clientHeight;

      titles.forEach(el=>{
        if(el.dataset.inv5TitleEffectDone==='1') return;

        const r=el.getBoundingClientRect();
        if(r.top < h*.88 && r.bottom > h*.08){
          el.dataset.inv5TitleEffectDone='1';
          win.requestAnimationFrame(()=>el.classList.add('inv5-title-effect-play'));
        }
      });
    };

    if(!win.__inv5TitleEffectSafeBound){
      win.__inv5TitleEffectSafeBound=true;
      win.addEventListener('scroll',scan,{passive:true});
      win.addEventListener('resize',scan,{passive:true});
    }

    scan();
    setTimeout(scan,350);
    setTimeout(scan,950);
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
