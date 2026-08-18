(() => {
  function titleCandidates(doc){
    return [...new Set(doc.querySelectorAll([
      'section h2','.section-title','.photo-story-title','.final-title','.location-title',
      '.dresscode-title','.inv5-dress-code','.rsvp-title','.faq-title','.gift-title',
      '.gift-stage-title','.music-title','.confirmation-title','.questions-title',
      '.itinerary-title','.itinerario-title','.timeline-title'
    ].join(',')))];
  }

  function install(doc){
    const old=doc.getElementById('inv5-effects-style');
    if(old) old.remove();
    const style=doc.createElement('style');
    style.id='inv5-effects-style';
    style.textContent=`
      .inv5-title-arrival-v3{
        opacity:0;
        clip-path:inset(0 52% 0 52%);
        letter-spacing:.08em;
        text-shadow:0 0 14px rgba(121,131,102,.18);
        transition:
          opacity .55s ease,
          clip-path .95s cubic-bezier(.22,.72,.2,1),
          letter-spacing .9s cubic-bezier(.22,.72,.2,1),
          text-shadow 1s ease;
        will-change:opacity,clip-path,letter-spacing;
      }
      .inv5-title-arrival-v3.is-title-visible{
        opacity:1;
        clip-path:inset(0 0 0 0);
        letter-spacing:normal;
        text-shadow:0 0 0 rgba(121,131,102,0);
      }

      /* Regalo: mantener el título principal en una sola línea mientras haya ancho suficiente. */
      #inv5GiftInRsvp .gift-stage-heading{
        width:calc(100vw - 28px)!important;
        max-width:760px!important;
        padding-left:0!important;
        padding-right:0!important;
      }
      #inv5GiftInRsvp .gift-stage-title{
        width:100%!important;
        max-width:none!important;
        white-space:nowrap!important;
        text-wrap:nowrap!important;
        line-height:1.08!important;
      }
      @media(max-width:350px){
        #inv5GiftInRsvp .gift-stage-title{
          white-space:normal!important;
          text-wrap:balance!important;
        }
      }

      @media(prefers-reduced-motion:reduce){
        .inv5-title-arrival-v3{opacity:1!important;clip-path:none!important;letter-spacing:normal!important;text-shadow:none!important;transition:none!important}
      }
    `;
    doc.head.appendChild(style);
  }

  function activateTitles(doc){
    install(doc);
    const win=doc.defaultView;
    const titles=titleCandidates(doc);

    titles.forEach(el=>{
      el.classList.remove('inv5-title-arrival-v2','inv5-title-arrival','is-title-visible');
      el.style.removeProperty('scale');
      el.style.removeProperty('translate');
      el.style.removeProperty('filter');
      el.classList.add('inv5-title-arrival-v3');
    });

    const scan=()=>{
      const h=win.innerHeight||doc.documentElement.clientHeight;
      titles.forEach(el=>{
        if(el.classList.contains('is-title-visible')) return;
        const r=el.getBoundingClientRect();
        if(r.top < h*.88 && r.bottom > h*.08){
          win.requestAnimationFrame(()=>el.classList.add('is-title-visible'));
        }
      });
    };

    if(!win.__inv5TitleRevealBound){
      win.__inv5TitleRevealBound=true;
      win.addEventListener('scroll',scan,{passive:true});
      win.addEventListener('resize',scan,{passive:true});
    }
    setTimeout(scan,80);
    setTimeout(scan,650);
    setTimeout(scan,1400);
  }

  function expandPetals(doc){
    const wrap=doc.getElementById('petals');
    if(!wrap) return;
    const target=55;
    let current=wrap.querySelectorAll('.petal').length;
    for(let i=current;i<target;i++){
      const p=doc.createElement('span');
      p.className='petal';
      const left=Math.random()*100;
      const dur1=9+Math.random()*11;
      const dur2=2.6+Math.random()*3.6;
      const dur3=5+Math.random()*6;
      const delay=Math.random()*-22;
      const scale=.58+Math.random()*1.15;
      p.style.left=left+'vw';
      p.style.animationDuration=`${dur1}s, ${dur2}s, ${dur3}s`;
      p.style.animationDelay=`${delay}s, ${delay}s, ${delay}s`;
      p.style.transform=`scale(${scale})`;
      p.style.opacity=(.34+Math.random()*.46).toFixed(2);
      wrap.appendChild(p);
    }
    wrap.dataset.inv5Expanded='3';
  }

  window.inv5ApplyVisualEffects=(doc)=>{
    try{activateTitles(doc);expandPetals(doc);}catch(e){}
  };
})();
