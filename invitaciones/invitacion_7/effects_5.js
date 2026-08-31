(() => {
  /*
   * INVITACIÓN 6 — EFECTOS VISUALES
   * Base: Invitación 5.
   */

  if(!document.getElementById('inv5-layout-loader')){
    const layoutScript=document.createElement('script');
    layoutScript.id='inv5-layout-loader';
    layoutScript.src='./layout_5.js?v=20260818-1442';
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

  function installInvitationBranding(doc){
    if(!doc.getElementById('inv5-great-vibes-font')){
      const fontLink=doc.createElement('link');
      fontLink.id='inv5-great-vibes-font';
      fontLink.rel='stylesheet';
      fontLink.href='https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap';
      doc.head.appendChild(fontLink);
    }

    doc.getElementById('inv5-branding-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv5-branding-style';
    style.textContent=`
      @font-face{
        font-family:'Amsterdam Four';
        src:url('./Amsterdam%20Four_ttf%20400.ttf') format('truetype');
        font-weight:400;
        font-style:normal;
        font-display:swap;
      }

      ${TITLE_SELECTORS},
      h1,h2,h3,
      [class*="section-title"],
      [class*="-title"]{
        font-family:'Amsterdam Four',cursive !important;
        font-weight:400 !important;
      }

      .photo-story-signature,
      .wait-signature{
        font-family:'Amsterdam Four',cursive !important;
        font-weight:400 !important;
      }

      #creditSection .credit-monogram{
        font-family:'Great Vibes',cursive !important;
        font-weight:400 !important;
      }

      .photo-frame.photo-placeholder::before{
        content:'Antonio  &  Lucero' !important;
        font-family:'Amsterdam Four',cursive !important;
        font-weight:400 !important;
        font-size:clamp(28px,6vw,42px) !important;
      }
    `;
    doc.head.appendChild(style);

    const exactInitials=/^\s*A\s*(?:&|\+|y)\s*L\s*$/i;
    doc.querySelectorAll('.credit-monogram,.photo-story-signature,.wait-signature').forEach(el=>{
      const text=(el.textContent||'').replace(/\s+/g,' ').trim();
      if(exactInitials.test(text)) el.textContent='Antonio & Lucero';
    });

    const creditMonogram=doc.querySelector('#creditSection .credit-monogram');
    if(creditMonogram) creditMonogram.textContent='Antonio & Lucero';
  }

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

  function installInv6FirstEntrance(doc){
    const saludo=doc.getElementById('saludoWrap');
    const phrase=doc.querySelector('.phrase-section');
    const paper=doc.querySelector('.paper-section');
    if(!paper) return;

    saludo?.remove();
    phrase?.remove();

    let section=doc.getElementById('inv6PrimeraEntrada');
    if(!section){
      section=doc.createElement('section');
      section.id='inv6PrimeraEntrada';
      section.setAttribute('aria-label','Portada de Antonio y Lucero');
      section.innerHTML=`
        <img class="inv6-first-image" src="./assets/Primera_entrada_6.png?v=20260821-2" alt="Antonio y Lucero" decoding="async">
        <div class="inv6-first-copy" aria-label="Antonio y Lucero se casan el 16 de enero de 2027">
          <div class="inv6-we-marry">NOS CASAMOS!</div>
          <div class="inv6-couple">Lucero &amp; Antonio</div>
          <div class="inv6-date">16.01.2027</div>
          <div class="inv6-countdown" aria-live="polite">
            <div class="inv6-time"><strong data-inv6-days>000</strong><span>Días</span></div>
            <div class="inv6-time"><strong data-inv6-hours>00</strong><span>Horas</span></div>
            <div class="inv6-time"><strong data-inv6-minutes>00</strong><span>Min.</span></div>
            <div class="inv6-time"><strong data-inv6-seconds>00</strong><span>Seg.</span></div>
          </div>
        </div>`;
      paper.parentNode.insertBefore(section,paper);
    }

    doc.getElementById('inv6-first-style')?.remove();
    const style=doc.createElement('style');
    style.id='inv6-first-style';
    style.textContent=`
      #inv6PrimeraEntrada{
        position:relative;
        width:100%;
        margin:0;
        padding:0;
        background:#efe7d6;
        overflow:hidden;
      }
      #inv6PrimeraEntrada .inv6-first-image{
        display:block;
        width:100%;
        height:auto;
        margin:0;
        padding:0;
        border:0;
        background:transparent;
        box-shadow:none;
      }
      #inv6PrimeraEntrada .inv6-first-copy{
        position:absolute;
        left:50%;
        top:58.2%;
        width:90%;
        transform:translateX(-50%);
        z-index:3;
        text-align:center;
        color:#323744;
        pointer-events:none;
      }
      #inv6PrimeraEntrada .inv6-we-marry{
        font-family:Georgia,'Times New Roman',serif;
        font-size:clamp(25px,5.8vw,44px);
        line-height:1;
        letter-spacing:.015em;
        font-weight:400;
      }
      #inv6PrimeraEntrada .inv6-couple{
        margin-top:8px;
        font-family:'Amsterdam Four','Great Vibes',cursive;
        font-size:clamp(44px,11vw,82px);
        line-height:.92;
        font-weight:400;
        color:#74794f;
        white-space:nowrap;
      }
      #inv6PrimeraEntrada .inv6-date{
        margin-top:16px;
        font-family:Georgia,'Times New Roman',serif;
        font-size:clamp(27px,6vw,46px);
        line-height:1;
        letter-spacing:.025em;
        color:#303542;
      }
      #inv6PrimeraEntrada .inv6-countdown{
        width:min(92%,560px);
        margin:16.5% auto 0;
        display:grid;
        grid-template-columns:repeat(4,minmax(0,1fr));
        color:#67704b;
      }
      #inv6PrimeraEntrada .inv6-time{
        position:relative;
        min-width:0;
        padding:0 5px;
      }
      #inv6PrimeraEntrada .inv6-time + .inv6-time::before{
        content:'';
        position:absolute;
        left:0;
        top:5%;
        width:1px;
        height:68%;
        background:rgba(103,112,75,.7);
      }
      #inv6PrimeraEntrada .inv6-time strong{
        display:block;
        font-family:Georgia,'Times New Roman',serif;
        font-size:clamp(36px,9vw,68px);
        line-height:.92;
        font-weight:400;
        letter-spacing:-.03em;
      }
      #inv6PrimeraEntrada .inv6-time span{
        display:block;
        margin-top:9px;
        font-family:Georgia,'Times New Roman',serif;
        font-size:clamp(13px,3vw,22px);
        line-height:1;
        font-weight:400;
      }
      .paper-section{
        margin-top:56px !important;
      }
      @media(max-width:540px){
        #inv6PrimeraEntrada .inv6-first-copy{top:58.6%;width:92%;}
        #inv6PrimeraEntrada .inv6-we-marry{font-size:clamp(24px,7vw,34px);}
        #inv6PrimeraEntrada .inv6-couple{margin-top:6px;font-size:clamp(40px,12.5vw,60px);}
        #inv6PrimeraEntrada .inv6-date{margin-top:12px;font-size:clamp(24px,7vw,34px);}
        #inv6PrimeraEntrada .inv6-countdown{margin-top:17.5%;width:94%;}
        #inv6PrimeraEntrada .inv6-time strong{font-size:clamp(31px,10.5vw,48px);}
        #inv6PrimeraEntrada .inv6-time span{font-size:clamp(12px,3.7vw,17px);margin-top:7px;}
        .paper-section{margin-top:42px !important;}
      }
    `;
    doc.head.appendChild(style);

    if(!doc.defaultView.__inv6CountdownTimer){
      const target=new Date('2027-01-16T00:00:00-05:00').getTime();
      const pad=n=>String(n).padStart(2,'0');
      const render=()=>{
        const diff=Math.max(0,target-Date.now());
        const total=Math.floor(diff/1000);
        const days=Math.floor(total/86400);
        const hours=Math.floor((total%86400)/3600);
        const minutes=Math.floor((total%3600)/60);
        const seconds=total%60;
        const d=doc.querySelector('[data-inv6-days]');
        const h=doc.querySelector('[data-inv6-hours]');
        const m=doc.querySelector('[data-inv6-minutes]');
        const s=doc.querySelector('[data-inv6-seconds]');
        if(d)d.textContent=String(days);
        if(h)h.textContent=pad(hours);
        if(m)m.textContent=pad(minutes);
        if(s)s.textContent=pad(seconds);
      };
      render();
      doc.defaultView.__inv6CountdownTimer=doc.defaultView.setInterval(render,1000);
    }
  }

  window.inv5ApplyVisualEffects=(doc)=>{
    try{
      installInv6FirstEntrance(doc);
      installInvitationBranding(doc);
      prepareTitleEffects(doc);
      expandPetals(doc);
    }catch(e){
      console.warn('[Invitación 6] No se pudieron aplicar efectos visuales:',e);
    }
  };
})();
