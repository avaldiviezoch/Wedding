(() => {
  if (document.documentElement.dataset.phase2FinalValidation === 'ready') return;
  const validationApi = window.MiGranDiaDistributionEngine?.validation;
  if (!validationApi?.evaluate) throw new Error('Fase H requiere engine.validation.evaluate');

  const legacyValidationMessages = validationMessages;

  function finalValidationResult() {
    const conflicts = typeof conflictIds === 'function' ? Array.from(conflictIds()) : [];
    return validationApi.evaluate({
      elements,
      guests,
      hiddenLayers,
      lockedLayers,
      conflictIds:conflicts,
      scale:typeof currentScale === 'function' ? currentScale() : 32,
      canvas:{ width:1448, height:1086 }
    });
  }

  validationMessages = function phase2FinalValidationMessages() {
    return finalValidationResult().messages;
  };

  window.MiGranDiaDistributionFinalValidationV1 = Object.freeze({
    status:'ready',
    evaluate:finalValidationResult,
    legacyAvailable:typeof legacyValidationMessages === 'function',
    memoryOnly:true,
    canvas:Object.freeze({ width:1448, height:1086 })
  });
  document.documentElement.dataset.phase2FinalValidation = 'ready';
  renderValidation();
})();