(() => {
  const STYLE_ID='inv6-paper-to-location-style';
  const GREEN_BLOCK_ID='inv6-green-location-from-inv1';
  const UPPER_MAP_BUTTON_ID='inv6-final-upper-map-button';

  function ensureSpacing(doc){
    let style=doc.getElementById(STYLE_ID);
    if(!style){
      style=doc.createElement('style');
      style.id=STYLE_ID;
      doc.head.appendChild(style);
    }
    style.textContent=`
      #inv6TornPaperMessage + .location-section{
        margin-top:clamp(22px,4.5vw,36px) !important;
      }

      .location-section .church-overlay-content{
        padding-top:128px !important;
        padding-bottom:78px !important;
      }

      .location-section .church-kicker{
        margin-top:10px !important;
        margin-bottom:20px !important;
        position:relative !important;
        z-index:3 !important;
      }

      .location-section .church-note{
        margin-bottom:0 !important;
      }

      #${UPPER_MAP_BUTTON_ID}.map-button{
        position:absolute;
        left:50%;
        bottom:7.2%;
        transform:translateX(-50%);
        min-width:min(58%, 320px);
        padding:13px 26px 12px;
        color:#59634f;
        background:rgba(242,231,216,.94);
        border:1.5px solid rgba(91,101,78,.70);
        border-radius:48% 52% 46% 54% / 52% 46% 54% 48%;
        text-decoration:none;
        text-align:center;
        font-family:Georgia, "Times New Roman", serif;
        font-size:clamp(13px, 2.8vw, 17px);
        font-weight:600;
        letter-spacing:.14em;
        text-transform:uppercase;
        line-height:1.1;
        box-shadow:0 5px 12px rgba(92,75,57,.12);
        z-index:40;
        -webkit-tap-highlight-color:transparent;
      }

      #${UPPER_MAP_BUTTON_ID}.map-button::before,
      #${UPPER_MAP_BUTTON_ID}.map-button::after{
        content:"";
        position:absolute;
        top:50%;
        width:24px;
        height:1px;
        background:rgba(91,101,78,.48);
      }
      #${UPPER_MAP_BUTTON_ID}.map-button::before{ left:-32px; }
      #${UPPER_MAP_BUTTON_ID}.map-button::after{ right:-32px; }

      #${UPPER_MAP_BUTTON_ID}.map-button:hover,
      #${UPPER_MAP_BUTTON_ID}.map-button:focus-visible{
        transform:translateX(-50%) translateY(-2px);
        background:rgba(247,238,225,.98);
        box-shadow:0 8px 16px rgba(92,75,57,.16), inset 0 0 0 3px rgba(255,255,255,.26);
        outline:none;
      }
      #${UPPER_MAP_BUTTON_ID}.map-button:active{
        transform:translateX(-50%) translateY(1px) scale(.99);
      }

      @media(max-width:540px){
        #inv6TornPaperMessage + .location-section{
          margin-top:24px !important;
        }
        .location-section .church-overlay-content{
          padding-top:104px !important;
          padding-bottom:68px !important;
        }
        .location-section .church-kicker{
          margin-top:12px !important;
          margin-bottom:18px !important;
        }
        #${UPPER_MAP_BUTTON_ID}.map-button{
          bottom:7%;
          min-width:60%;
          padding:11px 18px 10px;
          font-size:clamp(12px, 3.3vw, 15px);
          letter-spacing:.11em;
        }
        #${UPPER_MAP_BUTTON_ID}.map-button::before,
        #${UPPER_MAP_BUTTON_ID}.map-button::after{ width:18px; }
        #${UPPER_MAP_BUTTON_ID}.map-button::before{ left:-24px; }
        #${UPPER_MAP_BUTTON_ID}.map-button::after{ right:-24px; }
      }
    `;
  }

  function normalizeUpperMapButton(doc){
    const button=doc.getElementById(UPPER_MAP_BUTTON_ID);
    if(!button) return false;
    button.removeAttribute('style');
    button.classList.add('map-button');
    button.textContent='Ver ubicación';
    return true;
  }

  function watchUpperMapButton(doc){
    if(!doc?.body || doc.defaultView.__inv6MapButtonObserver) return;
    const Observer=doc.defaultView.MutationObserver;
    if(!Observer) return;
    let busy=false;
    const observer=new Observer(()=>{
      if(busy) return;
      busy=true;
      normalizeUpperMapButton(doc);
      busy=false;
    });
    observer.observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
    doc.defaultView.__inv6MapButtonObserver=observer;
  }

  function apply(doc){
    if(!doc) return;

    const hands=doc.getElementById('handsSection') || doc.querySelector('section.hands-section');
    const story=doc.getElementById('photoStorySection') || doc.querySelector('section.photo-story-section');
    hands?.remove();
    story?.remove();

    const torn=doc.getElementById('inv6TornPaperMessage');
    const location=doc.querySelector('section.location-section');

    if(torn && location && torn.nextElementSibling !== location){
      let node=torn.nextElementSibling;
      while(node && node !== location){
        const next=node.nextElementSibling;
        node.remove();
        node=next;
      }
    }

    doc.getElementById(GREEN_BLOCK_ID)?.remove();
    ensureSpacing(doc);
    normalizeUpperMapButton(doc);
    watchUpperMapButton(doc);
  }

  window.inv6RemoveBetweenPaperAndLocation=apply;
})();
