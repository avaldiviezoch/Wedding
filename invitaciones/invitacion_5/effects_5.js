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
    if(doc.getElementById('inv5-effects-style')) return;
    const style=doc.createElement('style');
    style.id='inv5-effects-style';
    style.textContent=`
      .inv5-title-arrival-v2{
        opacity:0;
        scale:.86;
        translate:0 34px;
        filter:blur(8px);
        transition:
          opacity .75s cubic-bezier(.2,.75,.25,1),
          scale .9s cubic-bezier(.18,.82,.22,1),
          translate .95s cubic-bezier(.18,.82,.22,1),
          filter .7s ease;
        will-change:opacity,scale,translate,filter;
      }
      .inv5-title-arrival-v2.is-title-visible{
        opacity:1;
        scale:1;
        translate:0 0;
        filter:blur(0);
      }
      @media(prefers-reduced-motion:reduce){
        .inv5-title-arrival-v2{opacity:1!important;scale:1!important;translate:0 0!important;filter:none!important;transition:none!important}
      }
    `;
    doc.head.appendChild(style);
  }

  function activateTitles(doc){
    install(doc);
    const win=doc.defaultView;
    const titles=titleCandidates(doc);
    titles.forEach(el=>el.classList.add('inv5-title-arrival-v2'));

    const scan=()=>{
      const h=win.innerHeight||doc.documentElement.clientHeight;
      titles.forEach(el=>{
        if(el.classList.contains('is-title-visible')) return;
        const r=el.getBoundingClientRect();
        if(r.top < h*.90 && r.bottom > h*.08){
          requestAnimationFrame(()=>el.classList.add('is-title-visible'));
        }
      });
    };

    if(!win.__inv5TitleArrivalBound){
      win.__inv5TitleArrivalBound=true;
      win.addEventListener('scroll',scan,{passive:true});
      win.addEventListener('resize',scan,{passive:true});
    }
    setTimeout(scan,60);
    setTimeout(scan,550);
    setTimeout(scan,1300);
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
    wrap.dataset.inv5Expanded='2';
  }

  window.inv5ApplyVisualEffects=(doc)=>{
    try{activateTitles(doc);expandPetals(doc);}catch(e){}
  };
})();
