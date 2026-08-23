(() => {
  const STYLE_ID='inv6-torn-paper-message-style';
  const SECTION_ID='inv6TornPaperMessage';

  function ensureStyles(doc){
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
        top:49% !important;
        width:68% !important;
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
        font-family:'Amsterdam Four','Great Vibes',cursive !important;
        font-size:clamp(19px,4.4vw,32px) !important;
        line-height:1.08 !important;
        font-weight:400 !important;
        color:#fffdf8 !important;
        text-shadow:0 1px 1px rgba(0,0,0,.06) !important;
      }
      #${SECTION_ID} .inv6-torn-paper-heart{
        display:block !important;
        margin:18px auto 0 !important;
        font-family:Georgia,'Times New Roman',serif !important;
        font-size:clamp(17px,3.2vw,24px) !important;
        line-height:1 !important;
        color:#fffdf8 !important;
      }
      @media(max-width:540px){
        #${SECTION_ID} .inv6-torn-paper-copy{
          top:48% !important;
          width:70% !important;
        }
        #${SECTION_ID} .inv6-torn-paper-text{
          font-size:clamp(17px,5vw,23px) !important;
          line-height:1.1 !important;
        }
        #${SECTION_ID} .inv6-torn-paper-heart{
          margin-top:15px !important;
          font-size:clamp(15px,4.2vw,20px) !important;
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
