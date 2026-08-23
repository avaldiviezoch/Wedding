(() => {
  const CARD_STYLE_ID='inv6-invite-card-from-inv1-style';
  const CARD_FONT_ID='inv6-invite-card-from-inv1-fonts';

  function ensureFonts(doc){
    if(doc.getElementById(CARD_FONT_ID)) return;
    const link=doc.createElement('link');
    link.id=CARD_FONT_ID;
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Great+Vibes&family=Cormorant+Garamond:wght@300;400;500;600&display=swap';
    doc.head.appendChild(link);
  }

  function ensureStyles(doc){
    doc.getElementById(CARD_STYLE_ID)?.remove();
    const style=doc.createElement('style');
    style.id=CARD_STYLE_ID;
    style.textContent=`
      .paper-section .countdown-image-wrap.invite-image-wrap.invite-text-layer{
        width:100% !important;
        max-width:none !important;
        margin:0 auto !important;
        position:relative !important;
        overflow:visible !important;
        background:transparent !important;
      }

      .paper-section .countdown-image.invite-base-image{
        width:100% !important;
        max-width:none !important;
        height:auto !important;
        display:block !important;
        margin:0 !important;
        padding:0 !important;
        user-select:none !important;
        -webkit-user-drag:none !important;
        background:transparent !important;
        border:0 !important;
        box-shadow:none !important;
      }

      .paper-section .invite-html-text{
        position:absolute !important;
        left:50% !important;
        transform:translateX(-50%) !important;
        z-index:3 !important;
        text-align:center !important;
        width:76% !important;
        color:#4b5137 !important;
        pointer-events:none !important;
        margin:0 !important;
        padding:0 !important;
        box-sizing:border-box !important;
      }

      .paper-section .invite-line-top{
        top:44.5% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(13px,3.4vw,23px) !important;
        line-height:1.35 !important;
        letter-spacing:.16em !important;
        font-weight:600 !important;
        text-transform:uppercase !important;
      }

      .paper-section .invite-main-title{
        top:52.0% !important;
        font-family:'Great Vibes',cursive !important;
        font-weight:400 !important;
        line-height:.78 !important;
        color:#465034 !important;
        text-shadow:0 1px 0 rgba(255,255,255,.32) !important;
      }

      .paper-section .invite-main-title span{
        display:block !important;
        font-size:clamp(56px,16.2vw,112px) !important;
      }

      .paper-section .invite-month-text{
        top:69.4% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(15px,4vw,27px) !important;
        letter-spacing:.22em !important;
        font-weight:600 !important;
        color:#4b5137 !important;
      }

      .paper-section .invite-month-text::after{
        content:'' !important;
        display:block !important;
        width:46% !important;
        height:1px !important;
        margin:9px auto 0 !important;
        background:linear-gradient(90deg,transparent,rgba(173,136,73,.78),transparent) !important;
      }

      .paper-section .invite-date-row{
        top:75.1% !important;
        display:grid !important;
        grid-template-columns:1fr 1px auto 1px 1fr !important;
        align-items:center !important;
        gap:16px !important;
        width:60% !important;
        font-family:'Cormorant Garamond',serif !important;
        color:#4b5137 !important;
      }

      .paper-section .invite-date-row span{
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(15px,4.3vw,29px) !important;
        font-weight:500 !important;
        color:#4b5137 !important;
      }

      .paper-section .invite-date-row strong{
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(48px,13vw,88px) !important;
        line-height:1 !important;
        font-weight:300 !important;
        color:#a88743 !important;
      }

      .paper-section .invite-date-row i{
        display:block !important;
        width:1px !important;
        height:58px !important;
        background:rgba(168,135,67,.66) !important;
      }

      .paper-section .invite-ornament{
        top:83.5% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(20px,5vw,32px) !important;
        color:#a88743 !important;
        opacity:.82 !important;
      }

      @media(max-width:520px){
        .paper-section .countdown-image-wrap.invite-image-wrap.invite-text-layer{
          width:100% !important;
          max-width:none !important;
        }
        .paper-section .invite-line-top{
          top:44.3% !important;
          font-size:clamp(12px,3.5vw,16px) !important;
        }
        .paper-section .invite-main-title{
          top:52.3% !important;
        }
        .paper-section .invite-main-title span{
          font-size:clamp(54px,16vw,74px) !important;
        }
        .paper-section .invite-month-text{
          top:69.6% !important;
          font-size:clamp(14px,3.8vw,18px) !important;
        }
        .paper-section .invite-date-row{
          top:75.3% !important;
          width:66% !important;
          gap:12px !important;
        }
        .paper-section .invite-date-row span{
          font-size:clamp(14px,4vw,18px) !important;
        }
        .paper-section .invite-date-row strong{
          font-size:clamp(44px,12.5vw,58px) !important;
        }
        .paper-section .invite-date-row i{
          height:46px !important;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  function mountInviteText(doc,wrap){
    wrap.querySelectorAll('.invite-html-text').forEach(el=>el.remove());

    const top=doc.createElement('div');
    top.className='invite-html-text invite-line-top';
    top.innerHTML='TENEMOS EL HONOR<br>DE INVITARTE A';

    const title=doc.createElement('div');
    title.className='invite-html-text invite-main-title';
    title.innerHTML='<span>Nuestra</span><span>Boda</span>';

    const month=doc.createElement('div');
    month.className='invite-html-text invite-month-text';
    month.textContent='ENERO';

    const date=doc.createElement('div');
    date.className='invite-html-text invite-date-row';
    date.innerHTML='<span>Viernes</span><i></i><strong>16</strong><i></i><span>2027</span>';

    const ornament=doc.createElement('div');
    ornament.className='invite-html-text invite-ornament';
    ornament.textContent='✦';

    wrap.append(top,title,month,date,ornament);
  }

  function isTextPixel(r,g,b,a){
    if(a<40) return false;
    const max=Math.max(r,g,b),min=Math.min(r,g,b);
    const luma=.2126*r+.7152*g+.0722*b;
    const oliveBias=(g>=r-14 && g>=b-4) || (r<150&&g<155&&b<140);
    return luma<181 && (oliveBias || max-min<36);
  }

  function cleanPrintedText(img){
    if(img.dataset.inv6CardCleaned==='1') return;
    const doc=img.ownerDocument;
    const w=img.naturalWidth,h=img.naturalHeight;
    if(!w||!h) return;

    const canvas=doc.createElement('canvas');
    canvas.width=w;
    canvas.height=h;
    const ctx=canvas.getContext('2d',{alpha:true,willReadFrequently:true});
    if(!ctx) return;

    try{
      ctx.drawImage(img,0,0,w,h);
      const imageData=ctx.getImageData(0,0,w,h);
      const data=imageData.data;
      const mask=new Uint8Array(w*h);

      // Regiones exclusivamente centrales donde está impreso el texto viejo.
      // No alcanzan el sello ni los relieves laterales de la tarjeta.
      const regions=[
        {x1:.25,x2:.75,y1:.458,y2:.515,sy1:.405,sy2:.458},
        {x1:.14,x2:.86,y1:.505,y2:.588,sy1:.395,sy2:.478},
        {x1:.27,x2:.73,y1:.580,y2:.635,sy1:.704,sy2:.759},
        {x1:.13,x2:.87,y1:.625,y2:.705,sy1:.705,sy2:.785}
      ];

      const toPx=(v,max)=>Math.max(0,Math.min(max-1,Math.round(v*max)));

      regions.forEach(region=>{
        const x1=toPx(region.x1,w),x2=toPx(region.x2,w);
        const y1=toPx(region.y1,h),y2=toPx(region.y2,h);
        for(let y=y1;y<=y2;y++){
          for(let x=x1;x<=x2;x++){
            const p=(y*w+x)*4;
            if(isTextPixel(data[p],data[p+1],data[p+2],data[p+3])) mask[y*w+x]=1;
          }
        }
      });

      // Expande unos pocos píxeles para retirar también antialias/sombra de las letras.
      const radius=Math.max(2,Math.min(6,Math.round(w/430)));
      const expanded=new Uint8Array(mask);
      for(let y=0;y<h;y++){
        for(let x=0;x<w;x++){
          if(!mask[y*w+x]) continue;
          const ya=Math.max(0,y-radius),yb=Math.min(h-1,y+radius);
          const xa=Math.max(0,x-radius),xb=Math.min(w-1,x+radius);
          for(let yy=ya;yy<=yb;yy++){
            const row=yy*w;
            for(let xx=xa;xx<=xb;xx++) expanded[row+xx]=1;
          }
        }
      }

      // Rellena únicamente los píxeles detectados con textura real tomada de zonas
      // limpias de la misma tarjeta. No se dibujan rectángulos ni colores planos.
      regions.forEach(region=>{
        const x1=toPx(region.x1,w),x2=toPx(region.x2,w);
        const y1=toPx(region.y1,h),y2=toPx(region.y2,h);
        const sy1=toPx(region.sy1,h),sy2=toPx(region.sy2,h);
        const targetH=Math.max(1,y2-y1);
        const sourceH=Math.max(1,sy2-sy1);
        for(let y=y1;y<=y2;y++){
          const t=(y-y1)/targetH;
          const sy=Math.max(0,Math.min(h-1,Math.round(sy1+t*sourceH)));
          for(let x=x1;x<=x2;x++){
            if(!expanded[y*w+x]) continue;
            const dst=(y*w+x)*4;
            const src=(sy*w+x)*4;
            data[dst]=data[src];
            data[dst+1]=data[src+1];
            data[dst+2]=data[src+2];
            data[dst+3]=data[src+3];
          }
        }
      });

      ctx.putImageData(imageData,0,0);
      const cleanSrc=canvas.toDataURL('image/png');
      img.dataset.inv6OriginalCardSrc=img.currentSrc||img.src;
      img.dataset.inv6CardCleaned='1';
      img.src=cleanSrc;
      img.removeAttribute('srcset');
    }catch(err){
      console.warn('[Invitación 6] No se pudo generar la copia limpia de la tarjeta:',err);
    }
  }

  function apply(doc){
    if(!doc) return;
    const section=doc.querySelector('.paper-section');
    const wrap=section?.querySelector('.countdown-image-wrap');
    const img=wrap?.querySelector('.countdown-image');
    if(!section||!wrap||!img) return;

    // El contador anterior no forma parte de la nueva composición.
    section.querySelectorAll('#countdownOverlay,.countdown-overlay').forEach(el=>el.remove());

    wrap.classList.add('invite-image-wrap','invite-text-layer');
    img.classList.add('invite-base-image');

    ensureFonts(doc);
    ensureStyles(doc);
    mountInviteText(doc,wrap);

    const clean=()=>cleanPrintedText(img);
    if(img.complete&&img.naturalWidth) clean();
    else img.addEventListener('load',clean,{once:true});
  }

  window.inv6ApplyInviteCardFromInv1=apply;
})();
