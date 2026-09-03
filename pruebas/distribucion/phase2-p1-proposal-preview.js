(() => {
  if (document.documentElement.dataset.phase2P1ProposalPreview === 'ready') return;
  document.documentElement.dataset.phase2P1ProposalPreview = 'ready';

  function buildProposalPreview() {
    try {
      const cloneSvg = planner.cloneNode(true);
      cloneSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      cloneSvg.setAttribute('viewBox', '0 0 1448 1086');
      cloneSvg.querySelectorAll('.rotate-ui,.vertex-handle').forEach((node) => node.remove());
      cloneSvg.querySelector('#drawLayer')?.replaceChildren();
      const xml = new XMLSerializer().serializeToString(cloneSvg);
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    } catch (_) {
      return '';
    }
  }

  function formatUpdatedAt(value) {
    if (!value) return 'Sesión actual';
    try {
      return new Date(value).toLocaleString('es-PE', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return 'Sesión actual';
    }
  }

  saveCurrentProposalSnapshot = function phase2P1SaveCurrentProposalWithPreview() {
    if (!currentProposalId) return;
    const proposal = proposals.find((entry) => entry.id === currentProposalId);
    if (!proposal) return;
    proposal.state = clone(stateSnapshot());
    proposal.updatedAt = new Date().toISOString();
    proposal.thumbnail = buildProposalPreview();
  };

  const baseRenderProposalList = renderProposalList;
  renderProposalList = function phase2P1RenderProposalListWithPreview() {
    baseRenderProposalList();
    proposalList.querySelectorAll('[data-proposal-id]').forEach((row) => {
      const proposal = proposals.find((entry) => entry.id === row.dataset.proposalId);
      if (!proposal) return;

      const preview = document.createElement('div');
      preview.className = 'proposal-preview-p1';
      if (proposal.thumbnail) {
        const image = document.createElement('img');
        image.src = proposal.thumbnail;
        image.alt = `Vista previa de ${proposal.name}`;
        preview.appendChild(image);
      } else {
        const placeholder = document.createElement('span');
        placeholder.textContent = 'Vista previa';
        preview.appendChild(placeholder);
      }
      row.prepend(preview);

      const info = row.children[1];
      const small = info?.querySelector('small');
      if (small) small.textContent += ` · ${formatUpdatedAt(proposal.updatedAt)}`;
    });
  };

  saveCurrentProposalSnapshot();
  renderProposalList();

  window.MiGranDiaDistributionPhase2P1ProposalPreview = Object.freeze({
    memoryOnly: true,
    svgPreview: true,
    updatedAt: true,
    status: 'ready'
  });
})();
