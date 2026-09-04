(() => {
  if (document.documentElement.dataset.phase2RendererUiBridge === 'ready') return;

  const required = [
    'MiGranDiaDistributionRendererTables','MiGranDiaDistributionRendererChairs','MiGranDiaDistributionRendererLabels','MiGranDiaDistributionRendererTents',
    'MiGranDiaDistributionUIPlanner','MiGranDiaDistributionUIInspector','MiGranDiaDistributionUILayers','MiGranDiaDistributionUIRisks','MiGranDiaDistributionUIProposals','MiGranDiaDistributionUIMobile'
  ];
  if (required.some((key) => !window[key])) throw new Error('Renderer/UI modular incompleto');

  const legacy = Object.freeze({
    renderTable,
    renderTent,
    render,
    setSelection,
    clearSelection,
    fillProperties,
    renderSeatEditor,
    renderLayerList,
    renderValidation,
    validationMessages,
    renderProposalList
  });

  const tables = window.MiGranDiaDistributionRendererTables.createTableRenderer({ renderTable: legacy.renderTable });
  const tents = window.MiGranDiaDistributionRendererTents.createTentRenderer({ renderTent: legacy.renderTent });
  const labels = window.MiGranDiaDistributionRendererLabels;
  const chairs = window.MiGranDiaDistributionRendererChairs;

  const plannerUi = window.MiGranDiaDistributionUIPlanner.createPlannerUI({
    render: legacy.render,
    setSelection: legacy.setSelection,
    clearSelection: legacy.clearSelection
  });
  const inspectorUi = window.MiGranDiaDistributionUIInspector.createInspectorUI({
    fillProperties: legacy.fillProperties,
    renderSeatEditor: legacy.renderSeatEditor
  });
  const layersUi = window.MiGranDiaDistributionUILayers.createLayersUI({ renderLayerList: legacy.renderLayerList });
  const risksUi = window.MiGranDiaDistributionUIRisks.createRisksUI({
    renderValidation: legacy.renderValidation,
    validationMessages: legacy.validationMessages
  });
  const proposalModal = document.getElementById('proposalModal');
  const proposalsUi = window.MiGranDiaDistributionUIProposals.createProposalsUI({
    renderProposalList: legacy.renderProposalList,
    open: () => { if (proposalModal) proposalModal.hidden = false; },
    close: () => { if (proposalModal) proposalModal.hidden = true; }
  });
  const mobileLegacy = window.MiGranDiaDistributionPhase2Close || {};
  const mobileUi = window.MiGranDiaDistributionUIMobile.createMobileUI({
    closePanels: mobileLegacy.closeMobileUi,
    repositionFab: mobileLegacy.positionFabAboveSheet,
    updateMenuDirection: mobileLegacy.updateFabMenuDirection
  });

  // Seams de compatibilidad: el runtime actual continúa llamando los mismos nombres,
  // pero éstos ya delegan a módulos con contratos explícitos.
  renderTable = (item, scale, conflicts) => tables.render(item, scale, conflicts);
  renderTent = (item) => tents.render(item);
  guestAnchor = (angle) => labels.guestAnchor(angle);
  compactName = (name, max = 18) => labels.compactName(name, max);
  renderLayerList = () => layersUi.render();
  renderValidation = () => risksUi.render();
  fillProperties = (item) => inspectorUi.render(item);
  renderSeatEditor = (table) => inspectorUi.renderSeats(table);
  renderProposalList = () => proposalsUi.render();

  document.documentElement.dataset.phase2RendererUiBridge = 'ready';
  window.MiGranDiaDistributionRendererUI = Object.freeze({
    status: 'ready',
    compatibilityMode: true,
    noVisualChange: true,
    renderer: Object.freeze({ tables, chairs, labels, tents }),
    ui: Object.freeze({ planner: plannerUi, inspector: inspectorUi, layers: layersUi, risks: risksUi, proposals: proposalsUi, mobile: mobileUi })
  });
})();
