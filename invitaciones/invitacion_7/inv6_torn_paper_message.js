(() => {
  const STYLE_ID='inv6-torn-paper-message-style';
  const FONT_ID='inv6-homemade-apple-font';
  const SECTION_ID='inv6TornPaperMessage';

  function ensureFont(doc){
    if(doc.getElementById(FONT_ID)) return;
    const link=doc.createElement('link');
    link.id=FONT_ID;
    link.rel='stylesheet';
    link.href='https://fonts.googleapis.com/css2?family=Homemade+Apple&display=swap';
    doc.head.appendChild(link);
  }

  function ensureStyles(doc){
    ensureFont(doc);
    doc.getElementById(STYLE_ID)?.remove();
    const style=doc.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      #${SECTION_ID}{
        position:relative !important;
        width:100% !important;
        margin:0 !important;
        padding:0 !important;
        background:transparent !important;
        overflow:visible !important;
      }
      #${SECTION_ID} .inv6-torn-paper-image{
        display:block !important;
        width:100% !important;
        height:auto !important;
        margin:0 !important;
        padding:0 !important;
        border:0 !important;
        background:transparent !important;
        user-select:none !important;
        -webkit-user-drag:none !important;
      }
      #${SECTION_ID} .inv6-torn-paper-copy{
        position:absolute !important;
        z-index:2 !important;
        left:50% !important;
        top:47% !important;
        width:84% !important;
        transform:translate(-50%,-50%) !important;
        margin:0 !important;
        padding:0 !important;
        color:#fffdf8 !important;
        text-align:center !important;
        pointer-events:none !important;
      }
      #${SECTION_ID} .inv6-torn-paper-text{
        margin:0 auto !important;
        max-width:100% !important;
        font-family:'Cormorant Garamond',serif !important;
        font-size:clamp(14px,3vw,22px) !important;
        line-height:1.24 !important;
        font-weight:400 !important;
        color:#fffdf8 !important;
        text-shadow:0 1px 1px rgba(0,0,0,.05) !important;
      }
      #${SECTION_ID} .inv6-torn-paper-heart{
        display:block !important;
        margin:11px auto 0 !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(13px,2.4vw,19px) !important;
        line-height:1 !important;
        color:#fffdf8 !important;
      }
      @media(max-width:540px){
        #${SECTION_ID} .inv6-torn-paper-copy{
          top:46.5% !important;
          width:88% !important;
        }
        #${SECTION_ID} .inv6-torn-paper-text{
          font-size:clamp(12px,3.6vw,16px) !important;
          line-height:1.22 !important;
        }
        #${SECTION_ID} .inv6-torn-paper-heart{
          margin-top:9px !important;
          font-size:clamp(12px,3vw,16px) !important;
        }
      }
    `;
    doc.head.appendChild(style);
  }

  function apply(doc){
    if(!doc) return;
    const paperSection=doc.querySelector('.paper-section');
    if(!paperSection) return;

    doc.getElementById(SECTION_ID)?.remove();
    ensureStyles(doc);

    const section=doc.createElement('section');
    section.id=SECTION_ID;
    section.setAttribute('aria-label','Mensaje para nuestros invitados');
    section.innerHTML=`
      <img class="inv6-torn-paper-image" src="./assets/papel_roto_6_1.png" alt="Papel decorativo verde con borde rasgado">
      <div class="inv6-torn-paper-copy">
        <p class="inv6-torn-paper-text">Nada nos hará más felices<br>que celebrar nuestro amor rodeados<br>de las personas más importantes de<br>nuestras vidas!</p>
        <span class="inv6-torn-paper-heart" aria-hidden="true">♥</span>
      </div>`;

    paperSection.insertAdjacentElement('afterend',section);
  }

  window.inv6ApplyTornPaperMessage=apply;
})();
