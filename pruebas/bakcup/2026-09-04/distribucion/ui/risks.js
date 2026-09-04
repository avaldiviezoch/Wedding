(() => {
  function createRisksUI({ renderValidation, validationMessages }) {
    if (typeof renderValidation !== 'function') throw new TypeError('renderValidation requerido');
    return Object.freeze({
      render: () => renderValidation(),
      messages: (conflicts) => typeof validationMessages === 'function' ? validationMessages(conflicts) : []
    });
  }
  window.MiGranDiaDistributionUIRisks = Object.freeze({ createRisksUI });
})();
