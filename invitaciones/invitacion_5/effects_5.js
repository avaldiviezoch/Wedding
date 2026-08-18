(() => {
  const selectors='section h2,.section-title,.photo-story-title,.final-title,.location-title,.dresscode-title,.inv5-dress-code,.rsvp-title,.faq-title,.gift-title,.gift-stage-title,.music-title,.confirmation-title,.questions-title,.itinerary-title,.itinerario-title,.timeline-title';

  function isProgramming(el){
    const t=(el.textContent||'').trim().toLowerCase();
    return !!el.closest('#itinerarySection,.itinerary-section,[aria-label*="Itinerario"],[aria-label*="itinerario"]') || t==='nuestro día' || t==='nuestro dia' || t.includes('programación') || t.includes('programacion');
  }

  function addStyle(doc){
    doc.getElementById('inv5-effects-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv5-effects-style';
    style.textContent=`
      .inv5-title-fixed{opacity:1!important;visibility:visible!important;filter:none!important;clip-path:none!important}
      .inv5-title-size{font-size:clamp(34px,9.2vw,42px)!important;line-height:1.14!important}
      .inv5-title-pulse{animation:inv5TitlePulse .9s ease-out both}
      @keyframes inv5TitlePulse{0%{letter-spacing:.035em;text-shadow:0 0 12px rgba(92,108,82,.25)}100%{letter-spacing:normal;text-shadow:none}}
      #inv5GiftInRsvp .gift-stage-heading{width:calc(100vw - 24px)!important;max-width:760px!important;padding-left:0!important;padding-right:0!important;overflow:visible!important}
      #inv5GiftInRsvp .gift-stage-title{width:100%!important;max-width:none!important;white-space:nowrap!important;overflow:visible!important}
      @media(max-width:350px){#inv5GiftInRsvp .gift-stage-title{white-space:normal!important;text-wrap:balance!important}}
      @media(prefers-reduced-motion:reduce){.inv5-title-pulse{animation:none!important}}
    `;
    doc.head.appendChild(style);
  }

  function applyTitles(doc){
    addStyle(doc);
    const win=doc.defaultView;
    const titles=[...new Set(doc.querySelectorAll(selectors))];

    titles.forEach(el=>{
      el.classList.remove('inv5-title-arrival-v4','inv5-title-arrival-v3','inv5-title-arrival-v2','inv5-title-arrival','is-title-visible','inv5-title-pulse');
      ['opacity','visibility','clip-path','scale','translate','filter','letter-spacing','text-shadow','transition','transition-delay'].forEach(p=>el.style.removeProperty(p));
      el.classList.add('inv5-title-fixed');
      if(isProgramming(el)){
        el.classList.remove('inv5-title-size');
        el.style.setProperty('transform','translateY(24px)','important');
      }else{
        el.classList.add('inv5-title-size');
      }
    });

    const scan=()=>{
      const h=win.innerHeight||doc.documentElement.clientHeight;
      titles.forEach(el=>{
        if(el.dataset.inv5Animated==='1') return;
        const r=el.getBoundingClientRect();
        if(r.top<h*.9 && r.bottom>h*.06){
          el.dataset.inv5Animated='1';
          el.classList.add('inv5-title-pulse');
        }
      });
    };
    if(!win.__inv5TitleSafeBound){
      win.__inv5TitleSafeBound=true;
      win.addEventListener('scroll',scan,{passive:true});
      win.addEventListener('resize',scan,{passive:true});
    }
    scan();
    setTimeout(scan,500);
  }

  function petals(doc){
    const wrap=doc.getElementById('petals');
    if(!wrap) return;
    for(let i=wrap.querySelectorAll('.petal').length;i<55;i++){
      const p=doc.createElement('span');
      p.className='petal';
      const d=-Math.random()*22;
      p.style.left=(Math.random()*100)+'vw';
      p.style.animationDuration=`${9+Math.random()*11}s, ${2.6+Math.random()*3.6}s, ${5+Math.random()*6}s`;
      p.style.animationDelay=`${d}s, ${d}s, ${d}s`;
      p.style.opacity=(.34+Math.random()*.46).toFixed(2);
      wrap.appendChild(p);
    }
  }

  window.inv5ApplyVisualEffects=(doc)=>{try{applyTitles(doc);petals(doc)}catch(e){}};
})();
