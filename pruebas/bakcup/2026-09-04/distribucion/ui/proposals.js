(() => {
  function createProposalsUI({ renderProposalList, open, close }) {
    if (typeof renderProposalList !== 'function') throw new TypeError('renderProposalList requerido');
    return Object.freeze({
      render: () => renderProposalList(),
      open: () => { renderProposalList(); return open?.(); },
      close: () => close?.()
    });
  }
  window.MiGranDiaDistributionUIProposals = Object.freeze({ createProposalsUI });
})();
