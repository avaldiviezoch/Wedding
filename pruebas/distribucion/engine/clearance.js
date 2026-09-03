(() => {
  const root = window.MiGranDiaDistributionEngine ||= {};
  const TABLE_CLEARANCE_MARGIN_M = 0.60;
  const HIDDEN_LAYER_POLICY = Object.freeze({ visualOnly: true, keepsCapacity: true, keepsAssignments: true, participatesInConflicts: false, participatesInProximity: false });

  function minimumCenterDistanceM(a, b, marginM = TABLE_CLEARANCE_MARGIN_M) {
    return ((Number(a?.widthM) || 0) + (Number(b?.widthM) || 0)) / 2 + marginM;
  }

  function isTooClose(a, b, scale, marginM = TABLE_CLEARANCE_MARGIN_M) {
    const minimum = minimumCenterDistanceM(a, b, marginM) * scale;
    const actual = Math.hypot((Number(a?.x) || 0) - (Number(b?.x) || 0), (Number(a?.y) || 0) - (Number(b?.y) || 0));
    return actual < minimum && actual > 5;
  }

  root.clearance = Object.freeze({ TABLE_CLEARANCE_MARGIN_M, HIDDEN_LAYER_POLICY, minimumCenterDistanceM, isTooClose });
})();